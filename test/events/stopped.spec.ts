import { ChildProcessWithoutNullStreams } from 'child_process';
import { mocked } from 'ts-jest/utils';
import {mockSpawnProcess, URI, PATH} from '../test.helpers';

import Recorder, { RecorderEvents } from '../../src/recorder';
import { verifyAllOptions } from '../../src/validators';

jest.mock('../../src/validators');

let fakeProcess: ChildProcessWithoutNullStreams;
let onStopped: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	onStopped = jest.fn().mockName('onStopped');
});

test(`should forward FFMPEG exit code to ${RecorderEvents.STOPPED} event handler`, async () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.STOPPED, onStopped)
		.start();

	fakeProcess.emit('close', 255);

	expect(onStopped).toBeCalledTimes(1);
	expect(onStopped).toBeCalledWith(255, 'FFMPEG exited. Code 255.');
});
