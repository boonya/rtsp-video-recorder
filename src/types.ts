export type Options = {
  title?: string;
  dateFormat?: string;
  timeFormat?: string;
  segmentTime?: number;
  dirSizeThreshold?: number;
  maxTryReconnect?: number;
};

export type EventCallback = (...args: any) => void;

export enum Events {
  STARTED = 'started',
  STOPPED = 'stopped',
  ERROR = 'error',
  PROGRESS = 'progress',
  FILE_CREATED = 'file_created',
  DIRECTORY_CREATED = 'directory_created',
  DELETED = 'deleted',
  DISK_FULL = 'disk_full',
}
