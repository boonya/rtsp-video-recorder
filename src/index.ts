import fs from 'fs';
import EventEmitter from 'events';
import childProcess, { ChildProcess } from 'child_process';
import moment from 'moment';

import RecorderError from './error';

type RecorderOptions = {
  duration?: number;
  dayDirNameFormat?: string;
  fileNameFormat?: string;
  dirSizeThreshold?: number;
  maxTryReconnect?: number;
};

type EventCallback = () => void;

export enum RecorderEvents {
  START = "start",
  STOP = "stop",
  ERROR = "error",
  CREATED = "created",
  DELETED = "deleted",
  FULL = "full",
};

class Recorder {
  private readonly EXT = 'mp4';

  private duration: number;
  private dayDirNameFormat: string;
  private fileNameFormat: string;
  private dirSizeThreshold: number;
  private maxTryReconnect: number;

  private timer: any;
  private writeStream: ChildProcess | null;
  private eventEmitter: EventEmitter;

  constructor(
    private uri: string,
    private path: string,
    options?: RecorderOptions
  ) {
    this.dayDirNameFormat = options && options.dayDirNameFormat || 'YY.MM.DD';
    this.fileNameFormat = options && options.fileNameFormat || 'YYYY.MM.DD-HH-mm-ss';
    this.duration = options && options.duration || 0;
    this.dirSizeThreshold = options && options.dirSizeThreshold || 0;
    this.maxTryReconnect = options && options.maxTryReconnect || 3;

    this.verifyOptions();

    this.timer = null;
    this.writeStream = null;
    this.eventEmitter = new EventEmitter();
  }

  public start = () => {
    try {
      this.startRecord();
    } catch (err) {
      this.eventEmitter.emit(RecorderEvents.ERROR, err);
    }
    return this;
  };

  public stop = () => {
    try {
      this.stopRecord();
    } catch (err) {
      this.eventEmitter.emit(RecorderEvents.ERROR, err);
    }
    return this;
  };

  public on = (eventName: RecorderEvents, callback: EventCallback) => {
    this.eventEmitter.on(eventName, callback);
    return this;
  };

  private verifyOptions = () => {
    const errors: string[] = [];

    /** @todo: Validate dayDirNameFormat & fileNameFormat to be a valid moment format strings */

    if (this.duration !== 0 && this.duration < 5) {
      errors.push('There is no sence to set duration value to less that 5 seconds');
    }

    if (this.dirSizeThreshold !== 0 && this.dirSizeThreshold < 200) {
      errors.push('There is no sence to set dirSizeThreshold value to less that 200 MB');
    }

    if (this.maxTryReconnect < 1) {
      errors.push('It\'s not possible to make less than one try of reconnection.');
    }

    if (errors.length) {
      throw new RecorderError('Options are invalid', errors);
    }
  };

  private getFilePath = (dirname: string, filename: string) => `${this.recordsPath()}/${dirname}/${filename}`;

  private recordsPath = () => this.path.replace(/\/+$/, '');

  private getFileName = () => moment(new Date(), this.fileNameFormat).toString() + this.EXT;

  private getDirName = () => moment(new Date(), this.dayDirNameFormat).toString();

  private startRecord = () => {
    // Check for space availability (if no space available then emit FULL event and clear directory)

    if (!this.duration) {
      this.startInfinityRecord();
    } else {
      this.timer = setInterval(this.startIntervalRecord, this.duration * 1000);
    }
    this.eventEmitter.emit(RecorderEvents.START, {
      dayDirNameFormat: this.dayDirNameFormat,
      dirSizeThreshold: this.dirSizeThreshold,
      duration: this.duration,
      fileNameFormat: this.fileNameFormat,
      path: this.path,
    });
  };

  private startIntervalRecord = () => {
    if (this.writeStream) {
      this.writeStream.kill();
      this.writeStream = null;
    }
    this.startInfinityRecord();
  };

  private startInfinityRecord = () => {
    const filename = this.getFileName();
    const dirname = this.getDirName();
    const filepath = this.getFilePath(dirname, filename);
    // this.writeStream = this.ffmpeg(filepath);
    this.eventEmitter.emit(RecorderEvents.CREATED, { filepath, dirname, filename });
  };

  private stopRecord = () => {
    // this.writeStream.kill();
    this.eventEmitter.emit(RecorderEvents.STOP);
  };

  private ffmpeg = (filepath: string) => {
    return childProcess.spawn("ffmpeg",
      [
        '-i',
        this.uri,
        '-an',
        '-f',
        'mpeg1video',
        '-b:v',
        '128k',
        '-r',
        '25',
        filepath
      ],
      { detached: false }
    );
  };

  private createDirectory = (path: string) => new Promise((resolve, reject) => {
    try {
      fs.lstat(path, (lstatErr, stats) => {
        if (lstatErr) {
          return reject(lstatErr);
        }
        if (!stats.isDirectory()) {
          /**
           * Since node v10.12.0 The second argument can be an options object
           * with recursive and mode properties.
           * @todo: Do this check here and apply appropriate.
           */
          fs.mkdir(path, 755, (mkdirErr) => {
            if (mkdirErr) {
              return reject(mkdirErr);
            }
            resolve();
          });
        }
      });
    } catch (err) {
      reject(err);
    }
  });

  private removeDirectory = (path: string) => new Promise((resolve, reject) => {
    fs.rmdir(path, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

export default Recorder;
