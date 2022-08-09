import space from './space';
import fs from 'fs';

jest.mock('fs');
jest.mock('path');

test('should return directory size in bytes', () => {
	jest.mocked(fs).readdirSync.mockReturnValue(new Array(3).fill(0));
	// @ts-ignore
	jest.mocked(fs).statSync.mockReturnValue({ isDirectory: () => false, size: 3 });

	const size = space('');

	expect(size).toEqual(9);
});
