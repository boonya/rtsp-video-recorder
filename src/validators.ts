import { Options, SegmentTimeOption, DirSizeThresholdOption } from './types';
import directoryExists from './helpers/directoryExists';
import pathApi from 'path';
import transformDirSizeThreshold from './helpers/sizeThreshold';
import transformSegmentTime from './helpers/segmentTime';

function getErrorMessage(err: unknown) {
	return err instanceof Error
		&& err.message
		|| 'Something went wrong';
}

/**
 * @return false or string
 */
export function verifyPath(value: string): false|string {
	try {
		const path = pathApi.resolve(value);
		if (!directoryExists(path)) {
			return `${path} is not a directory`;
		}
	} catch (err) {
		return getErrorMessage(err);
	}
	return false;
}

/**
 * @return false or string
 */
export function verifySegmentTime(value: SegmentTimeOption): false|string {
	if (typeof value === 'number') {
		const error = verifySegmentTimeMinimum(value);
		if (error) {
			return error;
		}
	}

	if (typeof value === 'string') {
		try {
			const seconds = transformSegmentTime(value);
			const error = verifySegmentTimeMinimum(seconds);
			if (error) {
				return error;
			}
		} catch (err) {
			return getErrorMessage(err);
		}
	}

	return false;
}

/**
 * @return false or string
 */
export function verifyDirSizeThreshold(value: DirSizeThresholdOption): false|string {
	if (typeof value === 'number') {
		const error = verifyDirSizeThresholdMinimum(value);
		if (error) {
			return error;
		}
	}

	if (typeof value === 'string') {
		try {
			const bytes = transformDirSizeThreshold(value);
			const error = verifyDirSizeThresholdMinimum(bytes);
			if (error) {
				return error;
			}
		} catch (err) {
			return getErrorMessage(err);
		}
	}

	return false;
}

/**
 * @return false or string
 */
export function verifyDirSizeThresholdMinimum(value: number): false|string {
	return value < 200 * Math.pow(1024, 2)
		&& 'There is no sense to set dirSizeThreshold value to less that 200 MB.';
}

/**
 * @returns false or string
 */
export function verifySegmentTimeMinimum(value: number): false|string {
	return value < 15
		&& 'There is no sense to set duration value to less than 15 seconds.';
}

export function verifyAllOptions(path: string, { segmentTime, dirSizeThreshold }: Options): string[] {
	const errors: string[] = [];

	const pathError = verifyPath(path);
	if (pathError) errors.push(pathError);

	if (segmentTime) {
		const error = verifySegmentTime(segmentTime);
		if (error) errors.push(error);
	}

	if (dirSizeThreshold) {
		const error = verifyDirSizeThreshold(dirSizeThreshold);
		if (error) errors.push(error);
	}

	return errors;
}
