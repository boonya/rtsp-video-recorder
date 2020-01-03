export type Options = {
  title?: string;
  directoryPattern?: string;
  filenamePattern?: string;
  segmentTime?: number;
  dirSizeThreshold?: number;
};

export type EventCallback = (...args: any) => void;

export enum Events {
  STARTED = 'started',
  STOPPED = 'stopped',
  ERROR = 'error',
  PROGRESS = 'progress',
  FILE_CREATED = 'file_created',
  DIRECTORY_CREATED = 'directory_created',
  DELETED = 'deleted', // Is not supported yet
  DISK_FULL = 'disk_full', // Is not supported yet
}
