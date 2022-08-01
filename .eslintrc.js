module.exports = {
	root: true,
	env: {
		node: true,
	},
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		project: './tsconfig.eslint.json',
	},
	rules: {
		'no-console': ['error'],
		'linebreak-style': ['error', 'unix'],
		indent: ['error', 'tab'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		'@typescript-eslint/no-unused-vars': ['error'],
	},
	overrides: [
		{
			files: ['**/*.spec.ts', 'test/**/*.ts'],
			rules: {
				'@typescript-eslint/ban-ts-comment': ['off'],
			}
		}
	],
};
