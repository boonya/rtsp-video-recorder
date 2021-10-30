import { mocked } from 'ts-jest/utils';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, PATH} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';

jest.mock('../../src/validators');

let onStart: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	mockSpawnProcess();
	onStart = jest.fn().mockName('onStart');
});

test('should return "programmatically" if .stop() executed', () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.START, onStart)
		.start();

	expect(onStart).toBeCalledTimes(1);
	expect(onStart).toBeCalledWith('programmatically');
});
