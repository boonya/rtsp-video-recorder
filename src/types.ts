export type SegmentTimeOption = number | string;
export type DirSizeThresholdOption = number | string;

export type Options = {
  title?: string;
  ffmpegBinary?: string;
  directoryPattern?: string;
  filenamePattern?: string;
  segmentTime?: SegmentTimeOption;
  dirSizeThreshold?: DirSizeThresholdOption;
};

export type EventCallback = (...args: any) => void;

export enum Events {
  STARTED = 'started',
  STOPPED = 'stopped',
  ERROR = 'error',
  PROGRESS = 'progress',
  FILE_CREATED = 'file_created',
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
