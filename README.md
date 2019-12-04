# RTSP Video Recorder

## Provide an API to record rtsp video stream to filesystem or/and stream it as mp4 source

### Precondition

This library spawns `ffmpeg` as a child process, so it won't work with no `ffmpeg` package installed.
To do so just type:

```bash
sudo apt update
sudo apt install -y ffmpeg
```

If you prefer different package manager or work on different linux distro use appropriate to your system command.

### Example

```js
import Recorder from "rtsp-video-recorder";

const recorder = new Recorder({
  uri: "rtsp://username:password@host/path",
  duration: 60, // seconds
  path: "/Users/username/Vvideos/Recorder",
  dirSizeThreshold: 1024, // MB
  maxTryReconnect: 15
});

// Start recording
recorder.start();

recorder.on("start", () => {
  /** Do what you need in case of recording started */
});

recorder.on("stop", () => {
  /** Do what you need in case of recording stopped */
});

recorder.on("error", () => {
  /** Do what you need in case of recording error */
});

recorder.on("file", () => {
  /** Do what you need in case of new records file created */
});

// Stop recording
recorder.stop();
```

### Options

#### uri

RTSP stream URI.

#### duration

Duration of one video file (seconds).

#### path

Absolute path to the recordings folder.

#### dirSizeThreshold

Max size of records folder (MB).

#### maxTryReconnect

max count for reconnects.
