import fse from 'fs-extra';
import pathApi from 'path';
import { EventEmitter } from 'events';
import { ChildProcessWithoutNullStreams as ChildProcess, spawn } from 'child_process';
import strftime from 'strftime';

import { IRecorder, Options, Events, EventCallback, SegmentStartedArg } from './types';
import { RecorderError, RecorderValidationError } from './error';
import Validators from './validators';
import Helpers from './helpers';

const FILE_EXTENSION = 'mp4';
const APPROXIMATION_PERCENTAGE = 1;

class Recorder implements IRecorder {
  private title?: string;
  private ffmpegBinary: string = 'ffmpeg';

  /**
   * @READ: http://www.cplusplus.com/reference/ctime/strftime/
   */
  private directoryPattern: string = '%Y.%m.%d';
  private filenamePattern: string = '%H.%M.%S';

  private segmentTime: number = 600; // 10 minutes or 600 seconds

  private dirSizeThreshold: number | null; // bytes

  private autoClear: boolean;

  private process: ChildProcess | null = null;
  private eventEmitter: EventEmitter;
  private uriHash?: string;
  private previousSegment?: string;

  constructor(
    private uri: string,
    private path: string,
    options: Options = {},
  ) {
    const errors = Validators.verifyAllOptions(path, options);
    if (errors.length) {
      throw new RecorderValidationError('Options invalid', errors);
    }

    this.title = options.title;
    this.ffmpegBinary = options.ffmpegBinary || this.ffmpegBinary;
    this.directoryPattern = options.directoryPattern || this.directoryPattern;
    this.filenamePattern = options.filenamePattern || this.filenamePattern;
    this.segmentTime = options.segmentTime ? Helpers.transformSegmentTime(options.segmentTime) : this.segmentTime;
    this.dirSizeThreshold = options.dirSizeThreshold ? Helpers.transformDirSizeThreshold(options.dirSizeThreshold) : null;
    this.autoClear = options.autoClear || false;

    this.eventEmitter = new EventEmitter();
    this.uriHash = Helpers.getHash(this.uri);
  }

  public start = () => {
    try {
      this.startRecord();
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
    }
    return this;
  }

  public stop = () => {
    try {
      this.stopRecord();
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
    }
    return this;
  }

  public on = (event: Events, callback: EventCallback) => {
    this.eventEmitter.on(event, callback);
    return this;
  }

  private startRecord = () => {
    if (this.process) {
      throw new RecorderError('Process already spawned.');
    }

    this.eventEmitter.on(Events.SEGMENT_STARTED, this.onSegmentStarted);
    this.eventEmitter.on(Events.SPACE_FULL, this.onSpaceFull);
    this.eventEmitter.on(Events.PROGRESS, this.onProgress);
    this.eventEmitter.on(Events.STOP, this.stopRecord);
    this.eventEmitter.on(Events.STOPPED, this.onStopped);

    this.process = this.spawnFFMPEG();

    this.eventEmitter.emit(Events.STARTED, {
      dateFormat: this.directoryPattern,
      timeFormat: this.filenamePattern,
      segmentTime: this.segmentTime,
      dirSizeThreshold: this.dirSizeThreshold,
      path: this.path,
      uri: this.uri,
    });
  }

  private stopRecord = () => {
    if (!this.process) {
      throw new RecorderError('No process spawned.');
    }
    this.process.kill();
    this.eventEmitter.emit(Events.STOPPED, 'Programmatically stopped');
  }

  private spawnFFMPEG = () => {
    const process = spawn(this.ffmpegBinary,
      [
        '-i',
        this.uri,
        '-an',
        '-vcodec',
        'copy',
        '-rtsp_transport',
        'tcp',
        '-vsync',
        '1',
        ...(this.title ? ['-metadata', `title=${this.title}`] : []),
        '-f',
        'segment',
        '-segment_time',
        `${this.segmentTime}`,
        '-reset_timestamps',
        '1',
        '-strftime',
        '1',
        pathApi.join(this.path, `%Y.%m.%d.%H.%M.%S.${this.uriHash}.${FILE_EXTENSION}`),
      ],
      { detached: false },
    );

    process.stderr.on('data', (buffer: Buffer) => {
      this.eventEmitter.emit(Events.PROGRESS, buffer);
    });

    process.on('error', (error: string) => {
      this.eventEmitter.emit(Events.ERROR, new RecorderError(error));
    });

    process.on('close', (code: string) => {
      this.eventEmitter.emit(Events.STOPPED, `FFMPEG process exited with code ${code}`);
    });

    return process;
  }

  private onSegmentStarted = async ({ previous }: SegmentStartedArg) => {
    if (!previous) {
      return;
    }

    try {
      const { dirpath, dirname, filename } = this.parseSegmentPath(previous);
      await this.ensureDirectory(dirpath, dirname);
      await this.moveSegment(previous, dirpath, dirname, filename);
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
    }
  }

  private onSpaceFull = async () => {
    try {
      if (!this.autoClear) {
        this.eventEmitter.emit(Events.ERROR, new RecorderError('Space is full but autoClear is not allowed.'));
        this.eventEmitter.emit(Events.STOP);
        return;
      }

      await Helpers.clearSpace(this.path);

      const used = await Helpers.getOccupiedSpace(this.path);
      const threshold = this.dirSizeThreshold;

      this.eventEmitter.emit(Events.SPACE_WIPED, {
        path: this.path,
        used,
        threshold,
      });
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
      this.eventEmitter.emit(Events.STOP);
    }
  }

  private onProgress = async (buffer: Buffer) => {
    try {
      await this.ensureSpaceEnough();
      this.handleProgressBuffer(buffer);
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
      this.eventEmitter.emit(Events.STOP);
    }
  }

  private onStopped = async () => {
    if (!this.previousSegment) {
      return;
    }
    const { dirpath, dirname, filename } = this.parseSegmentPath(this.previousSegment);
    await this.moveSegment(this.previousSegment, dirpath, dirname, filename);
    this.previousSegment = undefined;
  }

  private ensureSpaceEnough = async () => {
    if (!this.dirSizeThreshold) {
      return;
    }

    const used = await Helpers.getOccupiedSpace(this.path);
    const threshold = this.dirSizeThreshold;

    if (Math.ceil(used + used * APPROXIMATION_PERCENTAGE / 100) < threshold) {
      return;
    }

    this.eventEmitter.emit(Events.SPACE_FULL, {
      path: this.path,
      used,
      threshold,
    });
  }

  private handleProgressBuffer(buffer: Buffer) {
    const message = buffer.toString();

    const openingPattern = new RegExp(`Opening '(.+)' for writing`);
    const openingMatch = message.match(openingPattern);

    const failedPattern = new RegExp(`Failed to open segment '(.+)'`);
    const failedMatch = message.match(failedPattern);

    if (failedMatch) {
      this.eventEmitter.emit(Events.ERROR, new RecorderError(`Failed to open file '${failedMatch[1]}'.`));
      this.eventEmitter.emit(Events.STOP);
    }

    if (openingMatch) {
      const current = openingMatch[1];
      this.eventEmitter.emit(Events.SEGMENT_STARTED, { current, previous: this.previousSegment });
      this.previousSegment = current;
    }
  }

  private parseSegmentPath = (path: string) => {
    const date = Helpers.parseSegmentDate(path);
    const dirname = strftime(this.directoryPattern, date);
    const filename = `${strftime(this.filenamePattern, date)}.${FILE_EXTENSION}`;
    return {
      dirpath: pathApi.join(this.path, dirname),
      dirname,
      filename,
    };
  }

  private ensureDirectory = async (path: string, dirname: string) => {
    if (Helpers.directoryExists(path)) {
      return;
    }
    await fse.ensureDir(path, 0o777);
    this.eventEmitter.emit(Events.DIRECTORY_CREATED, { path, name: dirname });
  }

  private moveSegment = async (previous: string, dirpath: string, dirname: string, filename: string) => {
    const target = `${dirpath}/${filename}`;
    await Helpers.moveFile(previous, target);

    this.eventEmitter.emit(Events.FILE_CREATED, {
      filepath: target,
      dirpath,
      dirname,
      filename,
    });
  }
}

export {
  IRecorder,
  Recorder,
  Events as RecorderEvents,
  RecorderError,
  RecorderValidationError,
};

export default Recorder;
