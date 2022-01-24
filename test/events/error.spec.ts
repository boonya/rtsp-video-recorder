import { ChildProcessWithoutNullStreams } from 'child_process';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents, RecorderError } from '../../src/recorder';

jest.mock('../../src/validators');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onError');
});

test('should return RecorderError with message given by ffmpeg', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.ERROR, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.emit('error', 'FFMPEG process failed');

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith(new RecorderError('FFMPEG process failed'));
});

test('should return RecorderError - process already spawned', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.ERROR, eventHandler)
		.start()
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith(new RecorderError('Process already spawned.'));
});

test('should return RecorderError - no processes spawned', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.ERROR, eventHandler)
		.stop();

	// We have to wait next tick
	await Promise.resolve(true);

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith(new RecorderError('No process spawned.'));
});
