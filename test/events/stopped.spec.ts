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
	eventHandler = jest.fn().mockName('onStopped');
});

test('should return FFMPEG exit code', () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.STOPPED, eventHandler)
		.start();

	fakeProcess.emit('close', 255);

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith(255, 'FFMPEG exited. Code 255.');
});
