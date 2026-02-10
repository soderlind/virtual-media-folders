<?php
/**
 * AddonChecker class tests.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

namespace VirtualMediaFolders\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use VirtualMediaFolders\AddonChecker;
use PHPUnit\Framework\TestCase;

/**
 * Tests for AddonChecker class.
 */
class AddonCheckerTest extends TestCase {
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
	 * Test init registers the admin_notices action.
	 */
	public function test_init_registers_action(): void {
		Functions\expect( 'add_action' )
			->once()
			->with( 'admin_notices', [ AddonChecker::class, 'check_addon_versions' ] );

		AddonChecker::init();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	/**
	 * Test check_addon_versions returns early for non-media pages.
	 */
	public function test_check_addon_versions_skips_non_media_pages(): void {
		global $pagenow;
		$pagenow = 'edit.php';

		Functions\expect( 'is_plugin_active' )->never();
		Functions\expect( 'get_plugin_data' )->never();

		AddonChecker::check_addon_versions();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	/**
	 * Test check_addon_versions runs on upload.php page.
	 */
	public function test_check_addon_versions_runs_on_upload_page(): void {
		global $pagenow;
		$pagenow = 'upload.php';

		Functions\expect( 'is_plugin_active' )
			->times( 4 ) // Called for each of the 4 add-ons
			->andReturn( false );

		AddonChecker::check_addon_versions();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	/**
	 * Test check_addon_versions runs on media-new.php page.
	 */
	public function test_check_addon_versions_runs_on_media_new_page(): void {
		global $pagenow;
		$pagenow = 'media-new.php';

		Functions\expect( 'is_plugin_active' )
			->times( 4 ) // Called for each of the 4 add-ons
			->andReturn( false );

		AddonChecker::check_addon_versions();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	/**
	 * Test check_addon_versions skips inactive plugins.
	 */
	public function test_check_addon_versions_skips_inactive_plugins(): void {
		global $pagenow;
		$pagenow = 'upload.php';

		Functions\expect( 'is_plugin_active' )
			->times( 4 )
			->andReturn( false );

		Functions\expect( 'get_plugin_data' )->never();

		AddonChecker::check_addon_versions();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	/**
	 * Test check_addon_versions shows notice for outdated add-on.
	 */
	public function test_check_addon_versions_shows_notice_for_outdated_addon(): void {
		global $pagenow;
		$pagenow = 'upload.php';

		if ( ! defined( 'WP_PLUGIN_DIR' ) ) {
			define( 'WP_PLUGIN_DIR', '/tmp/wp-content/plugins' );
		}

		// Create a temporary plugin file for testing
		$plugin_dir  = WP_PLUGIN_DIR . '/vmfa-ai-organizer';
		$plugin_file = $plugin_dir . '/vmfa-ai-organizer.php';

		if ( ! is_dir( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}

		file_put_contents( $plugin_file, "<?php\n/**\n * Plugin Name: AI Organizer\n * Version: 1.0.0\n */\n" );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-ai-organizer/vmfa-ai-organizer.php' )
			->andReturn( true );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-rules-engine/vmfa-rules-engine.php' )
			->andReturn( false );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-editorial-workflow/vmfa-editorial-workflow.php' )
			->andReturn( false );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-media-cleanup/vmfa-media-cleanup.php' )
			->andReturn( false );

		Functions\expect( 'get_plugin_data' )
			->once()
			->with( $plugin_file )
			->andReturn( [ 'Version' => '1.0.0' ] );

		Functions\expect( 'esc_html__' )
			->andReturnFirstArg();

		Functions\expect( 'esc_html' )
			->andReturnFirstArg();

		$this->expectOutputRegex( '/notice notice-info is-dismissible/' );

		AddonChecker::check_addon_versions();

		// Cleanup
		unlink( $plugin_file );
		rmdir( $plugin_dir );
	}

	/**
	 * Test check_addon_versions does not show notice when version is current.
	 */
	public function test_check_addon_versions_no_notice_when_version_current(): void {
		global $pagenow;
		$pagenow = 'upload.php';

		if ( ! defined( 'WP_PLUGIN_DIR' ) ) {
			define( 'WP_PLUGIN_DIR', '/tmp/wp-content/plugins' );
		}

		// Create a temporary plugin file for testing
		$plugin_dir  = WP_PLUGIN_DIR . '/vmfa-ai-organizer';
		$plugin_file = $plugin_dir . '/vmfa-ai-organizer.php';

		if ( ! is_dir( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}

		file_put_contents( $plugin_file, "<?php\n/**\n * Plugin Name: AI Organizer\n * Version: 1.2.0\n */\n" );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-ai-organizer/vmfa-ai-organizer.php' )
			->andReturn( true );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-rules-engine/vmfa-rules-engine.php' )
			->andReturn( false );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-editorial-workflow/vmfa-editorial-workflow.php' )
			->andReturn( false );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-media-cleanup/vmfa-media-cleanup.php' )
			->andReturn( false );

		Functions\expect( 'get_plugin_data' )
			->once()
			->with( $plugin_file )
			->andReturn( [ 'Version' => '1.2.0' ] );

		// esc_html__ and esc_html should NOT be called since no notice is rendered
		Functions\expect( 'esc_html__' )->never();
		Functions\expect( 'esc_html' )->never();

		AddonChecker::check_addon_versions();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey

		// Cleanup
		unlink( $plugin_file );
		rmdir( $plugin_dir );
	}

	/**
	 * Test check_addon_versions does not show notice when version is higher.
	 */
	public function test_check_addon_versions_no_notice_when_version_higher(): void {
		global $pagenow;
		$pagenow = 'upload.php';

		if ( ! defined( 'WP_PLUGIN_DIR' ) ) {
			define( 'WP_PLUGIN_DIR', '/tmp/wp-content/plugins' );
		}

		// Create a temporary plugin file for testing
		$plugin_dir  = WP_PLUGIN_DIR . '/vmfa-ai-organizer';
		$plugin_file = $plugin_dir . '/vmfa-ai-organizer.php';

		if ( ! is_dir( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}

		file_put_contents( $plugin_file, "<?php\n/**\n * Plugin Name: AI Organizer\n * Version: 2.0.0\n */\n" );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-ai-organizer/vmfa-ai-organizer.php' )
			->andReturn( true );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-rules-engine/vmfa-rules-engine.php' )
			->andReturn( false );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-editorial-workflow/vmfa-editorial-workflow.php' )
			->andReturn( false );

		Functions\expect( 'is_plugin_active' )
			->with( 'vmfa-media-cleanup/vmfa-media-cleanup.php' )
			->andReturn( false );

		Functions\expect( 'get_plugin_data' )
			->once()
			->with( $plugin_file )
			->andReturn( [ 'Version' => '2.0.0' ] );

		// esc_html__ and esc_html should NOT be called since no notice is rendered
		Functions\expect( 'esc_html__' )->never();
		Functions\expect( 'esc_html' )->never();

		AddonChecker::check_addon_versions();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey

		// Cleanup
		unlink( $plugin_file );
		rmdir( $plugin_dir );
	}
}
