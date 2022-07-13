"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const SEGMENT_TIME_PATTERN = /^(\d+)(s|m|h)?$/;
function transformSegmentTime(value) {
    if (typeof value === 'number')
        return value;
    const [operand, factor] = matchSegmentTime(value);
    return getDuration(operand, factor);
}
exports.default = transformSegmentTime;
function matchSegmentTime(value) {
    const match = value.match(SEGMENT_TIME_PATTERN);
    if (!match) {
        throw new Error(`segmentTime value has to match to pattern ${SEGMENT_TIME_PATTERN.toString()}.`);
    }
    const operand = Number(match[1]);
    if (!operand) {
        throw new Error('segmentTime value has to be more than zero.');
    }
    const factor = match[2];
    return [operand, factor];
}
function getDuration(operand, factor) {
    switch (factor) {
        case types_1.DurationFactor.Minutes:
            return operand * 60;
        case types_1.DurationFactor.Hours:
            return operand * Math.pow(60, 2);
        case types_1.DurationFactor.Seconds:
        default:
            return operand;
    }
}
//# sourceMappingURL=segmentTime.js.map