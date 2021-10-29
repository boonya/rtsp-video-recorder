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

test('If no space left an event should be emitted and payload raised.', async () => {
	const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
	mocked(du).mockImplementation(() => 496);
	mocked(fs).readdirSync.mockImplementation(() => []);

	const onSpaceFull = jest.fn().mockName('onSpaceFull');

	new Recorder(URI, PATH, { dirSizeThreshold: 500 })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

	// https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
	await Promise.resolve();

	expect(onSpaceFull).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledWith({
		path: PATH,
		threshold: 500,
		used: 496,
	});
});

test('If space not enough an event won\'t be emitted.', async () => {
	const FIRST_SEGMENT = `${PATH}/2020.06.25.10.18.04.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`;
	mocked(du).mockImplementation(() => 400);
	mocked(fs).readdirSync.mockImplementation(() => []);

	const onSpaceFull = jest.fn().mockName('onSpaceFull');

	new Recorder(URI, PATH, { dirSizeThreshold: 500 })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from(`Opening '${FIRST_SEGMENT}' for writing`, 'utf8'));

	// https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
	await Promise.resolve();

	expect(onSpaceFull).toBeCalledTimes(0);
});
