import { ChildProcessWithoutNullStreams } from 'child_process';
import { verifyAllOptions } from '../../src/validators';
import { mockSpawnProcess, URI, DESTINATION } from '../helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';
import playlistName from '../../src/helpers/playlistName';

jest.mock('../../src/validators');
jest.mock('../../src/helpers/playlistName');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onFileCreated');
	jest.mocked(playlistName).mockReturnValue('playlist');
});

test('should return filename if ffmpeg says: "Opening \'*.mp4\' for writing"', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.FILE_CREATED, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith('segment.mp4');
});

test('should not handle event if ffmpeg says: "Opening \'*.m3u8.tmp\' for writing"', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.FILE_CREATED, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'playlist.m3u8.tmp\' for writing', 'utf8'));

	expect(eventHandler).toBeCalledTimes(0);
});
