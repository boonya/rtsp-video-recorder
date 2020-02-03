import Recorder, { RecorderEvents } from './recorder';

try {
  const recorder = new Recorder(
    'rtsp://192.168.2.201:554/user=admin_password=tlJwpbo6_channel=1_stream=0.sdp?real_stream',
    'Recorder',
    {
      title: 'Test Camera',
      segmentTime: 60,
      directoryPattern: 'cam-directory-%Y.%m.%d',
      filenamePattern: 'cam-file-%H.%M.%S',
    },
  );

  recorder
    .on(RecorderEvents.STARTED, (...args) => console.log('STARTED: ', ...args))
    .on(RecorderEvents.STOPPED, (...args) => console.log('STOPED: ', ...args))
    .on(RecorderEvents.ERROR, (...args) => console.log('ERROR: ', ...args))
    .on(RecorderEvents.FILE_CREATED, (...args) => console.log('FILE_CREATED: ', ...args))
    .on(RecorderEvents.DIRECTORY_CREATED, (...args) => console.log('DIRECTORY_CREATED: ', ...args))
    // .on(RecorderEvents.PROGRESS, (buffer: Buffer) => console.log('PROGRESS: ', buffer.toString()))
    .on(RecorderEvents.DELETED, (...args) => console.log('DELETED: ', ...args))
    .on(RecorderEvents.DISK_FULL, (...args) => console.log('DISK_FULL: ', ...args))
    .start();
} catch (err) {
  console.error(err.message, { err });
}
