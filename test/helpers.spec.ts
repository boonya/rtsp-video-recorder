import { BytesFactor, DurationFactor } from '../src/types';
import {
	directoryExists,
	transformDirSizeThreshold,
	transformSegmentTime,
	getBytesSize,
	getDuration,
	matchDirSizeThreshold,
	matchSegmentTime,
} from '../src/helpers';

describe('Helpers', () => {
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

	test('getBytesSize', () => {
		expect(getBytesSize(0, BytesFactor.Megabytes)).toEqual(0);
		expect(getBytesSize(1, BytesFactor.Megabytes)).toEqual(Math.pow(1024, 2));
		expect(getBytesSize(1, BytesFactor.Gigabytes)).toEqual(Math.pow(1024, 3));
		expect(getBytesSize(1, BytesFactor.Terrabytes)).toEqual(Math.pow(1024, 4));
	});

	test('getDuration', () => {
		expect(getDuration(0, DurationFactor.Seconds)).toEqual(0);
		expect(getDuration(1, DurationFactor.Seconds)).toEqual(1);
		expect(getDuration(1, DurationFactor.Minutes)).toEqual(60);
		expect(getDuration(1, DurationFactor.Hours)).toEqual(3600);
	});

	describe('matchDirSizeThreshold', () => {
		test('Valid values', () => {
			expect(matchDirSizeThreshold('20M')).toEqual([20, BytesFactor.Megabytes]);
			expect(matchDirSizeThreshold('20G')).toEqual([20, BytesFactor.Gigabytes]);
			expect(matchDirSizeThreshold('20T')).toEqual([20, BytesFactor.Terrabytes]);
		});

		test('Invalid values', () => {
			expect(() => matchDirSizeThreshold('0M'))
				.toThrowError('dirSizeThreshold value has to be more than zero.');

			expect(() => matchDirSizeThreshold('0G'))
				.toThrowError('dirSizeThreshold value has to be more than zero.');

			expect(() => matchDirSizeThreshold('0T'))
				.toThrowError('dirSizeThreshold value has to be more than zero.');

			expect(() => matchDirSizeThreshold('invalid value'))
				.toThrowError('dirSizeThreshold value has to match to pattern /^(\\d+)(M|G|T)?$/.');
		});
	});

	describe('matchSegmentTime', () => {
		test('Valid values', () => {
			expect(matchSegmentTime('20s')).toEqual([20, DurationFactor.Seconds]);
			expect(matchSegmentTime('20m')).toEqual([20, DurationFactor.Minutes]);
			expect(matchSegmentTime('20h')).toEqual([20, DurationFactor.Hours]);
		});

		test('Invalid values', () => {
			expect(() => matchSegmentTime('0s'))
				.toThrowError('segmentTime value has to be more than zero.');
			expect(() => matchSegmentTime('0m'))
				.toThrowError('segmentTime value has to be more than zero.');

			expect(() => matchSegmentTime('0h'))
				.toThrowError('segmentTime value has to be more than zero.');

			expect(() => matchSegmentTime('invalid value'))
				.toThrowError('segmentTime value has to match to pattern /^(\\d+)(s|m|h)?$/.');
		});
	});
});
