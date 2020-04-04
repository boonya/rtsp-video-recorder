import Recorder, { RecorderEvents } from './recorder';

try {
  new Recorder(
    'rtsp://192.168.0.100:554/user=admin_password=tlJwpbo6_channel=1_stream=0.sdp?real_stream',
    'dist/Recorder',
    {
      title: 'Test Camera',
      segmentTime: '10m',
      directoryPattern: '%Y.%m.%d',
      filenamePattern: '%H.%M.%S-test-cam',
      dirSizeThreshold: '20G',
      autoClear: true,
    },
  ).on(RecorderEvents.STARTED, (...args) => console.log(`${RecorderEvents.STARTED}: `, ...args))
    .on(RecorderEvents.STOPPED, (...args) => console.log(`${RecorderEvents.STOPPED}: `, ...args))
    .on(RecorderEvents.ERROR, (...args) => console.log(`${RecorderEvents.ERROR}: `, ...args))
    .on(RecorderEvents.SEGMENT_STARTED, (...args) => console.log(`${RecorderEvents.SEGMENT_STARTED}: `, ...args))
    .on(RecorderEvents.FILE_CREATED, (...args) => console.log(`${RecorderEvents.FILE_CREATED}: `, ...args))
    .on(RecorderEvents.DIRECTORY_CREATED, (...args) => console.log(`${RecorderEvents.DIRECTORY_CREATED}: `, ...args))
    .on(RecorderEvents.STOP, (...args) => console.log(`${RecorderEvents.STOP}: `, ...args))
    // .on(RecorderEvents.PROGRESS, (buffer: Buffer) => console.log(`${RecorderEvents.PROGRESS}: `, buffer.toString()))
    .on(RecorderEvents.SPACE_FULL, (...args) => console.log(`${RecorderEvents.SPACE_FULL}: `, ...args))
    .on(RecorderEvents.SPACE_WIPED, (...args) => console.log(`${RecorderEvents.SPACE_WIPED}: `, ...args))
    .start();
} catch (err) {
  console.error(err.message, { err });
}
