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
 * Version: 1.3.7
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
define( 'VMFO_VERSION', defined( 'WP_DEBUG' ) && WP_DEBUG ? strval( time() ) : '1.3.3' );
define( 'VMFO_FILE', __FILE__ );
define( 'VMFO_PATH', __DIR__ . '/' );
define( 'VMFO_URL', plugin_dir_url( __FILE__ ) );

/*
 * Load Composer autoloader.
 */
require_once VMFO_PATH . 'vendor/autoload.php';

/**
 * Migrate taxonomy from old 'media_folder' to new 'vmfo_folder'.
 *
 * This runs once on plugin activation or when the old taxonomy terms exist.
 * It preserves all folder assignments and metadata.
 *
 * @since 1.3.0
 */
function vmfo_maybe_migrate_taxonomy(): void {
	// Check if migration has already run.
	if ( get_option( 'vmfo_taxonomy_migrated', false ) ) {
		return;
	}

	global $wpdb;

	// Check if old taxonomy has any terms.
	$old_taxonomy = 'media_folder';
	$new_taxonomy = 'vmfo_folder';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$old_term_count = $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy = %s",
			$old_taxonomy
		)
	);

	if ( (int) $old_term_count === 0 ) {
		// No old terms, mark as migrated and return.
		update_option( 'vmfo_taxonomy_migrated', true );
		return;
	}

	// Update all term_taxonomy entries from old to new taxonomy.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	$wpdb->update(
		$wpdb->term_taxonomy,
		[ 'taxonomy' => $new_taxonomy ],
		[ 'taxonomy' => $old_taxonomy ],
		[ '%s' ],
		[ '%s' ]
	);

	// Clear taxonomy caches.
	wp_cache_delete( 'all_ids', $old_taxonomy );
	wp_cache_delete( 'all_ids', $new_taxonomy );
	wp_cache_delete( 'get', $old_taxonomy );
	wp_cache_delete( 'get', $new_taxonomy );

	// Mark migration as complete.
	update_option( 'vmfo_taxonomy_migrated', true );
}

/**
 * Initialize plugin components after all plugins are loaded.
 *
 * Components initialized:
 * - Taxonomy: Register 'vmfo_folder' custom taxonomy
 * - Admin: Media Library UI enhancements and folder tree
 * - RestApi: Custom endpoints for folder management
 * - Suggestions: AI-powered folder suggestions
 * - Editor: Gutenberg block editor integration
 * - Settings: Plugin settings page
 *
 * @since 0.1.0
 */
add_action( 'plugins_loaded', static function () {

	\VirtualMediaFolders\Taxonomy::init();

	// Run taxonomy migration after taxonomy is registered.
	add_action( 'init', 'vmfo_maybe_migrate_taxonomy', 20 );

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
