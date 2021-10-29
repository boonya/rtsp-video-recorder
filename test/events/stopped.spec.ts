import { ChildProcessWithoutNullStreams } from 'child_process';
import pathApi from 'path';
import fs, { Stats } from 'fs';
import fse from 'fs-extra';
import { mocked } from 'ts-jest/utils';
import {mockSpawnProcess} from '../test.helpers';

import Recorder, { RecorderEvents } from '../../src/recorder';
import { verifyAllOptions } from '../../src/validators';

jest.mock('fs');
jest.mock('fs-extra');
jest.mock('du');
jest.mock('../../src/validators');

const URI = 'rtsp://username:password@host/path';
const PATH = pathApi.normalize('/media/Recorder');

let fakeProcess: ChildProcessWithoutNullStreams;
beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	mocked(fs).lstatSync.mockImplementation(() => ({ ...new Stats(), isDirectory: () => true }));
	mocked(fse).move.mockImplementation(() => Promise.resolve(true));
	mocked(fse).remove.mockImplementation(() => Promise.resolve());
	mocked(fse).ensureDir.mockImplementation(() => Promise.resolve(true));
});

test(`If stop reason is FFMPEG process exited handler receives exit code of ffmpeg process
		and a message that FFMPEG exited.`, async () => {
	const onStopped = jest.fn().mockName('onStopped');

	new Recorder(URI, PATH)
		.on(RecorderEvents.STOPPED, onStopped)
		.start();

	fakeProcess.emit('close', 255);

	expect(onStopped).toBeCalledTimes(1);
	expect(onStopped).toBeCalledWith(255, 'FFMPEG exited. Code 255.');
});
