export type Options = {
  duration?: number;
  dayDirNameFormat?: string;
  fileNameFormat?: string;
  dirSizeThreshold?: number;
  maxTryReconnect?: number;
};

export type EventCallback = (...args: any) => void;

export enum Events {
  START = 'start',
  STOP = 'stop',
  ERROR = 'error',
  CREATED = 'created',
  DELETED = 'deleted',
  FULL = 'full',
}
