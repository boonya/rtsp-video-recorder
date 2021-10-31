import {
	directoryExists,
	transformDirSizeThreshold,
	transformSegmentTime,
} from '../src/helpers';

describe('directoryExists', () => {
	test('Valid value', () => {
		expect(directoryExists(__dirname)).toBeTruthy();
		expect(directoryExists('./invalid-directory')).toBeFalsy();
	});

	test('Invalid values', () => {
		expect(() => directoryExists(__filename))
			.toThrowError(`${__filename} exists but it is not a directory.`);
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
