import pathApi from 'path';
import EventEmitter from 'events';
import { ChildProcessWithoutNullStreams as ChildProcess, spawn } from 'child_process';

import strftime from 'strftime';

import { IRecorder, Options, Events, EventCallback } from './types';
import { RecorderError, RecorderValidationError } from './error';
import Validators from './validators';
import Helpers from './helpers';

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

  private process: ChildProcess | null = null;
  private eventEmitter: EventEmitter;

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

    this.eventEmitter = new EventEmitter();
  }

  public start = () => {
    try {
      this.startRecord();
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
      return this;
    }
    this.eventEmitter.emit(Events.STARTED, {
      dateFormat: this.directoryPattern,
      timeFormat: this.filenamePattern,
      segmentTime: this.segmentTime,
      dirSizeThreshold: this.dirSizeThreshold,
      path: this.path,
      uri: this.uri,
    });
    return this;
  }

  public stop = () => {
    try {
      this.stopRecord();
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
    }
    this.eventEmitter.emit(Events.STOPPED, 'Programmatically stopped');
    return this;
  }

  public on = (event: Events, callback: EventCallback) => {
    this.eventEmitter.on(event, callback);
    return this;
  }

  private startRecord = () => {
    // Check for space availability (if no space available then emit FULL event and clear directory)
    // console.log('du -s ->>>', this.recordsPath());
    // const process = spawn(`du -s ${this.recordsPath()}`);
    // console.log('ls', {process});

    if (this.process) {
      throw new RecorderError('Process already spawned.');
    }

    this.process = this.spawnFFMPEG();
  }

  private stopRecord = () => {
    if (!this.process) {
      throw new RecorderError('No process spawned.');
    }
    this.process.kill();
  }

  private spawnFFMPEG = () => {
    const process = spawn(`${this.ffmpegBinary}`,
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
        this.getFilePath(),
      ],
      { detached: false },
    );

    process.stderr.on('data', (buffer: Buffer) => {
      try {
        this.ensureDailyDirectoryExists();
      } catch (err) {
        this.eventEmitter.emit(Events.ERROR, err);
        if (this.process) {
          this.process.kill();
        }
        return;
      }

      this.eventEmitter.emit(Events.PROGRESS, buffer);
      this.logFileCreation(buffer);
    });

    process.on('error', (error) => {
      this.eventEmitter.emit(Events.ERROR, new RecorderError(error));
    });

    process.on('close', (code) => {
      this.eventEmitter.emit(Events.STOPPED, `FFMPEG process exited with code ${code}`);
    });

    return process;
  }

  private logFileCreation(buffer: Buffer) {
    const openingPattern = new RegExp(`\[segment @ 0x[0-9a-f]+\] Opening '(.+)' for writing`);
    const failedPattern = new RegExp(`\[segment @ 0x[0-9a-f]+\] Failed to open segment '(.+)'`);

    const message = buffer.toString();

    const openingMatch = message.match(openingPattern);
    const failedMatch = message.match(failedPattern);

    if (failedMatch) {
      this.eventEmitter.emit(Events.ERROR, new RecorderError(`Failed to open file '${failedMatch[1]}'.`));
    }

    if (openingMatch) {
      const filepath = openingMatch[1];
      const dirpath = pathApi.dirname(filepath);
      const dirname = pathApi.basename(dirpath);
      const filename = pathApi.basename(filepath);
      this.eventEmitter.emit(Events.FILE_CREATED, { filepath, dirpath, dirname, filename });
    }
  }

  private ensureDailyDirectoryExists = () => {
    const pathPattern = this.getDirPath();
    const path = strftime(pathPattern);
    if (Helpers.isDirectoryExist(path)) {
      return;
    }
    Helpers.createDirectory(path);
    this.eventEmitter.emit(Events.DIRECTORY_CREATED, { path });
  }

  private getDirPath = () => {
    return Helpers.getDirPath(this.path, this.directoryPattern);
  }

  private getFilePath = () => {
    return Helpers.getFilePath(this.getDirPath(), this.filenamePattern);
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
