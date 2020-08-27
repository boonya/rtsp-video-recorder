import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';
import fs, { Stats } from 'fs';
import fse from 'fs-extra';
import du from 'du';
// tslint:disable-next-line: no-implicit-dependencies no-submodule-imports
import { mocked } from 'ts-jest/utils';

import Recorder, { RecorderError, RecorderValidationError, RecorderEvents } from '../src/recorder';
import { verifyAllOptions } from '../src/validators';

jest.mock('child_process');
jest.mock('fs');
jest.mock('fs-extra');
jest.mock('du');
jest.mock('../src/validators');

const URI = 'rtsp://username:password@host/path';
const PATH = '/media/Recorder';

type OnSpawnType = (...args: any[]) => void;

type OnKillType = (...args: any[]) => boolean;

type MockSpawnProcessOptions = {
  onSpawn?: OnSpawnType,
  onKill?: OnKillType,
};

function mockSpawnProcess (options: MockSpawnProcessOptions = {}) {
  const onSpawn = options.onSpawn ? options.onSpawn : () => null;
  const onKill = options.onKill ? options.onKill : () => true;

  // @ts-ignore
  const proc: ChildProcessWithoutNullStreams = new EventEmitter();
  // @ts-ignore
  proc.stderr = new EventEmitter();
  proc.kill = onKill;

  mocked(spawn).mockImplementation((...args) => {
    onSpawn(...args);
    return proc;
  });

  return proc;
}

let fakeProcess: ChildProcessWithoutNullStreams;
beforeEach(() => {
  mocked(verifyAllOptions).mockReturnValue([]);
  fakeProcess = mockSpawnProcess();
  mocked(fs).lstatSync.mockImplementation(() => ({ ...new Stats(), isDirectory: () => true }));
  mocked(fse).move.mockImplementation(() => Promise.resolve(true));
  mocked(fse).remove.mockImplementation(() => Promise.resolve(true));
  mocked(fse).ensureDir.mockImplementation(() => Promise.resolve(true));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('If validation failed during instantiating recorder an error raised.', () => {
  mocked(verifyAllOptions).mockReturnValue([
    'Any validation error message',
    'One more validation error message',
  ]);

  expect(() => new Recorder(URI, PATH)).toThrowError(new RecorderValidationError('Options invalid', [
    'Any validation error message',
    'One more validation error message',
  ]));
});

describe('Events', () => {
  describe(RecorderEvents.STARTED, () => {
    test(`Handler receives an object that contains options applied to the current process.
    Default values if no options passed.`, (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const onStarted = jest.fn(() => done()).mockName('onStarted');

      new Recorder(URI, PATH)
        .on(RecorderEvents.STARTED, onStarted)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

      expect(onStarted).toBeCalledTimes(1);
      expect(onStarted).toBeCalledWith({
        uri: URI,
        path: PATH,
        filePattern: '%Y.%m.%d/%H.%M.%S',
        segmentTime: 600,
        autoClear: false,
        ffmpegBinary: 'ffmpeg',
      });
    });

    test(`Handler receives an object that contains options applied to the current process.
    Converted values in case of some options if passed.`, (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const onStarted = jest.fn(() => done()).mockName('onStarted');

      new Recorder(URI, PATH, {
        title: 'Test Cam',
        filePattern: '%Y %B %d/%I.%M.%S%p',
        dirSizeThreshold: '500M',
        segmentTime: '1h',
        autoClear: true,
        ffmpegBinary: '/bin/ffmpeg',
      })
        .on(RecorderEvents.STARTED, onStarted)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

      expect(onStarted).toBeCalledTimes(1);
      expect(onStarted).toBeCalledWith({
        uri: URI,
        path: PATH,
        title: 'Test Cam',
        filePattern: '%Y %B %d/%I.%M.%S%p',
        dirSizeThreshold: 524288000,
        segmentTime: 3600,
        autoClear: true,
        ffmpegBinary: '/bin/ffmpeg',
      });
    });
  });

  describe(RecorderEvents.STOPPED, () => {
    test(`If stop reason is FFMPEG process exited handler receives exit code of ffmpeg process
      and a messae that FFMPEG exited.`, (done) => {
      const onStopped = jest.fn(() => done()).mockName('onStopped');

      new Recorder(URI, PATH)
        .on(RecorderEvents.STOPPED, onStopped)
        .start();

      fakeProcess.emit('close', 255);

      expect(onStopped).toBeCalledTimes(1);
      expect(onStopped).toBeCalledWith(255, 'FFMPEG exited. Code 255.');
    });
  });

  describe(RecorderEvents.SEGMENT_STARTED, () => {
    test(`Event handler receives a path to current and previous segments.`, (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const SECOND_SEGMENT = `${PATH}/2020.06.25.10.28.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const onSegmentStarted = jest.fn(() => done()).mockName('onSegmentStarted');

      new Recorder(URI, PATH)
        .on(RecorderEvents.SEGMENT_STARTED, onSegmentStarted)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));
      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${SECOND_SEGMENT}' for writing`, 'utf8'));

      expect(onSegmentStarted).toBeCalledTimes(2);
      expect(onSegmentStarted).toHaveBeenNthCalledWith(1, {
        current: FIRST_SEGMENT,
      });
      expect(onSegmentStarted).toHaveBeenNthCalledWith(2, {
        current: SECOND_SEGMENT,
        previous: FIRST_SEGMENT,
      });
    });
  });

  describe(RecorderEvents.FILE_CREATED, () => {
    test('New file should be created when new segment started.', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const SECOND_SEGMENT = `${PATH}/2020.06.25.10.28.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const onFileCreated = jest.fn(() => done()).mockName('onFileCreated');

      new Recorder(URI, PATH)
        .on(RecorderEvents.FILE_CREATED, onFileCreated)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));
      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${SECOND_SEGMENT}' for writing`, 'utf8'));
      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();
      await Promise.resolve();

      expect(onFileCreated).toBeCalledTimes(1);
      expect(onFileCreated).toBeCalledWith(`${PATH}/2020.06.25/10.18.04.mp4`);
    });

    test('If recording stopped current segment should be moved to other files.', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const onFileCreated = jest.fn().mockName('onFileCreated');

      const recorder = new Recorder(URI, PATH)
        .on(RecorderEvents.FILE_CREATED, onFileCreated)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

      recorder.stop();

      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();
      await Promise.resolve();

      expect(onFileCreated).toBeCalledTimes(1);
      expect(onFileCreated).toBeCalledWith(`${PATH}/2020.06.25/10.18.04.mp4`);

      done();
    });
  });

  describe(RecorderEvents.SPACE_FULL, () => {
    test('If no space left an event should be emitted and payload raised.', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      mocked(du).mockImplementation(() => 496);
      mocked(fs).readdirSync.mockImplementation(() => []);

      const onSpaceFull = jest.fn(() => done()).mockName('onSpaceFull');

      new Recorder(URI, PATH, { dirSizeThreshold: 500 })
        .on(RecorderEvents.SPACE_FULL, onSpaceFull)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();

      expect(onSpaceFull).toBeCalledTimes(1);
      expect(onSpaceFull).toBeCalledWith({
        path: PATH,
        threshold: 500,
        used: 496,
      });
    });

    test('If space not enough an event won\'t be emitted.', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      mocked(du).mockImplementation(() => 400);
      mocked(fs).readdirSync.mockImplementation(() => []);

      const onSpaceFull = jest.fn().mockName('onSpaceFull');

      new Recorder(URI, PATH, { dirSizeThreshold: 500 })
        .on(RecorderEvents.SPACE_FULL, onSpaceFull)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();

      expect(onSpaceFull).toBeCalledTimes(0);

      done();
    });
  });

  describe(RecorderEvents.SPACE_WIPED, () => {
    test('If no space left recorder directory should be wiped. The oldest directory should be removed only.', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      mocked(du)
        .mockImplementationOnce(() => 500)
        .mockImplementationOnce(() => 200);
      // @ts-ignore
      mocked(fs).readdirSync.mockImplementation(() => ['oldest-dir', 'newest-dir']);
      mocked(fs).lstatSync.mockImplementation((arg) => ({
        ...new Stats(),
        birthtimeMs: arg === `${PATH}/oldest-dir` ? Date.now() - 1000 : Date.now(),
      }));
      mocked(fse).remove.mockImplementationOnce(() => true);

      const onSpaceWiped = jest.fn(() => done()).mockName('onSpaceWiped');

      new Recorder(URI, PATH, { dirSizeThreshold: 500, autoClear: true })
        .on(RecorderEvents.SPACE_WIPED, onSpaceWiped)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(onSpaceWiped).toBeCalledTimes(1);
      expect(onSpaceWiped).toBeCalledWith({
        path: PATH,
        threshold: 500,
        used: 200,
      });
    });
  });

  describe(RecorderEvents.ERROR, () => {
    test('If opening a file to write segment into has failed.', (done) => {
      const SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const onError = jest.fn(() => done()).mockName('onError');

      new Recorder(URI, PATH)
        .on(RecorderEvents.ERROR, onError)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Failed to open segment '${SEGMENT}'`, 'utf8'));

      expect(onError).toBeCalledTimes(1);
      expect(onError).toBeCalledWith(new RecorderError(`Failed to open file '${SEGMENT}'.`));
    });

    test('If ffmpeg process failed.', (done) => {
      const onError = jest.fn(() => done()).mockName('onError');

      new Recorder(URI, PATH)
        .on(RecorderEvents.ERROR, onError)
        .start();

      fakeProcess.emit('error', 'FFMPEG has failed.');

      expect(onError).toBeCalledTimes(1);
      expect(onError).toBeCalledWith(new RecorderError('FFMPEG has failed.'));
    });

    test('If process already started.', (done) => {
      const onError = jest.fn(() => done()).mockName('onError');

      new Recorder(URI, PATH)
        .on(RecorderEvents.ERROR, onError)
        .start()
        .start();

      expect(onError).toBeCalledTimes(1);
      expect(onError).toBeCalledWith(new RecorderError('Process already spawned.'));
    });

    test('If try to stop not started process.', async (done) => {
      const onError = jest.fn().mockName('onError');

      new Recorder(URI, PATH)
        .on(RecorderEvents.ERROR, onError)
        .stop();

      expect(onError).toBeCalledTimes(1);
      expect(onError).toBeCalledWith(new RecorderError('No process spawned.'));

      done();
    });

    test('In case of segment destination is not a directory for some reason.', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const SECOND_SEGMENT = `${PATH}/2020.06.25.10.28.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      mocked(fs).lstatSync.mockImplementation(() => ({ ...new Stats(), isDirectory: () => false }));
      const onError = jest.fn(() => done()).mockName('onError');

      new Recorder(URI, PATH)
        .on(RecorderEvents.ERROR, onError)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));
      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${SECOND_SEGMENT}' for writing`, 'utf8'));
      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toBeCalledTimes(1);
      expect(onError).toBeCalledWith(new Error(`${PATH}/2020.06.25 exists but it is not a directory.`));
    });

    test('In case of moving segment failed.', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const SECOND_SEGMENT = `${PATH}/2020.06.25.10.28.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const onError = jest.fn(() => done()).mockName('onError');
      mocked(fse).move.mockImplementation(() => {
        throw new Error('Moving failed.');
      });

      new Recorder(URI, PATH)
        .on(RecorderEvents.ERROR, onError)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));
      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${SECOND_SEGMENT}' for writing`, 'utf8'));
      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toBeCalledTimes(1);
      expect(onError).toBeCalledWith(new RecorderError('Moving failed.'));
    });

    test('DU has failed for some reason.', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      const onError = jest.fn(() => done()).mockName('onError');
      mocked(du).mockImplementation(() => {
        throw new Error('DU has failed for some reason.');
      });

      new Recorder(URI, PATH, { dirSizeThreshold: 500 })
        .on(RecorderEvents.ERROR, onError)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));
      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();

      expect(onError).toBeCalledTimes(1);
      expect(onError).toBeCalledWith(new RecorderError('DU has failed for some reason.'));
    });

    test('In case of can\'t remove a directory', async (done) => {
      const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
      mocked(du).mockImplementation(() => 500);
      mocked(fs).readdirSync.mockImplementation(() => []);
      const onError = jest.fn(() => done()).mockName('onError');

      new Recorder(URI, PATH, { dirSizeThreshold: 500, autoClear: true })
        .on(RecorderEvents.ERROR, onError)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));
      // https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toBeCalledTimes(1);
      expect(onError).toBeCalledWith(new Error('Can\'t remove current directory.'));
    });
  });

  describe(RecorderEvents.PROGRESS, () => {
    test('A message from stderr just translated from buffer to string and proxied to a progress event.', async (done) => {
      const onProgress = jest.fn().mockName('onProgress');

      new Recorder(URI, PATH)
        .on(RecorderEvents.PROGRESS, onProgress)
        .start();

      fakeProcess.stderr.emit('data', Buffer.from(`Random progress message.`, 'utf8'));

      expect(onProgress).toBeCalledTimes(1);
      expect(onProgress).toBeCalledWith('Random progress message.');

      done();
    });
  });
});

describe('Process', () => {
  test('Spawn arguments with no additional options defined', (done) => {
    function onSpawn (command: string, args: ReadonlyArray<string>, options: object) {
      expect(command).toEqual('ffmpeg');
      expect(args).toEqual([
        '-i',
        URI,
        '-an',
        '-vcodec',
        'copy',
        '-rtsp_transport',
        'tcp',
        '-vsync',
        '1',
        '-f',
        'segment',
        '-segment_time',
        '600',
        '-reset_timestamps',
        '1',
        '-strftime',
        '1',
        `${PATH}/%Y.%m.%d.%H.%M.%S.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`,
      ]);
      expect(options).toEqual({ detached: false });
      done();
    }

    mockSpawnProcess({ onSpawn });

    new Recorder(URI, PATH).start();
  });

  test('Spawn arguments with options defined', (done) => {
    function onSpawn (command: string, args: ReadonlyArray<string>, options: object) {
      expect(command).toEqual('ffmpeg');
      expect(args).toEqual([
        '-i',
        URI,
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
        `${PATH}/%Y.%m.%d.%H.%M.%S.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`,
      ]);
      expect(options).toEqual({ detached: false });
      done();
    }

    mockSpawnProcess({ onSpawn });

    new Recorder(URI, PATH, { title: 'Any video title', segmentTime: 1000 }).start();
  });
});
