module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['src', 'test'],
	// Automatically clear mock calls and instances between every test
	clearMocks: true,
	coverageDirectory: './coverage',
	coverageReporters: ['text-summary', 'html', 'lcov'],
	globals: {
		'ts-jest': {
			isolatedModules: true,
		},
	},
	globalSetup: './test/global-setup.js',
};
