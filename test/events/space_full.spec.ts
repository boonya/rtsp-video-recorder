import { ChildProcessWithoutNullStreams } from 'child_process';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import dirSize from '../../src/helpers/space';
import Recorder, { RecorderEvents, RecorderError } from '../../src/recorder';

jest.mock('../../src/validators');
jest.mock('../../src/helpers/space');

let fakeProcess: ChildProcessWithoutNullStreams;
let onSpaceFull: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	onSpaceFull = jest.fn().mockName('onSpaceFull');
});

test('should not evaluate space if "threshold" is undefined', async () => {
	jest.mocked(dirSize).mockReturnValue(Infinity);

	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(dirSize).toBeCalledTimes(0);
	expect(onSpaceFull).toBeCalledTimes(0);
});

test('should evaluate space but not rise an event if "used" is less than the "threshold"', async () => {
	jest.mocked(dirSize).mockReturnValue(300);
	const onStopped = jest.fn().mockName('onStopped');

	new Recorder(URI, DESTINATION, { dirSizeThreshold: 500 })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.on(RecorderEvents.STOPPED, onStopped)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	// dirSize called twice - 1st on start 2nd on opening segment for writing
	expect(dirSize).toBeCalledTimes(2);
	expect(onSpaceFull).toBeCalledTimes(0);
	expect(onStopped).toBeCalledTimes(0);
});

test('should evaluate space on start and rise an event if "used" is close to the "threshold"', async () => {
	jest.mocked(dirSize).mockReturnValue(496);
	const onStopped = jest.fn().mockName('onStopped');

	new Recorder(URI, DESTINATION, { dirSizeThreshold: 500 })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.on(RecorderEvents.STOPPED, onStopped)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	expect(dirSize).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledWith({
		threshold: 500,
		used: 496,
	});
	expect(onStopped).toBeCalledTimes(1);
	expect(onStopped).toBeCalledWith(0, 'space_full');
});

test('should evaluate space on start and rise an event if "used" is bigger than the "threshold"', async () => {
	jest.mocked(dirSize).mockReturnValue(600);
	const onStopped = jest.fn().mockName('onStopped');

	new Recorder(URI, DESTINATION, { dirSizeThreshold: 500 })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.on(RecorderEvents.STOPPED, onStopped)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	expect(dirSize).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledWith({
		threshold: 500,
		used: 600,
	});
	expect(onStopped).toBeCalledTimes(1);
	expect(onStopped).toBeCalledWith(0, 'space_full');
});

test('should evaluate space twice and rise an event if "used" became bigger than the "threshold" at progress', async () => {
	jest.mocked(dirSize).mockReturnValueOnce(200);
	const onStop = jest.fn().mockName('onStop');

	new Recorder(URI, DESTINATION, { dirSizeThreshold: 500 })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.on(RecorderEvents.STOP, onStop)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	jest.mocked(dirSize).mockReturnValueOnce(600);

	fakeProcess.stderr.emit('data', Buffer.from('Opening \'segment.mp4\' for writing', 'utf8'));

	expect(dirSize).toBeCalledTimes(2);
	expect(onSpaceFull).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledWith({
		threshold: 500,
		used: 600,
	});
	expect(onStop).toBeCalledTimes(1);
	expect(onStop).toBeCalledWith('space_full');
});

test('should return RecorderError - space evaluation failed', async () => {
	jest.mocked(dirSize).mockImplementation(() => {
		throw new Error('space evaluation failed');
	});
	const onError = jest.fn().mockName('onError');

	new Recorder(URI, DESTINATION, { dirSizeThreshold: 500 })
		.on(RecorderEvents.SPACE_FULL, onSpaceFull)
		.on(RecorderEvents.ERROR, onError)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	expect(dirSize).toBeCalledTimes(1);
	expect(onSpaceFull).toBeCalledTimes(0);
	expect(onError).toBeCalledTimes(1);
	expect(onError).toBeCalledWith(new RecorderError('space evaluation failed'));
});
