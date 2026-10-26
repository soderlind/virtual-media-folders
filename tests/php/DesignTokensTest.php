<?php
/**
 * DesignTokens class tests.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

namespace VirtualMediaFolders\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use VirtualMediaFolders\DesignTokens;
use PHPUnit\Framework\TestCase;

/**
 * Tests for DesignTokens class.
 */
class DesignTokensTest extends TestCase {
	/**
	 * Set up before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		if ( ! defined( 'VMFO_URL' ) ) {
			define( 'VMFO_URL', 'https://example.com/wp-content/plugins/virtual-media-folders/' );
		}
		if ( ! defined( 'VMFO_VERSION' ) ) {
			define( 'VMFO_VERSION', '0.1.0' );
		}
	}

	/**
	 * Tear down after each test.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test init registers early hooks for admin and block editor.
	 */
	public function test_init_registers_early_hooks(): void {
		DesignTokens::init();

		$this->assertSame( 1, has_action( 'admin_enqueue_scripts', [ DesignTokens::class, 'register' ] ) );
		$this->assertSame( 1, has_action( 'enqueue_block_editor_assets', [ DesignTokens::class, 'register' ] ) );
	}

	/**
	 * Test the fallback depends on core wp-theme when available (WP 7.0+).
	 */
	public function test_register_depends_on_core_theme_when_available(): void {
		Functions\when( 'wp_style_is' )->alias(
			static fn( string $handle ): bool => 'wp-theme' === $handle
		);
		Functions\expect( 'wp_register_style' )
			->once()
			->with( 'vmfo-tokens', VMFO_URL . 'src/css/wpds-tokens-fallback.css', [ 'wp-theme' ], VMFO_VERSION );

		DesignTokens::register();
		$this->addToAssertionCount( 1 );
	}

	/**
	 * Test the fallback has no deps when core tokens are missing (WP < 7.0).
	 */
	public function test_register_without_core_theme(): void {
		Functions\when( 'wp_style_is' )->justReturn( false );
		Functions\expect( 'wp_register_style' )
			->once()
			->with( 'vmfo-tokens', \Mockery::any(), [], \Mockery::any() );

		DesignTokens::register();
		$this->addToAssertionCount( 1 );
	}

	/**
	 * Test register is idempotent.
	 */
	public function test_register_skips_when_already_registered(): void {
		Functions\when( 'wp_style_is' )->justReturn( true );
		Functions\expect( 'wp_register_style' )->never();

		DesignTokens::register();
		$this->addToAssertionCount( 1 );
	}

	/**
	 * Test the fallback file exists and only uses zero-specificity selectors.
	 */
	public function test_fallback_file_uses_where_root(): void {
		$css = file_get_contents( dirname( __DIR__, 2 ) . '/src/css/wpds-tokens-fallback.css' );

		$this->assertIsString( $css );
		$this->assertStringContainsString( ':where(:root)', $css );
		$this->assertDoesNotMatchRegularExpression( '/(^|[^(]):root\s*\{/m', $css );
	}
}
