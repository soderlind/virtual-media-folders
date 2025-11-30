<?php
/**
 * Media Folder Taxonomy.
 *
 * Registers the custom 'media_folder' taxonomy for organizing
 * WordPress media library attachments into virtual folders.
 *
 * @package MediaManager
 * @since   1.0.0
 */

declare(strict_types=1);

namespace MediaManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Taxonomy handler for media folders.
 *
 * This class registers and configures the hierarchical 'media_folder' taxonomy
 * that allows users to organize media attachments into a folder structure.
 * The folders are virtual - files are not moved on disk.
 */
class Taxonomy {

	/**
	 * Taxonomy name constant.
	 *
	 * @var string
	 */
	public const TAXONOMY = 'media_folder';

	/**
	 * Initialize the taxonomy registration.
	 *
	 * Hooks into WordPress init action to register the taxonomy.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'init', [ static::class, 'register_taxonomy' ] );
	}

	/**
	 * Register the media_folder taxonomy.
	 *
	 * Creates a hierarchical taxonomy attached to the 'attachment' post type.
	 * Includes REST API support for use with the block editor and React components.
	 *
	 * @return void
	 */
	public static function register_taxonomy(): void {
		$labels = [
			'name'              => _x( 'Media Folders', 'taxonomy general name', 'mediamanager' ),
			'singular_name'     => _x( 'Media Folder', 'taxonomy singular name', 'mediamanager' ),
			'search_items'      => __( 'Search Folders', 'mediamanager' ),
			'all_items'         => __( 'All Folders', 'mediamanager' ),
			'parent_item'       => __( 'Parent Folder', 'mediamanager' ),
			'parent_item_colon' => __( 'Parent Folder:', 'mediamanager' ),
			'edit_item'         => __( 'Edit Folder', 'mediamanager' ),
			'update_item'       => __( 'Update Folder', 'mediamanager' ),
			'add_new_item'      => __( 'Add New Folder', 'mediamanager' ),
			'new_item_name'     => __( 'New Folder Name', 'mediamanager' ),
			'menu_name'         => __( 'Media Folders', 'mediamanager' ),
		];

		$args = [
			// Enable parent-child relationships for nested folders.
			'hierarchical'          => true,
			'labels'                => $labels,
			// Show in admin UI (taxonomy management page).
			'show_ui'               => true,
			// Don't add a column to the media list table (we use our own sidebar).
			'show_admin_column'     => false,
			// Enable REST API for React-based UI components.
			'show_in_rest'          => true,
			'rest_base'             => 'media-folders',
			'query_var'             => true,
			'rewrite'               => [ 'slug' => 'media-folder' ],
			// Use generic term count for attachments (includes all statuses).
			'update_count_callback' => '_update_generic_term_count',
		];

		register_taxonomy( self::TAXONOMY, 'attachment', $args );
	}
}
