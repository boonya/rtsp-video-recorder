import { ChildProcessWithoutNullStreams } from 'child_process';
import pathApi from 'path';
import { mocked } from 'ts-jest/utils';
import Recorder, { RecorderEvents } from '../../src/recorder';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, PATH} from '../test.helpers';

jest.mock('../../src/validators');

let fakeProcess: ChildProcessWithoutNullStreams;
let onFileCreated: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	onFileCreated = jest.fn().mockName('onFileCreated');
});

test(`should forward filename to "${RecorderEvents.FILE_CREATED}" event handler if ffmpeg says: "Opening 'filename' for writing"`, () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.FILE_CREATED, onFileCreated)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'/full-path/segment.mp4\' for writing', 'utf8'));

	expect(onFileCreated).toBeCalledTimes(1);
	expect(onFileCreated).toBeCalledWith(pathApi.normalize('/full-path/segment.mp4'));
});

test(`should not handle "${RecorderEvents.FILE_CREATED}" event if ffmpeg says: "Opening 'playlist.m3u8.tmp' for writing"`, () => {
	new Recorder(URI, PATH)
		.on(RecorderEvents.FILE_CREATED, onFileCreated)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'/full-path/playlist.m3u8.tmp\' for writing', 'utf8'));

	expect(onFileCreated).toBeCalledTimes(0);
});
