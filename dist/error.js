"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorderValidationError = exports.RecorderError = void 0;
class RecorderError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, RecorderError.prototype);
    }
}
exports.RecorderError = RecorderError;
class RecorderValidationError extends RecorderError {
    constructor(message, errors = []) {
        super(errors.length ? `${message}: ${errors.join('; ')}` : message);
        this.errors = errors;
        Object.setPrototypeOf(this, RecorderValidationError.prototype);
    }
}
exports.RecorderValidationError = RecorderValidationError;
//# sourceMappingURL=error.js.map