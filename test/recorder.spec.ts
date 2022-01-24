import { verifyAllOptions } from '../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from './test.helpers';
import Recorder, { RecorderValidationError } from '../src/recorder';

jest.mock('../src/validators');

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	mockSpawnProcess();
});

test('should throw RecorderValidationError if validation failed', () => {
	jest.mocked(verifyAllOptions).mockReturnValue([
		'Any validation error message',
		'One more validation error message',
	]);

	expect(() => new Recorder(URI, DESTINATION)).toThrowError(new RecorderValidationError('Options invalid', [
		'Any validation error message',
		'One more validation error message',
	]));
});

describe('isRecording', () => {
	test('should return true if process started', async () => {
		const recorder = new Recorder(URI, DESTINATION)
			.start();

		// We have to wait next tick
		await Promise.resolve(true);

		const isRecording = recorder.isRecording();

		expect(isRecording).toBe(true);
	});

	test('should return false if process not started', async () => {
		const recorder = new Recorder(URI, DESTINATION);

		// We have to wait next tick
		await Promise.resolve(true);

		const isRecording = recorder.isRecording();

		expect(isRecording).toBe(false);
	});

	test('should return false if process started & then stopped', () => {
		const isRecording = new Recorder(URI, DESTINATION)
			.start()
			.stop()
			.isRecording();

		expect(isRecording).toBe(false);
	});
});
