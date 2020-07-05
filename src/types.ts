export type SegmentTimeOption = number | string;
export type DirSizeThresholdOption = number | string;

export type SegmentStartedArg = {
  current: string;
  previous?: string;
};

export type Options = Partial<{
  title: string;
  directoryPattern: string;
  filenamePattern: string;
  segmentTime: SegmentTimeOption;
  dirSizeThreshold: DirSizeThresholdOption;
  autoClear: boolean;
  ffmpegBinary: string;
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
  DIRECTORY_CREATED = 'directory_created',
  SPACE_WIPED = 'space_wiped',
  SPACE_FULL = 'space_full',
}

export interface IRecorder {
  start: () => this;
  stop: () => this;
  on: (event: Events, callback: EventCallback) => this;
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
