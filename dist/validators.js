"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAllOptions = exports.verifySegmentTimeMinimum = exports.verifyDirSizeThresholdMinimum = exports.verifyDirSizeThreshold = exports.verifySegmentTime = exports.verifyPath = void 0;
const directoryExists_1 = __importDefault(require("./helpers/directoryExists"));
const path_1 = __importDefault(require("path"));
const sizeThreshold_1 = __importDefault(require("./helpers/sizeThreshold"));
const segmentTime_1 = __importDefault(require("./helpers/segmentTime"));
function getErrorMessage(err) {
    return err instanceof Error
        && err.message
        || 'Something went wrong';
}
function verifyPath(value) {
    try {
        const path = path_1.default.resolve(value);
        if (!(0, directoryExists_1.default)(path)) {
            return `${path} is not a directory`;
        }
    }
    catch (err) {
        return getErrorMessage(err);
    }
    return false;
}
exports.verifyPath = verifyPath;
function verifySegmentTime(value) {
    if (typeof value === 'number') {
        const error = verifySegmentTimeMinimum(value);
        if (error) {
            return error;
        }
    }
    if (typeof value === 'string') {
        try {
            const seconds = (0, segmentTime_1.default)(value);
            const error = verifySegmentTimeMinimum(seconds);
            if (error) {
                return error;
            }
        }
        catch (err) {
            return getErrorMessage(err);
        }
    }
    return false;
}
exports.verifySegmentTime = verifySegmentTime;
function verifyDirSizeThreshold(value) {
    if (typeof value === 'number') {
        const error = verifyDirSizeThresholdMinimum(value);
        if (error) {
            return error;
        }
    }
    if (typeof value === 'string') {
        try {
            const bytes = (0, sizeThreshold_1.default)(value);
            const error = verifyDirSizeThresholdMinimum(bytes);
            if (error) {
                return error;
            }
        }
        catch (err) {
            return getErrorMessage(err);
        }
    }
    return false;
}
exports.verifyDirSizeThreshold = verifyDirSizeThreshold;
function verifyDirSizeThresholdMinimum(value) {
    return value < 200 * Math.pow(1024, 2)
        && 'There is no sense to set dirSizeThreshold value to less that 200 MB.';
}
exports.verifyDirSizeThresholdMinimum = verifyDirSizeThresholdMinimum;
function verifySegmentTimeMinimum(value) {
    return value < 15
        && 'There is no sense to set duration value to less than 15 seconds.';
}
exports.verifySegmentTimeMinimum = verifySegmentTimeMinimum;
function verifyAllOptions(path, { segmentTime, dirSizeThreshold }) {
    const errors = [];
    const pathError = verifyPath(path);
    if (pathError)
        errors.push(pathError);
    if (segmentTime) {
        const error = verifySegmentTime(segmentTime);
        if (error)
            errors.push(error);
    }
    if (dirSizeThreshold) {
        const error = verifyDirSizeThreshold(dirSizeThreshold);
        if (error)
            errors.push(error);
    }
    return errors;
}
exports.verifyAllOptions = verifyAllOptions;
//# sourceMappingURL=validators.js.map