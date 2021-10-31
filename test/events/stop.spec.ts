import { mocked } from 'ts-jest/utils';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';

jest.mock('../../src/validators');

let onStop: () => void;
let onStopped: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	mockSpawnProcess();
	onStop = jest.fn().mockName('onStop');
	onStopped = jest.fn().mockName('onStopped');
});

test('should return "programmatically" if .stop() executed', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.STOP, onStop)
		.on(RecorderEvents.STOPPED, onStopped)
		.start()
		.stop();

	// We have to wait next tick
	await Promise.resolve(true);

	expect(onStop).toBeCalledTimes(1);
	expect(onStop).toBeCalledWith('programmatically');

	expect(onStopped).toBeCalledTimes(1);
	expect(onStopped).toBeCalledWith(expect.any(Number), 'ffmpeg_exited');
});
