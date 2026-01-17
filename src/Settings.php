<?php
/**
 * Settings Page.
 *
 * Provides a settings page for Virtual Media Folders plugin options.
 *
 * @package VirtualMediaFolders
 * @since 1.0.0
 */

declare(strict_types=1);

namespace VirtualMediaFolders;

/**
 * Settings handler.
 */
final class Settings {

	/**
	 * Whether the plugin supports add-on tabs.
	 * Add-ons can check this constant to determine if they can register tabs.
	 */
	public const SUPPORTS_ADDON_TABS = true;

	/**
	 * Option group name.
	 */
	private const OPTION_GROUP = 'vmfo_settings';

	/**
	 * Option name for storing settings.
	 */
	private const OPTION_NAME = 'vmfo_options';

	/**
	 * Settings page slug.
	 */
	public const PAGE_SLUG = 'vmfo-settings';

	/**
	 * Default settings.
	 *
	 * @var array<string, mixed>
	 */
	private const DEFAULTS = [
		'enable_suggestions'        => true,
		'suggestions_mime_types'    => true,
		'suggestions_exif_date'     => true,
		'suggestions_iptc'          => true,
		'default_folder'            => 0,
		'show_all_media'            => false,
		'show_uncategorized'        => true,
		'jump_to_folder_after_move' => false,
	];

	/**
	 * Initialize the settings page.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'admin_menu', [ self::class, 'add_menu_page' ] );
		add_action( 'admin_init', [ self::class, 'register_settings' ] );
		add_action( 'admin_enqueue_scripts', [ self::class, 'enqueue_settings_scripts' ] );
	}

	/**
	 * Add settings page to admin menu.
	 *
	 * @return void
	 */
	public static function add_menu_page(): void {
		add_submenu_page(
			'upload.php',
			__( 'Virtual Media Folders Settings', 'virtual-media-folders' ),
			__( 'Folder Settings', 'virtual-media-folders' ),
			'manage_options',
			self::PAGE_SLUG,
			[ self::class, 'render_settings_page' ]
		);
	}

	/**
	 * Enqueue settings page scripts.
	 *
	 * @param string $hook_suffix The current admin page.
	 * @return void
	 */
	public static function enqueue_settings_scripts( string $hook_suffix ): void {
		if ( 'media_page_' . self::PAGE_SLUG !== $hook_suffix ) {
			return;
		}

		$active_tab    = self::get_active_tab();
		$active_subtab = self::get_active_subtab();

		/**
		 * Fires when enqueuing scripts for the settings page.
		 * Add-ons should use this to conditionally enqueue their assets.
		 *
		 * @since 1.1.0
		 *
		 * @param string $active_tab    The currently active tab slug.
		 * @param string $active_subtab The currently active subtab slug.
		 */
		do_action( 'vmfo_settings_enqueue_scripts', $active_tab, $active_subtab );

		// Only enqueue parent scripts on the general tab.
		if ( 'general' !== $active_tab ) {
			return;
		}

		$asset_file = VMFO_PATH . 'build/settings.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'vmfo-settings',
			VMFO_URL . 'build/settings.js',
			$asset[ 'dependencies' ],
			$asset[ 'version' ],
			true
		);
	}

	/**
	 * Get the currently active tab.
	 *
	 * @return string The active tab slug, defaults to 'general'.
	 */
	private static function get_active_tab(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return isset( $_GET[ 'tab' ] ) ? sanitize_key( $_GET[ 'tab' ] ) : 'general';
	}

	/**
	 * Get the currently active subtab.
	 *
	 * @return string The active subtab slug, defaults to empty string.
	 */
	private static function get_active_subtab(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return isset( $_GET[ 'subtab' ] ) ? sanitize_key( $_GET[ 'subtab' ] ) : '';
	}

	/**
	 * Register settings and sections.
	 *
	 * @return void
	 */
	public static function register_settings(): void {
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_NAME,
			[
				'type'              => 'array',
				'sanitize_callback' => [ self::class, 'sanitize_settings' ],
				'default'           => self::DEFAULTS,
			]
		);

		// Smart Suggestions section is hidden until the feature is fully implemented.
		// @todo Uncomment when smart suggestions are ready.
		/*
		add_settings_section(
			'vmfo_suggestions',
			__( 'Smart Suggestions', 'virtual-media-folders' ),
			[ self::class, 'render_suggestions_section' ],
			self::PAGE_SLUG
		);

		add_settings_field(
			'enable_suggestions',
			__( 'Enable Suggestions', 'virtual-media-folders' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'vmfo_suggestions',
			[
				'id'          => 'enable_suggestions',
				'description' => __( 'Show folder suggestions when uploading new media.', 'virtual-media-folders' ),
			]
		);

		add_settings_field(
			'suggestions_mime_types',
			__( 'MIME Type Matching', 'virtual-media-folders' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'vmfo_suggestions',
			[
				'id'          => 'suggestions_mime_types',
				'description' => __( 'Suggest folders based on file type (images, videos, documents).', 'virtual-media-folders' ),
			]
		);

		add_settings_field(
			'suggestions_exif_date',
			__( 'EXIF Date Matching', 'virtual-media-folders' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'vmfo_suggestions',
			[
				'id'          => 'suggestions_exif_date',
				'description' => __( 'Suggest folders based on photo creation date from EXIF data.', 'virtual-media-folders' ),
			]
		);

		add_settings_field(
			'suggestions_iptc',
			__( 'IPTC Keywords Matching', 'virtual-media-folders' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'vmfo_suggestions',
			[
				'id'          => 'suggestions_iptc',
				'description' => __( 'Suggest folders based on embedded IPTC keywords.', 'virtual-media-folders' ),
			]
		);
		*/

		// Default behavior section.
		add_settings_section(
			'vmfo_defaults',
			__( 'Default Behavior', 'virtual-media-folders' ),
			[ self::class, 'render_defaults_section' ],
			self::PAGE_SLUG
		);

		add_settings_field(
			'default_folder',
			__( 'Default Folder', 'virtual-media-folders' ),
			[ self::class, 'render_folder_select_field' ],
			self::PAGE_SLUG,
			'vmfo_defaults',
			[
				'id'          => 'default_folder',
				'description' => __( 'Automatically assign new uploads to this folder (0 = none).', 'virtual-media-folders' ),
			]
		);

		add_settings_field(
			'show_all_media',
			__( 'Show All Media', 'virtual-media-folders' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'vmfo_defaults',
			[
				'id'          => 'show_all_media',
				'description' => __( 'Show the "All Media" option in the sidebar.', 'virtual-media-folders' ),
			]
		);

		add_settings_field(
			'show_uncategorized',
			__( 'Show Uncategorized', 'virtual-media-folders' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'vmfo_defaults',
			[
				'id'          => 'show_uncategorized',
				'description' => __( 'Show the "Uncategorized" virtual folder in the sidebar.', 'virtual-media-folders' ),
			]
		);

		add_settings_field(
			'jump_to_folder_after_move',
			__( 'Jump to Folder After Move', 'virtual-media-folders' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'vmfo_defaults',
			[
				'id'          => 'jump_to_folder_after_move',
				'description' => __( 'Automatically switch to the target folder after moving files.', 'virtual-media-folders' ),
			]
		);
	}

	/**
	 * Sanitize settings before saving.
	 *
	 * @param array $input Raw input values.
	 * @return array<string, mixed> Sanitized values.
	 */
	public static function sanitize_settings( $input ): array {
		$sanitized = [];

		// Boolean fields.
		$boolean_fields = [
			'enable_suggestions',
			'suggestions_mime_types',
			'suggestions_exif_date',
			'suggestions_iptc',
			'show_all_media',
			'show_uncategorized',
			'jump_to_folder_after_move',
		];

		foreach ( $boolean_fields as $field ) {
			$sanitized[ $field ] = ! empty( $input[ $field ] );
		}

		// Integer fields.
		$sanitized[ 'default_folder' ] = isset( $input[ 'default_folder' ] ) ? absint( $input[ 'default_folder' ] ) : 0;

		return self::normalize_visibility( $sanitized );
	}

	/**
	 * Get the default settings.
	 *
	 * @return array<string, mixed> Default settings, filtered via 'vmfo_default_settings'.
	 */
	public static function get_defaults(): array {
		/**
		 * Filter the default settings.
		 *
		 * @since 1.0.5
		 *
		 * @param array $defaults Default settings array.
		 */
		return apply_filters( 'vmfo_default_settings', self::DEFAULTS );
	}

	/**
	 * Get a setting value.
	 *
	 * Settings can be overridden via the 'vmfo_setting_{$key}' filter or
	 * the 'vmfo_settings' filter for all settings at once.
	 *
	 * Note: At least one of 'show_all_media' or 'show_uncategorized' must be true.
	 * If both are set to false (via filters), 'show_all_media' will be forced to true.
	 *
	 * @param string $key     Setting key.
	 * @param mixed  $default Default value if not set.
	 * @return mixed Setting value, filtered via 'vmfo_setting_{$key}'.
	 */
	public static function get( string $key, $default = null ) {
		$options  = self::get_options();
		$defaults = self::get_defaults();

		$value = $options[ $key ] ?? ( $default !== null ? $default : ( $defaults[ $key ] ?? null ) );

		/**
		 * Filter a specific setting value.
		 *
		 * @since 1.0.5
		 *
		 * @param mixed  $value   The setting value.
		 * @param string $key     The setting key.
		 * @param array  $options All settings.
		 */
		$value = apply_filters( "vmfo_setting_{$key}", $value, $key, $options );

		return $value;
	}

	/**
	 * Get all settings merged with defaults and filtered, with visibility constraint enforced.
	 *
	 * @return array<string, mixed>
	 */
	private static function get_options(): array {
		$defaults = self::get_defaults();
		$options  = get_option( self::OPTION_NAME, $defaults );

		if ( ! is_array( $options ) ) {
			$options = $defaults;
		} else {
			$options = array_merge( $defaults, $options );
		}

		/**
		 * Filter all settings at once.
		 *
		 * @since 1.0.5
		 *
		 * @param array $options All settings.
		 */
		$options = apply_filters( 'vmfo_settings', $options );

		return self::normalize_visibility( $options );
	}

	/**
	 * Ensure at least one sidebar entry (All or Uncategorized) remains visible.
	 *
	 * @param array<string, mixed> $options Raw options array.
	 * @return array<string, mixed>
	 */
	private static function normalize_visibility( array $options ): array {
		$show_all           = ! empty( $options[ 'show_all_media' ] );
		$show_uncategorized = ! empty( $options[ 'show_uncategorized' ] );

		if ( ! $show_all && ! $show_uncategorized ) {
			$options[ 'show_all_media' ]     = true;
			$options[ 'show_uncategorized' ] = false;
		}

		return $options;
	}

	/**
	 * Render the settings page.
	 *
	 * @return void
	 */
	public static function render_settings_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Show save confirmation.
		if ( isset( $_GET[ 'settings-updated' ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_settings_error(
				'vmfo_messages',
				'vmfo_message',
				__( 'Settings saved.', 'virtual-media-folders' ),
				'updated'
			);
		}

		$active_tab    = self::get_active_tab();
		$active_subtab = self::get_active_subtab();

		// Build tabs array: General first, then add-on tabs.
		$tabs = array(
			'general' => array(
				'title'    => __( 'General', 'virtual-media-folders' ),
				'callback' => array( self::class, 'render_general_tab' ),
			),
		);

		/**
		 * Filter to register add-on tabs.
		 *
		 * Add-ons can use this filter to add their own tabs to the settings page.
		 *
		 * @since 1.1.0
		 *
		 * @param array $tabs Array of tabs: [ 'slug' => [ 'title' => '', 'callback' => callable ] ].
		 */
		$addon_tabs = apply_filters( 'vmfo_settings_tabs', array() );

		// Sort add-on tabs alphabetically by title.
		uasort( $addon_tabs, function ( $a, $b ) {
			return strcasecmp( $a[ 'title' ] ?? '', $b[ 'title' ] ?? '' );
		} );

		$tabs = array_merge( $tabs, $addon_tabs );

		// Validate active tab exists, fall back to general.
		if ( ! isset( $tabs[ $active_tab ] ) ) {
			$active_tab = 'general';
		}

		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<?php settings_errors( 'vmfo_messages' ); ?>

			<?php if ( count( $tabs ) > 1 ) : ?>
				<nav class="nav-tab-wrapper vmfo-nav-tabs">
					<?php foreach ( $tabs as $slug => $tab ) : ?>
						<a href="<?php echo esc_url( admin_url( 'upload.php?page=' . self::PAGE_SLUG . '&tab=' . $slug ) ); ?>"
							class="nav-tab <?php echo $active_tab === $slug ? 'nav-tab-active' : ''; ?>">
							<?php echo esc_html( $tab[ 'title' ] ); ?>
						</a>
					<?php endforeach; ?>
				</nav>
			<?php endif; ?>

			<div class="vmfo-tab-content">
				<?php
				if ( isset( $tabs[ $active_tab ][ 'callback' ] ) && is_callable( $tabs[ $active_tab ][ 'callback' ] ) ) {
					call_user_func( $tabs[ $active_tab ][ 'callback' ], $active_tab, $active_subtab );
				}
				?>
			</div>
		</div>
		<?php
	}

	/**
	 * Render the general settings tab.
	 *
	 * @param string $active_tab    The active tab slug.
	 * @param string $active_subtab The active subtab slug.
	 * @return void
	 */
	public static function render_general_tab( string $active_tab, string $active_subtab ): void {
		?>
		<form action="options.php" method="post">
			<?php
			settings_fields( self::OPTION_GROUP );
			do_settings_sections( self::PAGE_SLUG );
			submit_button( __( 'Save Settings', 'virtual-media-folders' ) );
			?>
		</form>
		<?php
	}

	/**
	 * Render suggestions section description.
	 *
	 * @return void
	 */
	public static function render_suggestions_section(): void {
		echo '<p>' . esc_html__( 'Configure how Virtual Media Folders suggests folders for newly uploaded files.', 'virtual-media-folders' ) . '</p>';
	}

	/**
	 * Render defaults section description.
	 *
	 * @return void
	 */
	public static function render_defaults_section(): void {
		echo '<p>' . esc_html__( 'Set default behavior for folder organization.', 'virtual-media-folders' ) . '</p>';
	}

	/**
	 * Render a checkbox field.
	 *
	 * @param array $args Field arguments.
	 * @return void
	 */
	public static function render_checkbox_field( array $args ): void {
		$options = self::get_options();
		$value   = $options[ $args[ 'id' ] ] ?? self::DEFAULTS[ $args[ 'id' ] ] ?? false;
		$name    = self::OPTION_NAME . '[' . $args[ 'id' ] . ']';

		// Check if this field should be disabled based on interdependency.
		// When disabled, the checkbox is forced checked (the other option is off).
		$disabled     = '';
		$is_forced_on = false;
		if ( $args[ 'id' ] === 'show_uncategorized' && empty( $options[ 'show_all_media' ] ) ) {
			$disabled     = 'disabled';
			$is_forced_on = true;
			$value        = true; // Force checked visually.
		} elseif ( $args[ 'id' ] === 'show_all_media' && empty( $options[ 'show_uncategorized' ] ) ) {
			$disabled     = 'disabled';
			$is_forced_on = true;
			$value        = true; // Force checked visually.
		}

		// Hidden field to submit value when checkbox is disabled.
		// Disabled fields don't submit, so we need this to preserve the forced-on state.
		if ( $is_forced_on ) {
			printf(
				'<input type="hidden" name="%s" value="1" />',
				esc_attr( $name )
			);
		}

		printf(
			'<label><input type="checkbox" id="%s" name="%s" value="1" %s %s /> %s</label>',
			esc_attr( $args[ 'id' ] ),
			esc_attr( $name ),
			checked( $value, true, false ),
			esc_attr( $disabled ),
			esc_html( $args[ 'description' ] ?? '' )
		);
	}

	/**
	 * Render a folder select field.
	 *
	 * If the VMFA Rules Engine add-on is active, show a link to its settings instead.
	 *
	 * @param array $args Field arguments.
	 * @return void
	 */
	public static function render_folder_select_field( array $args ): void {
		// Check if VMFA Rules Engine add-on is active.
		if ( self::is_rules_engine_active() ) {
			$rules_engine_url = admin_url( 'upload.php?page=' . self::PAGE_SLUG . '&tab=rules-engine' );
			printf(
				'<p class="description">%s <a href="%s">%s</a></p>',
				esc_html__( 'Default folder assignment is managed by the Rules Engine.', 'virtual-media-folders' ),
				esc_url( $rules_engine_url ),
				esc_html__( 'Configure Rules Engine →', 'virtual-media-folders' )
			);
			return;
		}

		$options = self::get_options();
		$value   = $options[ $args[ 'id' ] ] ?? self::DEFAULTS[ $args[ 'id' ] ] ?? 0;
		$name    = self::OPTION_NAME . '[' . $args[ 'id' ] . ']';

		$folders = get_terms(
			[
				'taxonomy'   => 'vmfo_folder',
				'hide_empty' => false,
				'orderby'    => 'name',
				'order'      => 'ASC',
			]
		);

		echo '<select name="' . esc_attr( $name ) . '">';
		echo '<option value="0">' . esc_html__( 'None', 'virtual-media-folders' ) . '</option>';

		if ( ! is_wp_error( $folders ) && is_array( $folders ) ) {
			foreach ( $folders as $folder ) {
				printf(
					'<option value="%d" %s>%s</option>',
					esc_attr( $folder->term_id ),
					selected( $value, $folder->term_id, false ),
					esc_html( $folder->name )
				);
			}
		}

		echo '</select>';

		if ( ! empty( $args[ 'description' ] ) ) {
			echo '<p class="description">' . esc_html( $args[ 'description' ] ) . '</p>';
		}
	}

	/**
	 * Check if the VMFA Rules Engine add-on is active.
	 *
	 * @return bool True if the Rules Engine plugin is active.
	 */
	private static function is_rules_engine_active(): bool {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		return is_plugin_active( 'vmfa-rules-engine/vmfa-rules-engine.php' );
	}
}
