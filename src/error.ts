// tslint:disable: max-classes-per-file
export class RecorderError extends Error {
  constructor (...props: any) {
    super(...props);
    Object.setPrototypeOf(this, RecorderError.prototype);
  }
}

export class RecorderValidationError extends RecorderError {
  constructor (message: string, public errors: string[] = []) {
    super(message + ":" + errors.join(" "));
    Object.setPrototypeOf(this, RecorderValidationError.prototype);
  }
}

export default {
  RecorderError,
  RecorderValidationError,
};
// tslint:enable: max-classes-per-file
