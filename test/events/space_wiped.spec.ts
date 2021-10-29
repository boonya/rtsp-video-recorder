import { ChildProcessWithoutNullStreams } from 'child_process';
import pathApi from 'path';
import fs, { Stats } from 'fs';
import fse from 'fs-extra';
import du from 'du';
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

test('If no space left recorder directory should be wiped. The oldest directory should be removed only.', async () => {
	const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
	mocked(du)
		.mockImplementationOnce(() => 500)
		.mockImplementationOnce(() => 200);
	mocked(fs).readdirSync.mockImplementation(() => ['oldest-dir', 'newest-dir']);
	mocked(fs).lstatSync.mockImplementation((arg) => ({
		...new Stats(),
		birthtimeMs: arg === `${PATH}/oldest-dir` ? Date.now() - 1000 : Date.now(),
	}));
	mocked(fse).remove.mockResolvedValue();

	const onSpaceWiped = jest.fn().mockName('onSpaceWiped');

	new Recorder(URI, PATH, { dirSizeThreshold: 500, autoClear: true })
		.on(RecorderEvents.SPACE_WIPED, onSpaceWiped)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

	// https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();

	expect(onSpaceWiped).toBeCalledTimes(1);
	expect(onSpaceWiped).toBeCalledWith({
		path: PATH,
		threshold: 500,
		used: 200,
	});
});
