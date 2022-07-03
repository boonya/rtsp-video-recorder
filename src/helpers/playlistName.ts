export default function playlistName(customValue?: string) {
	if (customValue) {
		return customValue;
	}
	const date = new Date();
	const Y = date.getFullYear();
	const m = date.getMonth() + 1;
	const d = date.getDate();
	const H = date.getHours();
	const M = date.getMinutes();
	const S = date.getSeconds();
	return `${Y}.${m}.${d}-${H}.${M}.${S}}`;
}
