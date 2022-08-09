import segmentTime from './segmentTime';

test('should return the same as an input.', () => {
	[1, 1024, 65324, 200].forEach((input) => {
		expect(segmentTime(input)).toEqual(input);
	});
});

test('should transform 1 minute string to 60 seconds number.', () => {
	expect(segmentTime('1m')).toEqual(60);
});
