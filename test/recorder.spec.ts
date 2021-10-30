import { mocked } from 'ts-jest/utils';
import { verifyAllOptions } from '../src/validators';
import {URI, PATH} from './test.helpers';
import Recorder, { RecorderValidationError } from '../src/recorder';

jest.mock('../src/validators');

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
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
