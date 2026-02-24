<?php
/**
 * Admin class tests.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

namespace VirtualMediaFolders\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Brain\Monkey\Filters;
use VirtualMediaFolders\Admin;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Admin class.
 */
class AdminTest extends TestCase {
	/**
	 * Set up before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tear down after each test.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test init registers hooks including wp_generate_attachment_metadata filter.
	 */
	public function test_init_registers_action(): void {
		Admin::init();

		$this->assertTrue(
			has_action( 'admin_enqueue_scripts', [ Admin::class, 'enqueue_scripts' ] ) !== false
		);
		$this->assertTrue(
			has_filter( 'wp_generate_attachment_metadata', [ Admin::class, 'assign_default_folder' ] ) !== false
		);
	}

	/**
	 * Test enqueue_scripts returns early for non-media pages.
	 */
	public function test_enqueue_scripts_skips_non_media_pages(): void {
		Functions\expect( 'wp_enqueue_script' )->never();
		Functions\expect( 'wp_enqueue_style' )->never();

		Admin::enqueue_scripts( 'edit.php' );

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	/**
	 * Test enqueue_scripts returns early when asset file doesn't exist.
	 */
	public function test_enqueue_scripts_skips_when_no_asset_file(): void {
		if ( ! defined( 'VMFO_PATH' ) ) {
			define( 'VMFO_PATH', '/tmp/vmf-test/' );
		}

		Functions\expect( 'wp_enqueue_script' )->never();
		Functions\expect( 'wp_enqueue_style' )->never();

		Admin::enqueue_scripts( 'upload.php' );

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	/**
	 * Test assign_default_folder skips non-create context.
	 */
	public function test_assign_default_folder_skips_non_create(): void {
		Functions\expect( 'apply_filters' )->never();

		$metadata = [ 'width' => 1920, 'height' => 1080 ];
		$result   = Admin::assign_default_folder( $metadata, 123, 'update' );

		$this->assertSame( $metadata, $result );
	}

	/**
	 * Test assign_default_folder applies vmfo_upload_folder filter.
	 */
	public function test_assign_default_folder_applies_filter(): void {
		// Mock get_option so Settings::get( 'default_folder' ) returns 5.
		Functions\when( 'get_option' )->justReturn(
			[ 'default_folder' => 5, 'show_all_media' => true, 'show_uncategorized' => true ]
		);

		Filters\expectApplied( 'vmfo_upload_folder' )
			->once()
			->with( 5, 123, [ 'width' => 1920 ] )
			->andReturn( 5 );

		Functions\expect( 'get_term' )
			->once()
			->with( 5, 'vmfo_folder' )
			->andReturn( (object) [ 'term_id' => 5 ] );

		Functions\expect( 'is_wp_error' )
			->once()
			->andReturn( false );

		Functions\expect( 'wp_set_object_terms' )
			->once()
			->with( 123, [ 5 ], 'vmfo_folder' );

		$metadata = [ 'width' => 1920 ];
		$result   = Admin::assign_default_folder( $metadata, 123, 'create' );

		$this->assertSame( $metadata, $result );
	}

	/**
	 * Test assign_default_folder skips when filter returns 0.
	 */
	public function test_assign_default_folder_skips_when_filter_returns_zero(): void {
		// Mock get_option so Settings::get( 'default_folder' ) returns 0.
		Functions\when( 'get_option' )->justReturn(
			[ 'default_folder' => 0, 'show_all_media' => true, 'show_uncategorized' => true ]
		);

		Filters\expectApplied( 'vmfo_upload_folder' )
			->once()
			->andReturn( 0 );

		Functions\expect( 'get_term' )->never();
		Functions\expect( 'wp_set_object_terms' )->never();

		$metadata = [ 'width' => 1920 ];
		$result   = Admin::assign_default_folder( $metadata, 123, 'create' );

		$this->assertSame( $metadata, $result );
	}

	/**
	 * Test assign_default_folder allows add-ons to override folder.
	 */
	public function test_assign_default_folder_addon_override(): void {
		// Mock get_option so Settings::get( 'default_folder' ) returns 5.
		Functions\when( 'get_option' )->justReturn(
			[ 'default_folder' => 5, 'show_all_media' => true, 'show_uncategorized' => true ]
		);

		// Simulate an add-on overriding the folder to 42.
		Filters\expectApplied( 'vmfo_upload_folder' )
			->once()
			->with( 5, 123, [ 'width' => 800 ] )
			->andReturn( 42 );

		Functions\expect( 'get_term' )
			->once()
			->with( 42, 'vmfo_folder' )
			->andReturn( (object) [ 'term_id' => 42 ] );

		Functions\expect( 'is_wp_error' )
			->once()
			->andReturn( false );

		Functions\expect( 'wp_set_object_terms' )
			->once()
			->with( 123, [ 42 ], 'vmfo_folder' );

		$metadata = [ 'width' => 800 ];
		$result   = Admin::assign_default_folder( $metadata, 123, 'create' );

		$this->assertSame( $metadata, $result );
	}
}
