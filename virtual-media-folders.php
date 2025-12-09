<?php
/**
 * Virtual Media Folders WordPress Plugin
 *
 * Provides virtual folder organization and smart management features
 * for the WordPress Media Library. Includes a folder sidebar in both
 * the Media Library grid view and Gutenberg block editor media modals.
 *
 * @package     VirtualMediaFolders
 * @author      Per Søderlind
 * @copyright   2024 Per Søderlind
 * @license     GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name: Virtual Media Folders
 * Description: Virtual folder organization and smart management for the WordPress Media Library.
 * Version: 1.1.7
 * Requires at least: 6.8
 * Requires PHP: 8.3
 * Author: Per Soderlind
 * Author URI: https://soderlind.no/
 * License: GPL-2.0-or-later
 * Text Domain: virtual-media-folders
 */

/*
 * Security: Prevent direct file access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/*
 * Check PHP version compatibility.
 * Virtual Media Folders requires PHP 8.3+ for modern language features.
 */
if ( version_compare( PHP_VERSION, '8.3', '<' ) ) {
	add_action( 'admin_notices', static function () {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'Virtual Media Folders requires PHP 8.3 or higher.', 'virtual-media-folders' ) . '</p></div>';
	} );
	return;
}

/*
 * Check WordPress version compatibility.
 * Virtual Media Folders requires WP 6.8+ for modern block editor features.
 */
if ( version_compare( get_bloginfo( 'version' ), '6.8', '<' ) ) {
	add_action( 'admin_notices', static function () {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'Virtual Media Folders requires WordPress 6.8 or higher.', 'virtual-media-folders' ) . '</p></div>';
	} );
	return;
}

/*
 * Define plugin constants.
 */
define( 'VMF_VERSION', defined( 'WP_DEBUG' ) && WP_DEBUG ? strval( time() ) : '1.0.0' );
define( 'VMF_FILE', __FILE__ );
define( 'VMF_PATH', __DIR__ . '/' );
define( 'VMF_URL', plugin_dir_url( __FILE__ ) );

/**
 * Load plugin text domain for translations.
 * Using 'init' action with priority 0 for early loading.
 *
 * Note: This is required for GitHub-hosted plugins since WordPress.org
 * automatic translation loading doesn't apply.
 *
 * @since 0.1.0
 */
add_action( 'init', static function () {
	// phpcs:ignore PluginCheck.CodeAnalysis.DiscouragedFunctions.load_plugin_textdomainFound -- Required for GitHub-hosted plugins.
	load_plugin_textdomain( 'virtual-media-folders', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}, 0 );

/*
 * Load Composer autoloader.
 */
require_once VMF_PATH . 'vendor/autoload.php';

/**
 * Initialize plugin components after all plugins are loaded.
 *
 * Components initialized:
 * - GitHubPluginUpdater: Auto-update from GitHub releases
 * - Taxonomy: Register 'media-folder' custom taxonomy
 * - Admin: Media Library UI enhancements and folder tree
 * - RestApi: Custom endpoints for folder management
 * - Suggestions: AI-powered folder suggestions
 * - Editor: Gutenberg block editor integration
 * - Settings: Plugin settings page
 *
 * @since 0.1.0
 */
add_action( 'plugins_loaded', static function () {

	if ( class_exists( 'VirtualMediaFolders\\GitHubPluginUpdater' ) ) {
		$updater = \VirtualMediaFolders\GitHubPluginUpdater::create_with_assets(
			'https://github.com/soderlind/virtual-media-folders',
			VMF_FILE,
			'virtual-media-folders',
			'/virtual-media-folders\.zip/',
			'main'
		);
	}

	\VirtualMediaFolders\Taxonomy::init();

	if ( class_exists( 'VirtualMediaFolders\\Admin' ) ) {
		\VirtualMediaFolders\Admin::init();
	}

	if ( class_exists( 'VirtualMediaFolders\\RestApi' ) ) {
		\VirtualMediaFolders\RestApi::init();
	}

	if ( class_exists( 'VirtualMediaFolders\\Suggestions' ) ) {
		\VirtualMediaFolders\Suggestions::init();
	}

	if ( class_exists( 'VirtualMediaFolders\\Editor' ) ) {
		\VirtualMediaFolders\Editor::boot();
	}

	if ( class_exists( 'VirtualMediaFolders\\Settings' ) ) {
		\VirtualMediaFolders\Settings::init();
	}
} );
