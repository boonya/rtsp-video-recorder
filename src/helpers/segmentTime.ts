import { DurationFactor, SegmentTimeOption } from '../types';

export const SEGMENT_TIME_PATTERN = /^(\d+)(s|m|h)?$/;

export default function transformSegmentTime(value: SegmentTimeOption) {
	if (typeof value === 'number') return value;
	const [operand, factor] = matchSegmentTime(value);
	return getDuration(operand, factor);
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
