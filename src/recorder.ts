import pathApi from 'path';
import { EventEmitter } from 'events';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import strftime from 'strftime';
import fse from 'fs-extra';
import du from 'du';

import { IRecorder, Options, Events, EventCallback, SegmentStartedArg } from './types';
import { RecorderError, RecorderValidationError } from './error';
import { verifyAllOptions } from './validators';
import {
  transformSegmentTime,
  transformDirSizeThreshold,
  getHash,
  clearSpace,
  parseSegmentDate,
  directoryExists,
} from './helpers';

const FILE_EXTENSION = 'mp4';
const APPROXIMATION_PERCENTAGE = 1;

export default class Recorder implements IRecorder {
  private title?: string;
  private ffmpegBinary: string = 'ffmpeg';

  /**
   * @READ: http://www.cplusplus.com/reference/ctime/strftime/
   */
  private directoryPattern: string = '%Y.%m.%d';
  private filenamePattern: string = '%H.%M.%S';

  private segmentTime: number = 600; // 10 minutes or 600 seconds

  private dirSizeThreshold?: number; // bytes

  private autoClear: boolean;

  private process: ChildProcessWithoutNullStreams | null = null;
  private eventEmitter: EventEmitter;
  private uriHash?: string;
  private previousSegment?: string;

  constructor (
    private uri: string,
    private path: string,
    options: Options = {},
  ) {
    const errors = verifyAllOptions(path, options);
    if (errors.length) {
      throw new RecorderValidationError('Options invalid', errors);
    }

    this.title = options.title;
    this.ffmpegBinary = options.ffmpegBinary || this.ffmpegBinary;
    this.directoryPattern = options.directoryPattern || this.directoryPattern;
    this.filenamePattern = options.filenamePattern || this.filenamePattern;
    this.segmentTime = options.segmentTime ? transformSegmentTime(options.segmentTime) : this.segmentTime;
    this.dirSizeThreshold = options.dirSizeThreshold ? transformDirSizeThreshold(options.dirSizeThreshold) : undefined;
    this.autoClear = options.autoClear || false;

    this.eventEmitter = new EventEmitter();
    this.uriHash = getHash(this.uri);
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

    // TODO: To spawn STARTED event here in case process is really started only.
    this.eventEmitter.emit(Events.STARTED, {
      path: this.path,
      uri: this.uri,
      segmentTime: this.segmentTime,
      directoryPattern: this.directoryPattern,
      filenamePattern: this.filenamePattern,
      dirSizeThreshold: this.dirSizeThreshold,
      autoClear: this.autoClear,
      title: this.title,
      ffmpegBinary: this.ffmpegBinary,
    });
  }

  private stopRecord = () => {
    if (!this.process) {
      throw new RecorderError('No process spawned.');
    }
    this.process.kill();
    this.eventEmitter.emit(Events.STOPPED, 0, 'Programmatically stopped.');
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
      try {
        const message = buffer.toString();
        const current = this.handleProgressBuffer(message);
        if (current) {
          this.eventEmitter.emit(Events.SEGMENT_STARTED, {
            current,
            previous: this.previousSegment,
          });
          this.previousSegment = current;
        }
        this.eventEmitter.emit(Events.PROGRESS, message);
      } catch (err) {
        this.eventEmitter.emit(Events.ERROR, err);
        this.eventEmitter.emit(Events.STOP, 'Error', err);
      }
    });

    process.on('error', (error: string) => {
      this.eventEmitter.emit(Events.ERROR, new RecorderError(error));
    });

    process.on('close', (code: string) => {
      this.eventEmitter.emit(Events.STOPPED, code, `FFMPEG exited. Code ${code}.`);
    });

    return process;
  }

  private onSegmentStarted = async ({ previous }: SegmentStartedArg) => {
    if (previous) {
      await this.moveSegment(previous);
    }
  }

  private onSpaceFull = async () => {
    try {
      if (!this.autoClear) {
        this.eventEmitter.emit(Events.STOP, 'Space is full');
        return;
      }

      await clearSpace(this.path);

      const used = await du(this.path, { disk: true });
      const threshold = this.dirSizeThreshold;

      this.eventEmitter.emit(Events.SPACE_WIPED, {
        path: this.path,
        used,
        threshold,
      });
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
      this.eventEmitter.emit(Events.STOP, 'Error', err);
    }
  }

  private onProgress = async () => {
    try {
      await this.ensureSpaceEnough();
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
      this.eventEmitter.emit(Events.STOP);
    }
  }

  private onStopped = async () => {
    if (this.previousSegment) {
      await this.moveSegment(this.previousSegment);
      this.previousSegment = undefined;
    }
  }

  private ensureSpaceEnough = async () => {
    if (!this.dirSizeThreshold) {
      return;
    }

    const used = await du(this.path, { disk: true });

    if (Math.ceil(used + used * APPROXIMATION_PERCENTAGE / 100) > this.dirSizeThreshold) {
      this.eventEmitter.emit(Events.SPACE_FULL, {
        path: this.path,
        threshold: this.dirSizeThreshold,
        used,
      });
    }
  }

  private handleProgressBuffer = (message: string) => {
    const openingPattern = new RegExp(`Opening '(.+)' for writing`);
    const openingMatch = message.match(openingPattern);

    const failedPattern = new RegExp(`Failed to open segment '(.+)'`);
    const failedMatch = message.match(failedPattern);

    if (failedMatch) {
      throw new RecorderError(`Failed to open file '${failedMatch[1]}'.`);
    }

    if (openingMatch) {
      return openingMatch[1];
    }
  }

  private parseSegmentPath = (path: string) => {
    const date = parseSegmentDate(path);
    const dirname = strftime(this.directoryPattern, date);
    const filename = `${strftime(this.filenamePattern, date)}.${FILE_EXTENSION}`;
    return {
      dirpath: pathApi.join(this.path, dirname),
      dirname,
      filename,
    };
  }

  private ensureDirectory = async (path: string, dirname: string) => {
    if (directoryExists(path)) {
      return;
    }
    await fse.ensureDir(path, 0o777);
    this.eventEmitter.emit(Events.DIRECTORY_CREATED, { path, name: dirname });
  }

  private moveSegment = async (path: string) => {
    try {
      const { dirpath, dirname, filename } = this.parseSegmentPath(path);
      await this.ensureDirectory(dirpath, dirname);
      const target = `${dirpath}/${filename}`;
      await fse.move(path, target);
      this.eventEmitter.emit(Events.FILE_CREATED, {
        filepath: target,
        dirpath,
        dirname,
        filename,
      });
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
    }
  }
}

export {
  IRecorder,
  Recorder,
  Events as RecorderEvents,
  RecorderError,
  RecorderValidationError,
};
