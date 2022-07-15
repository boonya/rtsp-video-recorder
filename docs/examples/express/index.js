const express = require('express');
const {Recorder, RecorderEvents} = require('rtsp-video-recorder');
const app = express();
const PORT = 3000;

try {
	const recorder = new Recorder('rtsp://rtsp.stream/pattern', '.', {
		title: 'Test video stream'
	});

	recorder.on(RecorderEvents.FILE_CREATED, (...args) => console.log('file_created:', ...args));
	recorder.on(RecorderEvents.PROGRESS, (...args) => console.log('progress:', ...args));
	recorder.on(RecorderEvents.STOP, (...args) => console.log('stop:', ...args));
	recorder.on(RecorderEvents.STOPPED, (...args) => console.log('stopped:', ...args));
	recorder.on(RecorderEvents.START, (...args) => console.log('start:', ...args));
	recorder.on(RecorderEvents.STARTED, (...args) => console.log('started:', ...args));

	app.get('/', (req, res) => {
		res.send('Hello World!');
	});

	app.get('/start', (req, res) => {
		recorder.start();
		res.send('Recording has started.');
	});

	app.get('/stop', (req, res) => {
		recorder.stop();
		res.send('Recording has stopped.');
	});

	app.listen(PORT, () => {
		console.log(`Example app listening on port ${PORT}`);
	});

} catch (err) {
	console.error('Error:', err.message);
}
