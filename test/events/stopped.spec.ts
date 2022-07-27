import { ChildProcessWithoutNullStreams } from 'child_process';
import { verifyAllOptions } from '../../src/validators';
import playlistName from '../../src/helpers/playlistName';
import { mockSpawnProcess, URI, DESTINATION } from '../helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';

jest.mock('../../src/validators');
jest.mock('../../src/helpers/playlistName');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onStopped');
	jest.mocked(playlistName).mockReturnValue('playlist');
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
