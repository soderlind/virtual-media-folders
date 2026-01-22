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
		add_action( 'wp_ajax_vmfo_move_to_folder', [ static::class, 'ajax_move_to_folder' ] );
		add_action( 'wp_ajax_vmfo_bulk_move_to_folder', [ static::class, 'ajax_bulk_move_to_folder' ] );
		add_action( 'add_attachment', [ static::class, 'assign_default_folder' ] );
		add_action( 'admin_head-upload.php', [ static::class, 'add_help_tab' ] );
		add_action( 'admin_enqueue_scripts', [ static::class, 'add_critical_css' ] );
		add_action( 'admin_footer-upload.php', [ static::class, 'render_folder_button_script' ] );
	}

	/**
	 * Add critical inline CSS to prevent layout shift.
	 *
	 * Uses wp_add_inline_style to add minimal CSS rules to reserve space
	 * for the folder sidebar before the main stylesheet loads.
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 * @return void
	 */
	public static function add_critical_css( string $hook_suffix ): void {
		// Only load on media library pages.
		if ( $hook_suffix !== 'upload.php' ) {
			return;
		}

		$critical_css = '
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
			}
			.vmf-folder-tree-sidebar.is-visible.vmf-positioned {
				visibility: visible;
			}
			.attachments-browser.vmf-sidebar-visible .attachments {
				margin-left: 220px !important;
			}
		';

		wp_add_inline_style( 'vmfo-admin', $critical_css );
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
			'id'      => 'vmfo-folders-help',
			'title'   => __( 'Virtual Folders', 'virtual-media-folders' ),
			'content' => self::get_help_content(),
		] );

		// Append to existing help sidebar.
		$sidebar  = $screen->get_help_sidebar();
		$sidebar .= '<p><a href="https://github.com/soderlind/virtual-media-folders" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Virtual Media Folders on GitHub', 'virtual-media-folders' ) . '</a></p>';
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
		if ( ! check_ajax_referer( 'vmfo_move_media', 'nonce', false ) ) {
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

		/**
		 * Fires after a media item has been assigned to a folder.
		 *
		 * @since 1.5.0
		 *
		 * @param int   $media_id  The attachment ID.
		 * @param int   $folder_id The folder term ID.
		 * @param array $result    The result from wp_set_object_terms.
		 */
		do_action( 'vmfo_folder_assigned', $media_id, $folder_id, $result );

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
	 * Handle bulk AJAX request to move multiple media items to a folder.
	 *
	 * Moves all specified media IDs to the target folder in a single request.
	 *
	 * @return void Sends JSON response and exits.
	 */
	public static function ajax_bulk_move_to_folder(): void {
		// Verify nonce for security.
		if ( ! check_ajax_referer( 'vmfo_move_media', 'nonce', false ) ) {
			wp_send_json_error( [ 'message' => __( 'Invalid security token.', 'virtual-media-folders' ) ], 403 );
		}

		// Verify user has permission to upload/manage media.
		if ( ! current_user_can( 'upload_files' ) ) {
			wp_send_json_error( [ 'message' => __( 'Permission denied.', 'virtual-media-folders' ) ], 403 );
		}

		// Sanitize and validate input.
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$media_ids_raw = isset( $_POST[ 'media_ids' ] ) ? wp_unslash( $_POST[ 'media_ids' ] ) : '';
		$folder_id     = isset( $_POST[ 'folder_id' ] ) ? sanitize_text_field( wp_unslash( $_POST[ 'folder_id' ] ) ) : '';

		// Parse media IDs (can be JSON array or comma-separated).
		if ( is_string( $media_ids_raw ) ) {
			$decoded = json_decode( $media_ids_raw, true );
			if ( is_array( $decoded ) ) {
				$media_ids = array_map( 'absint', $decoded );
			} else {
				$media_ids = array_map( 'absint', explode( ',', $media_ids_raw ) );
			}
		} elseif ( is_array( $media_ids_raw ) ) {
			$media_ids = array_map( 'absint', $media_ids_raw );
		} else {
			$media_ids = [];
		}

		// Filter out invalid IDs.
		$media_ids = array_filter( $media_ids );

		if ( empty( $media_ids ) ) {
			wp_send_json_error( [ 'message' => __( 'No valid media IDs provided.', 'virtual-media-folders' ) ], 400 );
		}

		// Determine target term IDs.
		$term_ids    = [];
		$folder_name = __( 'Uncategorized', 'virtual-media-folders' );

		if ( $folder_id !== 'uncategorized' && $folder_id !== '' && $folder_id !== 'root' ) {
			$folder_id_int = absint( $folder_id );
			$term          = get_term( $folder_id_int, Taxonomy::TAXONOMY );
			if ( ! $term || is_wp_error( $term ) ) {
				wp_send_json_error( [ 'message' => __( 'Folder not found.', 'virtual-media-folders' ) ], 404 );
			}
			$term_ids    = [ $folder_id_int ];
			$folder_name = $term->name;
		}

		// Move all media items.
		$success_count = 0;
		$failed_ids    = [];

		foreach ( $media_ids as $media_id ) {
			$attachment = get_post( $media_id );
			if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
				$failed_ids[] = $media_id;
				continue;
			}

			$result = wp_set_object_terms( $media_id, $term_ids, Taxonomy::TAXONOMY );
			if ( is_wp_error( $result ) ) {
				$failed_ids[] = $media_id;
			} else {
				++$success_count;
			}
		}

		if ( $success_count === 0 ) {
			wp_send_json_error( [ 'message' => __( 'Failed to move any items.', 'virtual-media-folders' ) ], 500 );
		}

		$message = sprintf(
			/* translators: 1: number of items, 2: folder name */
			_n(
				'%1$d item moved to "%2$s".',
				'%1$d items moved to "%2$s".',
				$success_count,
				'virtual-media-folders'
			),
			$success_count,
			$folder_name
		);

		wp_send_json_success( [
			'message'       => $message,
			'success_count' => $success_count,
			'failed_ids'    => $failed_ids,
			'folder_id'     => empty( $term_ids ) ? null : $term_ids[ 0 ],
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

		$asset_file = VMFO_PATH . 'build/admin.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		// Enqueue the main admin JavaScript bundle.
		wp_enqueue_script(
			'vmfo-admin',
			VMFO_URL . 'build/admin.js',
			$asset[ 'dependencies' ] ?? [ 'wp-element', 'wp-api-fetch', 'wp-i18n', 'wp-icons' ],
			$asset[ 'version' ] ?? VMFO_VERSION,
			true
		);

		// Enqueue admin styles.
		wp_enqueue_style(
			'vmfo-admin',
			VMFO_URL . 'build/admin.css',
			[ 'wp-components' ],
			$asset[ 'version' ] ?? VMFO_VERSION
		);

		// Determine the folder view URL based on showAllMedia setting.
		$show_all_media  = (bool) Settings::get( 'show_all_media' );
		$folder_view_url = $show_all_media
			? admin_url( 'upload.php?mode=folder' )
			: admin_url( 'upload.php?mode=folder&vmfo_folder=uncategorized' );

		// Provide AJAX configuration and preloaded folders to JavaScript.
		wp_add_inline_script(
			'vmfo-admin',
			'var vmfData = ' . wp_json_encode( [
				'ajaxUrl'               => admin_url( 'admin-ajax.php' ),
				'nonce'                 => wp_create_nonce( 'vmfo_move_media' ),
				'jumpToFolderAfterMove' => (bool) Settings::get( 'jump_to_folder_after_move', false ),
				'showAllMedia'          => $show_all_media,
				'showUncategorized'     => (bool) Settings::get( 'show_uncategorized', true ),
				'folderViewUrl'         => $folder_view_url,
				'folders'               => self::get_preloaded_folders(),
			] ) . ';',
			'before'
		);

		// Enable translations for JavaScript strings.
		wp_set_script_translations( 'vmfo-admin', 'virtual-media-folders', VMFO_PATH . 'languages' );
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
			$order     = get_term_meta( $term->term_id, 'vmfo_order', true );
			$folders[] = [
				'id'         => $term->term_id,
				'name'       => $term->name,
				'slug'       => $term->slug,
				'parent'     => $term->parent,
				'count'      => $term->count,
				'vmfo_order' => $order !== '' ? (int) $order : null,
			];
		}

		// Sort: folders with vmfo_order first (by order), then by name.
		usort( $folders, function ( $a, $b ) {
			$order_a = $a[ 'vmfo_order' ];
			$order_b = $b[ 'vmfo_order' ];

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

	/**
	 * Render inline script to add the folder button with correct PHP-generated URL.
	 *
	 * This ensures the folder button has the correct href based on server-side settings,
	 * avoiding any JavaScript timing issues with vmfData availability.
	 *
	 * @return void
	 */
	public static function render_folder_button_script(): void {
		$show_all_media = (bool) Settings::get( 'show_all_media' );
		$folder_url     = $show_all_media
			? admin_url( 'upload.php?mode=folder' )
			: admin_url( 'upload.php?mode=folder&vmfo_folder=uncategorized' );

		// Use esc_url_raw() for JavaScript context to avoid &amp; encoding
		$folder_url_escaped = esc_url_raw( $folder_url );
		$title              = esc_attr__( 'Show Folders', 'virtual-media-folders' );
		$screen_reader_text = esc_html__( 'Show Folders', 'virtual-media-folders' );

		?>
		<script>
			(function () {
				function addFolderButton() {
					// Don't add if already exists
					if (document.querySelector('.vmf-folder-toggle-button')) {
						return;
					}

					var viewSwitch = document.querySelector('.view-switch');
					if (!viewSwitch) {
						return;
					}

					// Check if folder view should be active
					var urlParams = new URLSearchParams(window.location.search);
					var isActive = urlParams.has('vmfo_folder') || urlParams.get('mode') === 'folder';
					if (!isActive) {
						var savedPref = localStorage.getItem('vmfo_folder_view');
						isActive = savedPref === '1';
					}

					var button = document.createElement('a');
					button.href = <?php echo wp_json_encode( $folder_url_escaped ); ?>;
					button.className = 'vmf-folder-toggle-button' + (isActive ? ' is-active' : '');
					button.title = <?php echo wp_json_encode( $title ); ?>;
					button.innerHTML = '<span class="screen-reader-text">' + <?php echo wp_json_encode( $screen_reader_text ); ?> + '</span>' +
						'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7.5l-2-2H4z"/></svg>';

					button.addEventListener('click', function () {
						localStorage.setItem('vmfo_folder_view', '1');
						// Let the link navigate naturally
					});

					viewSwitch.parentNode.insertBefore(button, viewSwitch);
				}

				// Try immediately
				addFolderButton();

				// Try on DOM ready
				if (document.readyState === 'loading') {
					document.addEventListener('DOMContentLoaded', addFolderButton);
				}

				// Watch for dynamically added view-switch element
				var observer = new MutationObserver(function (mutations) {
					if (!document.querySelector('.vmf-folder-toggle-button') && document.querySelector('.view-switch')) {
						addFolderButton();
						observer.disconnect();
					}
				});
				observer.observe(document.body, { childList: true, subtree: true });

				// Disconnect after 10 seconds to avoid memory leaks
				setTimeout(function () { observer.disconnect(); }, 10000);
			})();
		</script>
		<?php
	}
}
