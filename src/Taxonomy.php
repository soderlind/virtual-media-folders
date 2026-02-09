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

		if ( is_admin() ) {
			add_filter( 'terms_clauses', [ static::class, 'filter_terms_clauses_vmfo_order' ], 10, 3 );
			add_filter( 'manage_edit-' . self::TAXONOMY . '_sortable_columns', [ static::class, 'filter_sortable_columns' ] );
		}
	}

	/**
	 * Remove sorting links from the taxonomy list table header.
	 *
	 * We enforce a single ordering (matching the sidebar), so allowing header
	 * sorting creates a confusing UX.
	 *
	 * @param array<string,string> $sortable_columns Sortable columns.
	 * @return array<string,string>
	 */
	public static function filter_sortable_columns( array $sortable_columns ): array {
		return [];
	}

	/**
	 * Ensure vmfo_folder terms are ordered like the sidebar on the taxonomy screen.
	 *
	 * The sidebar is the "master" order:
	 * - Terms with vmfo_order first (ascending)
	 * - Then terms without vmfo_order (by name)
	 *
	 * This is intentionally scoped to wp-admin/edit-tags.php for the vmfo_folder
	 * taxonomy to avoid affecting other term queries (REST, settings dropdowns, etc.).
	 *
	 * @param array<string,string> $pieces     Terms query SQL clauses.
	 * @param array<int,string>    $taxonomies Taxonomies being queried.
	 * @param array<string,mixed>  $args       Terms query arguments.
	 * @return array<string,string>
	 */
	public static function filter_terms_clauses_vmfo_order( array $pieces, array $taxonomies, array $args ): array {
		if ( ! self::is_vmfo_edit_tags_screen() ) {
			return $pieces;
		}

		if ( ! in_array( self::TAXONOMY, $taxonomies, true ) ) {
			return $pieces;
		}

		// Allow explicit sorting by other columns (e.g. count) when requested.
		if ( isset( $_GET[ 'orderby' ] ) && sanitize_key( wp_unslash( $_GET[ 'orderby' ] ) ) !== '' && sanitize_key( wp_unslash( $_GET[ 'orderby' ] ) ) !== 'name' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return $pieces;
		}

		// Only adjust ordering for queries that return full term rows.
		// (Ordering a non-all fields query by meta can lead to SQL errors with DISTINCT.)
		if ( isset( $args[ 'fields' ] ) && ! in_array( $args[ 'fields' ], [ 'all', 'all_with_object_id', '' ], true ) ) {
			return $pieces;
		}

		global $wpdb;
		$alias = 'vmfo_order_meta';

		$join = $pieces[ 'join' ] ?? '';
		if ( ! str_contains( $join, $alias ) ) {
			$join .= " LEFT JOIN {$wpdb->termmeta} AS {$alias} ON {$alias}.term_id = t.term_id AND {$alias}.meta_key = 'vmfo_order' ";
		}
		$pieces[ 'join' ] = $join;

		// If DISTINCT is used, MySQL can require ORDER BY expressions to appear in the SELECT list.
		// Add computed fields and order by aliases for compatibility.
		$fields = trim( $pieces[ 'fields' ] ?? '' );
		if ( $fields === '' ) {
			$fields = 't.*';
		}
		if ( ! str_contains( $fields, 'vmfo_order_missing' ) ) {
			$fields .= ", tt.parent AS vmfo_parent";
			$fields .= ", CASE WHEN {$alias}.meta_value IS NULL OR {$alias}.meta_value = '' THEN 1 ELSE 0 END AS vmfo_order_missing";
			$fields .= ", CAST({$alias}.meta_value AS UNSIGNED) AS vmfo_order_num";
		}
		$pieces[ 'fields' ] = $fields;

		// Order by parent first so siblings are grouped, then vmfo_order, then name.
		$orderby_list = 'vmfo_parent, vmfo_order_missing, vmfo_order_num, t.name';
		$current      = $pieces[ 'orderby' ] ?? '';
		if ( stripos( $current, 'order by' ) !== false ) {
			$pieces[ 'orderby' ] = 'ORDER BY ' . $orderby_list;
		} else {
			$pieces[ 'orderby' ] = $orderby_list;
		}

		return $pieces;
	}

	/**
	 * Check whether we're on the vmfo_folder taxonomy screen.
	 *
	 * @return bool
	 */
	private static function is_vmfo_edit_tags_screen(): bool {
		if ( ! is_admin() ) {
			return false;
		}

		$pagenow = $GLOBALS[ 'pagenow' ] ?? '';
		if ( $pagenow !== 'edit-tags.php' ) {
			return false;
		}

		$taxonomy  = isset( $_GET[ 'taxonomy' ] ) ? sanitize_text_field( wp_unslash( $_GET[ 'taxonomy' ] ) ) : '';
		$post_type = isset( $_GET[ 'post_type' ] ) ? sanitize_text_field( wp_unslash( $_GET[ 'post_type' ] ) ) : '';

		return $taxonomy === self::TAXONOMY && $post_type === 'attachment';
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
		$show_ui = defined( 'WP_DEBUG' ) && WP_DEBUG;

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
			'show_ui'               => $show_ui,
			// Don't add a column to the media list table (we use our own sidebar).
			'show_admin_column'     => false,
			// Disable the default taxonomy metabox on attachment edit screen.
			// The plugin provides its own folder management UI in the media library.
			'meta_box_cb'           => false,
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
