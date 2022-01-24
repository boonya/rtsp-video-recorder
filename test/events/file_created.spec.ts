import { ChildProcessWithoutNullStreams } from 'child_process';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';

jest.mock('../../src/validators');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onFileCreated');
});

test('should return filename if ffmpeg says: "Opening \'*.mp4\' for writing"', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.FILE_CREATED, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith('segment.mp4');
});

test('should not handle event if ffmpeg says: "Opening \'*.m3u8.tmp\' for writing"', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.FILE_CREATED, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'playlist.m3u8.tmp\' for writing', 'utf8'));

	expect(eventHandler).toBeCalledTimes(0);
});
