# RTSP Video Recorder

## Provides an API to record rtsp video stream as a mp4 files splitted out on segments

[![build status](https://img.shields.io/travis/com/boonya/rtsp-video-recorder?label=build%20status)](https://travis-ci.com/boonya/rtsp-video-recorder)
[![npm](https://img.shields.io/npm/v/rtsp-video-recorder)](https://www.npmjs.com/package/rtsp-video-recorder)
[![maintainability](https://img.shields.io/codeclimate/maintainability-percentage/boonya/rtsp-video-recorder?label=Maintainability)](https://codeclimate.com/github/boonya/rtsp-video-recorder/maintainability)
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
npm i rtsp-video-recorder
```

And after that you can use is as on example below

### Example

```ts
import Recorder, { RecorderEvents } from "rtsp-video-recorder";

const recorder = new Recorder("rtsp://username:password@host/path", "/media/Recorder", {
  title: "Test Camera",
  segmentTime: 60
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

recorder.on(RecorderEvents.DIRECTORY_CREATED, () => {
  /** Do what you need in case of new daily directory created */
});

recorder.on(RecorderEvents.FILE_CREATED, () => {
  /** Do what you need in case of new file created */
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

Duration of one video file (seconds).
600 seconds or 10 minutes by default if not defined.

#### title

Title of video file
