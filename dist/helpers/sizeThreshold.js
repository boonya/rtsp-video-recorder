"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const DIR_SIZE_THRESHOLD_PATTERN = /^(\d+)(M|G|T)?$/;
function transformDirSizeThreshold(value) {
    if (typeof value === 'number')
        return value;
    const [operand, factor] = matchDirSizeThreshold(value);
    return getBytesSize(operand, factor);
}
exports.default = transformDirSizeThreshold;
function matchDirSizeThreshold(value) {
    const match = value.match(DIR_SIZE_THRESHOLD_PATTERN);
    if (!match) {
        throw new Error(`dirSizeThreshold value has to match to pattern ${DIR_SIZE_THRESHOLD_PATTERN.toString()}.`);
    }
    const operand = Number(match[1]);
    if (!operand) {
        throw new Error('dirSizeThreshold value has to be more than zero.');
    }
    const factor = match[2];
    return [operand, factor];
}
function getBytesSize(operand, factor) {
    switch (factor) {
        case types_1.BytesFactor.Gigabytes:
            return operand * Math.pow(1024, 3);
        case types_1.BytesFactor.Terabytes:
            return operand * Math.pow(1024, 4);
        case types_1.BytesFactor.Megabytes:
        default:
            return operand * Math.pow(1024, 2);
    }
}
//# sourceMappingURL=sizeThreshold.js.map