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
	 * Test init registers the enqueue_scripts action.
	 */
	public function test_init_registers_action(): void {
		Functions\expect( 'add_action' )
			->once()
			->with( 'admin_enqueue_scripts', [ Admin::class, 'enqueue_scripts' ] );

		Admin::init();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
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
}
