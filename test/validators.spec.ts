import pathApi from 'path';

import {
  verifyPath,
  verifySegmentTime,
  verifyDirSizeThreshold,
  verifyDirSizeThresholdMinimum,
  verifySegmentTimeMinimum,
  verifyAllOptions,
} from '../src/validators';

describe('verifyPath', () => {
  test('Valid', () => {
    expect(verifyPath('.')).toBeFalsy();
    expect(verifyPath(__dirname)).toBeFalsy();
  });

  test('Invalid', () => {
    expect(verifyPath('./unexistant-dir')).toEqual(`${pathApi.dirname(__dirname)}/unexistant-dir is not a directory`);
    expect(verifyPath(__filename)).toEqual(`${__filename} exists but it is not a directory.`);
  });
});

describe('verifySegmentTime', () => {
  test('Valid', () => {
    expect(verifySegmentTime(20)).toBeFalsy();
    expect(verifySegmentTime('20s')).toBeFalsy();
    expect(verifySegmentTime('10m')).toBeFalsy();
    expect(verifySegmentTime('1h')).toBeFalsy();
  });

  test('Invalid', () => {
    expect(verifySegmentTime(1)).toEqual('There is no sence to set duration value to less than 15 seconds.');
    expect(verifySegmentTime('1s')).toEqual('There is no sence to set duration value to less than 15 seconds.');
    expect(verifySegmentTime('0.1m')).toEqual('segmentTime value has to match to pattern /^(\\d+)(s|m|h)?$/.');
    expect(verifySegmentTime('invalid value')).toEqual('segmentTime value has to match to pattern /^(\\d+)(s|m|h)?$/.');
  });
});

describe('verifyDirSizeThreshold', () => {
  test('Valid', () => {
    expect(verifyDirSizeThreshold(200 * Math.pow(1024, 2))).toBeFalsy();
    expect(verifyDirSizeThreshold('200M')).toBeFalsy();
    expect(verifyDirSizeThreshold('1G')).toBeFalsy();
    expect(verifyDirSizeThreshold('1T')).toBeFalsy();
  });

  test('Invalid', () => {
    expect(verifyDirSizeThreshold(199 * Math.pow(1024, 2))).toEqual('There is no sence to set dirSizeThreshold value to less that 200 MB.');
    expect(verifyDirSizeThreshold('199M')).toEqual('There is no sence to set dirSizeThreshold value to less that 200 MB.');
    expect(verifyDirSizeThreshold('0.1T')).toEqual('dirSizeThreshold value has to match to pattern /^(\\d+)(M|G|T)?$/.');
    expect(verifyDirSizeThreshold('invalid value')).toEqual('dirSizeThreshold value has to match to pattern /^(\\d+)(M|G|T)?$/.');
  });
});

test('verifyDirSizeThresholdMinimum', () => {
  expect(verifyDirSizeThresholdMinimum(200 * Math.pow(1024, 2))).toBeFalsy();
  expect(verifyDirSizeThresholdMinimum(199 * Math.pow(1024, 2)))
    .toEqual('There is no sence to set dirSizeThreshold value to less that 200 MB.');
});

test('verifySegmentTimeMinimum', () => {
  expect(verifySegmentTimeMinimum(15)).toBeFalsy();
  expect(verifySegmentTimeMinimum(14))
    .toEqual('There is no sence to set duration value to less than 15 seconds.');
});

test('verifyAllOptions', () => {
  expect(verifyAllOptions(__filename, { segmentTime: 1, dirSizeThreshold: 1 })).toEqual([
    `${__filename} exists but it is not a directory.`,
    'There is no sence to set duration value to less than 15 seconds.',
    'There is no sence to set dirSizeThreshold value to less that 200 MB.',
  ]);
});
