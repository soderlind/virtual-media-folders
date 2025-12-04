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
			$term = get_term( $default_folder, 'media_folder' );
			if ( $term && ! is_wp_error( $term ) ) {
				wp_set_object_terms( $attachment_id, [ $default_folder ], 'media_folder' );
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
			wp_set_object_terms( $media_id, [], 'media_folder' );
			wp_send_json_success( [
				'message'   => __( 'Media removed from all folders.', 'virtual-media-folders' ),
				'media_id'  => $media_id,
				'folder_id' => null,
			] );
		}

		// Verify the target folder exists.
		$folder_id = absint( $folder_id );
		$term      = get_term( $folder_id, 'media_folder' );
		if ( ! $term || is_wp_error( $term ) ) {
			wp_send_json_error( [ 'message' => __( 'Folder not found.', 'virtual-media-folders' ) ], 404 );
		}

		// Assign media to folder (replaces existing assignments).
		$result = wp_set_object_terms( $media_id, [ $folder_id ], 'media_folder' );

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

		// Provide AJAX configuration to JavaScript.
		wp_localize_script( 'vmf-admin', 'vmfData', [
			'ajaxUrl'               => admin_url( 'admin-ajax.php' ),
			'nonce'                 => wp_create_nonce( 'vmf_move_media' ),
			'jumpToFolderAfterMove' => Settings::get( 'jump_to_folder_after_move', false ),
			'showAllMedia'          => Settings::get( 'show_all_media', true ),
			'showUncategorized'     => Settings::get( 'show_uncategorized', true ),
		] );

		// Enable translations for JavaScript strings.
		wp_set_script_translations( 'vmf-admin', 'virtual-media-folders', VMF_PATH . 'languages' );
	}
}
