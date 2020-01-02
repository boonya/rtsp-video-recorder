import fs from 'fs';
import { resolve as pathResolve, dirname as pathDirname, basename as pathBasename } from 'path';
import EventEmitter from 'events';
import { ChildProcessWithoutNullStreams as ChildProcess, spawn, exec } from 'child_process';

import { RecorderError, RecorderValidationError } from './error';
import { Options, Events, EventCallback } from './types';

class Recorder {
  private readonly EXT = 'mp4';

  private title?: string;

  /**
   * @READ: http://www.cplusplus.com/reference/ctime/strftime/
   */
  private dateFormat: string = '%Y.%m.%d';
  private timeFormat: string = '%H.%M.%S';

  private segmentTime: number = 600; // 10 minutes or 600 seconds
  private dirSizeThreshold: number | null;
  private maxTryReconnect: number | null;

  private outputStarted = false;
  private process: ChildProcess | null = null;
  private eventEmitter: EventEmitter;

  constructor(
    private uri: string,
    private path: string,
    options: Options = {},
  ) {
    this.title = options.title;
    this.dateFormat = options.dateFormat || this.dateFormat;
    this.timeFormat = options.timeFormat || this.timeFormat;
    this.segmentTime = options.segmentTime || this.segmentTime;
    this.dirSizeThreshold = options.dirSizeThreshold || null;
    this.maxTryReconnect = options.maxTryReconnect || null;

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
      dateFormat: this.dateFormat,
      timeFormat: this.timeFormat,
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

    if (this.maxTryReconnect && this.maxTryReconnect < 1) {
      errors.push('It\'s not possible to make less than one try of reconnection.');
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

  private getBaseDirPath = () => pathResolve(this.path);

  private getFilePath = () => {
    return `${this.getBaseDirPath()}/${this.dateFormat}/${this.timeFormat}.${this.EXT}`;
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
    this.outputStarted = false;
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
        '-segment_atclocktime',
        '1',
        '-segment_time',
        `${this.segmentTime}`,
        '-write_empty_segments',
        '1',
        '-reset_timestamps',
        '1',
        '-strftime',
        '1',
        this.getFilePath(),
      ],
      { detached: false },
    );

    this.runDirectoryProvider(this.process);

    this.process.stderr.on('data', (buffer: Buffer) => {
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
    const firstOpeningPattern = new RegExp(`\n\[segment @ 0x[0-9a-f]+\] Opening '(.+)' for writing\nOutput #0, segment, to '(.+)'`);
    const openingPattern = new RegExp(`\[segment @ 0x[0-9a-f]+\] Opening '(.+)' for writing`);
    const failedPattern = new RegExp(`\[segment @ 0x[0-9a-f]+\] Failed to open segment '(.+)'`);

    const message = buffer.toString();

    const firstOpeningMatch = message.match(firstOpeningPattern);
    const openingMatch = message.match(openingPattern);
    const failedMatch = message.match(failedPattern);

    if (firstOpeningMatch) {
      this.outputStarted = true;
    }

    if (failedMatch) {
      this.eventEmitter.emit(Events.ERROR, new RecorderError(`Failed to open file '${failedMatch[1]}'.`));
    }

    if (this.outputStarted && openingMatch) {
      const filepath = openingMatch[1];
      const dirpath = pathDirname(filepath);
      const dirname = pathBasename(dirpath);
      const filename = pathBasename(filepath);
      this.eventEmitter.emit(Events.FILE_CREATED, { filepath, dirpath, dirname, filename });
    }
  }

  private runDirectoryProvider = ({ stderr }: ChildProcess) => {
    stderr.on('data', () => {
      // tslint:disable-next-line: no-floating-promises
      (async () => {
        const currentDate = await this.getCurrentDate();
        this.ensureDailyDirectoryExists(currentDate);
      })();
    });
  }

  private getCurrentDate = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      exec(`date +${this.dateFormat}`, (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stdout.replace('\n', ''));
      });
    });
  }

  private isDirectoryExist = (path: string) => {
    try {
      const stats = fs.lstatSync(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private ensureDailyDirectoryExists = (currentDate: string) => {
    const path = `${this.getBaseDirPath()}/${currentDate}`;
    try {
      const stats = fs.lstatSync(path);
      if (stats.isDirectory()) {
        return;
      }
    } catch (err) {
      fs.mkdirSync(path, 0o777);
      this.eventEmitter.emit(Events.DIRECTORY_CREATED, { path });
      return;
    }
    this.eventEmitter.emit(Events.ERROR, new RecorderError(`${path} is not a directory`));
  }
}

export {
  Recorder,
  Events as RecorderEvents,
  RecorderError,
  RecorderValidationError,
};

export default Recorder;
