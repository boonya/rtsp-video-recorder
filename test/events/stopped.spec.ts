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
	eventHandler = jest.fn().mockName('onStopped');
});

test('should return FFMPEG exit code', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.STOPPED, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.emit('close', 255);

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith(255, 'ffmpeg_exited');
});
