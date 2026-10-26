<?php
/**
 * Abstract Settings Tab for VMF add-ons.
 *
 * Handles tab registration via vmfo_settings_tabs, asset enqueuing
 * (JS + CSS + wp7-compat), script localisation, fallback menu, and
 * a default React mount-point render.
 *
 * @package VirtualMediaFolders
 * @since   2.0.0
 */

declare(strict_types=1);

namespace VirtualMediaFolders\Addon;

defined( 'ABSPATH' ) || exit;

/**
 * Base class for add-on settings tabs.
 */
abstract class AbstractSettingsTab {

	// ------------------------------------------------------------------
	//  Abstract — each add-on must provide these.
	// ------------------------------------------------------------------

	/**
	 * Tab slug used in vmfo_settings_tabs (e.g. 'rules-engine').
	 *
	 * @return string
	 */
	abstract protected function get_tab_slug(): string;

	/**
	 * Translated tab label shown in the UI.
	 *
	 * @return string
	 */
	abstract protected function get_tab_label(): string;

	/**
	 * Plugin text domain for translations.
	 *
	 * @return string
	 */
	abstract protected function get_text_domain(): string;

	/**
	 * Absolute path to the plugin's build/ directory (with trailing slash).
	 *
	 * @return string
	 */
	abstract protected function get_build_path(): string;

	/**
	 * URL to the plugin's build/ directory (with trailing slash).
	 *
	 * @return string
	 */
	abstract protected function get_build_url(): string;

	/**
	 * Absolute path to the plugin's languages/ directory.
	 *
	 * @return string
	 */
	abstract protected function get_languages_path(): string;

	/**
	 * Plugin version string used as fallback when the asset file is missing.
	 *
	 * @return string
	 */
	abstract protected function get_plugin_version(): string;

	/**
	 * Data passed to wp_localize_script.
	 *
	 * Must include at least 'restUrl' and 'nonce'. The base class adds
	 * those automatically if the subclass omits them.
	 *
	 * @return array<string, mixed>
	 */
	abstract protected function get_localized_data(): array;

	/**
	 * JS global variable name for wp_localize_script (e.g. 'vmfaRulesEngine').
	 *
	 * @return string
	 */
	abstract protected function get_localized_name(): string;

	// ------------------------------------------------------------------
	//  Optional overrides.
	// ------------------------------------------------------------------

	/**
	 * Asset entry-point basename (without extension). Default: 'index'.
	 *
	 * @return string
	 */
	protected function get_asset_entry(): string {
		return 'index';
	}

	/**
	 * Extra CSS style-sheet dependencies for the main style.
	 *
	 * Default: ['wp-components', 'vmfo-tokens']. Keep 'vmfo-tokens' when
	 * overriding if the add-on CSS uses `--wpds-*` design tokens.
	 *
	 * @return string[]
	 */
	protected function get_style_deps(): array {
		return [ 'wp-components', \VirtualMediaFolders\DesignTokens::HANDLE ];
	}

	/**
	 * Tab registration array. Override to add 'subtabs' or extra keys.
	 *
	 * @return array{title: string, callback: callable, subtabs?: array<string, string>}
	 */
	protected function get_tab_definition(): array {
		return [
			'title'    => $this->get_tab_label(),
			'callback' => [ $this, 'render_tab' ],
		];
	}

	/**
	 * Capability required for the fallback admin menu page.
	 *
	 * @return string
	 */
	protected function get_menu_capability(): string {
		return 'manage_options';
	}

	/**
	 * HTML id attribute for the React mount-point div.
	 *
	 * @return string
	 */
	protected function get_app_container_id(): string {
		return 'vmfa-' . $this->get_tab_slug() . '-app';
	}

	// ------------------------------------------------------------------
	//  Concrete public API — called by the add-on's Plugin class.
	// ------------------------------------------------------------------

	/**
	 * Register the tab entry with the parent plugin.
	 *
	 * Callback for the `vmfo_settings_tabs` filter.
	 *
	 * @param array $tabs Existing tabs.
	 * @return array
	 */
	public function register_tab( array $tabs ): array {
		$tabs[ $this->get_tab_slug() ] = $this->get_tab_definition();
		return $tabs;
	}

	/**
	 * Enqueue assets when this tab is active.
	 *
	 * Callback for the `vmfo_settings_enqueue_scripts` action.
	 *
	 * @param string $active_tab    Currently active tab slug.
	 * @param string $active_subtab Currently active subtab slug.
	 * @return void
	 */
	public function enqueue_tab_scripts( string $active_tab, string $active_subtab ): void {
		if ( $this->get_tab_slug() !== $active_tab ) {
			return;
		}

		$this->do_enqueue_assets();
	}

	/**
	 * Render the tab body (React mount-point by default).
	 *
	 * @param string $active_tab    Currently active tab slug.
	 * @param string $active_subtab Currently active subtab slug.
	 * @return void
	 */
	public function render_tab( string $active_tab, string $active_subtab ): void {
		?>
		<div class="vmfa-tab-content">
			<div id="<?php echo esc_attr( $this->get_app_container_id() ); ?>"></div>
		</div>
		<?php
	}

	// ------------------------------------------------------------------
	//  Fallback standalone admin page.
	// ------------------------------------------------------------------

	/**
	 * Register a standalone admin submenu under Media.
	 *
	 * @return void
	 */
	public function register_admin_menu(): void {
		$slug  = 'vmfa-' . $this->get_tab_slug();
		$title = sprintf(
			/* translators: %s add-on tab label */
			'Virtual Media Folders %s',
			$this->get_tab_label()
		);

		add_submenu_page(
			'upload.php',
			$title,
			$this->get_tab_label(),
			$this->get_menu_capability(),
			$slug,
			[ $this, 'render_admin_page' ]
		);
	}

	/**
	 * Render the standalone admin page.
	 *
	 * @return void
	 */
	public function render_admin_page(): void {
		$title = sprintf(
			/* translators: %s add-on tab label */
			'Virtual Media Folders %s',
			$this->get_tab_label()
		);
		?>
		<div class="wrap">
			<h1><?php echo esc_html( $title ); ?></h1>
			<div id="<?php echo esc_attr( $this->get_app_container_id() ); ?>"></div>
		</div>
		<?php
	}

	/**
	 * Enqueue assets for the standalone admin page.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 * @return void
	 */
	public function enqueue_admin_assets( string $hook_suffix ): void {
		$expected = 'media_page_vmfa-' . $this->get_tab_slug();

		if ( $expected !== $hook_suffix ) {
			return;
		}

		$this->do_enqueue_assets();
	}

	// ------------------------------------------------------------------
	//  Internal asset enqueue logic.
	// ------------------------------------------------------------------

	/**
	 * Enqueue JS, CSS, localisation, and wp7-compat.
	 *
	 * @return void
	 */
	protected function do_enqueue_assets(): void {
		$entry      = $this->get_asset_entry();
		$build_path = $this->get_build_path();
		$build_url  = $this->get_build_url();
		$handle     = 'vmfa-' . $this->get_tab_slug() . '-admin';

		$asset_file = $build_path . $entry . '.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		// --- JavaScript ---
		wp_enqueue_script(
			$handle,
			$build_url . $entry . '.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations(
			$handle,
			$this->get_text_domain(),
			$this->get_languages_path()
		);

		// --- CSS ---
		$css_file = $build_path . $entry . '.css';

		if ( file_exists( $css_file ) ) {
			wp_enqueue_style(
				$handle,
				$build_url . $entry . '.css',
				$this->get_style_deps(),
				$asset['version']
			);
		}

		// --- Localised data ---
		wp_localize_script(
			$handle,
			$this->get_localized_name(),
			$this->get_localized_data()
		);

		// --- WP 7+ design-token overrides ---
		$this->maybe_enqueue_wp7_compat( $handle );
	}

	/**
	 * Conditionally enqueue WP 7 compatibility CSS.
	 *
	 * Loads the plugin-specific build/wp7-compat.css as well as the shared
	 * base from VMF core (if available).
	 *
	 * @param string $parent_handle Style handle the compat sheet depends on.
	 * @return void
	 */
	protected function maybe_enqueue_wp7_compat( string $parent_handle ): void {
		if ( ! function_exists( 'vmfo_is_wp7' ) || ! vmfo_is_wp7() ) {
			return;
		}

		$slug       = $this->get_tab_slug();
		$build_path = $this->get_build_path();
		$build_url  = $this->get_build_url();

		// Shared base from VMF core.
		$base_handle = 'vmf-wp7-compat-base';

		if ( ! wp_style_is( $base_handle, 'registered' ) ) {
			$vmf_css = plugin_dir_path( dirname( __DIR__ ) ) . 'src/css/wp7-compat-base.css';
			$vmf_url = plugin_dir_url( dirname( __DIR__ ) ) . 'src/css/wp7-compat-base.css';

			if ( file_exists( $vmf_css ) ) {
				wp_register_style(
					$base_handle,
					$vmf_url,
					[ 'wp-base-styles', \VirtualMediaFolders\DesignTokens::HANDLE ],
					(string) filemtime( $vmf_css )
				);
			}
		}

		// Plugin-specific overrides.
		$wp7_file = $build_path . 'wp7-compat.css';

		if ( file_exists( $wp7_file ) ) {
			$wp7_asset_file = $build_path . 'wp7-compat.asset.php';
			$wp7_version    = file_exists( $wp7_asset_file )
				? ( include $wp7_asset_file )['version'] ?? $this->get_plugin_version()
				: $this->get_plugin_version();

			$deps = [ $parent_handle ];

			if ( wp_style_is( $base_handle, 'registered' ) ) {
				$deps[] = $base_handle;
			}

			wp_enqueue_style(
				'vmfa-' . $slug . '-wp7',
				$build_url . 'wp7-compat.css',
				$deps,
				$wp7_version
			);
		}
	}
}
