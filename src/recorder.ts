import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { IRecorder, Options, Events, EventCallback } from './types';
import { RecorderError, RecorderValidationError } from './error';
import { verifyAllOptions } from './validators';
import dirSize from './helpers/space';
import playlistName from './helpers/playlistName';
import transformDirSizeThreshold from './helpers/sizeThreshold';
import transformSegmentTime from './helpers/segmentTime';

export { Recorder, Events as RecorderEvents, RecorderError, RecorderValidationError };
export type { IRecorder };

const APPROXIMATION_PERCENTAGE = 1;

export default class Recorder implements IRecorder {
	private title?: string;
	private ffmpegBinary = 'ffmpeg';

	/**
	 * Here you can use bash
	 */
	private playlistName?: string;

	/**
	 * @READ: http://www.cplusplus.com/reference/ctime/strftime/
	 */
	private filePattern = '%Y.%m.%d/%H.%M.%S';

	private segmentTime = 600; // 10 minutes or 600 seconds

	private dirSizeThreshold?: number; // bytes

	private noAudio: boolean;

	private process: ChildProcessWithoutNullStreams | null = null;
	private eventEmitter: EventEmitter;

	constructor(private uri: string, private destination: string, options: Options = {}) {
		const errors = verifyAllOptions(destination, options);
		if (errors.length) {
			throw new RecorderValidationError('Options invalid', errors);
		}

		this.title = options.title;
		this.ffmpegBinary = options.ffmpegBinary || this.ffmpegBinary;
		this.playlistName = playlistName(options.playlistName);
		this.filePattern = (options.filePattern || this.filePattern)
			.replace(/[\s:]+/gu, '_')
			.replace(/_+/ug, '_');

		this.segmentTime = options.segmentTime
			? transformSegmentTime(options.segmentTime)
			: this.segmentTime;

		this.dirSizeThreshold = options.dirSizeThreshold
			? transformDirSizeThreshold(options.dirSizeThreshold)
			: undefined;

		this.noAudio = options.noAudio || false;

		this.eventEmitter = new EventEmitter();

		this.on(Events.START, this.startRecord);
		this.on(Events.STOP, this.stopRecord);
	}

	public start = () => {
		this.eventEmitter.emit(Events.START, 'programmatically');
		return this;
	};

	public stop = () => {
		this.eventEmitter.emit(Events.STOP, 'programmatically');
		return this;
	};

	public on = (event: Events, callback: EventCallback) => {
		this.eventEmitter.on(event, callback);
		return this;
	};

	public removeListener = (event: Events, callback: EventCallback) => {
		this.eventEmitter.removeListener(event, callback);
		return this;
	};

	public isRecording = () => Boolean(this.process);

	private startRecord = async () => {
		try {
			// We have to wait next tick
			await Promise.resolve(true);

			if (this.process) {
				throw new RecorderError('Process already spawned.');
			}

			if (!this.isSpaceEnough()) {
				this.eventEmitter.emit(Events.STOPPED, 0, 'space_full');
				return;
			}

			this.on(Events.PROGRESS, this.onProgress)
				.on(Events.FILE_CREATED, this.isSpaceEnough)
				.on(Events.SPACE_FULL, this.onSpaceFull)
				.on(Events.STOPPED, this.onStopped);

			this.process = spawn(this.ffmpegBinary,
				[
					'-rtsp_transport', 'tcp',
					'-i', this.uri,
					'-reset_timestamps', '1',
					...(this.title ? ['-metadata', `title="${this.title}"`] : []),
					...(this.noAudio ? ['-an'] : ['-c:a', 'aac']),
					'-strftime', '1',
					'-strftime_mkdir', '1',
					'-hls_time', String(this.segmentTime),
					'-hls_list_size', '0',
					'-hls_segment_filename', `${this.filePattern}.mp4`,
					`./${this.playlistName}.m3u8`,
				],
				{
					detached: false,
					cwd: this.destination,
				},
			);

			this.process.stderr.on('data', (buffer: Buffer) => {
				const message = buffer.toString();
				this.eventEmitter.emit(Events.PROGRESS, message);
			});

			this.process.on('error', (error: string) => {
				this.eventEmitter.emit(Events.ERROR, new RecorderError(error));
			});

			this.process.on('close', (code: string) => {
				this.eventEmitter.emit(Events.STOPPED, code, 'ffmpeg_exited');
			});
		} catch (err) {
			this.eventEmitter.emit(Events.ERROR, err);
		}
	};

	private stopRecord = async () => {
		// We have to wait next tick
		await Promise.resolve(true);

		if (!this.process) {
			this.eventEmitter.emit(Events.ERROR, new RecorderError('No process spawned.'));
			return;
		}
		this.process.kill();
	};

	private matchStarted = (message: string) => {
		const pattern = new RegExp('Output #0, hls, to \'./(?<file>(:?.+).m3u8)\':');
		return message.match(pattern)?.groups?.file;
	};

	private matchFileCreated = (message: string) => {
		const pattern = new RegExp('Opening \'(?<file>.+)\' for writing');
		const file = message.match(pattern)?.groups?.file || false;
		const segment = file && !file.match(/\.m3u8\.tmp$/u);
		return segment ? file : undefined;
	};

	private onProgress = (message: string) => {
		const playlist = this.matchStarted(message);
		if (playlist) {
			this.eventEmitter.emit(Events.STARTED, {
				uri: this.uri,
				destination: this.destination,
				playlist,
				title: this.title,
				filePattern: this.filePattern,
				segmentTime: this.segmentTime,
				dirSizeThreshold: this.dirSizeThreshold,
				noAudio: this.noAudio,
				ffmpegBinary: this.ffmpegBinary,
			});
		}

		const file = this.matchFileCreated(message);
		if (file) {
			this.eventEmitter.emit(Events.FILE_CREATED, file);
		}
	};

	private isSpaceEnough = () => {
		try {
			if (!this.dirSizeThreshold) {
				return true;
			}
			const used = dirSize(this.destination);
			const enough = Math.ceil(used + used * APPROXIMATION_PERCENTAGE / 100) < this.dirSizeThreshold;
			if (enough) {
				return true;
			}
			this.eventEmitter.emit(Events.SPACE_FULL, {
				threshold: this.dirSizeThreshold,
				used,
			});
			return false;
		} catch (err) {
			this.eventEmitter.emit(Events.ERROR, err);
		}
		return true;
	};

	private onSpaceFull = () => {
		this.eventEmitter.emit(Events.STOP, 'space_full');
	};

	private onStopped = () => {
		this.eventEmitter.removeListener(Events.PROGRESS, this.onProgress);
		this.eventEmitter.removeListener(Events.FILE_CREATED, this.isSpaceEnough);
		this.eventEmitter.removeListener(Events.SPACE_FULL, this.onSpaceFull);
		this.process = null;
	};
}
