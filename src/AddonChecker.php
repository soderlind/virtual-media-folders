<?php
/**
 * Add-on version checker for Virtual Media Folders.
 *
 * Displays admin notices when installed add-ons have outdated versions.
 *
 * @package VirtualMediaFolders
 * @since   1.8.0
 */

namespace VirtualMediaFolders;

/**
 * Checks add-on versions and displays update notices.
 */
class AddonChecker {

	/**
	 * Minimum required versions for add-ons.
	 *
	 * @var array<string, array{name: string, min_version: string}>
	 */
	private const ADDONS = [
		'vmfa-ai-organizer/vmfa-ai-organizer.php'             => [
			'name'        => 'AI Organizer',
			'min_version' => '1.2.0',
		],
		'vmfa-rules-engine/vmfa-rules-engine.php'             => [
			'name'        => 'Rules Engine',
			'min_version' => '1.4.0',
		],
		'vmfa-editorial-workflow/vmfa-editorial-workflow.php' => [
			'name'        => 'Editorial Workflow',
			'min_version' => '1.6.0',
		],
		'vmfa-media-cleanup/vmfa-media-cleanup.php'           => [
			'name'        => 'Media Cleanup',
			'min_version' => '1.1.0',
		],
	];

	/**
	 * Initialize the add-on checker.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'admin_notices', [ self::class, 'check_addon_versions' ] );
	}

	/**
	 * Check add-on versions and display notices for outdated ones.
	 *
	 * Only runs on Media Library pages (upload.php, media-new.php).
	 *
	 * @return void
	 */
	public static function check_addon_versions(): void {
		global $pagenow;

		// Only show on Media Library pages.
		if ( ! in_array( $pagenow, [ 'upload.php', 'media-new.php' ], true ) ) {
			return;
		}

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		foreach ( self::ADDONS as $plugin_file => $addon ) {
			if ( ! is_plugin_active( $plugin_file ) ) {
				continue;
			}

			$plugin_path = WP_PLUGIN_DIR . '/' . $plugin_file;
			if ( ! file_exists( $plugin_path ) ) {
				continue;
			}

			$plugin_data     = get_plugin_data( $plugin_path );
			$current_version = $plugin_data[ 'Version' ] ?? '0.0.0';

			if ( version_compare( $current_version, $addon[ 'min_version' ], '<' ) ) {
				self::render_notice( $addon[ 'name' ], $current_version, $addon[ 'min_version' ] );
			}
		}
	}

	/**
	 * Render the update notice for an outdated add-on.
	 *
	 * @param string $name            The add-on display name.
	 * @param string $current_version The currently installed version.
	 * @param string $min_version     The minimum required version.
	 * @return void
	 */
	private static function render_notice( string $name, string $current_version, string $min_version ): void {
		printf(
			'<div class="notice notice-info is-dismissible"><p>%s</p></div>',
			sprintf(
				/* translators: 1: Add-on name, 2: Current version, 3: Minimum required version 4: Link to GitHub repository */
				esc_html__( 'A new version of Virtual Media Folders - %1$s is available. You have version %2$s. Please update to version %3$s or later. The new version is available via %4$s', 'virtual-media-folders' ),
				esc_html( $name ),
				esc_html( $current_version ),
				esc_html( $min_version ),
				sprintf( '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>', esc_html( 'https://github.com/soderlind' ), esc_html( 'https://github.com/soderlind' ) )
			)
		);
	}
}
