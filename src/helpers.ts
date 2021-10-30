import fs from 'fs';
import { BytesFactor, DurationFactor, DirSizeThresholdOption, SegmentTimeOption } from './types';

const SEGMENT_TIME_PATTERN = /^(\d+)(s|m|h)?$/;

const DIR_SIZE_THRESHOLD_PATTERN = /^(\d+)(M|G|T)?$/;

export function transformDirSizeThreshold(value: DirSizeThresholdOption): number {
	if (typeof value === 'number') return value;
	const [operand, factor] = matchDirSizeThreshold(value);
	return getBytesSize(operand, factor);
}

export function transformSegmentTime(value: SegmentTimeOption): number {
	if (typeof value === 'number') return value;
	const [operand, factor] = matchSegmentTime(value);
	return getDuration(operand, factor);
}

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

function matchDirSizeThreshold(value: string): [number, BytesFactor] {
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
}

/**
 * @returns bytes
 */
function getBytesSize(operand: number, factor: BytesFactor): number {
	switch (factor) {
	case BytesFactor.Gigabytes:
		return operand * Math.pow(1024, 3);
	case BytesFactor.Terabytes:
		return operand * Math.pow(1024, 4);
	case BytesFactor.Megabytes:
	default:
		return operand * Math.pow(1024, 2);
	}
}

function matchSegmentTime(value: string): [number, DurationFactor] {
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
}

/**
 * @returns seconds
 */
function getDuration(operand: number, factor: DurationFactor): number {
	switch (factor) {
	case DurationFactor.Minutes:
		return operand * 60;
	case DurationFactor.Hours:
		return operand * Math.pow(60, 2);
	case DurationFactor.Seconds:
	default:
		return operand;
	}
}
