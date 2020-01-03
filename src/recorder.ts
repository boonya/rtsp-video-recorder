import fs from 'fs';
import pathApi from 'path';
import EventEmitter from 'events';
import { ChildProcessWithoutNullStreams as ChildProcess, spawn } from 'child_process';

import strftime from 'strftime';

import { RecorderError, RecorderValidationError } from './error';
import { Options, Events, EventCallback } from './types';

class Recorder {
  private readonly EXT = 'mp4';

  private title?: string;

  /**
   * @READ: http://www.cplusplus.com/reference/ctime/strftime/
   */
  private directoryPattern: string = '%Y.%m.%d';
  private filenamePattern: string = '%H.%M.%S';

  private segmentTime: number = 600; // 10 minutes or 600 seconds
  private dirSizeThreshold: number | null;

  private process: ChildProcess | null = null;
  private eventEmitter: EventEmitter;

  constructor(
    private uri: string,
    private path: string,
    options: Options = {},
  ) {
    this.title = options.title;
    this.directoryPattern = options.directoryPattern || this.directoryPattern;
    this.filenamePattern = options.filenamePattern || this.filenamePattern;
    this.segmentTime = options.segmentTime || this.segmentTime;
    this.dirSizeThreshold = options.dirSizeThreshold || null;

    this.verifyOptions();

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

  private verifyOptions = () => {
    const errors: string[] = [];

    /** @todo: Validate dateFormat & timeFormat to be a valid cpp strftime format strings */

    if (this.segmentTime < 5) {
      errors.push('There is no sence to set duration value to less that 5 seconds');
    }

    if (this.dirSizeThreshold && this.dirSizeThreshold < 200) {
      errors.push('There is no sence to set dirSizeThreshold value to less that 200 MB');
    }

    try {
      const path = this.getBaseDirPath();
      if (!this.isDirectoryExist(path)) {
        errors.push(`${path} is not a directory`);
      }
    } catch (err) {
      errors.push(err.message);
    }

    if (errors.length) {
      throw new RecorderValidationError('Options are invalid', errors);
    }
  }

  private getBaseDirPath = () => pathApi.resolve(this.path);

  private getDirPath = () => {
    return `${this.getBaseDirPath()}/${this.directoryPattern}`;
  }

  private getFilePath = () => {
    return `${this.getDirPath()}/${this.filenamePattern}.${this.EXT}`;
  }

  private startRecord = () => {
    // Check for space availability (if no space available then emit FULL event and clear directory)
    // console.log('du -s ->>>', this.recordsPath());
    // const process = spawn(`du -s ${this.recordsPath()}`);
    // console.log('ls', {process});

    if (this.process) {
      throw new RecorderError('Process already spawned');
    }

    this.ffmpegRun();
  }

  private stopRecord = () => {
    if (!this.process) {
      throw new RecorderError('No process spawned');
    }
    this.process.kill();
  }

  private ffmpegRun = () => {
    this.process = spawn('ffmpeg',
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

    this.process.stderr.on('data', (buffer: Buffer) => {
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

    this.process.on('error', (...args) => {
      this.eventEmitter.emit(Events.ERROR, ...args);
    });

    this.process.on('close', (code) => {
      this.eventEmitter.emit(Events.STOPPED, `FFMPEG process exited with code ${code}`);
    });

    return this.process;
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

  private isDirectoryExist = (path: string) => {
    try {
      const stats = fs.lstatSync(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private ensureDailyDirectoryExists = () => {
    const path = strftime(this.getDirPath());
    if (this.isDirectoryExist(path)) {
      return;
    }
    fs.mkdirSync(path, 0o777);
    this.eventEmitter.emit(Events.DIRECTORY_CREATED, { path });
  }
}

export {
  Recorder,
  Events as RecorderEvents,
  RecorderError,
  RecorderValidationError,
};

export default Recorder;
