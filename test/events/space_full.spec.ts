import { ChildProcessWithoutNullStreams } from 'child_process';
import { transformDirSizeThreshold, dirSize } from '../../src/helpers';
import { mocked } from 'ts-jest/utils';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents, RecorderError } from '../../src/recorder';

jest.mock('../../src/validators');
jest.mock('../../src/helpers');

let fakeProcess: ChildProcessWithoutNullStreams;
let onSpaceFull: () => void;

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	onSpaceFull = jest.fn().mockName('onSpaceFull');
});

test('should not evaluate space if "threshold" is undefined', () => {
	mocked(dirSize).mockReturnValue(Infinity);

	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(dirSize).toBeCalledTimes(0);
	expect(onSpaceFull).toBeCalledTimes(0);
});

test('should evaluate space and rise an event if "used" is close to the "threshold"', () => {
	const dirSizeThreshold = 500;
	mocked(transformDirSizeThreshold).mockReturnValue(dirSizeThreshold);
	mocked(dirSize).mockReturnValue(496);
	const onStop = jest.fn().mockName('onStop');

	new Recorder(URI, DESTINATION, { dirSizeThreshold })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.on(RecorderEvents.STOP, onStop)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(dirSize).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledWith({
		threshold: 500,
		used: 496,
	});
	expect(onStop).toBeCalledTimes(1);
	expect(onStop).toBeCalledWith('space_full');
});

test('should evaluate space but do not rise an event if "used" is far from the "threshold"', () => {
	const dirSizeThreshold = 500;
	mocked(transformDirSizeThreshold).mockReturnValue(dirSizeThreshold);
	mocked(dirSize).mockReturnValue(400);

	new Recorder(URI, DESTINATION, { dirSizeThreshold })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(dirSize).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledTimes(0);
});

test('should return RecorderError - space evaluation failed', () => {
	const dirSizeThreshold = 500;
	mocked(transformDirSizeThreshold).mockReturnValue(dirSizeThreshold);
	mocked(dirSize).mockImplementation(() => {
		throw new Error('space evaluation failed');
	});
	const onError = jest.fn().mockName('onError');

	new Recorder(URI, DESTINATION, { dirSizeThreshold })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.on(RecorderEvents.ERROR, onError)
		.start();

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(dirSize).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledTimes(0);
	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('space evaluation failed'));
});
