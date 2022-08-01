import sizeThreshold from './sizeThreshold';

test('should return the same as an input.', () => {
	[1, 1024, 65324, 200].forEach((input) => {
		expect(sizeThreshold(input)).toEqual(input);
	});
});

test('should return 1 Gig Bytes in bytes.', () => {
	expect(sizeThreshold('1G')).toEqual(Math.pow(1024, 3));
});
