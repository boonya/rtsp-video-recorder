import fs from 'fs';

export default function directoryExists(path: string) {
	try {
		const stats = fs.lstatSync(path);
		if (!stats.isDirectory()) {
			throw new TypeError(`${path} exists but it is not a directory.`);
		}
		return true;
	} catch (err) {
		if (err instanceof TypeError) {
			throw err;
		}
		return false;
	}
}
