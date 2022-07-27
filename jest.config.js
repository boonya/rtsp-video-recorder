module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['src', 'test'],
	clearMocks: true,
	coverageDirectory: './coverage',
	coverageReporters: ['text-summary', 'html', 'lcov'],
	globals: {
		'ts-jest': {
			isolatedModules: true,
		},
	},
};
