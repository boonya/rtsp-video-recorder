import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { lstatSync } from 'fs';
import EventEmitter from 'events';
import Recorder, { RecorderValidationError, RecorderError, RecorderEvents } from './recorder';

jest.mock('child_process');
jest.mock('fs');

let fakeProcess: ChildProcessWithoutNullStreams;
// @ts-ignore
spawn.mockImplementation((...args) => {
  fakeProcess = {
    // @ts-ignore
    stderr: new EventEmitter(),
    // @ts-ignore
    on: () => null,
    kill: () => null,
  };
  return fakeProcess;
});

// @ts-ignore
lstatSync.mockImplementation((path) => {
  return { isDirectory: () => true };
});

describe('Testing errors and validation', () => {
  test('Segment time option less than 5 seconds', () => {
    expect(() => new Recorder('uri', 'path', { segmentTime: 4 })).toThrow(RecorderValidationError);
  });

  test('dirSizeThreshold option less than 200 but not equal to 0', () => {
    expect(() => new Recorder('uri', 'path', { dirSizeThreshold: 199 })).toThrow(RecorderValidationError);
  });
});

describe('Testing what public methods return', () => {
  test('Method .start() should return this instance', () => {
    expect(new Recorder('uri', 'path').start()).toBeInstanceOf(Recorder);
  });

  test('Method .stop() should return this instance', () => {
    expect(new Recorder('uri', 'path').start().stop()).toBeInstanceOf(Recorder);
  });

  test('Method .on() should return this instance', () => {
    expect(new Recorder('uri', 'path').on(RecorderEvents.STARTED, () => null)).toBeInstanceOf(Recorder);
  });
});

describe('Testing events', () => {
  test('Recorder STARTED with no additional options defined', (done) => {
    function onStart(data: object) {
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
      .on(RecorderEvents.STARTED, onStart)
      .start();
  });

  test('Recorder STARTED with options defined', (done) => {
    function onStart(data: object) {
      expect(data).toStrictEqual({
        dateFormat: '%Y %B %d',
        dirSizeThreshold: 500,
        segmentTime: 3600,
        timeFormat: '%I.%M.%S%p',
        path: 'path',
        uri: 'uri',
      });
      done();
    }

    new Recorder('uri', 'path', {
      directoryPattern: '%Y %B %d',
      dirSizeThreshold: 500,
      segmentTime: 3600,
      filenamePattern: '%I.%M.%S%p',
    })
      .on(RecorderEvents.STARTED, onStart)
      .start();
  });

  test('FILE_CREATED on recorder instantiated with no options defined', (done) => {
    function onCreated(data: object) {
      expect(data).toStrictEqual({
        filepath: 'path/2020.01.03/01.37.53.mp4',
        dirpath: 'path/2020.01.03',
        dirname: '2020.01.03',
        filename: '01.37.53.mp4',
      });
      done();
    }

    new Recorder('uri', 'path')
      .on(RecorderEvents.FILE_CREATED, onCreated)
      .start();

    const message = `[segment @ 0x000000\] Opening 'path/2020.01.03/01.37.53.mp4' for writing`;
    const buffer = Buffer.from(message, 'utf8');
    fakeProcess.stderr.emit('data', buffer);
  });

  test('STOPED', (done) => {
    function onStop(data: string) {
      expect(data).toStrictEqual('Programmatically stopped');
      done();
    }

    new Recorder('uri', 'path')
      .start()
      .on(RecorderEvents.STOPPED, onStop)
      .stop();
  });

  test('ERROR if stop on not started', (done) => {
    function onError(err: RecorderError) {
      expect(err).toBeInstanceOf(RecorderError);
      expect(err.message).toStrictEqual('No process spawned');
      done();
    }

    new Recorder('uri', 'path')
      .on(RecorderEvents.ERROR, onError)
      .stop();
  });

  test('ERROR if start on already started', (done) => {
    function onError(err: RecorderError) {
      expect(err).toBeInstanceOf(RecorderError);
      expect(err.message).toStrictEqual('Process already spawned');
      done();
    }

    new Recorder('uri', 'path')
      .on(RecorderEvents.ERROR, onError)
      .start()
      .start();
  });
});
