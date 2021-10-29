import { ChildProcessWithoutNullStreams } from 'child_process';
import pathApi from 'path';
import fs, { Stats } from 'fs';
import fse from 'fs-extra';
import du from 'du';
import { mocked } from 'ts-jest/utils';
import {mockSpawnProcess} from '../test.helpers';
import Recorder, { RecorderError, RecorderEvents } from '../../src/recorder';
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
});

test('should forward to event handler RecorderError with message given by ffmpeg', async () => {
	const onError = jest.fn().mockName('onError');

	new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Failed to open segment \'.~segment.mp4\'', 'utf8'));

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('Failed to open file \'.~segment.mp4\'.'));
});

test('should forward to event handler RecorderError - FFMPEG process failed', async () => {
	const onError = jest.fn().mockName('onError');

	new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.start();

	fakeProcess.emit('error', 'FFMPEG has failed.');

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('FFMPEG has failed.'));
});

test('should forward to event handler RecorderError - process already spawned', async () => {
	const onError = jest.fn().mockName('onError');

	const recorder = new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.start();

	await Promise.resolve();
	recorder.start();

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('Process already spawned.'));
});

test('should forward to event handler RecorderError - no processes spawned', async () => {
	const onError = jest.fn().mockName('onError');

	new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.stop();

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('No process spawned.'));
});

test('should forward to event handler RecorderError - moving failed', async () => {
	const onError = jest.fn().mockName('onError');
	mocked(fse).move.mockImplementation(() => {
		throw new Error('Moving failed.');
	});

	new Recorder(URI, PATH)
		.on(RecorderEvents.ERROR, onError)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'.~segment1.mp4\' for writing', 'utf8'));
	fakeProcess.stderr.emit('data', Buffer.from('Opening \'.~segment2.mp4\' for writing', 'utf8'));
	// https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
	await Promise.resolve();
	await Promise.resolve();

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('Moving failed.'));
});

test('should forward to event handler RecorderError that du has failed', async () => {
	const onError = jest.fn().mockName('onError');
	mocked(du).mockImplementation(() => {
		throw new Error('DU has failed for some reason.');
	});

	new Recorder(URI, PATH, { dirSizeThreshold: 500 })
		.on(RecorderEvents.ERROR, onError)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from(`Opening \'/full-path/.~segment.mp4\' for writing`, 'utf8'));
	// https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
	await Promise.resolve();

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('DU has failed for some reason.'));
});

test('should forward to event handler RecorderError - can not remove current directory', async () => {
	mocked(du).mockImplementation(() => 500);
	mocked(fs).readdirSync.mockImplementation(() => []);
	const onError = jest.fn().mockName('onError');

	new Recorder(URI, PATH, { dirSizeThreshold: 500, autoClear: true })
		.on(RecorderEvents.ERROR, onError)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'/full-path/.~segment.mp4\' for writing', 'utf8'));
	// https://stackoverflow.com/questions/54890916/jest-fn-claims-not-to-have-been-called-but-has?answertab=active#tab-top
	await Promise.resolve();
	await Promise.resolve();

	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new Error('Can\'t remove current directory.'));
});
