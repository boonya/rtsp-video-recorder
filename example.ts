/* eslint-disable no-console */
import readline from 'readline';
import Recorder, { RecorderEvents } from './src/recorder';

const log = (event: string) => (...args: unknown[]) => {
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
		FILE_PATTERN,
		AUTO_CLEAR,
		NO_AUDIO,
		DESTINATION,
		SHOW_PROGRESS,
	} = process.env;

	if (!IP || !DESTINATION) {
		throw new Error('You have to specify at least IP & DESTINATION.');
	}

	const title = TITLE || 'Example cam';
	const segmentTime = SEGMENT_TIME || '10m';
	const dirSizeThreshold = THRESHOLD || '500M';
	const autoClear = AUTO_CLEAR === 'true' ? true : false;
	const noAudio = NO_AUDIO === 'true' ? true : false;
	const filePattern = FILE_PATTERN || `%Y.%m.%d/%H.%M.%S-${title}`;

	const recorder = new Recorder(
		`rtsp://${IP}:554/user=admin_password=tlJwpbo6_channel=1_stream=0.sdp?real_stream`, DESTINATION,
		{
			title,
			segmentTime,
			filePattern,
			dirSizeThreshold,
			autoClear,
			noAudio,
		},
	);

	if (SHOW_PROGRESS) {
		recorder.on(RecorderEvents.PROGRESS, log(RecorderEvents.PROGRESS));
	}

	recorder.on(RecorderEvents.STARTED, log(RecorderEvents.STARTED))
		.on(RecorderEvents.STOPPED, log(RecorderEvents.STOPPED))
		.on(RecorderEvents.ERROR, log(RecorderEvents.ERROR))
		.on(RecorderEvents.SEGMENT_STARTED, log(RecorderEvents.SEGMENT_STARTED))
		.on(RecorderEvents.FILE_CREATED, log(RecorderEvents.FILE_CREATED))
		.on(RecorderEvents.STOP, log(RecorderEvents.STOP))
		.on(RecorderEvents.SPACE_FULL, log(RecorderEvents.SPACE_FULL))
		.on(RecorderEvents.SPACE_WIPED, log(RecorderEvents.SPACE_WIPED))
		.start();

	process.stdin.on('keypress', (_, key) => {
		if (key.ctrl && key.name === 'c') {
			if (recorder.isRecording()) {
				recorder
					.on(RecorderEvents.STOPPED, () => {
						setTimeout(() => {
							console.log('Gracefully stopped.');
							process.exit();
						}, 2000);
					})
					.stop();
			} else {
				process.exit();
			}
		} else if (key.name === 'space') {
			if (recorder.isRecording()) {
				recorder.stop();
			} else {
				recorder.start();
			}
		}
	});
	console.log('Press "space" to start/stop recording, "ctrl + c" to stop a process.');
	console.log();
} catch (err) {
	console.error(err);
}
