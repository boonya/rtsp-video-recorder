import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';
import { mocked } from 'ts-jest/utils';
import path from 'path';

jest.mock('child_process');

type OnSpawnType = (...args: unknown[]) => void;

type OnKillType = (...args: unknown[]) => boolean;

type MockSpawnProcessOptions = {
  onSpawn?: OnSpawnType,
  onKill?: OnKillType,
};

export const URI = 'rtsp://username:password@host/path';
export const PATH = path.normalize('/media/Recorder');

export function mockSpawnProcess (options: MockSpawnProcessOptions = {}) {
	const onSpawn = options.onSpawn || (() => null);
	const onKill = options.onKill || (() => true);

	const proc: ChildProcessWithoutNullStreams = new EventEmitter();
	proc.stderr = new EventEmitter();
	proc.kill = onKill;

	mocked(spawn).mockImplementation((...args) => {
		onSpawn(...args);
		return proc;
	});

	return proc;
}