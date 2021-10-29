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

test('should rename previous segment from ".~name" to just "name" if new segment started', async () => {
	const onFileCreated = jest.fn().mockName('onFileCreated');

	new Recorder(URI, PATH)
		.on(RecorderEvents.FILE_CREATED, onFileCreated)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from(`Opening '/full-path/.~segment1.mp4' for writing`, 'utf8'));
	fakeProcess.stderr.emit('data', Buffer.from(`Opening '/full-path/.~segment2.mp4' for writing`, 'utf8'));
	// https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
	await Promise.resolve();
	await Promise.resolve();

	expect(onFileCreated).toBeCalledTimes(1);
	expect(onFileCreated).toBeCalledWith(pathApi.normalize('/full-path/segment1.mp4'));
});

test('should rename current segment from ".~name" to just "name" if stopped', async () => {
	const onFileCreated = jest.fn().mockName('onFileCreated');

	const recorder = new Recorder(URI, PATH)
		.on(RecorderEvents.FILE_CREATED, onFileCreated)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from(`Opening '/full-path/.~segment.mp4' for writing`, 'utf8'));

	recorder.stop();

	// https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
	await Promise.resolve();
	await Promise.resolve();

	expect(onFileCreated).toBeCalledTimes(1);
	expect(onFileCreated).toBeCalledWith(pathApi.normalize('/full-path/segment.mp4'));
});
