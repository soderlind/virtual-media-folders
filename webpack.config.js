const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
	...defaultConfig,
	entry: {
		admin: path.resolve(__dirname, 'src/admin/index.js'),
		editor: path.resolve(__dirname, 'src/editor/index.js'),
		settings: path.resolve(__dirname, 'src/admin/settings.js'),
		shared: path.resolve(__dirname, 'src/shared/index.js'),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve(__dirname, 'build'),
		// Export shared components as a library for add-ons to consume.
		library: {
			name: ['vmfo', '[name]'],
			type: 'window',
		},
	},
	externals: {
		...defaultConfig.externals,
		// Allow add-ons to import from the shared bundle.
		'@vmfo/shared': 'vmfo.shared',
	},
};
