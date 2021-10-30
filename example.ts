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
		SOURCE,
		IP,
		TITLE,
		SEGMENT_TIME,
		THRESHOLD,
		FILE_PATTERN,
		NO_AUDIO,
		DESTINATION,
		SHOW_PROGRESS,
	} = process.env;

	if (!DESTINATION && (!SOURCE && !IP) || (SOURCE && IP)) {
		console.warn('Error: Please specify SOURCE or IP + DESTINATION.');
		process.exit(1);
	}

	const source = SOURCE || `rtsp://${IP}:554/user=admin_password=tlJwpbo6_channel=1_stream=1.sdp?real_stream`;

	const title = TITLE || 'Example cam';
	const segmentTime = SEGMENT_TIME || '10m';
	const dirSizeThreshold = THRESHOLD || '500M';
	const noAudio = NO_AUDIO === 'true' ? true : false;
	const filePattern = FILE_PATTERN || `${title}-%Y.%m.%d/%H.%M.%S`;

	const recorder = new Recorder(
		source,
		DESTINATION,
		{
			title,
			segmentTime,
			filePattern,
			dirSizeThreshold,
			noAudio,
		},
	);

	if (SHOW_PROGRESS) {
		recorder.on(RecorderEvents.PROGRESS, log(RecorderEvents.PROGRESS));
	}

	recorder.on(RecorderEvents.STARTED, log(RecorderEvents.STARTED))
		.on(RecorderEvents.STOPPED, log(RecorderEvents.STOPPED))
		.on(RecorderEvents.ERROR, log(RecorderEvents.ERROR))
		.on(RecorderEvents.FILE_CREATED, log(RecorderEvents.FILE_CREATED))
		.on(RecorderEvents.STOP, log(RecorderEvents.STOP))
		.on(RecorderEvents.SPACE_FULL, log(RecorderEvents.SPACE_FULL))
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
	process.exit(1);
}
