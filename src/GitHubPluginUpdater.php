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

		} catch (\Exception $e) {
			// Silently fail - update checker is non-critical.
			unset( $e );
		}
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
