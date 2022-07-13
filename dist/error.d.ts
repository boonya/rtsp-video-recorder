export declare class RecorderError extends Error {
    constructor(message?: string);
}
export declare class RecorderValidationError extends RecorderError {
    errors: string[];
    constructor(message: string, errors?: string[]);
}
//# sourceMappingURL=error.d.ts.map