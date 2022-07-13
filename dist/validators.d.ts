import { Options, SegmentTimeOption, DirSizeThresholdOption } from './types';
export declare function verifyPath(value: string): false | string;
export declare function verifySegmentTime(value: SegmentTimeOption): false | string;
export declare function verifyDirSizeThreshold(value: DirSizeThresholdOption): false | string;
export declare function verifyDirSizeThresholdMinimum(value: number): false | string;
export declare function verifySegmentTimeMinimum(value: number): false | string;
export declare function verifyAllOptions(path: string, { segmentTime, dirSizeThreshold }: Options): string[];
//# sourceMappingURL=validators.d.ts.map