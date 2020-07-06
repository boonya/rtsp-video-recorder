import readline from 'readline';
import Recorder, { RecorderEvents } from './recorder';

const log = (event: string) => (...args: any[]) => {
  console.log(`${new Date().toISOString().split('T').join(' ')} :: Event "${event}": `, ...args);
};

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

try {
  const recorder = new Recorder(
    'rtsp://192.168.0.100:554/user=admin_password=tlJwpbo6_channel=1_stream=0.sdp?real_stream',
    'dist/Recorder',
    {
      title: 'Test cam',
      segmentTime: '10m',
      directoryPattern: '%Y.%m.%d',
      filenamePattern: '%H.%M.%S-test-cam',
      dirSizeThreshold: '20G',
      autoClear: true,
    },
  );

  recorder.on(RecorderEvents.STARTED, log(RecorderEvents.STARTED))
    .on(RecorderEvents.STOPPED, log(RecorderEvents.STOPPED))
    .on(RecorderEvents.ERROR, log(RecorderEvents.ERROR))
    .on(RecorderEvents.SEGMENT_STARTED, log(RecorderEvents.SEGMENT_STARTED))
    .on(RecorderEvents.FILE_CREATED, log(RecorderEvents.FILE_CREATED))
    .on(RecorderEvents.DIRECTORY_CREATED, log(RecorderEvents.DIRECTORY_CREATED))
    .on(RecorderEvents.STOP, log(RecorderEvents.STOP))
    // .on(RecorderEvents.PROGRESS, log(RecorderEvents.PROGRESS))
    .on(RecorderEvents.SPACE_FULL, log(RecorderEvents.SPACE_FULL))
    .on(RecorderEvents.SPACE_WIPED, log(RecorderEvents.SPACE_WIPED));

  process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
      if (recorder.isRecording()) {
        recorder.stop();
      }
      process.exit();
    } else if (key.name === 'space') {
      recorder.isRecording()
        ? recorder.stop()
        : recorder.start();
    }
  });
  console.log('Press "space" to start/stop recording, "ctrl + c" to stop a process.');
  console.log();
} catch (err) {
  console.error(err.message, { err });
}
