import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@wordpress/components': '@wordpress/components',
      '@wordpress/element': '@wordpress/element',
      '@wordpress/data': '@wordpress/data',
      '@wordpress/api-fetch': '@wordpress/api-fetch',
      '@wordpress/icons': '@wordpress/icons',
    },
  },
});
