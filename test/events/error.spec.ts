import { ChildProcessWithoutNullStreams } from 'child_process';
import { mocked } from 'ts-jest/utils';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents, RecorderError } from '../../src/recorder';

jest.mock('../../src/validators');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onError');
});

test('should return RecorderError with message given by ffmpeg', () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.ERROR, eventHandler)
		.start();

	fakeProcess.emit('error', 'FFMPEG process failed');

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith(new RecorderError('FFMPEG process failed'));
});

test('should return RecorderError - process already spawned', () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.ERROR, eventHandler)
		.start()
		.start();

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith(new RecorderError('Process already spawned.'));
});

test('should return RecorderError - no processes spawned', () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.ERROR, eventHandler)
		.stop();

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith(new RecorderError('No process spawned.'));
});
