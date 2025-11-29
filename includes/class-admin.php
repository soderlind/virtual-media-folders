<?php

namespace MediaManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Admin {
	public static function init(): void {
		add_action( 'admin_enqueue_scripts', [ static::class, 'enqueue_scripts' ] );
		add_action( 'wp_ajax_mm_move_to_folder', [ static::class, 'ajax_move_to_folder' ] );
	}

	/**
	 * AJAX handler for moving media to a folder.
	 */
	public static function ajax_move_to_folder(): void {
		// Verify nonce
		if ( ! check_ajax_referer( 'mm_move_media', 'nonce', false ) ) {
			wp_send_json_error( [ 'message' => __( 'Invalid security token.', 'mediamanager' ) ], 403 );
		}

		// Check permissions
		if ( ! current_user_can( 'upload_files' ) ) {
			wp_send_json_error( [ 'message' => __( 'Permission denied.', 'mediamanager' ) ], 403 );
		}

		$media_id  = isset( $_POST[ 'media_id' ] ) ? absint( $_POST[ 'media_id' ] ) : 0;
		$folder_id = isset( $_POST[ 'folder_id' ] ) ? sanitize_text_field( wp_unslash( $_POST[ 'folder_id' ] ) ) : '';

		if ( ! $media_id ) {
			wp_send_json_error( [ 'message' => __( 'Invalid media ID.', 'mediamanager' ) ], 400 );
		}

		// Verify the attachment exists
		$attachment = get_post( $media_id );
		if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
			wp_send_json_error( [ 'message' => __( 'Attachment not found.', 'mediamanager' ) ], 404 );
		}

		// Handle special cases
		if ( $folder_id === 'uncategorized' || $folder_id === '' || $folder_id === 'root' ) {
			// Remove all folder assignments
			wp_set_object_terms( $media_id, [], 'media_folder' );
			wp_send_json_success( [
				'message'   => __( 'Media removed from all folders.', 'mediamanager' ),
				'media_id'  => $media_id,
				'folder_id' => null,
			] );
		}

		// Verify folder exists
		$folder_id = absint( $folder_id );
		$term      = get_term( $folder_id, 'media_folder' );
		if ( ! $term || is_wp_error( $term ) ) {
			wp_send_json_error( [ 'message' => __( 'Folder not found.', 'mediamanager' ) ], 404 );
		}

		// Assign to folder (replace existing assignments)
		$result = wp_set_object_terms( $media_id, [ $folder_id ], 'media_folder' );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( [ 'message' => $result->get_error_message() ], 500 );
		}

		wp_send_json_success( [
			'message'   => sprintf(
				/* translators: %s: folder name */
				__( 'Media moved to "%s".', 'mediamanager' ),
				$term->name
			),
			'media_id'  => $media_id,
			'folder_id' => $folder_id,
		] );
	}

	/**
	 * Enqueue admin scripts and styles for the Media Library.
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	public static function enqueue_scripts( string $hook_suffix ): void {
		// Only load on media library pages
		if ( ! in_array( $hook_suffix, [ 'upload.php', 'media-new.php' ], true ) ) {
			return;
		}

		$asset_file = MEDIAMANAGER_PATH . 'build/admin.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		wp_enqueue_script(
			'mediamanager-admin',
			MEDIAMANAGER_URL . 'build/admin.js',
			$asset[ 'dependencies' ] ?? [ 'wp-element', 'wp-api-fetch', 'wp-i18n', 'wp-icons' ],
			$asset[ 'version' ] ?? MEDIAMANAGER_VERSION,
			true
		);

		wp_enqueue_style(
			'mediamanager-admin',
			MEDIAMANAGER_URL . 'build/admin.css',
			[ 'wp-components' ],
			$asset[ 'version' ] ?? MEDIAMANAGER_VERSION
		);

		// Localize script with AJAX URL and nonce
		wp_localize_script( 'mediamanager-admin', 'mediaManagerData', [
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'mm_move_media' ),
		] );

		wp_set_script_translations( 'mediamanager-admin', 'mediamanager', MEDIAMANAGER_PATH . 'languages' );
	}
}
