<?php
/**
 * Plugin Name: Media Manager
 * Description: Virtual folder organization and smart management for the WordPress Media Library.
 * Version: 0.1.0
 * Requires at least: 6.8
 * Requires PHP: 8.3
 * Author: Your Name
 * Text Domain: mediamanager
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( version_compare( PHP_VERSION, '8.3', '<' ) ) {
	add_action( 'admin_notices', static function () {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'Media Manager requires PHP 8.3 or higher.', 'mediamanager' ) . '</p></div>';
	} );
	return;
}

if ( version_compare( get_bloginfo( 'version' ), '6.8', '<' ) ) {
	add_action( 'admin_notices', static function () {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'Media Manager requires WordPress 6.8 or higher.', 'mediamanager' ) . '</p></div>';
	} );
	return;
}

define( 'MEDIAMANAGER_VERSION', strval( time() ) ); // Random version for cache busting during development
define( 'MEDIAMANAGER_FILE', __FILE__ );
define( 'MEDIAMANAGER_PATH', __DIR__ . '/' );
define( 'MEDIAMANAGER_URL', plugin_dir_url( __FILE__ ) );

/**
 * Load plugin text domain for translations.
 */
add_action( 'init', static function () {
	load_plugin_textdomain( 'mediamanager', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
} );


require_once MEDIAMANAGER_PATH . 'vendor/autoload.php';


add_action( 'plugins_loaded', static function () {

	\MediaManager\GitHub_Plugin_Updater::create_with_assets(
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

	if ( class_exists( 'MediaManager\\REST_API' ) ) {
		\MediaManager\REST_API::init();
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
