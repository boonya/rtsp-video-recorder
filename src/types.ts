export type SegmentTimeOption = number | string;
export type DirSizeThresholdOption = number | string;

export type SegmentStartedArg = {
  current: string;
  previous?: string;
};

export type Options = Partial<{
  title: string;
  filePattern: string;
  segmentTime: SegmentTimeOption;
  dirSizeThreshold: DirSizeThresholdOption;
  autoClear: boolean;
  ffmpegBinary: string;
  noAudio: boolean;
}>;

export type EventCallback = (...args: any) => void;

export enum Events {
  STARTED = 'started',
  STOPPED = 'stopped',
  ERROR = 'error',
  PROGRESS = 'progress',
  SEGMENT_STARTED = 'segment_started',
  FILE_CREATED = 'file_created',
  STOP = 'stop',
  SPACE_WIPED = 'space_wiped',
  SPACE_FULL = 'space_full',
}

export interface IRecorder {
  start: () => this;
  stop: () => this;
  on: (event: Events, callback: EventCallback) => this;
  isRecording: () => boolean;
}

export enum BytesFactor {
  Megabytes = 'M',
  Gigabytes = 'G',
  Terrabytes = 'T',
}

export enum DurationFactor {
  Seconds = 's',
  Minutes = 'm',
  Hours = 'h',
}
