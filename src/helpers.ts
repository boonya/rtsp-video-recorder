import pathApi from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { createHash } from 'crypto';

import { BytesFactor, DurationFactor, DirSizeThresholdOption, SegmentTimeOption } from './types';

const SEGMENT_TIME_PATTERN = /^(\d+)(s|m|h)?$/;

const DIR_SIZE_THRESHOLD_PATTERN = /^(\d+)(M|G|T)?$/;

export const transformDirSizeThreshold = (value: DirSizeThresholdOption): number => {
	if (typeof value === 'number') return value;
	const [operand, factor] = matchDirSizeThreshold(value);
	return getBytesSize(operand, factor);
};

export const transformSegmentTime = (value: SegmentTimeOption): number => {
	if (typeof value === 'number') return value;
	const [operand, factor] = matchSegmentTime(value);
	return getDuration(operand, factor);
};

export const directoryExists = (path: string): boolean => {
	let stats: fs.Stats;
	try {
		stats = fs.lstatSync(path);
	} catch {
		return false;
	}
	if (!stats.isDirectory()) {
		throw new Error(`${path} exists but it is not a directory.`);
	}
	return true;
};

export const ensureDirectory = async (path: string) => {
	if (directoryExists(path)) {
		return;
	}
	return fse.ensureDir(path, 0o777);
};

export const clearSpace = async (root: string): Promise<void> => {
	const listing = fs.readdirSync(root).map((i) => pathApi.join(root, i));
	if (listing.length < 2) {
		throw new Error('Can\'t remove current directory.');
	}
	const path = getOldestObject(listing);
	await fse.remove(path);
};

export const getOldestObject = (listing: string[]): string => {
	const result = listing.map((path) => {
		try {
			return {
				path,
				created: fs.lstatSync(path).birthtimeMs,
			};
		} catch {
			return { path, created: Infinity };
		}
	})
		.filter((item) => item.created !== Infinity)
		.reduce(
			(acc, cur) => acc.created > cur.created ? cur : acc,
			{ path: '', created: Infinity },
		);
	return result.path;
};

export const matchDirSizeThreshold = (value: string): [number, BytesFactor] => {
	const match = value.match(DIR_SIZE_THRESHOLD_PATTERN);
	if (!match) {
		throw new Error(`dirSizeThreshold value has to match to pattern ${DIR_SIZE_THRESHOLD_PATTERN.toString()}.`);
	}
	const operand = Number(match[1]);
	if (!operand) {
		throw new Error('dirSizeThreshold value has to be more than zero.');
	}

	const factor = match[2] as BytesFactor;
	return [operand, factor];
};

/**
 * @returns bytes
 */
export const getBytesSize = (operand: number, factor: BytesFactor): number => {
	switch (factor) {
	case BytesFactor.Gigabytes:
		return operand * Math.pow(1024, 3);
	case BytesFactor.Terrabytes:
		return operand * Math.pow(1024, 4);
	case BytesFactor.Megabytes:
	default:
		return operand * Math.pow(1024, 2);
	}
};

export const matchSegmentTime = (value: string): [number, DurationFactor] => {
	const match = value.match(SEGMENT_TIME_PATTERN);
	if (!match) {
		throw new Error(`segmentTime value has to match to pattern ${SEGMENT_TIME_PATTERN.toString()}.`);
	}
	const operand = Number(match[1]);
	if (!operand) {
		throw new Error('segmentTime value has to be more than zero.');
	}

	const factor = match[2] as DurationFactor;
	return [operand, factor];
};

export const parseProgressBuffer = (message: string) => {
	const openingPattern = new RegExp('Opening \'(.+)\' for writing');
	const openingMatch = message.match(openingPattern);

	const failedPattern = new RegExp('Failed to open segment \'(.+)\'');
	const failedMatch = message.match(failedPattern);

	if (failedMatch) {
		throw new Error(`Failed to open file '${failedMatch[1]}'.`);
	}

	if (openingMatch) {
		return openingMatch[1];
	}

	return;
};

/**
 * @returns seconds
 */
export const getDuration = (operand: number, factor: DurationFactor): number => {
	switch (factor) {
	case DurationFactor.Minutes:
		return operand * 60;
	case DurationFactor.Hours:
		return operand * Math.pow(60, 2);
	case DurationFactor.Seconds:
	default:
		return operand;
	}
};
