<?php
/**
 * WordPress Design System token loader.
 *
 * @package VirtualMediaFolders
 * @since   2.2.0
 */

declare(strict_types=1);

namespace VirtualMediaFolders;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the `vmfo-tokens` style handle.
 *
 * Plugin and add-on styles use `--wpds-*` design tokens. WordPress 7.0+
 * provides them via the core `wp-theme` stylesheet; on older versions the
 * bundled fallback file defines them. The fallback uses a zero-specificity
 * selector, so core values always win when present.
 *
 * Add `DesignTokens::HANDLE` to the dependencies of any stylesheet that
 * uses `--wpds-*` tokens.
 */
final class DesignTokens {

	/**
	 * Style handle for the design tokens.
	 */
	public const HANDLE = 'vmfo-tokens';

	/**
	 * Initialize hooks.
	 *
	 * Registers early so later enqueues (including add-ons) can depend on it.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'admin_enqueue_scripts', [ static::class, 'register' ], 1 );
		add_action( 'enqueue_block_editor_assets', [ static::class, 'register' ], 1 );
	}

	/**
	 * Register the token stylesheet (idempotent).
	 *
	 * @return void
	 */
	public static function register(): void {
		if ( wp_style_is( self::HANDLE, 'registered' ) ) {
			return;
		}

		$deps = wp_style_is( 'wp-theme', 'registered' ) ? [ 'wp-theme' ] : [];

		wp_register_style(
			self::HANDLE,
			VMFO_URL . 'src/css/wpds-tokens-fallback.css',
			$deps,
			VMFO_VERSION
		);
	}
}
