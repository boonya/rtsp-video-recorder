import fs from 'fs';
import pathApi from 'path';

import { BytesFactor, DurationFactor, DirSizeThresholdOption, SegmentTimeOption } from './types';

const FILE_EXTENSION = 'mp4';

const SEGMENT_TIME_PATTERN = /^(\d+)(s|m|h)?$/;

const DIR_SIZE_THRESHOLD_PATTERN = /^(\d+)(M|G|T)?$/;

export const transformDirSizeThreshold = (value: DirSizeThresholdOption) => {
  if (typeof value === 'number') return value;
  const [operand, factor] = matchDirSizeThreshold(value);
  return getBytesSize(operand, factor);
};

export const transformSegmentTime = (value: SegmentTimeOption) => {
  if (typeof value === 'number') return value;
  const [operand, factor] = matchSegmentTime(value);
  return getDuration(operand, factor);
};

export const getDirPath = (path: string, directoryPattern: string) => {
  return `${pathApi.resolve(path)}/${directoryPattern}`;
};

export const getFilePath = (directoryPath: string, filenamePattern: string) => {
  return `${directoryPath}/${filenamePattern}.${FILE_EXTENSION}`;
};

export const isDirectoryExist = (path: string) => {
  let stats;
  try {
    stats = fs.lstatSync(path);
  } catch (e) {
    return false;
  }
  if (!stats.isDirectory()) {
    throw new Error(`${path} exists but it is not a directory.`);
  }
  return true;
};

export const createDirectory = (path: string) => {
  return fs.mkdirSync(path, 0o777);
};

export const matchDirSizeThreshold = (value: string): [number, BytesFactor] => {
  const match = value.match(DIR_SIZE_THRESHOLD_PATTERN);
  if (!match) {
    throw new Error(`dirSizeThreshold value has to match to pattern ${DIR_SIZE_THRESHOLD_PATTERN.toString()}.`);
  }
  const operand = Number(match[1]);
  if (!operand) {
    throw new Error('dirSizeThreshold value has to be more than zero.');
  }

  const factor = match[2] as BytesFactor;
  return [operand, factor];
};

/**
 * @returns bytes
 */
export const getBytesSize = (operand: number, factor: BytesFactor) => {
  switch (factor) {
    case BytesFactor.Gigabytes:
      return operand * Math.pow(1024, 3);
    case BytesFactor.Terrabytes:
      return operand * Math.pow(1024, 4);
    case BytesFactor.Megabytes:
    default:
      return operand * Math.pow(1024, 2);
  }
};

export const matchSegmentTime = (value: string): [number, DurationFactor] => {
  const match = value.match(SEGMENT_TIME_PATTERN);
  if (!match) {
    throw new Error(`segmentTime value has to match to pattern ${SEGMENT_TIME_PATTERN.toString()}.`);
  }
  const operand = Number(match[1]);
  if (!operand) {
    throw new Error(`segmentTime value has to be more than zero.`);
  }

  const factor = match[2] as DurationFactor;
  return [operand, factor];
};

/**
 * @returns seconds
 */
export const getDuration = (operand: number, factor: DurationFactor) => {
  switch (factor) {
    case DurationFactor.Minutes:
      return operand * 60;
    case DurationFactor.Hours:
      return operand * Math.pow(60, 2);
    case DurationFactor.Seconds:
    default:
      return operand;
  }
};

export default {
  transformDirSizeThreshold,
  transformSegmentTime,
  getDirPath,
  getFilePath,
  isDirectoryExist,
  createDirectory,
};
