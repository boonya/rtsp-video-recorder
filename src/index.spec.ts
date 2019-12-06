import Recorder, { RecorderError, RecorderEvents } from '.';

jest.useFakeTimers();

describe('Testing errors and validation', () => {
  test('duration option less than 5 but not equal to 0', () => {
    expect(() => new Recorder('uri', 'path', { duration: 4 })).toThrow(RecorderError);
  });

  test('dirSizeThreshold option less than 200 but not equal to 0', () => {
    expect(() => new Recorder('uri', 'path', { dirSizeThreshold: 199 })).toThrow(RecorderError);
  });

  test('maxTryReconnect option less than 1 but not equal to 0', () => {
    expect(() => new Recorder('uri', 'path', { maxTryReconnect: -1 })).toThrow(RecorderError);
  });
});

describe('Testing what public methods return', () => {
  test('Method .start() should return this instance', () => {
    expect(new Recorder('uri', 'path').start()).toBeInstanceOf(Recorder);
  });

  test('Method .stop() should return this instance', () => {
    expect(new Recorder('uri', 'path').stop()).toBeInstanceOf(Recorder);
  });

  test('Method .on() should return this instance', () => {
    expect(new Recorder('uri', 'path').on(RecorderEvents.START, () => null)).toBeInstanceOf(Recorder);
  });
});

describe('Testing events', () => {
  test('START event', (done) => {
    function onStart(data: object) {
      expect(data).toStrictEqual({
        "dayDirNameFormat": "YYYY.MM.DD",
        "dirSizeThreshold": null,
        "duration": null,
        "fileNameFormat": "YYYY.MM.DD-HH-mm-ss",
        "path": "path",
        "uri": "uri"
      });
      done();
    }

    new Recorder('uri', 'path')
      .on(RecorderEvents.START, onStart)
      .start();

    jest.runOnlyPendingTimers();
    expect(setInterval).toHaveBeenCalledTimes(0);
  });

  test('START event on recorder with options defined', (done) => {
    function onStart(data: object) {
      expect(data).toStrictEqual({
        "dayDirNameFormat": "YYYY.MMM.DD",
        "dirSizeThreshold": 500,
        "duration": 3600,
        "fileNameFormat": "DD.mm.ss",
        "path": "path",
        "uri": "uri"
      });
      done();
    }

    new Recorder('uri', 'path', {
      dayDirNameFormat: 'YYYY.MMM.DD',
      dirSizeThreshold: 500,
      duration: 3600,
      fileNameFormat: 'DD.mm.ss',
    })
      .on(RecorderEvents.START, onStart)
      .start();

    jest.runOnlyPendingTimers();
    expect(setInterval).toHaveBeenCalledTimes(1);
  });
});
