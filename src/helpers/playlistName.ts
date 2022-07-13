export default function playlistName(customValue?: string) {
	if (customValue) {
		return customValue.replace(/[:><"'![\]|+?*%@\s]+/ug, '_').replace(/_+/ug, '_');
	}

	const now = new Date();
	const [date] = now.toISOString().split('T');
	const [time] = now.toTimeString().split(' ');

	return [
		date.replace(/-/ug, '.'),
		time.replace(/:/ug, '.'),
	].join('-');
}
