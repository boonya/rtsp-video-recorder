module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['src', 'test'],
  coverageDirectory: './coverage',
  coverageReporters: ['lcov'],
};
