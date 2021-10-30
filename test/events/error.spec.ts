import { ChildProcessWithoutNullStreams } from 'child_process';
import { mocked } from 'ts-jest/utils';
import Recorder, { RecorderError, RecorderEvents } from '../../src/recorder';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, PATH} from '../test.helpers';

jest.mock('../../src/validators');

let fakeProcess: ChildProcessWithoutNullStreams;
let onError: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	onError = jest.fn().mockName('onError');
});

test('should forward to event handler RecorderError with message given by ffmpeg', async () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.start();

	fakeProcess.emit('error', 'Connection to tcp://localhost:554?timeout=0 failed: Operation timed out');

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('Connection to tcp://localhost:554?timeout=0 failed: Operation timed out'));
});

test('should forward to event handler RecorderError - FFMPEG process failed', async () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.start();

	fakeProcess.emit('error', 'FFMPEG has failed.');

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('FFMPEG has failed.'));
});

test('should forward to event handler RecorderError - process already spawned', async () => {
	const recorder = new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.start();

	recorder.start();

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('Process already spawned.'));
});

test('should forward to event handler RecorderError - no processes spawned', async () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.stop();

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('No process spawned.'));
});
