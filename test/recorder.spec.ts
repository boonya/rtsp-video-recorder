import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import EventEmitter from 'events';

import Recorder, { RecorderError, RecorderEvents, RecorderValidationError } from '../src/recorder';
import Validators from '../src/validators';
import Helpers from '../src/helpers';

jest.mock('child_process');
jest.mock('../src/validators');
jest.mock('../src/helpers');

type OnSpawnType = (...args: any[]) => void;

type OnKillType = (...args: any[]) => void;

type MockSpawnProcessOptions = {
  onSpawn?: OnSpawnType,
  onKill?: OnKillType,
};

const mockSpawnProcess = (options: MockSpawnProcessOptions = {}) => {
  const onSpawn = options.onSpawn ? options.onSpawn : () => null;
  const onKill = options.onKill ? options.onKill : () => null;

  // @ts-ignore
  const proc: ChildProcessWithoutNullStreams = new EventEmitter();
  // @ts-ignore
  proc.stderr = new EventEmitter();
  proc.kill = onKill;

  // @ts-ignore
  spawn.mockImplementation((...args: any[]) => {
    onSpawn(...args);
    return proc;
  });

  return proc;
};

const mockValidators = (result: string[]) => {
  // @ts-ignore
  Validators.verifyAllOptions.mockReturnValue(result);
};

const mockTransformSegmentTime = () => {
  // @ts-ignore
  Helpers.transformSegmentTime.mockImplementation((v: number) => v);
};

const mockTransformDirSizeThreshold = () => {
  // @ts-ignore
  Helpers.transformDirSizeThreshold.mockImplementation((v: number) => v);
};

const mockGetDirPath = (result: string) => {
  // @ts-ignore
  Helpers.getDirPath.mockReturnValue(result);
};

const mockGetFilePath = (result: string) => {
  // @ts-ignore
  Helpers.getFilePath.mockReturnValue(result);
};

const mockIsDirectoryExist = (result: boolean) => {
  // @ts-ignore
  Helpers.isDirectoryExist.mockReturnValue(result);
};

describe('Recorder', () => {
  beforeEach(() => {
    mockValidators([]);
    mockSpawnProcess();
    mockTransformSegmentTime();
    mockTransformDirSizeThreshold();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Events', () => {
    test('Recorder STARTED with no additional options defined', (done) => {
      function handler(data: object) {
        expect(data).toStrictEqual({
          dateFormat: '%Y.%m.%d',
          dirSizeThreshold: null,
          segmentTime: 600,
          timeFormat: '%H.%M.%S',
          path: 'path',
          uri: 'uri',
        });
        done();
      }

      new Recorder('uri', 'path')
        .on(RecorderEvents.STARTED, handler)
        .start();
    });

    test('Recorder STARTED with options defined', (done) => {
      function handler(data: object) {
        expect(data).toStrictEqual({
          uri: 'uri',
          path: 'path',
          dateFormat: '%Y %B %d',
          timeFormat: '%I.%M.%S%p',
          dirSizeThreshold: 500,
          segmentTime: 3600,
        });
        done();
      }

      new Recorder('uri', 'path', {
        directoryPattern: '%Y %B %d',
        filenamePattern: '%I.%M.%S%p',
        dirSizeThreshold: 500,
        segmentTime: 3600,
      })
        .on(RecorderEvents.STARTED, handler)
        .start();
    });

    test('FILE_CREATED on recorder instantiated with no options defined', (done) => {
      function handler(data: object) {
        expect(data).toStrictEqual({
          filepath: 'path/2020.01.03/01.37.53.mp4',
          dirpath: 'path/2020.01.03',
          dirname: '2020.01.03',
          filename: '01.37.53.mp4',
        });
        done();
      }

      const fakeProcess = mockSpawnProcess();
      mockGetDirPath('path/2020.01.03');
      mockIsDirectoryExist(true);

      new Recorder('uri', 'path')
        .on(RecorderEvents.FILE_CREATED, handler)
        .start();

      const message = `[segment @ 0x000000\] Opening 'path/2020.01.03/01.37.53.mp4' for writing`;
      const buffer = Buffer.from(message, 'utf8');
      fakeProcess.stderr.emit('data', buffer);
    });

    test('DIRECTORY_CREATED on recorder instantiated with no options defined', (done) => {
      function handler(data: object) {
        expect(data).toStrictEqual({ path: 'path/2020.01.03' });
        done();
      }

      const fakeProcess = mockSpawnProcess();
      mockGetDirPath('path/2020.01.03');
      mockIsDirectoryExist(false);

      new Recorder('uri', 'path')
        .on(RecorderEvents.DIRECTORY_CREATED, handler)
        .start();

      const buffer = Buffer.from('any message', 'utf8');
      fakeProcess.stderr.emit('data', buffer);
    });

    test('ERROR if can not create a file', (done) => {
      function handler(data: any) {
        expect(data).toEqual(new RecorderError(`Failed to open file 'path/2020.01.03/01.37.53.mp4'.`));
        done();
      }

      const fakeProcess = mockSpawnProcess();

      new Recorder('uri', 'path')
        .on(RecorderEvents.ERROR, handler)
        .start();

      const message = `[segment @ 0x000000] Failed to open segment 'path/2020.01.03/01.37.53.mp4'`;
      const buffer = Buffer.from(message, 'utf8');
      fakeProcess.stderr.emit('data', buffer);
    });

    test('STOPED', (done) => {
      function handler(data: string) {
        expect(data).toEqual('Programmatically stopped');
        done();
      }

      new Recorder('uri', 'path')
        .start()
        .on(RecorderEvents.STOPPED, handler)
        .stop();
    });
  });

  describe('Errors', () => {
    test('Validation error', () => {
      mockValidators(['any validation error']);

      expect(() => new Recorder('uri', 'path'))
        .toThrow(RecorderValidationError);
    });

    test('ERROR if stop on not started', (done) => {
      function onError(err: RecorderError) {
        expect(err).toBeInstanceOf(RecorderError);
        expect(err.message).toEqual('No process spawned.');
        done();
      }

      new Recorder('uri', 'path')
        .on(RecorderEvents.ERROR, onError)
        .stop();
    });

    test('ERROR if start on already started', (done) => {
      function onError(err: RecorderError) {
        expect(err).toBeInstanceOf(RecorderError);
        expect(err.message).toEqual('Process already spawned.');
        done();
      }

      new Recorder('uri', 'path')
        .on(RecorderEvents.ERROR, onError)
        .start()
        .start();
    });
  });

  describe('Process', () => {
    test('Spawn arguments with no additional options defined', (done) => {
      function onSpawn(command: string, args: ReadonlyArray<string>, options: object) {
        expect(command).toEqual('ffmpeg');
        expect(args).toEqual([
          '-i',
          'uri',
          '-an',
          '-vcodec',
          'copy',
          '-rtsp_transport',
          'tcp',
          '-vsync',
          '1',
          // ...(this.title ? ['-metadata', `title=${this.title}`] : []),
          '-f',
          'segment',
          '-segment_time',
          '600',
          '-reset_timestamps',
          '1',
          '-strftime',
          '1',
          'any-file-path',
        ]);
        expect(options).toEqual({ detached: false });
        done();
      }

      mockSpawnProcess({ onSpawn });
      mockGetFilePath('any-file-path');

      new Recorder('uri', 'path').start();
    });

    test('Spawn arguments with options defined', (done) => {
      function onSpawn(command: string, args: ReadonlyArray<string>, options: object) {
        expect(command).toEqual('ffmpeg');
        expect(args).toEqual([
          '-i',
          'any-uri',
          '-an',
          '-vcodec',
          'copy',
          '-rtsp_transport',
          'tcp',
          '-vsync',
          '1',
          '-metadata',
          'title=Any video title',
          '-f',
          'segment',
          '-segment_time',
          '1000',
          '-reset_timestamps',
          '1',
          '-strftime',
          '1',
          'any-file-path',
        ]);
        expect(options).toEqual({ detached: false });
        done();
      }

      mockSpawnProcess({ onSpawn });
      mockGetFilePath('any-file-path');

      new Recorder('any-uri', 'path', { title: 'Any video title', segmentTime: 1000 }).start();
    });

    test('FFMPEG process exited with code X', (done) => {
      function handler(data: any) {
        expect(data).toBe('FFMPEG process exited with code X');
        done();
      }

      const proc = mockSpawnProcess();

      new Recorder('uri', 'path').on(RecorderEvents.STOPPED, handler).start();

      proc.emit('close', 'X');
    });

    test('FFMPEG process emitted error', (done) => {
      function handler(data: any) {
        expect(data).toEqual(new RecorderError('Error Message'));
        done();
      }

      const proc = mockSpawnProcess();

      new Recorder('uri', 'path').on(RecorderEvents.ERROR, handler).start();

      proc.emit('error', 'Error Message');
    });
  });
});
