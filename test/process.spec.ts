import { mockSpawnProcess, URI, DESTINATION } from './test.helpers';
import Recorder from '../src/recorder';
import { verifyAllOptions } from '../src/validators';
import { Options } from '../src/types';
import playlistName from '../src/helpers/playlistName';

jest.mock('../src/validators');
jest.mock('../src/helpers/playlistName');

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	jest.mocked(playlistName).mockReturnValue('playlist');
});

it('Spawn arguments with no additional options defined', () => {
	function onSpawn(command: string, args: ReadonlyArray<string>, options: Options) {
		expect(command).toEqual('ffmpeg');
		expect(args).toEqual([
			'-rtsp_transport', 'tcp',
			'-i', URI,
			'-reset_timestamps', '1',
			'-c:a', 'aac',
			'-strftime', '1',
			'-strftime_mkdir', '1',
			'-hls_time', '600',
			'-hls_list_size', '0',
			'-hls_segment_filename', '"%Y.%m.%d/%H.%M.%S.mp4"',
			'./playlist.m3u8',
		]);
		expect(options).toEqual({ detached: false, cwd: DESTINATION });
	}

	// @ts-ignore
	mockSpawnProcess({ onSpawn });

	new Recorder(URI, DESTINATION).start();
});

it('Spawn arguments with options defined', () => {
	function onSpawn(command: string, args: ReadonlyArray<string>, options: Options) {
		expect(command).toEqual('ffmpeg');
		expect(args).toEqual([
			'-rtsp_transport', 'tcp',
			'-i', URI,
			'-reset_timestamps', '1',
			'-metadata', 'title="Any video title"',
			'-an',
			'-strftime', '1',
			'-strftime_mkdir', '1',
			'-hls_time', '1000',
			'-hls_list_size', '0',
			'-hls_segment_filename', '"%Y.%m.%d/%H.%M.%S.mp4"',
			'./playlist.m3u8',
		]);
		expect(options).toEqual({ detached: false, cwd: DESTINATION });
	}

	// @ts-ignore
	mockSpawnProcess({ onSpawn });

	new Recorder(URI, DESTINATION, { title: 'Any video title', segmentTime: 1000, noAudio: true }).start();
});
