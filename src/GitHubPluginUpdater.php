<?php
/**
 * Generic WordPress Plugin GitHub Updater
 *
 * A reusable class for handling WordPress plugin updates from GitHub repositories
 * using the plugin-update-checker library.
 *
 * @package VirtualMediaFolders
 * @version 1.0.0
 * @author Per Soderlind
 * @license GPL-2.0+
 */

declare(strict_types=1);

namespace VirtualMediaFolders;

use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

/**
 * GitHub Plugin Updater.
 */
class GitHubPluginUpdater {

	/**
	 * GitHub repository URL.
	 *
	 * @var string
	 */
	private $github_url;

	/**
	 * Branch to check for updates.
	 *
	 * @var string
	 */
	private $branch;

	/**
	 * Regex pattern to match the plugin zip file name.
	 *
	 * @var string
	 */
	private $name_regex;

	/**
	 * The plugin slug.
	 *
	 * @var string
	 */
	private $plugin_slug;

	/**
	 * The main plugin file path.
	 *
	 * @var string
	 */
	private $plugin_file;

	/**
	 * Whether to enable release assets.
	 *
	 * @var bool
	 */
	private $enable_release_assets;

	/**
	 * Constructor.
	 *
	 * @param array $config Configuration array with the following keys:
	 *                     - github_url: GitHub repository URL (required)
	 *                     - plugin_file: Main plugin file path (required)
	 *                     - plugin_slug: Plugin slug for updates (required)
	 *                     - branch: Branch to check for updates (default: 'main')
	 *                     - name_regex: Regex pattern for zip file name (optional)
	 *                     - enable_release_assets: Whether to enable release assets (default: true if name_regex provided)
	 */
	public function __construct( $config = array() ) {
		// Validate required parameters.
		$required = array( 'github_url', 'plugin_file', 'plugin_slug' );
		foreach ( $required as $key ) {
			if ( empty( $config[ $key ] ) ) {
				throw new \InvalidArgumentException(
					// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception messages are not output directly.
					sprintf( 'Required parameter %s is missing or empty.', $key )
				);
			}
		}

		$this->github_url            = $config[ 'github_url' ];
		$this->plugin_file           = $config[ 'plugin_file' ];
		$this->plugin_slug           = $config[ 'plugin_slug' ];
		$this->branch                = isset( $config[ 'branch' ] ) ? $config[ 'branch' ] : 'main';
		$this->name_regex            = isset( $config[ 'name_regex' ] ) ? $config[ 'name_regex' ] : '';
		$this->enable_release_assets = isset( $config[ 'enable_release_assets' ] )
			? $config[ 'enable_release_assets' ]
			: ! empty( $this->name_regex );

		// Initialize the updater
		add_action( 'init', array( $this, 'setup_updater' ) );
	}

	/**
	 * Set up the update checker using GitHub integration.
	 *
	 * @return void
	 */
	public function setup_updater(): void {
		// Always register admin notice hook to check transient state.
		add_action( 'admin_notices', array( $this, 'show_update_error_notice' ) );

		try {
			$update_checker = PucFactory::buildUpdateChecker(
				$this->github_url,
				$this->plugin_file,
				$this->plugin_slug
			);

			$update_checker->setBranch( $this->branch );

			// Enable release assets if configured
			if ( $this->enable_release_assets && ! empty( $this->name_regex ) ) {
				$update_checker->getVcsApi()->enableReleaseAssets( $this->name_regex );
			}

			// Add filter to handle API errors gracefully.
			add_filter(
				'puc_request_info_result-' . $this->plugin_slug,
				array( $this, 'handle_update_check_result' ),
				10,
				2
			);

			// Add filter to prevent 500 errors when plugin info is null.
			add_filter(
				'puc_pre_inject_info-' . $this->plugin_slug,
				array( $this, 'handle_pre_inject_info' ),
				10,
				1
			);

		} catch (\Exception $e) {
			// Silently fail - update checker is non-critical.
			unset( $e );
		}
	}

	/**
	 * Handle pre-inject info filter to prevent 500 errors.
	 *
	 * When the GitHub API returns null (rate limit, network error, etc.),
	 * returning false here prevents the library from trying to call toWpFormat()
	 * on a null object, which would cause a fatal error.
	 *
	 * @param mixed $plugin_info The plugin info object or null.
	 * @return mixed The plugin info or false to prevent injection.
	 */
	public function handle_pre_inject_info( $plugin_info ) {
		if ( null === $plugin_info || false === $plugin_info ) {
			return false;
		}
		return $plugin_info;
	}

	/**
	 * Handle update check result and show admin notice on API errors.
	 *
	 * @param mixed $result        The update check result.
	 * @param array $http_response The HTTP response (if available).
	 * @return mixed The result (unchanged).
	 */
	public function handle_update_check_result( $result, $http_response = null ) {
		$transient_key = 'vmf_updater_error_notice';

		// Check if result indicates an error (null or WP_Error).
		if ( is_wp_error( $result ) || null === $result ) {
			// Store transient to track error state (1 hour).
			if ( false === get_transient( $transient_key ) ) {
				set_transient( $transient_key, true, HOUR_IN_SECONDS );
			}
		} else {
			// Clear error transient on success - connection restored.
			delete_transient( $transient_key );
		}

		return $result;
	}

	/**
	 * Display admin notice when update check fails.
	 *
	 * @return void
	 */
	public function show_update_error_notice(): void {
		// Only show if error transient exists.
		if ( false === get_transient( 'vmf_updater_error_notice' ) ) {
			return;
		}

		// Only show on plugins page.
		$screen = get_current_screen();
		if ( ! $screen || 'plugins' !== $screen->id ) {
			return;
		}

		printf(
			'<div class="notice notice-warning is-dismissible"><p><strong>%s</strong> %s</p></div>',
			esc_html__( 'Virtual Media Folders:', 'virtual-media-folders' ),
			esc_html__( 'Could not check for updates. GitHub API may be temporarily unavailable. Please try again later.', 'virtual-media-folders' )
		);
	}

	/**
	 * Create updater instance with minimal configuration.
	 *
	 * @param string $github_url  GitHub repository URL.
	 * @param string $plugin_file Main plugin file path.
	 * @param string $plugin_slug Plugin slug.
	 * @param string $branch      Branch name (default: 'main').
	 *
	 * @return GitHubPluginUpdater
	 */
	public static function create( $github_url, $plugin_file, $plugin_slug, $branch = 'main' ): self {
		return new self( array(
			'github_url'  => $github_url,
			'plugin_file' => $plugin_file,
			'plugin_slug' => $plugin_slug,
			'branch'      => $branch,
		) );
	}

	/**
	 * Create updater instance for plugins with release assets.
	 *
	 * @param string $github_url  GitHub repository URL.
	 * @param string $plugin_file Main plugin file path.
	 * @param string $plugin_slug Plugin slug.
	 * @param string $name_regex  Regex pattern for release assets.
	 * @param string $branch      Branch name (default: 'main').
	 *
	 * @return GitHubPluginUpdater
	 */
	public static function create_with_assets( $github_url, $plugin_file, $plugin_slug, $name_regex, $branch = 'main' ): self {
		return new self( array(
			'github_url'  => $github_url,
			'plugin_file' => $plugin_file,
			'plugin_slug' => $plugin_slug,
			'branch'      => $branch,
			'name_regex'  => $name_regex,
		) );
	}
}
