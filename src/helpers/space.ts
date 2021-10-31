import fs from 'fs';
import pathApi from 'path';

/**
 * @returns bytes
 */
export default function dirSize(path: string) {
	return getDirListing(path)
		.map((item) => fs.statSync(item).size)
		.reduce((acc, size) => acc + size, 0);
}

function getDirListing(dir: string): string[] {
	return fs.readdirSync(dir)
		.map((item) => {
			const path = pathApi.join(dir, item);
			if (fs.statSync(path).isDirectory()) {
				return getDirListing(path);
			}
			return path;
		})
		.reduce<string[]>((acc, i) => {
			if (Array.isArray(i)) {
				return [...acc, ...i];
			}
			return [...acc, i];
		}, []);
}
