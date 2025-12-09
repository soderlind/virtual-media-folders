<?php
/**
 * Admin Integration.
 *
 * Handles admin-side functionality including script/style enqueuing
 * and AJAX handlers for media folder operations.
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
 * Admin handler for Virtual Media Folders.
 *
 * Responsible for:
 * - Enqueueing admin scripts and styles on media library pages
 * - Handling AJAX requests for moving media between folders
 * - Auto-assigning new uploads to default folder
 * - Providing localized data for JavaScript components
 */
class Admin {

	/**
	 * Initialize admin hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'admin_enqueue_scripts', [ static::class, 'enqueue_scripts' ] );
		add_action( 'wp_ajax_vmf_move_to_folder', [ static::class, 'ajax_move_to_folder' ] );
		add_action( 'add_attachment', [ static::class, 'assign_default_folder' ] );
		add_action( 'admin_head-upload.php', [ static::class, 'add_help_tab' ] );
		add_action( 'admin_head-upload.php', [ static::class, 'add_critical_css' ] );
	}

	/**
	 * Add critical inline CSS to prevent layout shift.
	 *
	 * Outputs minimal CSS rules immediately in the head to reserve space
	 * for the folder sidebar before the main stylesheet loads.
	 *
	 * @return void
	 */
	public static function add_critical_css(): void {
		// Check if folder view preference is enabled (cookie/localStorage check happens client-side,
		// but we output the CSS anyway - it only applies when classes are present)
		?>
		<style id="vmf-critical-css">
			/* Critical CSS to prevent layout shift - loaded inline before main styles */
			.vmf-folder-tree-sidebar {
				position: absolute;
				top: 0;
				left: 0;
				width: 220px;
				display: none;
				z-index: 75;
			}

			.vmf-folder-tree-sidebar.is-visible {
				display: block;
				visibility: hidden;
				/* Hide until JS positions it */
			}

			.vmf-folder-tree-sidebar.is-visible.vmf-positioned {
				visibility: visible;
			}

			.attachments-browser.vmf-sidebar-visible .attachments {
				margin-left: 220px !important;
			}
		</style>
		<?php
	}

	/**
	 * Add contextual help tab to the Media Library page.
	 *
	 * @return void
	 */
	public static function add_help_tab(): void {
		$screen = get_current_screen();

		if ( ! $screen ) {
			return;
		}

		$screen->add_help_tab( [
			'id'      => 'vmf-folders-help',
			'title'   => __( 'Virtual Folders', 'virtual-media-folders' ),
			'content' => self::get_help_content(),
		] );

		// Append to existing help sidebar.
		$sidebar  = $screen->get_help_sidebar();
		$sidebar .= '<p><a href="https://github.com/soderlind/virtual-media-folders" target="_blank">' . esc_html__( 'Virtual Media Folders on GitHub', 'virtual-media-folders' ) . '</a></p>';
		$screen->set_help_sidebar( $sidebar );
	}

	/**
	 * Get the help tab content.
	 *
	 * @return string HTML content for the help tab.
	 */
	private static function get_help_content(): string {
		$content  = '<h3>' . esc_html__( 'Virtual Media Folders', 'virtual-media-folders' ) . '</h3>';
		$content .= '<p>' . esc_html__( 'Organize your media files into virtual folders without moving files on disk.', 'virtual-media-folders' ) . '</p>';

		$content .= '<h4>' . esc_html__( 'Getting Started', 'virtual-media-folders' ) . '</h4>';
		$content .= '<ul>';
		$content .= '<li>' . esc_html__( 'Click the folder icon next to the view switcher to show the folder sidebar.', 'virtual-media-folders' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Use the + button in the sidebar to create new folders.', 'virtual-media-folders' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Click a folder to filter the media library by that folder.', 'virtual-media-folders' ) . '</li>';
		$content .= '</ul>';

		$content .= '<h4>' . esc_html__( 'Moving Media', 'virtual-media-folders' ) . '</h4>';
		$content .= '<ul>';
		$content .= '<li>' . esc_html__( 'Drag and drop media items onto folders in the sidebar.', 'virtual-media-folders' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Select multiple items and use Bulk Actions to move them together.', 'virtual-media-folders' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Drop media on "Uncategorized" to remove folder assignments.', 'virtual-media-folders' ) . '</li>';
		$content .= '</ul>';

		$content .= '<h4>' . esc_html__( 'Keyboard Navigation', 'virtual-media-folders' ) . '</h4>';
		$content .= '<ul>';
		$content .= '<li>' . esc_html__( 'Use arrow keys to navigate between folders.', 'virtual-media-folders' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Press Enter or Space to select a folder.', 'virtual-media-folders' ) . '</li>';
		$content .= '</ul>';

		return $content;
	}

	/**
	 * Assign new uploads to the default folder if configured.
	 *
	 * @param int $attachment_id The newly uploaded attachment ID.
	 * @return void
	 */
	public static function assign_default_folder( int $attachment_id ): void {
		$default_folder = Settings::get( 'default_folder', 0 );

		if ( $default_folder > 0 ) {
			// Verify the folder exists
			$term = get_term( $default_folder, Taxonomy::TAXONOMY );
			if ( $term && ! is_wp_error( $term ) ) {
				wp_set_object_terms( $attachment_id, [ $default_folder ], Taxonomy::TAXONOMY );
			}
		}
	}

	/**
	 * AJAX handler for moving media to a folder.
	 *
	 * Handles the drag-and-drop folder assignment in the Media Library.
	 * Accepts a media ID and folder ID, validates permissions, and
	 * updates the media's folder taxonomy term.
	 *
	 * Special folder values:
	 * - 'uncategorized' or '' or 'root': Removes all folder assignments
	 * - numeric ID: Assigns to the specified folder
	 *
	 * @return void Sends JSON response and exits.
	 */
	public static function ajax_move_to_folder(): void {
		// Verify nonce for security.
		if ( ! check_ajax_referer( 'vmf_move_media', 'nonce', false ) ) {
			wp_send_json_error( [ 'message' => __( 'Invalid security token.', 'virtual-media-folders' ) ], 403 );
		}

		// Verify user has permission to upload/manage media.
		if ( ! current_user_can( 'upload_files' ) ) {
			wp_send_json_error( [ 'message' => __( 'Permission denied.', 'virtual-media-folders' ) ], 403 );
		}

		// Sanitize and validate input.
		$media_id  = isset( $_POST[ 'media_id' ] ) ? absint( $_POST[ 'media_id' ] ) : 0;
		$folder_id = isset( $_POST[ 'folder_id' ] ) ? sanitize_text_field( wp_unslash( $_POST[ 'folder_id' ] ) ) : '';

		if ( ! $media_id ) {
			wp_send_json_error( [ 'message' => __( 'Invalid media ID.', 'virtual-media-folders' ) ], 400 );
		}

		// Verify the attachment exists and is valid.
		$attachment = get_post( $media_id );
		if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
			wp_send_json_error( [ 'message' => __( 'Attachment not found.', 'virtual-media-folders' ) ], 404 );
		}

		// Handle special cases: remove from all folders.
		if ( $folder_id === 'uncategorized' || $folder_id === '' || $folder_id === 'root' ) {
			wp_set_object_terms( $media_id, [], Taxonomy::TAXONOMY );
			wp_send_json_success( [
				'message'   => __( 'Media removed from all folders.', 'virtual-media-folders' ),
				'media_id'  => $media_id,
				'folder_id' => null,
			] );
		}

		// Verify the target folder exists.
		$folder_id = absint( $folder_id );
		$term      = get_term( $folder_id, Taxonomy::TAXONOMY );
		if ( ! $term || is_wp_error( $term ) ) {
			wp_send_json_error( [ 'message' => __( 'Folder not found.', 'virtual-media-folders' ) ], 404 );
		}

		// Assign media to folder (replaces existing assignments).
		$result = wp_set_object_terms( $media_id, [ $folder_id ], Taxonomy::TAXONOMY );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( [ 'message' => $result->get_error_message() ], 500 );
		}

		wp_send_json_success( [
			'message'   => sprintf(
				/* translators: %s: folder name */
				__( 'Media moved to "%s".', 'virtual-media-folders' ),
				$term->name
			),
			'media_id'  => $media_id,
			'folder_id' => $folder_id,
		] );
	}

	/**
	 * Enqueue admin scripts and styles for the Media Library.
	 *
	 * Only loads assets on media library pages (upload.php, media-new.php).
	 * Includes the React-based folder tree component and required styles.
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 * @return void
	 */
	public static function enqueue_scripts( string $hook_suffix ): void {
		// Only load on media library pages.
		if ( ! in_array( $hook_suffix, [ 'upload.php', 'media-new.php' ], true ) ) {
			return;
		}

		$asset_file = VMF_PATH . 'build/admin.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		// Enqueue the main admin JavaScript bundle.
		wp_enqueue_script(
			'vmf-admin',
			VMF_URL . 'build/admin.js',
			$asset[ 'dependencies' ] ?? [ 'wp-element', 'wp-api-fetch', 'wp-i18n', 'wp-icons' ],
			$asset[ 'version' ] ?? VMF_VERSION,
			true
		);

		// Enqueue admin styles.
		wp_enqueue_style(
			'vmf-admin',
			VMF_URL . 'build/admin.css',
			[ 'wp-components' ],
			$asset[ 'version' ] ?? VMF_VERSION
		);

		// Provide AJAX configuration and preloaded folders to JavaScript.
		wp_add_inline_script(
			'vmf-admin',
			'var vmfData = ' . wp_json_encode( [
				'ajaxUrl'               => admin_url( 'admin-ajax.php' ),
				'nonce'                 => wp_create_nonce( 'vmf_move_media' ),
				'jumpToFolderAfterMove' => (bool) Settings::get( 'jump_to_folder_after_move', false ),
				'showAllMedia'          => (bool) Settings::get( 'show_all_media', true ),
				'showUncategorized'     => (bool) Settings::get( 'show_uncategorized', true ),
				'folders'               => self::get_preloaded_folders(),
			] ) . ';',
			'before'
		);

		// Enable translations for JavaScript strings.
		wp_set_script_translations( 'vmf-admin', 'virtual-media-folders', VMF_PATH . 'languages' );
	}

	/**
	 * Get preloaded folders for instant display.
	 *
	 * Returns folder data in the same format as the REST API response
	 * for optimistic loading before background refresh.
	 *
	 * @return array<int, array<string, mixed>> Array of folder data.
	 */
	private static function get_preloaded_folders(): array {
		$terms = get_terms(
			[
				'taxonomy'   => Taxonomy::TAXONOMY,
				'hide_empty' => false,
			]
		);

		if ( is_wp_error( $terms ) || ! is_array( $terms ) ) {
			return [];
		}

		// Pre-fetch all term meta to avoid N+1 queries.
		$term_ids = wp_list_pluck( $terms, 'term_id' );
		\update_meta_cache( 'term', $term_ids );

		// Build folder list with order meta.
		$folders = [];
		foreach ( $terms as $term ) {
			$order     = get_term_meta( $term->term_id, 'vmf_order', true );
			$folders[] = [
				'id'        => $term->term_id,
				'name'      => $term->name,
				'slug'      => $term->slug,
				'parent'    => $term->parent,
				'count'     => $term->count,
				'vmf_order' => $order !== '' ? (int) $order : null,
			];
		}

		// Sort: folders with vmf_order first (by order), then by name.
		usort( $folders, function ( $a, $b ) {
			$order_a = $a[ 'vmf_order' ];
			$order_b = $b[ 'vmf_order' ];

			if ( $order_a !== null && $order_b !== null ) {
				return $order_a - $order_b;
			}
			if ( $order_a !== null ) {
				return -1;
			}
			if ( $order_b !== null ) {
				return 1;
			}
			return strcasecmp( $a[ 'name' ], $b[ 'name' ] );
		} );

		return $folders;
	}
}
