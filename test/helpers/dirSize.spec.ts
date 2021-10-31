import fs from 'fs';
import { mocked } from 'ts-jest/utils';
import {dirSize} from '../../src/helpers';

jest.mock('fs');
jest.mock('path');

test('should return directory size in bytes', () => {
	mocked(fs).readdirSync.mockReturnValue(new Array(3).fill(0));
	// @ts-ignore
	mocked(fs).statSync.mockReturnValue({isDirectory: () => false, size: 3});

	const size = dirSize('');

	expect(size).toEqual(9);
});
