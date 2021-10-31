# RTSP Video Recorder

## Provides an API to record rtsp video stream as a mp4 files splitted out on segments

[![Linting, types checking, testing](https://github.com/boonya/rtsp-video-recorder/actions/workflows/push.yml/badge.svg)](https://github.com/boonya/rtsp-video-recorder/actions/workflows/push.yml?query=event%3Apush+branch%3Amaster)
[![Publishing](https://github.com/boonya/rtsp-video-recorder/actions/workflows/release.yml/badge.svg)](https://github.com/boonya/rtsp-video-recorder/actions/workflows/release.yml?query=event%3Arelease)
[![npm](https://img.shields.io/npm/v/rtsp-video-recorder)](https://www.npmjs.com/package/rtsp-video-recorder)
[![Maintainability](https://img.shields.io/codeclimate/maintainability-percentage/boonya/rtsp-video-recorder?label=maintainability)](https://codeclimate.com/github/boonya/rtsp-video-recorder)
[![Test Coverage](https://img.shields.io/codeclimate/coverage/boonya/rtsp-video-recorder)](https://codeclimate.com/github/boonya/rtsp-video-recorder)
![Bundle Size](https://img.shields.io/bundlephobia/min/rtsp-video-recorder)
[![Dependencies](https://img.shields.io/librariesio/release/npm/rtsp-video-recorder)](https://www.npmjs.com/package/rtsp-video-recorder?activeTab=dependencies)

## Precondition

This library spawns `ffmpeg` as a child process, so it won't work with no `ffmpeg` installed.
To do so just type:

```bash
sudo apt update
sudo apt install -y ffmpeg
```

If you prefer different package manager or work on different linux distr use appropriate to your system command.

## Installation

Installation process of this lib as simple as it can be. Just run

```bash
npm i --save rtsp-video-recorder
```

After that you can use it like on example below

## Example

### Init an instance of recorder

```ts
import Recorder, { RecorderEvents } from 'rtsp-video-recorder';

const recorder = new Recorder('rtsp://username:password@host/path', '/media/Recorder', {
  title: 'Test Camera',
});
```

### Assign event handlers you need

#### `start` event

```ts
recorder.on(RecorderEvents.START, (payload) => {
  assert.equal(payload, 'programmatically');
});
```

#### `stop` event

Normal stop

```ts
recorder.on(RecorderEvents.STOP, (payload) => {
  assert.equal(payload, 'programmatically');
});
```

If space full

```ts
recorder.on(RecorderEvents.STOP, (payload) => {
  assert.equal(payload, 'space_full');
});
```

In case of other errors

```ts
recorder.on(RecorderEvents.STOP, (payload) => {
  assert.equal(payload, 'error', Error);
});
```

#### `started` event

Handler receives an object that contains options applied to the current process

- Default values if no options passed.
- Converted values in case of some options if passed.

```ts
recorder.on(RecorderEvents.STARTED, (payload) => {
  assert.equal(payload, {
    uri: 'rtsp://username:password@host/path',
    destination: '/media/Recorder',
    playlist: 'playlist.m3u8',
    title: 'Test Camera',
    filePattern: '%Y.%m.%d/%H.%M.%S',
    segmentTime: 600,
    noAudio: false,
    ffmpegBinary: 'ffmpeg',
  });
});
```

#### `stopped` event

If stopped because of space full handler receives 0 exit code & reason message 'space_full'.

```ts
recorder.on(RecorderEvents.STOPPED, (payload) => {
  assert.equal(payload, 0, 'space_full');
});
```

Or if stop reason is FFMPEG process exited, handler receives an exit code of ffmpeg process and a message that FFMPEG exited.

```ts
recorder.on(RecorderEvents.STOPPED, (payload) => {
  assert.equal(payload, 255, 'ffmpeg_exited');
});
```

#### `file_created` event

New file should be created when new segment started or in case of recording stopped.

```ts
recorder.on(RecorderEvents.FILE_CREATED, (payload) => {
  assert.equal(payload, `2020.06.25/10.18.04.mp4`);
});
```

#### `space_full` event

If no space left an event should be emitted and payload raised.

There is approximation percentage which is set to 1, so when you reach out 496 you'll have `space_full` event emitted if you set your threshold e.g. 500.
In other words it works based on formula `Math.ceil(used + used * APPROXIMATION_PERCENTAGE / 100) > threshold` where `threshold` is you threshold valid and `used` is amount of space used.

```ts
recorder.on(RecorderEvents.SPACE_FULL, (payload) => {
  assert.equal(payload, {
    threshold: 500,
    used: 496,
  });
});
```

#### `error` event

```ts
recorder.on(RecorderEvents.ERROR, () => {
  /** Do what you need in case of recording error */
});
```

### Start recording

```ts
recorder.start();
```

### Stop recording

```ts
recorder.stop();
```

### If you need to know whether recording is in process or no

You can execute `isRecording` method on recorder instance which returns boolean value

```ts
recorder.isRecording();
```

### It also supports [Fluent Interface](https://en.wikipedia.org/wiki/Fluent_interface#JavaScript)

```ts
import Recorder, { RecorderEvents } from 'rtsp-video-recorder';

new Recorder('rtsp://username:password@host/path', '/media/Recorder')
  .on(RecorderEvents.STARTED, onStarted)
  .on(RecorderEvents.STOPPED, onStopped)
  .on(RecorderEvents.FILE_CREATED, onFileCreated)
  .start();
```

## Arguments

### uri

RTSP stream URI.
e.g. `rtsp://username:password@host/path`

### destination

Path to the directory for video records.
It may be relative but better to define it in absolute manner.

## Options

### title

Title of video file. Used as metadata of video file.

### playlistName

The name you want your playlist file to have.

By default the name is going to be `$(date +%Y.%m.%d-%H.%M.%S)` (e.g. `2020.01.03-03.19.15`) which represents a time playlist have been created.

### filePattern

File path pattern. By default it is `%Y.%m.%d/%H.%M.%S` which will be translated to e.g. `2020.01.03/03.19.15`

_Accepts C++ strftime specifiers:_ http://www.cplusplus.com/reference/ctime/strftime/

### segmentTime

Duration of one video file (in seconds).
600 seconds or 10 minutes by default if not defined.
It can be a number of seconds or string xs, xm or xh what means amount of seconds, minutes or hours respectively.

### noAudio

By default the process is going to record audio stream into a file but in case you don't want to, you can pass `true` to this option. Note that audio stream is encoded using ACC.

### dirSizeThreshold

In case you have this option specified you will have ability to catch `SPACE_FULL` event when threshold is reached. It can be a number of bytes or string xM, xG or xT what means amount of Megabytes, Gigabytes or Terabytes respectively.

_NOTE that option does not make sense if `dirSizeThreshold` option is not specified._

### ffmpegBinary

In case you need to specify a path to ffmpeg binary you can do it using this argument.
