<?php
/**
 * Settings Page.
 *
 * Provides a settings page for Media Manager plugin options.
 *
 * @package MediaManager
 * @since 1.0.0
 */

declare(strict_types=1);

namespace MediaManager;

/**
 * Settings handler.
 */
final class Settings {

	/**
	 * Option group name.
	 */
	private const OPTION_GROUP = 'mediamanager_settings';

	/**
	 * Option name for storing settings.
	 */
	private const OPTION_NAME = 'mediamanager_options';

	/**
	 * Settings page slug.
	 */
	private const PAGE_SLUG = 'mediamanager-settings';

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
		'show_uncategorized'        => true,
		'enable_drag_drop'          => true,
		'sidebar_default_visible'   => false,
		'jump_to_folder_after_move' => true,
	];

	/**
	 * Initialize the settings page.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'admin_menu', [ self::class, 'add_menu_page' ] );
		add_action( 'admin_init', [ self::class, 'register_settings' ] );
	}

	/**
	 * Add settings page to admin menu.
	 *
	 * @return void
	 */
	public static function add_menu_page(): void {
		add_submenu_page(
			'upload.php',
			__( 'Media Manager Settings', 'mediamanager' ),
			__( 'Folder Settings', 'mediamanager' ),
			'manage_options',
			self::PAGE_SLUG,
			[ self::class, 'render_settings_page' ]
		);
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
			'mediamanager_suggestions',
			__( 'Smart Suggestions', 'mediamanager' ),
			[ self::class, 'render_suggestions_section' ],
			self::PAGE_SLUG
		);

		add_settings_field(
			'enable_suggestions',
			__( 'Enable Suggestions', 'mediamanager' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'mediamanager_suggestions',
			[
				'id'          => 'enable_suggestions',
				'description' => __( 'Show folder suggestions when uploading new media.', 'mediamanager' ),
			]
		);

		add_settings_field(
			'suggestions_mime_types',
			__( 'MIME Type Matching', 'mediamanager' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'mediamanager_suggestions',
			[
				'id'          => 'suggestions_mime_types',
				'description' => __( 'Suggest folders based on file type (images, videos, documents).', 'mediamanager' ),
			]
		);

		add_settings_field(
			'suggestions_exif_date',
			__( 'EXIF Date Matching', 'mediamanager' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'mediamanager_suggestions',
			[
				'id'          => 'suggestions_exif_date',
				'description' => __( 'Suggest folders based on photo creation date from EXIF data.', 'mediamanager' ),
			]
		);

		add_settings_field(
			'suggestions_iptc',
			__( 'IPTC Keywords Matching', 'mediamanager' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'mediamanager_suggestions',
			[
				'id'          => 'suggestions_iptc',
				'description' => __( 'Suggest folders based on embedded IPTC keywords.', 'mediamanager' ),
			]
		);
		*/

		// Default behavior section.
		add_settings_section(
			'mediamanager_defaults',
			__( 'Default Behavior', 'mediamanager' ),
			[ self::class, 'render_defaults_section' ],
			self::PAGE_SLUG
		);

		add_settings_field(
			'default_folder',
			__( 'Default Folder', 'mediamanager' ),
			[ self::class, 'render_folder_select_field' ],
			self::PAGE_SLUG,
			'mediamanager_defaults',
			[
				'id'          => 'default_folder',
				'description' => __( 'Automatically assign new uploads to this folder (0 = none).', 'mediamanager' ),
			]
		);

		add_settings_field(
			'show_uncategorized',
			__( 'Show Uncategorized', 'mediamanager' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'mediamanager_defaults',
			[
				'id'          => 'show_uncategorized',
				'description' => __( 'Show the "Uncategorized" virtual folder in the sidebar.', 'mediamanager' ),
			]
		);

		// UI preferences section.
		add_settings_section(
			'mediamanager_ui',
			__( 'User Interface', 'mediamanager' ),
			[ self::class, 'render_ui_section' ],
			self::PAGE_SLUG
		);

		add_settings_field(
			'enable_drag_drop',
			__( 'Enable Drag & Drop', 'mediamanager' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'mediamanager_ui',
			[
				'id'          => 'enable_drag_drop',
				'description' => __( 'Allow drag and drop to organize media into folders.', 'mediamanager' ),
			]
		);

		add_settings_field(
			'sidebar_default_visible',
			__( 'Sidebar Default Visible', 'mediamanager' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'mediamanager_ui',
			[
				'id'          => 'sidebar_default_visible',
				'description' => __( 'Show the folder sidebar by default when opening Media Library.', 'mediamanager' ),
			]
		);

		add_settings_field(
			'jump_to_folder_after_move',
			__( 'Jump to Folder After Move', 'mediamanager' ),
			[ self::class, 'render_checkbox_field' ],
			self::PAGE_SLUG,
			'mediamanager_ui',
			[
				'id'          => 'jump_to_folder_after_move',
				'description' => __( 'Automatically switch to the target folder after moving files.', 'mediamanager' ),
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
			'show_uncategorized',
			'enable_drag_drop',
			'sidebar_default_visible',
			'jump_to_folder_after_move',
		];

		foreach ( $boolean_fields as $field ) {
			$sanitized[ $field ] = ! empty( $input[ $field ] );
		}

		// Integer fields.
		$sanitized[ 'default_folder' ] = isset( $input[ 'default_folder' ] ) ? absint( $input[ 'default_folder' ] ) : 0;

		return $sanitized;
	}

	/**
	 * Get a setting value.
	 *
	 * @param string $key     Setting key.
	 * @param mixed  $default Default value if not set.
	 * @return mixed Setting value.
	 */
	public static function get( string $key, $default = null ) {
		$options = get_option( self::OPTION_NAME, self::DEFAULTS );

		if ( isset( $options[ $key ] ) ) {
			return $options[ $key ];
		}

		if ( $default !== null ) {
			return $default;
		}

		return self::DEFAULTS[ $key ] ?? null;
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
				'mediamanager_messages',
				'mediamanager_message',
				__( 'Settings saved.', 'mediamanager' ),
				'updated'
			);
		}

		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<?php settings_errors( 'mediamanager_messages' ); ?>
			<form action="options.php" method="post">
				<?php
				settings_fields( self::OPTION_GROUP );
				do_settings_sections( self::PAGE_SLUG );
				submit_button( __( 'Save Settings', 'mediamanager' ) );
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render suggestions section description.
	 *
	 * @return void
	 */
	public static function render_suggestions_section(): void {
		echo '<p>' . esc_html__( 'Configure how Media Manager suggests folders for newly uploaded files.', 'mediamanager' ) . '</p>';
	}

	/**
	 * Render defaults section description.
	 *
	 * @return void
	 */
	public static function render_defaults_section(): void {
		echo '<p>' . esc_html__( 'Set default behavior for folder organization.', 'mediamanager' ) . '</p>';
	}

	/**
	 * Render UI section description.
	 *
	 * @return void
	 */
	public static function render_ui_section(): void {
		echo '<p>' . esc_html__( 'Customize the Media Manager user interface.', 'mediamanager' ) . '</p>';
	}

	/**
	 * Render a checkbox field.
	 *
	 * @param array $args Field arguments.
	 * @return void
	 */
	public static function render_checkbox_field( array $args ): void {
		$options = get_option( self::OPTION_NAME, self::DEFAULTS );
		$value   = $options[ $args[ 'id' ] ] ?? self::DEFAULTS[ $args[ 'id' ] ] ?? false;
		$name    = self::OPTION_NAME . '[' . $args[ 'id' ] . ']';

		printf(
			'<label><input type="checkbox" name="%s" value="1" %s /> %s</label>',
			esc_attr( $name ),
			checked( $value, true, false ),
			esc_html( $args[ 'description' ] ?? '' )
		);
	}

	/**
	 * Render a folder select field.
	 *
	 * @param array $args Field arguments.
	 * @return void
	 */
	public static function render_folder_select_field( array $args ): void {
		$options = get_option( self::OPTION_NAME, self::DEFAULTS );
		$value   = $options[ $args[ 'id' ] ] ?? self::DEFAULTS[ $args[ 'id' ] ] ?? 0;
		$name    = self::OPTION_NAME . '[' . $args[ 'id' ] . ']';

		$folders = get_terms(
			[
				'taxonomy'   => 'media_folder',
				'hide_empty' => false,
				'orderby'    => 'name',
				'order'      => 'ASC',
			]
		);

		echo '<select name="' . esc_attr( $name ) . '">';
		echo '<option value="0">' . esc_html__( 'None', 'mediamanager' ) . '</option>';

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
}
