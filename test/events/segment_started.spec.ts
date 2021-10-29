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

test('should forward to event handler full path current and previous segments', async () => {
	const onSegmentStarted = jest.fn().mockName('onSegmentStarted');

	new Recorder(URI, PATH)
		.on(RecorderEvents.SEGMENT_STARTED, onSegmentStarted)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from(`Opening '/full-path/segment1.mp4' for writing`, 'utf8'));
	fakeProcess.stderr.emit('data', Buffer.from(`Opening '/full-path/segment2.mp4' for writing`, 'utf8'));
	fakeProcess.stderr.emit('data', Buffer.from(`Opening '/full-path/segment3.mp4' for writing`, 'utf8'));

	expect(onSegmentStarted).toBeCalledTimes(3);
	expect(onSegmentStarted).toHaveBeenNthCalledWith(1, {
		current: '/full-path/segment1.mp4',
	});
	expect(onSegmentStarted).toHaveBeenNthCalledWith(2, {
		previous: '/full-path/segment1.mp4',
		current: '/full-path/segment2.mp4',
	});
	expect(onSegmentStarted).toHaveBeenNthCalledWith(3, {
		previous: '/full-path/segment2.mp4',
		current: '/full-path/segment3.mp4',
	});
});
