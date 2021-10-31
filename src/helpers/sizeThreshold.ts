import { BytesFactor, DirSizeThresholdOption } from '../types';

const DIR_SIZE_THRESHOLD_PATTERN = /^(\d+)(M|G|T)?$/;

export default function transformDirSizeThreshold(value: DirSizeThresholdOption) {
	if (typeof value === 'number') return value;
	const [operand, factor] = matchDirSizeThreshold(value);
	return getBytesSize(operand, factor);
}

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
