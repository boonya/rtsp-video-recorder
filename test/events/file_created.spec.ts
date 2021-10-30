import { ChildProcessWithoutNullStreams } from 'child_process';
import { mocked } from 'ts-jest/utils';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, PATH} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';

jest.mock('../../src/validators');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onFileCreated');
});

test('should return filename if ffmpeg says: "Opening \'*.mp4\' for writing"', () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.FILE_CREATED, eventHandler)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith('segment.mp4');
});

test('should not handle event if ffmpeg says: "Opening \'*.m3u8.tmp\' for writing"', () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.FILE_CREATED, eventHandler)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'playlist.m3u8.tmp\' for writing', 'utf8'));

	expect(eventHandler).toBeCalledTimes(0);
});
