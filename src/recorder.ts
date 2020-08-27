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
  private filePattern: string = '%Y.%m.%d/%H.%M.%S';

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
    this.filePattern = options.filePattern || this.filePattern;
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
    this.stopRecord().catch((err) => {
      this.eventEmitter.emit(Events.ERROR, err);
    });
    return this;
  }

  public on = (event: Events, callback: EventCallback) => {
    this.eventEmitter.on(event, callback);
    return this;
  }

  public removeListener = (event: Events, callback: EventCallback) => {
    this.eventEmitter.removeListener(event, callback);
    return this;
  }

  public isRecording = () => Boolean(this.process);

  private startRecord = () => {
    if (this.process) {
      throw new RecorderError('Process already spawned.');
    }

    this.eventEmitter.on(Events.PROGRESS, this.onProgress);
    this.eventEmitter.on(Events.SEGMENT_STARTED, this.onSegmentStarted);
    this.eventEmitter.on(Events.SPACE_FULL, this.onSpaceFull);
    this.eventEmitter.on(Events.STOP, this.stopRecord);

    this.process = this.spawnFFMPEG();
  }

  private stopRecord = async () => {
    if (!this.process) {
      this.eventEmitter.emit(Events.ERROR, new RecorderError('No process spawned.'));
      return;
    }
    this.process.kill();
    this.process = null;
    if (this.previousSegment) {
      try {
        await this.moveSegment(this.previousSegment);
      } catch (err) {
        this.eventEmitter.emit(Events.ERROR, err);
      }
      this.previousSegment = undefined;
    }
    this.eventEmitter.removeListener(Events.PROGRESS, this.onProgress);
    this.eventEmitter.removeListener(Events.SEGMENT_STARTED, this.onSegmentStarted);
    this.eventEmitter.removeListener(Events.SPACE_FULL, this.onSpaceFull);
    this.eventEmitter.removeListener(Events.STOP, this.stopRecord);
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
  }

  private onProgress = (message: string) => {
    try {
      const current = this.handleProgressBuffer(message);
      if (current) {
        if (!this.previousSegment) {
          this.eventEmitter.emit(Events.STARTED, {
            path: this.path,
            uri: this.uri,
            segmentTime: this.segmentTime,
            filePattern: this.filePattern,
            dirSizeThreshold: this.dirSizeThreshold,
            autoClear: this.autoClear,
            title: this.title,
            ffmpegBinary: this.ffmpegBinary,
          });
        }
        this.eventEmitter.emit(Events.SEGMENT_STARTED, {
          current,
          previous: this.previousSegment,
        });
        this.previousSegment = current;
      }
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
      this.eventEmitter.emit(Events.STOP, 'Error', err);
    }
  }

  private onSegmentStarted = async ({ previous }: SegmentStartedArg) => {
    try {
      if (previous) {
        await this.moveSegment(previous);
      }
      await this.ensureSpaceEnough();
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
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

      this.eventEmitter.emit(Events.SPACE_WIPED, {
        path: this.path,
        threshold: this.dirSizeThreshold,
        used,
      });
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
      this.eventEmitter.emit(Events.STOP, 'Error', err);
    }
  }

  private ensureSpaceEnough = async () => {
    if (!this.dirSizeThreshold) {
      return true;
    }

    const used = await du(this.path, { disk: true });

    if (Math.ceil(used + used * APPROXIMATION_PERCENTAGE / 100) > this.dirSizeThreshold) {
      this.eventEmitter.emit(Events.SPACE_FULL, {
        path: this.path,
        threshold: this.dirSizeThreshold,
        used,
      });
      return false;
    }
    return true;
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
    const file = `${strftime(this.filePattern, date)}.${FILE_EXTENSION}`;
    return pathApi.join(this.path, file);
  }

  private ensureDirectory = async (path: string) => {
    if (directoryExists(path)) {
      return;
    }
    await fse.ensureDir(path, 0o777);
  }

  private moveSegment = async (path: string) => {
    const target = this.parseSegmentPath(path);
    const dirpath = pathApi.dirname(target);
    await this.ensureDirectory(dirpath);
    await fse.move(path, target);
    this.eventEmitter.emit(Events.FILE_CREATED, target);
  }
}

export {
  IRecorder,
  Recorder,
  Events as RecorderEvents,
  RecorderError,
  RecorderValidationError,
};
