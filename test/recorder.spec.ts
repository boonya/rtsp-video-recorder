import pathApi from 'path';
import { mocked } from 'ts-jest/utils';

import Recorder, { RecorderValidationError } from '../src/recorder';
import { verifyAllOptions } from '../src/validators';

jest.mock('../src/validators');

const URI = 'rtsp://username:password@host/path';
const PATH = pathApi.normalize('/media/Recorder');

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
