<?php
/**
 * Media Manager WordPress Plugin
 *
 * Provides virtual folder organization and smart management features
 * for the WordPress Media Library. Includes a folder sidebar in both
 * the Media Library grid view and Gutenberg block editor media modals.
 *
 * @package     MediaManager
 * @author      Per Søderlind
 * @copyright   2024 Per Søderlind
 * @license     GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name: Media Manager
 * Description: Virtual folder organization and smart management for the WordPress Media Library.
 * Version: 0.1.6
 * Requires at least: 6.8
 * Requires PHP: 8.3
 * Author: Per Soderlind
 * Author URI: https://soderlind.no/
 * License: GPL-2.0-or-later
 * Text Domain: mediamanager
 */

/*
 * Security: Prevent direct file access.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/*
 * Check PHP version compatibility.
 * Media Manager requires PHP 8.3+ for modern language features.
 */
if ( version_compare( PHP_VERSION, '8.3', '<' ) ) {
	add_action( 'admin_notices', static function () {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'Media Manager requires PHP 8.3 or higher.', 'mediamanager' ) . '</p></div>';
	} );
	return;
}

/*
 * Check WordPress version compatibility.
 * Media Manager requires WP 6.8+ for modern block editor features.
 */
if ( version_compare( get_bloginfo( 'version' ), '6.8', '<' ) ) {
	add_action( 'admin_notices', static function () {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'Media Manager requires WordPress 6.8 or higher.', 'mediamanager' ) . '</p></div>';
	} );
	return;
}

/*
 * Define plugin constants.
 */
define( 'MEDIAMANAGER_VERSION', defined( 'WP_DEBUG' ) && WP_DEBUG ? strval( time() ) : '0.1.6' );
define( 'MEDIAMANAGER_FILE', __FILE__ );
define( 'MEDIAMANAGER_PATH', __DIR__ . '/' );
define( 'MEDIAMANAGER_URL', plugin_dir_url( __FILE__ ) );

/**
 * Load plugin text domain for translations.
 *
 * @since 0.1.0
 */
add_action( 'init', static function () {
	load_plugin_textdomain( 'mediamanager', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
} );

/*
 * Load Composer autoloader.
 */
require_once MEDIAMANAGER_PATH . 'vendor/autoload.php';

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

	\MediaManager\GitHubPluginUpdater::create_with_assets(
		'https://github.com/soderlind/mediamanager',
		MEDIAMANAGER_FILE,
		'mediamanager',
		'/mediamanager\.zip/',
		'main'
	);
	\MediaManager\Taxonomy::init();

	if ( class_exists( 'MediaManager\\Admin' ) ) {
		\MediaManager\Admin::init();
	}

	if ( class_exists( 'MediaManager\\RestApi' ) ) {
		\MediaManager\RestApi::init();
	}

	if ( class_exists( 'MediaManager\\Suggestions' ) ) {
		\MediaManager\Suggestions::init();
	}

	if ( class_exists( 'MediaManager\\Editor' ) ) {
		\MediaManager\Editor::boot();
	}

	if ( class_exists( 'MediaManager\\Settings' ) ) {
		\MediaManager\Settings::init();
	}
} );
