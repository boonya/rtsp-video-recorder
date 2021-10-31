
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
	eventHandler = jest.fn().mockName('onProgress');
});

test('should return any ffmpeg progress message', () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.PROGRESS, eventHandler)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Random progress message', 'utf8'));

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith('Random progress message');
});
