import { ChildProcessWithoutNullStreams } from 'child_process';
import { verifyAllOptions } from '../../src/validators';
import {mockSpawnProcess, URI, DESTINATION} from '../test.helpers';
import Recorder, { RecorderEvents } from '../../src/recorder';
import dirSize from '../../src/helpers/space';

jest.mock('../../src/validators');
jest.mock('../../src/helpers/space');

let fakeProcess: ChildProcessWithoutNullStreams;
let eventHandler: () => void;

beforeEach(() => {
	jest.mocked(verifyAllOptions).mockReturnValue([]);
	fakeProcess = mockSpawnProcess();
	eventHandler = jest.fn().mockName('onStarted');
	jest.mocked(dirSize).mockReturnValue(0);
});

const FFMPEG_MESSAGE = `[libx264 @ 0x148816200] 264 - core 163 r3060 5db6aa6 - H.264/MPEG-4 AVC codec - Copyleft 2003-2021 - http://www.videolan.org/x264.html - options: cabac=1 ref=3 deblock=1:0:0 analyse=0x3:0x113 me=hex subme=7 psy=1 psy_rd=1.00:0.00 mixed_ref=1 me_range=16 chroma_me=1 trellis=1 8x8dct=1 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=-2 threads=12 lookahead_threads=2 sliced_threads=0 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=3 b_pyramid=2 b_adapt=1 b_bias=0 direct=1 weightb=1 open_gop=0 weightp=2 keyint=250 keyint_min=15 scenecut=40 intra_refresh=0 rc_lookahead=40 rc=crf mbtree=1 crf=23.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=1:1.00
Output #0, hls, to './playlist.m3u8':
  Metadata:
    title           : Any cam
    encoder         : Lavf58.76.100
  Stream #0:0: Video: h264, yuv420p(progressive), 2592x1944, q=2-31, 15 fps, 90k tbn
    Metadata:
      encoder         : Lavc58.134.100 libx264
    Side data:
      cpb: bitrate max/min/avg: 0/0/0 buffer size: 0 vbv_delay: N/A
`;

test('should return default options + playlist', async () => {
	new Recorder(URI, DESTINATION)
		.on(RecorderEvents.STARTED, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from(FFMPEG_MESSAGE, 'utf8'));

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith({
		uri: URI,
		destination: DESTINATION,
		filePattern: '%Y.%m.%d/%H.%M.%S',
		playlist: 'playlist.m3u8',
		segmentTime: 600,
		noAudio: false,
		ffmpegBinary: 'ffmpeg',
	});
});

test('should return custom options + playlist', async () => {
	new Recorder(URI, DESTINATION, {
		title: 'Test Cam',
		filePattern: '%Y:%B  %d/%I %M: %S%p',
		dirSizeThreshold: '500M',
		segmentTime: '1h',
		noAudio: true,
		ffmpegBinary: '/bin/ffmpeg',
	})
		.on(RecorderEvents.STARTED, eventHandler)
		.start();

	// We have to wait next tick
	await Promise.resolve(true);

	fakeProcess.stderr.emit('data', Buffer.from(FFMPEG_MESSAGE, 'utf8'));

	expect(eventHandler).toBeCalledTimes(1);
	expect(eventHandler).toBeCalledWith({
		uri: URI,
		destination: DESTINATION,
		title: 'Test Cam',
		filePattern: '%Y_%B_%d/%I_%M_%S%p',
		playlist: 'playlist.m3u8',
		dirSizeThreshold: 524288000,
		segmentTime: 3600,
		noAudio: true,
		ffmpegBinary: '/bin/ffmpeg',
	});
});
