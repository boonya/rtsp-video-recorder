import { ChildProcessWithoutNullStreams } from 'child_process';
import pathApi from 'path';
import { mocked } from 'ts-jest/utils';
import {mockSpawnProcess} from '../test.helpers';

import Recorder, { RecorderEvents } from '../../src/recorder';
import { verifyAllOptions } from '../../src/validators';

jest.mock('fs');
jest.mock('../../src/validators');

const URI = 'rtsp://username:password@host/path';
const PATH = pathApi.normalize('/media/Recorder');

let fakeProcess: ChildProcessWithoutNullStreams;
beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
});

test('should forward to event handler default recorder options', async () => {
	const onStarted = jest.fn().mockName('onStarted');

	new Recorder(URI, PATH)
		.on(RecorderEvents.STARTED, onStarted)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(onStarted).toBeCalledTimes(1);
	expect(onStarted).toBeCalledWith({
		uri: URI,
		path: PATH,
		filePattern: '%Y.%m.%d/%H.%M.%S',
		segmentTime: 600,
		autoClear: false,
		noAudio: false,
		ffmpegBinary: 'ffmpeg',
	});
});

test('should forward to event handler custom recorder options', async () => {
	const onStarted = jest.fn().mockName('onStarted');

	new Recorder(URI, PATH, {
		title: 'Test Cam',
		filePattern: '%Y %B %d/%I.%M.%S%p',
		dirSizeThreshold: '500M',
		segmentTime: '1h',
		autoClear: true,
		noAudio: true,
		ffmpegBinary: '/bin/ffmpeg',
	})
		.on(RecorderEvents.STARTED, onStarted)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(onStarted).toBeCalledTimes(1);
	expect(onStarted).toBeCalledWith({
		uri: URI,
		path: PATH,
		title: 'Test Cam',
		filePattern: '%Y %B %d/%I.%M.%S%p',
		dirSizeThreshold: 524288000,
		segmentTime: 3600,
		autoClear: true,
		noAudio: true,
		ffmpegBinary: '/bin/ffmpeg',
	});
});
