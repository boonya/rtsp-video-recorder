import fs from 'fs';
import EventEmitter from 'events';
import childProcess, { ChildProcess } from 'child_process';
import moment from 'moment';

import RecorderError from './error';
import { Options, Events, EventCallback } from './types';

class Recorder {
  private readonly EXT = 'mp4';

  private dayDirNameFormat: string;
  private fileNameFormat: string;

  private duration: number | null;
  private dirSizeThreshold: number | null;
  private maxTryReconnect: number | null;

  private timer: any = null;
  private writeStream: ChildProcess | null = null;
  private eventEmitter: EventEmitter;

  constructor(
    private uri: string,
    private path: string,
    options: Options = {}
  ) {
    this.dayDirNameFormat = options.dayDirNameFormat || 'YYYY.MM.DD';
    this.fileNameFormat = options.fileNameFormat || 'YYYY.MM.DD-HH-mm-ss';
    this.duration = options.duration || null;
    this.dirSizeThreshold = options.dirSizeThreshold || null;
    this.maxTryReconnect = options.maxTryReconnect || null;

    this.verifyOptions();

    this.eventEmitter = new EventEmitter();
  }

  public start = () => {
    try {
      this.initRecord();
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
    }
    return this;
  };

  public stop = () => {
    try {
      this.stopRecord();
    } catch (err) {
      this.eventEmitter.emit(Events.ERROR, err);
    }
    return this;
  };

  public on = (event: Events, callback: EventCallback) => {
    this.eventEmitter.on(event, callback);
    return this;
  };

  private verifyOptions = () => {
    const errors: string[] = [];

    /** @todo: Validate dayDirNameFormat & fileNameFormat to be a valid moment format strings */

    if (this.duration && this.duration < 5) {
      errors.push('There is no sence to set duration value to less that 5 seconds');
    }

    if (this.dirSizeThreshold && this.dirSizeThreshold < 200) {
      errors.push('There is no sence to set dirSizeThreshold value to less that 200 MB');
    }

    if (this.maxTryReconnect && this.maxTryReconnect < 1) {
      errors.push('It\'s not possible to make less than one try of reconnection.');
    }

    if (errors.length) {
      throw new RecorderError('Options are invalid', errors);
    }
  };

  private getFilePath = (dirname: string, filename: string) => `${this.recordsPath()}/${dirname}/${filename}`;

  private recordsPath = () => this.path.replace(/\/+$/, '');

  private getFileName = () => `${moment(new Date()).format(this.fileNameFormat)}.${this.EXT}`;

  private getDirName = () => moment(new Date()).format(this.dayDirNameFormat);

  private initRecord = () => {
    // Check for space availability (if no space available then emit FULL event and clear directory)
    if (!this.duration) {
      this.startRecord();
    } else {
      this.timer = setInterval(() => {
        if (this.writeStream) {
          this.writeStream.kill();
        }
        this.startRecord();
      }, this.duration * 1000);
    }
    this.eventEmitter.emit(Events.START, {
      dayDirNameFormat: this.dayDirNameFormat,
      dirSizeThreshold: this.dirSizeThreshold,
      duration: this.duration,
      fileNameFormat: this.fileNameFormat,
      path: this.path,
      uri: this.uri,
    });
  };

  private startRecord = () => {
    const filename = this.getFileName();
    const dirname = this.getDirName();
    const filepath = this.getFilePath(dirname, filename);
    // this.writeStream = this.ffmpeg(filepath);
    this.eventEmitter.emit(Events.CREATED, { filepath, dirname, filename });
  };

  private stopRecord = () => {
    // this.writeStream.kill();
    this.eventEmitter.emit(Events.STOP);
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

export {
  Recorder,
  Events as RecorderEvents,
  RecorderError
};

export default Recorder;
