# RTSP Video Recorder

## Provides an API to record rtsp video stream as a mp4 files splitted out on segments

[![Lint and test](https://github.com/boonya/rtsp-video-recorder/workflows/On%20push%20workflow/badge.svg)](https://github.com/boonya/rtsp-video-recorder/actions?query=workflow%3A%22Lint+and+test%22)
[![Lint, test, build and publish](https://github.com/boonya/rtsp-video-recorder/workflows/Publish/badge.svg)](https://github.com/boonya/rtsp-video-recorder/actions?query=workflow%3A%22Lint%2C+test%2C+build+and+publish%22)
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

If you prefer different package manager or work on different linux distro use appropriate to your system command.

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

#### `started` event

Handler receives an object that contains options applied to the current process

- Default values if no options passed.
- Converted values in case of some options if passed.

```ts
recorder.on(RecorderEvents.STARTED, (payload) => {
  assert.equal(payload, {
    uri: 'rtsp://username:password@host/path',
    path: '/media/Recorder',
    title: 'Test Camera',
    noAudio: false,
    filePattern: '%Y.%m.%d/%H.%M.%S',
    segmentTime: 600,
    autoClear: false,
    ffmpegBinary: 'ffmpeg',
  });
});
```

#### `stopped` event

If stopped programmatically handler receives 0 exit code & reason message that it stopped programmatically.

```ts
recorder.on(RecorderEvents.STOPPED, (payload) => {
  assert.equal(payload, 0, 'Programmatically stopped.');
});
```

Or if stop reason is FFMPEG process exited, handler receives an exit code of ffmpeg process and a message that FFMPEG exited.

```ts
recorder.on(RecorderEvents.STOPPED, (payload) => {
  assert.equal(payload, 255, 'FFMPEG exited. Code 255.');
});
```

#### `segment_started` event

Event handler receives a path to current and previous segments.

```ts
recorder.on(RecorderEvents.SEGMENT_STARTED, (payload) => {
  assert.equal(payload, {
    current: '/media/Recorder/2020.06.25.10.28.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4',
    previous: '/media/Recorder/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4',
  });
});
```

Or just current if it's first segment during this run.

```ts
recorder.on(RecorderEvents.SEGMENT_STARTED, (payload) => {
  assert.equal({
    current: '/media/Recorder/2020.06.25.10.28.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4',
  });
});
```

#### `file_created` event

New file should be created when new segment started or in case of recording stopped.

```ts
recorder.on(RecorderEvents.FILE_CREATED, (payload) => {
  assert.equal(payload, `/media/Recorder/2020.06.25/10.18.04.mp4`);
});
```

#### `space_full` event

If no space left an event should be emitted and payload raised.

There is approximation percentage which is set to 1, so when you reach out 496 you'll have `space_full` event emitted if you set your threshold e.g. 500.
In other words it works based on formula `Math.ceil(used + used * APPROXIMATION_PERCENTAGE / 100) > threshold` where `threshold` is you threshold valud and `used` is amount of space used.

```ts
recorder.on(RecorderEvents.SPACE_FULL, (payload) => {
  assert.equal(payload, {
    path: '/media/Recorder',
    threshold: 500,
    used: 496,
  });
});
```

#### `space_wiped` event

If no space left recorder directory should be wiped.
The oldest subdirectory should be removed only. An event handler will get an object with
`path`, `threshold` and space `used` which left after clear.

```ts
recorder.on(RecorderEvents.SPACE_WIPED, (payload) => {
  assert.equal(payload, {
    path: '/media/Recorder',
    threshold: 500,
    used: 200,
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

You can execute `isRecording` methond on recorder instance which returns boolean value

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

## Properties

### uri

RTSP stream URI.
e.g. `rtsp://username:password@host/path`

### path

Path to the directory for video records.
It may be relative but better to define it in absolute manner.

## Options

### filePattern

File path pattern. By default it is `%Y.%m.%d/%H.%M.%S` which will be translated to e.g. `2020.01.03/03.19.15`

_Accepts C++ strftime specifiers:_ http://www.cplusplus.com/reference/ctime/strftime/

### segmentTime

Duration of one video file (in seconds).
600 seconds or 10 minutes by default if not defined.
It can be a number of seconds or string xs, xm or xh what means amount of seconds, minutes or hours respectively.

### title

Title of video file. Used as metadata of video file.

### noAudio

By default the process is going to record audio stream into a file but in case you don't want to, you can pass `true` to this option. Note that audio stream is encoded using ACC.

### dirSizeThreshold

In case you have this option specified you will have ability to catch `SPACE_FULL` event whent threshold is reached. It can be a number of bytes or string xM, xG or xT what means amount of Megabytes, Gigabytes or Terrabytes respectively.

### autoClear

This option is `false` bu default. So, if you reach a threshold your `Recorder` emits `SPACE_FULL` event and stops. But if you specify this option as `true` it will remove the oldest directory in case threshold reached out. Also it does emit `SPACE_WIPED` event in case of some directory removed.

_NOTE that option does not make sence if `dirSizeThreshold` option is not specified._

### ffmpegBinary

In case you need to specify a path to ffmpeg binary you can do it usin this argument.
