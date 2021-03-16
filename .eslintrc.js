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
		ecmaVersion: 6,
		sourceType: 'module',
		project: './tsconfig.eslint.json',
	},
	rules: {
		'no-console': ['warn'],
		'linebreak-style': ['error', 'unix'],
		indent: ['error', 'tab'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
	}
};
