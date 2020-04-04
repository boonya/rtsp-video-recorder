# RTSP Video Recorder

## Provides an API to record rtsp video stream as a mp4 files splitted out on segments

![On push workflow](https://github.com/boonya/rtsp-video-recorder/workflows/On%20push%20workflow/badge.svg)
![Publish](https://github.com/boonya/rtsp-video-recorder/workflows/Publish/badge.svg)
[![npm](https://img.shields.io/npm/v/rtsp-video-recorder)](https://www.npmjs.com/package/rtsp-video-recorder)
[![maintainability](https://img.shields.io/codeclimate/maintainability-percentage/boonya/rtsp-video-recorder?label=maintainability)](https://codeclimate.com/github/boonya/rtsp-video-recorder/maintainability)
![bundle size](https://img.shields.io/bundlephobia/min/rtsp-video-recorder)
![dependencies](https://img.shields.io/librariesio/release/npm/rtsp-video-recorder)

### Precondition

This library spawns `ffmpeg` as a child process, so it won't work with no `ffmpeg` package installed.
To do so just type:

```bash
sudo apt update
sudo apt install -y ffmpeg
```

If you prefer different package manager or work on different linux distro use appropriate to your system command.

### Installation

Installation process of this lib as simple as it can be. Just run

```bash
npm i --save rtsp-video-recorder
```

And after that you can use is as on example below

### Example

```ts
import Recorder, { RecorderEvents } from "rtsp-video-recorder";

const recorder = new Recorder("rtsp://username:password@host/path", "/media/Recorder", {
  title: "Test Camera",
});

// Start recording
recorder.start();

recorder.on(RecorderEvents.STARTED, () => {
  /** Do what you need in case of recording started */
});

recorder.on(RecorderEvents.STOPPED, () => {
  /** Do what you need in case of recording stopped */
});

recorder.on(RecorderEvents.ERROR, () => {
  /** Do what you need in case of recording error */
});

recorder.on(RecorderEvents.SEGMENT_STARTED, () => {
  /** Do what you need in case of new segment started */
});

recorder.on(RecorderEvents.DIRECTORY_CREATED, () => {
  /** Do what you need in case of new directory created */
});

recorder.on(RecorderEvents.FILE_CREATED, () => {
  /** Do what you need in case of new file created */
});

recorder.on(RecorderEvents.SPACE_FULL, () => {
  /** Do what you need in case of space is full */
});

recorder.on(RecorderEvents.SPACE_WIPED, () => {
  /** Do what you need in case of space wiped */
});

// Stop recording
recorder.stop();
```

### Properties

#### uri

RTSP stream URI.

#### path

Path to the directory for video records.
It may be relative but better to define it in absolute manner.

### Options

#### directoryPattern

Directory name pattern. By default it is `%Y.%m.%d` which will be translated to e.g. `2020.01.03`

_Accepts C++ strftime specifiers:_ http://www.cplusplus.com/reference/ctime/strftime/

#### filenamePattern

File name pattern. By default it is `%H.%M.%S` which will be translated to e.g. `03.19.15`

_Accepts C++ strftime specifiers:_ http://www.cplusplus.com/reference/ctime/strftime/

#### segmentTime

Duration of one video file (in seconds).
600 seconds or 10 minutes by default if not defined.
It can be a number of seconds or string xs, xm or xh what means amount of seconds, minutes or hours respectively.

#### title

Title of video file. Used as metadata of video file.

#### dirSizeThreshold

In case you have this option specified you will have ability to catch `SPACE_FULL` event whent threshold is reached. It can be a number of bytes or string xM, xG or xT what means amount of Megabytes, Gigabytes or Terrabytes respectively.

#### autoClear

This option is `false` bu default. So, if you reach a threshold your `Recorder` emits `SPACE_FULL` event and stops. But if you specify this option as `true` it will remove the oldest directory in case threshold reached out. Also it does emit `SPACE_WIPED` event in case of some directory removed.

_NOTE that option does not make sence if `dirSizeThreshold` option is not specified._

#### ffmpegBinary

In case you need to specify a path to ffmpeg binary you can do it usin this argument.
