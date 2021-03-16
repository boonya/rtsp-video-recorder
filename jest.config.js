module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['src', 'test'],
	coverageDirectory: './coverage',
	coverageReporters: ['lcov'],
	resetMocks: true,
	globals: {
		'ts-jest': {
			isolatedModules: true,
		},
	},
};
