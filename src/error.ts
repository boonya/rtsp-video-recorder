export class RecorderError extends Error {
	constructor (message?: string) {
		super(message);
		Object.setPrototypeOf(this, RecorderError.prototype);
	}
}

export class RecorderValidationError extends RecorderError {
	constructor (message: string, public errors: string[] = []) {
		super(errors.length ? `${message}: ${errors.join('; ')}` : message);
		Object.setPrototypeOf(this, RecorderValidationError.prototype);
	}
}
