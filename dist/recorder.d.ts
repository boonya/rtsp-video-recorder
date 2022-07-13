import { IRecorder, Options, Events, EventCallback } from './types';
import { RecorderError, RecorderValidationError } from './error';
export { Recorder, Events as RecorderEvents, RecorderError, RecorderValidationError };
export type { IRecorder };
export default class Recorder implements IRecorder {
    private uri;
    private destination;
    private title?;
    private ffmpegBinary;
    private playlistName?;
    private filePattern;
    private segmentTime;
    private dirSizeThreshold?;
    private noAudio;
    private process;
    private eventEmitter;
    constructor(uri: string, destination: string, options?: Options);
    start: () => this;
    stop: () => this;
    on: (event: Events, callback: EventCallback) => this;
    removeListener: (event: Events, callback: EventCallback) => this;
    isRecording: () => boolean;
    private startRecord;
    private stopRecord;
    private matchStarted;
    private matchFileCreated;
    private onProgress;
    private isSpaceEnough;
    private onSpaceFull;
    private onStopped;
}
//# sourceMappingURL=recorder.d.ts.map