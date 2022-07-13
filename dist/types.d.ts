export declare type SegmentTimeOption = number | string;
export declare type DirSizeThresholdOption = number | string;
export declare type Options = Partial<{
    title: string;
    playlistName: string;
    filePattern: string;
    segmentTime: SegmentTimeOption;
    dirSizeThreshold: DirSizeThresholdOption;
    ffmpegBinary: string;
    noAudio: boolean;
}>;
export declare type EventCallback = (...args: any[]) => void;
export declare enum Events {
    START = "start",
    STARTED = "started",
    STOP = "stop",
    STOPPED = "stopped",
    ERROR = "error",
    PROGRESS = "progress",
    FILE_CREATED = "file_created",
    SPACE_FULL = "space_full"
}
export interface IRecorder {
    start: () => this;
    stop: () => this;
    on: (event: Events, callback: EventCallback) => this;
    isRecording: () => boolean;
}
export declare enum BytesFactor {
    Megabytes = "M",
    Gigabytes = "G",
    Terabytes = "T"
}
export declare enum DurationFactor {
    Seconds = "s",
    Minutes = "m",
    Hours = "h"
}
//# sourceMappingURL=types.d.ts.map