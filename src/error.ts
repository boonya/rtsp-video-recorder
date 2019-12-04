class RecorderError extends Error {
  constructor(public message: string, public errors: string[]) {
    super(message);
  }
}

export default RecorderError;
