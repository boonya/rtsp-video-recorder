class RecorderError extends Error {
  constructor(message: string, public errors: string[] = []) {
    super(message);
    Object.setPrototypeOf(this, RecorderError.prototype);
  }
}

export default RecorderError;
