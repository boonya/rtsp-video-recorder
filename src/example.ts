import Recorder, { IRecorder, RecorderEvents } from './recorder';

const handleEvents = (name: string, recorder: IRecorder) => recorder
  .on(RecorderEvents.STARTED, (...args) => console.log(`${name} -> ${RecorderEvents.STARTED}: `, ...args))
  .on(RecorderEvents.STOPPED, (...args) => console.log(`${name} -> ${RecorderEvents.STOPPED}: `, ...args))
  .on(RecorderEvents.ERROR, (...args) => console.log(`${name} -> ${RecorderEvents.ERROR}: `, ...args))
  .on(RecorderEvents.SEGMENT_STARTED, (...args) => console.log(`${name} -> ${RecorderEvents.SEGMENT_STARTED}: `, ...args))
  .on(RecorderEvents.FILE_CREATED, (...args) => console.log(`${name} -> ${RecorderEvents.FILE_CREATED}: `, ...args))
  .on(RecorderEvents.DIRECTORY_CREATED, (...args) => console.log(`${name} -> ${RecorderEvents.DIRECTORY_CREATED}: `, ...args))
  .on(RecorderEvents.STOP, (...args) => console.log(`${name} -> ${RecorderEvents.STOP}: `, ...args))

  // .on(RecorderEvents.PROGRESS, (buffer: Buffer) => console.log(`${name} -> ${RecorderEvents.PROGRESS}: `, buffer.toString()))

  .on(RecorderEvents.SPACE_FULL, ({ used, threshold, ...rest }) => console.log(`${name} -> ${RecorderEvents.SPACE_FULL}: `, {
    used,
    threshold,
    MB: {
      used: used / 1024 / 1024,
      threshold: threshold / 1024 / 1024,
    },
    GB: {
      used: used / 1024 / 1024 / 1024,
      threshold: threshold / 1024 / 1024 / 1024,
    },
    ...rest,
  }))

  .on(RecorderEvents.SPACE_WIPED, ({ used, threshold, ...rest }) => console.log(`${name} -> ${RecorderEvents.SPACE_WIPED}: `, {
    used,
    threshold,
    MB: {
      used: used / 1024 / 1024,
      threshold: threshold / 1024 / 1024,
    },
    GB: {
      used: used / 1024 / 1024 / 1024,
      threshold: threshold / 1024 / 1024 / 1024,
    },
    ...rest,
  }));

try {
  const yardCamRecorder = new Recorder(
    'rtsp://192.168.0.100:554/user=admin_password=tlJwpbo6_channel=1_stream=0.sdp?real_stream',
    'dist/Recorder',
    {
      title: 'Yard Camera',
      segmentTime: '10m',
      directoryPattern: '%Y.%m.%d',
      filenamePattern: '%H.%M.%S-yard',
      dirSizeThreshold: '20G',
      autoClear: true,
    },
  );

  const tableCamRecorder = new Recorder(
    'rtsp://192.168.0.101:554/user=admin_password=tlJwpbo6_channel=1_stream=0.sdp?real_stream',
    'dist/Recorder',
    {
      title: 'Table Camera',
      segmentTime: '10m',
      directoryPattern: '%Y.%m.%d',
      filenamePattern: '%H.%M.%S-table',
      dirSizeThreshold: '20G',
      autoClear: true,
    },
  );

  handleEvents('Yard Cam', yardCamRecorder);
  handleEvents('Table Cam', tableCamRecorder);

  yardCamRecorder.start();
  tableCamRecorder.start();
} catch (err) {
  console.error(err.message, { err });
}
