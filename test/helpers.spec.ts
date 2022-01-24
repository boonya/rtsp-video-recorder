import directoryExists from '../src/helpers/directoryExists';
import dirSize from '../src/helpers/space';
import fs from 'fs';
import transformDirSizeThreshold from '../src/helpers/sizeThreshold';
import transformSegmentTime from '../src/helpers/segmentTime';

jest.mock('fs');
jest.mock('path');

describe('directoryExists', () => {
	test('exists', () => {
		jest.mocked(fs).lstatSync.mockReturnValue({isDirectory: () => true});

		expect(directoryExists('path')).toBeTruthy();
	});

	test('does not exist', () => {
		jest.mocked(fs).lstatSync.mockImplementation(() => {
			throw new Error('no such file or directory');
		});

		expect(directoryExists('path')).toBeFalsy();
	});

	test('not a directory', () => {
		jest.mocked(fs).lstatSync.mockReturnValue({isDirectory: () => false});

		expect(() => directoryExists('path')).toThrowError('path exists but it is not a directory.');
	});
});

test('transformDirSizeThreshold', () => {
	expect(transformDirSizeThreshold(1)).toEqual(1);
	expect(transformDirSizeThreshold('1G')).toEqual(Math.pow(1024, 3));
});

test('transformSegmentTime', () => {
	expect(transformSegmentTime(1)).toEqual(1);
	expect(transformSegmentTime('1m')).toEqual(60);
});

test('should return directory size in bytes', () => {
	jest.mocked(fs).readdirSync.mockReturnValue(new Array(3).fill(0));
	jest.mocked(fs).statSync.mockReturnValue({isDirectory: () => false, size: 3});

	const size = dirSize('');

	expect(size).toEqual(9);
});
