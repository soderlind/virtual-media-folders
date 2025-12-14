<?php
/**
 * Media Folder Taxonomy.
 *
 * Registers the custom 'vmfo_folder' taxonomy for organizing
 * WordPress media library attachments into virtual folders.
 *
 * @package VirtualMediaFolders
 * @since   1.0.0
 */

declare(strict_types=1);

namespace VirtualMediaFolders;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Taxonomy handler for media folders.
 *
 * This class registers and configures the hierarchical 'vmfo_folder' taxonomy
 * that allows users to organize media attachments into a folder structure.
 * The folders are virtual - files are not moved on disk.
 */
class Taxonomy {

	/**
	 * Taxonomy name constant.
	 *
	 * @var string
	 */
	public const TAXONOMY = 'vmfo_folder';

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
	 * Register the vmfo_folder taxonomy.
	 *
	 * Creates a hierarchical taxonomy attached to the 'attachment' post type.
	 * Includes REST API support for use with the block editor and React components.
	 *
	 * @return void
	 */
	public static function register_taxonomy(): void {
		$labels = [
			'name'              => _x( 'Media Folders', 'taxonomy general name', 'virtual-media-folders' ),
			'singular_name'     => _x( 'Media Folder', 'taxonomy singular name', 'virtual-media-folders' ),
			'search_items'      => __( 'Search Folders', 'virtual-media-folders' ),
			'all_items'         => __( 'All Folders', 'virtual-media-folders' ),
			'parent_item'       => __( 'Parent Folder', 'virtual-media-folders' ),
			'parent_item_colon' => __( 'Parent Folder:', 'virtual-media-folders' ),
			'edit_item'         => __( 'Edit Folder', 'virtual-media-folders' ),
			'update_item'       => __( 'Update Folder', 'virtual-media-folders' ),
			'add_new_item'      => __( 'Add New Folder', 'virtual-media-folders' ),
			'new_item_name'     => __( 'New Folder Name', 'virtual-media-folders' ),
			'menu_name'         => __( 'Media Folders', 'virtual-media-folders' ),
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
			'rest_base'             => 'vmfo-folders',
			'query_var'             => true,
			'rewrite'               => [ 'slug' => 'vmfo-folder' ],
			// Use generic term count for attachments (includes all statuses).
			'update_count_callback' => '_update_generic_term_count',
		];

		register_taxonomy( self::TAXONOMY, 'attachment', $args );
	}
}
