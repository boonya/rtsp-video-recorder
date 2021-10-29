import pathApi from 'path';
import { mocked } from 'ts-jest/utils';
import {mockSpawnProcess} from './test.helpers';

import Recorder from '../src/recorder';
import { verifyAllOptions } from '../src/validators';
import { Options } from '../src/types';

jest.mock('../src/validators');

const URI = 'rtsp://username:password@host/path';
const PATH = pathApi.normalize('/media/Recorder');

beforeEach(() => {
	mocked(verifyAllOptions).mockReturnValue([]);
});

it('Spawn arguments with no additional options defined', async () => {
	function onSpawn (command: string, args: ReadonlyArray<string>, options: Options) {
		expect(command).toEqual('ffmpeg');
		expect(args).toEqual([
			'-rtsp_transport', 'tcp',
			'-i', URI,
			'-reset_timestamps', '1',
			'-f', 'segment',
			'-segment_time', '600',
			'-strftime', '1',
			'-c:v', 'copy',
			'-c:a', 'aac',
			pathApi.normalize(`${PATH}/%Y.%m.%d.%H.%M.%S.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`),
		]);
		expect(options).toEqual({ detached: false });
	}

	mockSpawnProcess({ onSpawn });

	new Recorder(URI, PATH).start();
});

it('Spawn arguments with options defined', async () => {
	function onSpawn (command: string, args: ReadonlyArray<string>, options: Options) {
		expect(command).toEqual('ffmpeg');
		expect(args).toEqual([
			'-rtsp_transport', 'tcp',
			'-i', URI,
			'-reset_timestamps', '1',
			'-f', 'segment',
			'-segment_time', '1000',
			'-strftime', '1',
			'-metadata', 'title=Any video title',
			'-c:v', 'copy',
			'-an',
			pathApi.normalize(`${PATH}/%Y.%m.%d.%H.%M.%S.731b9d2bc1c4b8376bc7fb87a3565f7b.mp4`),
		]);
		expect(options).toEqual({ detached: false });
	}

	mockSpawnProcess({ onSpawn });

	new Recorder(URI, PATH, { title: 'Any video title', segmentTime: 1000, noAudio: true }).start();
});
