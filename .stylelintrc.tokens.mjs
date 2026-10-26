/**
 * Token-only stylelint config (run via `npm run lint:tokens`).
 *
 * Enforces WPDS token usage rules without the full WordPress style ruleset.
 * scripts/check-wpds-tokens.mjs additionally verifies the fallback file.
 */
export default {
	plugins: [
		'@wordpress/theme/stylelint-plugins/no-unknown-ds-tokens',
		'@wordpress/theme/stylelint-plugins/no-token-fallback-values',
		'@wordpress/theme/stylelint-plugins/no-setting-wpds-custom-properties',
	],
	rules: {
		'plugin-wpds/no-unknown-ds-tokens': true,
		'plugin-wpds/no-token-fallback-values': true,
		'plugin-wpds/no-setting-wpds-custom-properties': true,
	},
	overrides: [
		{
			files: [ '**/*.scss' ],
			customSyntax: 'postcss-scss',
		},
		{
			files: [ 'src/css/wpds-tokens-fallback.css' ],
			rules: {
		'plugin-wpds/no-unknown-ds-tokens': true,
				'plugin-wpds/no-setting-wpds-custom-properties': null,
			},
		},
	],
};
