
import { ChildProcessWithoutNullStreams } from 'child_process';
import { mocked } from 'ts-jest/utils';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';

jest.mock('../../src/validators');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onProgress');
});

test('should return any ffmpeg progress message', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.PROGRESS, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from('Random progress message', 'utf8'));

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith('Random progress message');
});
