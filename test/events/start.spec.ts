import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';

jest.mock('../../src/validators');

let onStart: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	mockSpawnProcess();
	onStart = jest.fn().mockName('onStart');
});

test('should return "programmatically" if .stop() executed', () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.START, onStart)
		.start();

	expect(onStart).toBeCalledTimes(1);
	expect(onStart).toBeCalledWith('programmatically');
});
