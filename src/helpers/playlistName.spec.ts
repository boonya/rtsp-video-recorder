import playlistName from './playlistName';

test('should return current date based name.', () => {
	jest.useFakeTimers().setSystemTime(new Date('Feb 24 2022 04:45:00').getTime());

	const result = playlistName();

	expect(result).toBe('2022.02.24-04.45.00');
});

test('should return custom name.', () => {
	const result = playlistName('custom - name : і Colon');

	expect(result).toBe('custom - name _ і Colon');
});
