import directoryExists from '../src/helpers/directoryExists';
import dirSize from '../src/helpers/space';
import fs from 'fs';
import transformDirSizeThreshold from '../src/helpers/sizeThreshold';
import transformSegmentTime from '../src/helpers/segmentTime';
import playlistName from '../src/helpers/playlistName';

jest.mock('fs');
jest.mock('path');

describe('directoryExists', () => {
	test('exists', () => {
		jest.mocked(fs).lstatSync.mockReturnValue({ isDirectory: () => true });

		expect(directoryExists('path')).toBeTruthy();
	});

	test('does not exist', () => {
		jest.mocked(fs).lstatSync.mockImplementation(() => {
			throw new Error('no such file or directory');
		});

		expect(directoryExists('path')).toBeFalsy();
	});

	test('not a directory', () => {
		jest.mocked(fs).lstatSync.mockReturnValue({ isDirectory: () => false });

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
	jest.mocked(fs).statSync.mockReturnValue({ isDirectory: () => false, size: 3 });

	const size = dirSize('');

	expect(size).toEqual(9);
});

describe('playlistName', () => {
	test('should return current date based name.', () => {
		jest.useFakeTimers().setSystemTime(new Date('Feb 24 2022 04:45:00').getTime());

		const result = playlistName();

		expect(result).toBe('2022.02.24-04.45.00');
	});

	test('should return custom name.', () => {
		const result = playlistName('custom - name%:_"spec@%+!/]_[\\\'"chars');

		expect(result).toBe('custom_-_name_spec_chars');
	});
});
