import { z } from 'zod';
import {SEGMENT_TIME_PATTERN} from './helpers/segmentTime';
import {DIR_SIZE_THRESHOLD_PATTERN} from './helpers/sizeThreshold';

export const SegmentTimeSchema = z.string().regex(SEGMENT_TIME_PATTERN).or(z.number());
export const DirSizeThresholdSchema = z.string().regex(DIR_SIZE_THRESHOLD_PATTERN).or(z.number());

export const OptionsSchema = z.object({
	title: z.string().optional(),
	playlistName: z.string().optional(),
	filePattern: z.string().optional(),
	segmentTime: SegmentTimeSchema.optional(),
	dirSizeThreshold: DirSizeThresholdSchema.optional(),
	ffmpegBinary: z.string().optional(),
	noAudio: z.boolean().optional(),
});
