import pathApi from 'path';

import { Options, SegmentTimeOption, DirSizeThresholdOption } from './types';
import Helpers from './helpers';

/**
 * @return false or string
 */
export const verifyPath = (value: string) => {
  try {
    const path = pathApi.resolve(value);
    if (!Helpers.directoryExists(path)) {
      return `${path} is not a directory`;
    }
  } catch (err) {
    return err.message;
  }
  return false;
};

/**
 * @return false or string
 */
export const verifySegmentTime = (value: SegmentTimeOption) => {
  if (typeof value === 'number') {
    const error = verifySegmentTimeMinimum(value);
    if (error) {
      return error;
    }
  }

  if (typeof value === 'string') {
    try {
      const seconds = Helpers.transformSegmentTime(value);
      const error = verifySegmentTimeMinimum(seconds);
      if (error) {
        return error;
      }
    } catch (e) {
      return e.message;
    }
  }

  return false;
};

/**
 * @return false or string
 */
export const verifyDirSizeThreshold = (value: DirSizeThresholdOption) => {
  if (typeof value === 'number') {
    const error = verifyDirSizeThresholdMinimum(value);
    if (error) {
      return error;
    }
  }

  if (typeof value === 'string') {
    try {
      const bytes = Helpers.transformDirSizeThreshold(value);
      const error = verifyDirSizeThresholdMinimum(bytes);
      if (error) {
        return error;
      }
    } catch (e) {
      return e.message;
    }
  }

  return false;
};

/**
 * @return false or string
 */
export const verifyDirSizeThresholdMinimum = (value: number) => {
  return value < 200 * Math.pow(1024, 2)
    && 'There is no sence to set dirSizeThreshold value to less that 200 MB.';
};

/**
 * @returns false or string
 */
export const verifySegmentTimeMinimum = (value: number) => {
  return value < 15
    && 'There is no sence to set duration value to less than 15 seconds.';
};

export const verifyAllOptions = (path: string, { segmentTime, dirSizeThreshold }: Options) => {
  const errors: string[] = [];

  const pathError = verifyPath(path);
  if (pathError) errors.push(pathError);

  // TODO: Validate dateFormat & timeFormat to be a valid cpp strftime format strings

  if (segmentTime) {
    const error = verifySegmentTime(segmentTime);
    if (error) errors.push(error);
  }

  if (dirSizeThreshold) {
    const error = verifyDirSizeThreshold(dirSizeThreshold);
    if (error) errors.push(error);
  }

  return errors;
};

export default { verifyAllOptions };
