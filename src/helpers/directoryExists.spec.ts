import directoryExists from './directoryExists';
import fs from 'fs';

jest.mock('fs');

test('exists', () => {
	// @ts-ignore
	jest.mocked(fs).lstatSync.mockReturnValue({ isDirectory: () => true });

	expect(directoryExists('path')).toBeTruthy();
});

test('does not exist', () => {
	jest.mocked(fs).lstatSync.mockImplementation(() => {
		throw new Error('no such file or directory');
	});

	expect(directoryExists('path')).toBeFalsy();
});

test('not a directory', () => {
	// @ts-ignore
	jest.mocked(fs).lstatSync.mockReturnValue({ isDirectory: () => false });

	expect(() => directoryExists('path')).toThrowError('path exists but it is not a directory.');
});
