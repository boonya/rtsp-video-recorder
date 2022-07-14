
import { ChildProcessWithoutNullStreams } from 'child_process';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';
import playlistName from '../../src/helpers/playlistName';

jest.mock('../../src/validators');
jest.mock('../../src/helpers/playlistName');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onProgress');
	jest.mocked(playlistName).mockReturnValue('playlist');
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
