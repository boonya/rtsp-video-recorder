import { EventEmitter } from 'events';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { IRecorder, Options, Events, EventCallback } from './types';
import { RecorderError, RecorderValidationError } from './error';
import { verifyAllOptions } from './validators';
import {transformSegmentTime, transformDirSizeThreshold} from './helpers';

const FILE_EXTENSION = 'mp4';

export {Recorder, Events as RecorderEvents, RecorderError, RecorderValidationError};
export type { IRecorder };

export default class Recorder implements IRecorder {
	private title?: string;
	private ffmpegBinary = 'ffmpeg';

	/**
	 * @READ: http://www.cplusplus.com/reference/ctime/strftime/
	 */
	private filePattern = '%Y.%m.%d/%H.%M.%S';

	private segmentTime = 600; // 10 minutes or 600 seconds

	private dirSizeThreshold?: number; // bytes

	private noAudio: boolean;

	private process: ChildProcessWithoutNullStreams | null = null;
	private eventEmitter: EventEmitter;

	constructor (private uri: string, private path: string, options: Options = {}) {
		const errors = verifyAllOptions(path, options);
		if (errors.length) {
			throw new RecorderValidationError('Options invalid', errors);
		}

		this.title = options.title;
		this.ffmpegBinary = options.ffmpegBinary || this.ffmpegBinary;
		this.filePattern = options.filePattern || this.filePattern;
		this.segmentTime = options.segmentTime ? transformSegmentTime(options.segmentTime) : this.segmentTime;
		this.dirSizeThreshold = options.dirSizeThreshold ? transformDirSizeThreshold(options.dirSizeThreshold) : undefined;
		this.noAudio = options.noAudio || false;

		this.eventEmitter = new EventEmitter();
	}

	public start = (): this => {
		if (this.process) {
			this.eventEmitter.emit(Events.ERROR, new RecorderError('Process already spawned.'));
			return this;
		}

		try {
			this.startRecord();
		}
		catch (err) {
			this.eventEmitter.emit(Events.ERROR, err);
		}

		return this;
	};

	public stop = (): this => {
		this.stopRecord().catch((err) => {
			this.eventEmitter.emit(Events.ERROR, err);
		});
		return this;
	};

	public on = (event: Events, callback: EventCallback): this => {
		this.eventEmitter.on(event, callback);
		return this;
	};

	public removeListener = (event: Events, callback: EventCallback): this => {
		this.eventEmitter.removeListener(event, callback);
		return this;
	};

	public isRecording = (): boolean => Boolean(this.process);

	private startRecord = () => {
		this.eventEmitter.on(Events.PROGRESS, this.onProgress);
		this.eventEmitter.on(Events.FILE_CREATED, this.onFileCreated);
		this.eventEmitter.on(Events.SPACE_FULL, this.onSpaceFull);
		this.eventEmitter.on(Events.STOP, this.stopRecord);

		this.process = this.spawnFFMPEG();
	};

	private stopRecord = async () => {
		if (!this.process) {
			this.eventEmitter.emit(Events.ERROR, new RecorderError('No process spawned.'));
			return;
		}
		// TODO: Instead of kill process consider to gracefully stop it
		this.process.kill();
		this.process = null;
		this.eventEmitter.removeListener(Events.PROGRESS, this.onProgress);
		this.eventEmitter.removeListener(Events.FILE_CREATED, this.onFileCreated);
		this.eventEmitter.removeListener(Events.SPACE_FULL, this.onSpaceFull);
		this.eventEmitter.removeListener(Events.STOP, this.stopRecord);
	};

	private spawnFFMPEG = () => {
		const playlistName = [this.title, '$(date +%Y.%m.%d-%H.%M.%S).m3u8'].join('-');
		const segmentNamePattern = `${this.filePattern}.${FILE_EXTENSION}`;

		const process = spawn(this.ffmpegBinary,
			[
				'-rtsp_transport', 'tcp',
				'-i', this.uri,
				'-reset_timestamps', '1',
				...(this.title ? ['-metadata', `title=${this.title}`] : []),
				...(this.noAudio ? ['-an'] : ['-c:a', 'aac']),
				'-strftime', '1',
				'-strftime_mkdir', '1',
				'-hls_time', String(this.segmentTime),
				'-hls_list_size', '0',
				'-hls_segment_filename', segmentNamePattern,
				playlistName,
			],
			{
				detached: false,
				shell: true,
				cwd: this.path,
			},
		);

		process.stderr.on('data', (buffer: Buffer) => {
			const message = buffer.toString();
			this.eventEmitter.emit(Events.PROGRESS, message);
		});

		process.on('error', (error: string) => {
			this.eventEmitter.emit(Events.ERROR, new RecorderError(error));
		});

		process.on('close', (code: string) => {
			this.eventEmitter.emit(Events.STOPPED, code, `FFMPEG exited. Code ${code}.`);
		});

		return process;
	};

	private matchStarted = (message: string) => {
		const pattern = new RegExp('Output #0, hls, to \'(?<file>(:?.+).m3u8)\':');
		return message.match(pattern)?.groups?.file;
	};

	private matchFileCreated = (message: string) => {
		const pattern = new RegExp('Opening \'(?<file>.+)\' for writing');
		const file = message.match(pattern)?.groups?.file || false;
		const segment = file && !file.match(/\.m3u8\.tmp$/u);
		return segment ? file : undefined;
	};

	private ensureSpaceEnough = () => {
		// FIXME: Should be implemented before release
		/**
		 * fs.lstatSync(path[, options]) -> https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_fs_lstatsync_path_options
		 * stats.size -> https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_stats_size
		 * stats.isDirectory() -> https://nodejs.org/docs/latest-v10.x/api/fs.html#fs_stats_isdirectory
		 */
	};

	private onProgress = (message: string) => {
		try {
			const playlist = this.matchStarted(message);
			if (playlist) {
				this.eventEmitter.emit(Events.STARTED, {
					path: this.path,
					uri: this.uri,
					segmentTime: this.segmentTime,
					filePattern: this.filePattern,
					dirSizeThreshold: this.dirSizeThreshold,
					title: this.title,
					noAudio: this.noAudio,
					ffmpegBinary: this.ffmpegBinary,
					playlist,
				});
			}

			const file = this.matchFileCreated(message);
			if (file) {
				this.eventEmitter.emit(Events.FILE_CREATED, file);
			}

		} catch (err) {
			this.eventEmitter.emit(Events.ERROR, err);
			this.eventEmitter.emit(Events.STOP, 'Error', err);
		}
	};

	private onFileCreated = async () => {
		try {
			await this.ensureSpaceEnough();
		} catch (err) {
			this.eventEmitter.emit(Events.ERROR, err);
		}
	};

	private onSpaceFull = () => {
		this.stop();
	};
}
