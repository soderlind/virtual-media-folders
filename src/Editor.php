<?php
/**
 * Gutenberg Editor Integration.
 *
 * Handles registration of editor scripts and styles
 * for block editor integration.
 *
 * @package VirtualMediaFolders
 * @since 1.0.0
 */

declare(strict_types=1);

namespace VirtualMediaFolders;

defined( 'ABSPATH' ) || exit;

/**
 * Editor integration handler.
 */
final class Editor {

	/**
	 * Script handle for editor scripts.
	 */
	private const SCRIPT_HANDLE = 'vmfo-editor';

	/**
	 * Boot the editor integration.
	 *
	 * @return void
	 */
	public static function boot(): void {
		add_action( 'enqueue_block_editor_assets', [ self::class, 'enqueue_editor_assets' ] );
		add_filter( 'ajax_query_attachments_args', [ self::class, 'filter_ajax_query_args' ], 10, 1 );
	}

	/**
	 * Enqueue block editor assets.
	 *
	 * @return void
	 */
	public static function enqueue_editor_assets(): void {
		$asset_file = VMFO_PATH . 'build/editor.asset.php';

		if ( file_exists( $asset_file ) ) {
			$asset = require $asset_file;
		} else {
			$asset = [
				'dependencies' => [
					'wp-element',
					'wp-components',
					'wp-api-fetch',
					'wp-hooks',
					'wp-i18n',
					'wp-media-utils',
				],
				'version'      => VMFO_VERSION,
			];
		}

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			VMFO_URL . 'build/editor.js',
			$asset[ 'dependencies' ],
			$asset[ 'version' ],
			true
		);

		wp_enqueue_style(
			self::SCRIPT_HANDLE,
			VMFO_URL . 'build/editor.css',
			[ 'wp-components' ],
			$asset[ 'version' ]
		);

		// Pass folder data to JavaScript.
		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'var vmfEditor = ' . wp_json_encode( self::get_editor_data() ) . ';',
			'before'
		);

		// Set script translations.
		wp_set_script_translations(
			self::SCRIPT_HANDLE,
			'virtual-media-folders',
			VMFO_PATH . 'languages'
		);
	}

	/**
	 * Get data to pass to editor scripts.
	 *
	 * @return array<string, mixed>
	 */
	private static function get_editor_data(): array {
		$folders = get_terms(
			[
				'taxonomy'   => Taxonomy::TAXONOMY,
				'hide_empty' => false,
				'orderby'    => 'name',
				'order'      => 'ASC',
			]
		);

		$folder_list = [];

		if ( ! is_wp_error( $folders ) && is_array( $folders ) ) {
			foreach ( $folders as $folder ) {
				$folder_list[] = [
					'id'     => $folder->term_id,
					'name'   => $folder->name,
					'slug'   => $folder->slug,
					'parent' => $folder->parent,
					'count'  => $folder->count,
				];
			}
		}

		return [
			'folders'           => $folder_list,
			'restBase'          => 'vmfo-folders',
			'nonce'             => wp_create_nonce( 'wp_rest' ),
			'showAllMedia'      => (bool) Settings::get( 'show_all_media' ),
			'showUncategorized' => (bool) Settings::get( 'show_uncategorized' ),
		];
	}

	/**
	 * Filter AJAX attachment query arguments.
	 *
	 * Handles folder filtering for media library AJAX requests.
	 *
	 * @param mixed $query_args Query arguments.
	 * @return mixed
	 */
	public static function filter_ajax_query_args( $query_args ) {
		// Ensure we have an array
		if ( ! is_array( $query_args ) ) {
			return $query_args;
		}

		// Bail early if taxonomy doesn't exist yet.
		if ( ! function_exists( 'taxonomy_exists' ) || ! taxonomy_exists( Taxonomy::TAXONOMY ) ) {
			return $query_args;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended

		// Check both the query_args (passed by WordPress) and $_REQUEST['query'] (raw POST data)
		$folder_value   = null;
		$folder_exclude = null;

		// First check if it's in the query_args directly (props from Backbone collection)
		if ( ! empty( $query_args[ 'vmfo_folder' ] ) ) {
			$folder_value = $query_args[ 'vmfo_folder' ];
			unset( $query_args[ 'vmfo_folder' ] ); // Remove so it doesn't interfere
		} elseif ( ! empty( $_REQUEST[ 'query' ][ 'vmfo_folder' ] ) ) {
			$folder_value = sanitize_text_field( wp_unslash( $_REQUEST[ 'query' ][ 'vmfo_folder' ] ) );
		}

		if ( ! empty( $query_args[ 'vmfo_folder_exclude' ] ) ) {
			$folder_exclude = $query_args[ 'vmfo_folder_exclude' ];
			unset( $query_args[ 'vmfo_folder_exclude' ] );
		} elseif ( ! empty( $_REQUEST[ 'query' ][ 'vmfo_folder_exclude' ] ) ) {
			$folder_exclude = sanitize_text_field( wp_unslash( $_REQUEST[ 'query' ][ 'vmfo_folder_exclude' ] ) );
		}

		// Handle specific folder filtering
		if ( $folder_value !== null && is_numeric( $folder_value ) ) {
			$folder_id = absint( $folder_value );
			if ( $folder_id > 0 ) {
				if ( ! isset( $query_args[ 'tax_query' ] ) || ! is_array( $query_args[ 'tax_query' ] ) ) {
					$query_args[ 'tax_query' ] = [];
				}

				/**
				 * Filter whether to include child folders when filtering by a folder.
				 *
				 * By default, only items directly assigned to the selected folder are shown.
				 * Return true to also include items from child folders.
				 *
				 * @since 1.0.0
				 *
				 * @param bool $include_children Whether to include child folders. Default false.
				 * @param int  $folder_id        The folder term ID being filtered.
				 */
				$include_children = apply_filters( 'vmfo_include_child_folders', false, $folder_id );

				$query_args[ 'tax_query' ][] = [
					'taxonomy'         => Taxonomy::TAXONOMY,
					'field'            => 'term_id',
					'terms'            => [ $folder_id ],
					'include_children' => $include_children,
				];
			}
		}

		// Handle uncategorized (exclude all folders)
		if ( $folder_exclude === 'all' ) {
			$all_folders = get_terms(
				[
					'taxonomy'   => Taxonomy::TAXONOMY,
					'hide_empty' => false,
					'fields'     => 'ids',
				]
			);

			if ( ! is_wp_error( $all_folders ) && ! empty( $all_folders ) ) {
				if ( ! isset( $query_args[ 'tax_query' ] ) || ! is_array( $query_args[ 'tax_query' ] ) ) {
					$query_args[ 'tax_query' ] = [];
				}
				$query_args[ 'tax_query' ][] = [
					'taxonomy' => Taxonomy::TAXONOMY,
					'field'    => 'term_id',
					'terms'    => $all_folders,
					'operator' => 'NOT IN',
				];
			}
		}

		// phpcs:enable

		return $query_args;
	}
}
