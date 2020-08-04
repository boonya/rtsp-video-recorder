import readline from 'readline';
import Recorder, { RecorderEvents } from './recorder';

const log = (event: string) => (...args: any[]) => {
  console.log(new Date().toString());
  console.log(`Event "${event}": `, ...args);
  console.log();
};

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

try {
  const {
    IP,
    TITLE,
    SEGMENT_TIME,
    THRESHOLD,
    DIRECTORY_PATTERN,
    FILENAME_PATTERN,
    AUTO_CLEAR,
    DESTINATION,
  } = process.env;

  if (!IP || !DESTINATION) {
    throw new Error('You have to specify at least IP & DESTINATION.');
  }

  const title = TITLE || 'Example cam';
  const segmentTime = SEGMENT_TIME || '10m';
  const dirSizeThreshold = THRESHOLD || '500M';
  const autoClear = AUTO_CLEAR === 'false' ? false : true;
  const directoryPattern = DIRECTORY_PATTERN || '%Y.%m.%d';
  const filenamePattern = FILENAME_PATTERN || `%H.%M.%S-${title}`;

  const recorder = new Recorder(
    `rtsp://${IP}:554/user=admin_password=tlJwpbo6_channel=1_stream=0.sdp?real_stream`, DESTINATION,
    {
      title,
      segmentTime,
      directoryPattern,
      filenamePattern,
      dirSizeThreshold,
      autoClear,
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

  process.stdin.on('keypress', (_, key: {ctrl: boolean, name: string}) => {
    if (key.ctrl && key.name === 'c') {
      if (recorder.isRecording()) {
        recorder
          .on(RecorderEvents.STOPPED, () => {
            console.log('Gracefully stopped.');
            process.exit();
          })
          .stop();
      } else {
        process.exit();
      }
    } else if (key.name === 'space') {
      recorder.isRecording()
        ? recorder.stop()
        : recorder.start();
    }
  });
  console.log('Press "space" to start/stop recording, "ctrl + c" to stop a process.');
  console.log();
} catch (err) {
  console.error(err);
}
