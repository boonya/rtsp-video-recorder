export type SegmentTimeOption = number | string;
export type DirSizeThresholdOption = number | string;

export type Options = Partial<{
	title: string;
	playlistName: string;
	filePattern: string;
	segmentTime: SegmentTimeOption;
	dirSizeThreshold: DirSizeThresholdOption;
	ffmpegBinary: string;
	noAudio: boolean;
}>;

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
