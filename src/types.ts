import {SegmentTimeSchema, DirSizeThresholdSchema, OptionsSchema} from './schemas';
import { z } from 'zod';

export type SegmentTimeOption = z.infer<typeof SegmentTimeSchema>;
export type DirSizeThresholdOption = z.infer<typeof DirSizeThresholdSchema>;

export type Options = z.infer<typeof OptionsSchema>;

export type EventCallback = (...args: any[]) => void;

export enum Events {
	START = 'start',
	STARTED = 'started',
	STOP = 'stop',
	STOPPED = 'stopped',
	ERROR = 'error',
	PROGRESS = 'progress',
	FILE_CREATED = 'file_created',
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
	Terabytes = 'T',
}

export enum DurationFactor {
	Seconds = 's',
	Minutes = 'm',
	Hours = 'h',
}
