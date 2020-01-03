# RTSP Video Recorder

## Provide an API to record rtsp video stream to filesystem or/and stream it as mp4 source

[![Build Status](https://travis-ci.com/boonya/rtsp-video-recorder.svg?branch=master)](https://travis-ci.com/boonya/rtsp-video-recorder)
[![Maintainability](https://api.codeclimate.com/v1/badges/3f1bb7b44468808daac0/maintainability)](https://codeclimate.com/github/boonya/rtsp-video-recorder/maintainability)

### Precondition

This library spawns `ffmpeg` as a child process, so it won't work with no `ffmpeg` package installed.
To do so just type:

```bash
sudo apt update
sudo apt install -y ffmpeg
```

If you prefer different package manager or work on different linux distro use appropriate to your system command.

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

#### segmentTime

Duration of one video file (seconds).
600 seconds or 1 hour by default if not defined.

#### title

Title of video file
