
import { ChildProcessWithoutNullStreams } from 'child_process';
import pathApi from 'path';
import { mocked } from 'ts-jest/utils';
import {mockSpawnProcess} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';
import { verifyAllOptions } from '../../src/validators';

jest.mock('../../src/validators');

const URI = 'rtsp://username:password@host/path';
const PATH = pathApi.normalize('/media/Recorder');

let fakeProcess: ChildProcessWithoutNullStreams;
beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
});

test('should forward to event handler any ffmpeg progress message', async () => {
	const onProgress = jest.fn().mockName('onProgress');

	new Recorder(URI, PATH)
		.on(RecorderEvents.PROGRESS, onProgress)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Random progress message', 'utf8'));

	expect(onProgress).toBeCalledTimes(1);
	expect(onProgress).toBeCalledWith('Random progress message');
});
