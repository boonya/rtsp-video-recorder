import { EventEmitter } from 'events';
import { mocked } from 'ts-jest/utils';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';

jest.mock('child_process');

type OnSpawnType = (...args: unknown[]) => void;

type MockSpawnProcessOptions = {
	onSpawn?: OnSpawnType,
};

export const URI = 'rtsp://username:password@host/path';
export const PATH = path.normalize('/media/Recorder');

export function mockSpawnProcess (options: MockSpawnProcessOptions = {}) {
	const onSpawn = options.onSpawn || (() => null);

	// @ts-ignore
	const proc: ChildProcessWithoutNullStreams = new EventEmitter();
	// @ts-ignore
	proc.stderr = new EventEmitter();
	proc.kill = () => {
		proc.emit('close', 255);
		return true;
	};

	mocked(spawn).mockImplementation((...args) => {
		onSpawn(...args);
		return proc;
	});

	return proc;
}
