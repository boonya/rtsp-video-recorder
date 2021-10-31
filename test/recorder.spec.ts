import { mocked } from 'ts-jest/utils';
import { verifyAllOptions } from '../src/validators';
import {mockSpawnProcess, URI, PATH} from './test.helpers';
import Recorder, { RecorderValidationError } from '../src/recorder';

jest.mock('../src/validators');

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
	mockSpawnProcess();
});

test('should throw RecorderValidationError if validation failed', () => {
	mocked(verifyAllOptions).mockReturnValue([
		'Any validation error message',
		'One more validation error message',
	]);

	expect(() => new Recorder(URI, PATH)).toThrowError(new RecorderValidationError('Options invalid', [
		'Any validation error message',
		'One more validation error message',
	]));
});

describe('isRecording', () => {
	test('should return true if process started', () => {
		const isRecording = new Recorder(URI, PATH)
			.start()
			.isRecording();

		expect(isRecording).toBe(true);
	});

	test('should return false if process not started', () => {
		const isRecording = new Recorder(URI, PATH)
			.isRecording();

		expect(isRecording).toBe(false);
	});

	test('should return false if process started & then stopped', () => {
		const isRecording = new Recorder(URI, PATH)
			.start()
			.stop()
			.isRecording();

		expect(isRecording).toBe(false);
	});
});
