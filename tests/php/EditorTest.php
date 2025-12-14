<?php
/**
 * Editor class tests.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

namespace VirtualMediaFolders\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use VirtualMediaFolders\Editor;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Editor class.
 */
class EditorTest extends TestCase {
	/**
	 * Set up before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Define constants if not already defined
		if ( ! defined( 'VMFO_PATH' ) ) {
			define( 'VMFO_PATH', '/tmp/vmf-test/' );
		}
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
	 * Test boot registers the required actions and filters.
	 */
	public function test_boot_registers_hooks(): void {
		Functions\expect( 'add_action' )
			->once()
			->with( 'enqueue_block_editor_assets', [ Editor::class, 'enqueue_editor_assets' ] );

		Functions\expect( 'add_filter' )
			->once()
			->with( 'ajax_query_attachments_args', [ Editor::class, 'filter_ajax_query_args' ], 10, 1 );

		Editor::boot();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	/**
	 * Test filter_ajax_query_args returns unmodified args when no folder param.
	 */
	public function test_filter_ajax_query_args_no_folder(): void {
		Functions\expect( 'taxonomy_exists' )
			->once()
			->with( 'vmfo_folder' )
			->andReturn( true );

		$query_args = [ 'post_type' => 'attachment' ];

		$result = Editor::filter_ajax_query_args( $query_args );

		$this->assertSame( $query_args, $result );
	}

	/**
	 * Test filter_ajax_query_args adds tax_query for folder parameter.
	 */
	public function test_filter_ajax_query_args_with_folder(): void {
		$_REQUEST[ 'query' ][ 'vmfo_folder' ] = '5';

		Functions\expect( 'taxonomy_exists' )
			->once()
			->with( 'vmfo_folder' )
			->andReturn( true );

		Functions\expect( 'sanitize_text_field' )
			->once()
			->andReturnUsing( function ( $val ) {
				return $val;
			} );

		Functions\expect( 'wp_unslash' )
			->once()
			->andReturnUsing( function ( $val ) {
				return $val;
			} );

		Functions\expect( 'absint' )
			->once()
			->with( '5' )
			->andReturn( 5 );

		Functions\expect( 'apply_filters' )
			->once()
			->with( 'vmfo_include_child_folders', false, 5 )
			->andReturn( false );

		$query_args = [ 'post_type' => 'attachment' ];

		$result = Editor::filter_ajax_query_args( $query_args );

		$this->assertArrayHasKey( 'tax_query', $result );
		$this->assertSame( 'vmfo_folder', $result[ 'tax_query' ][ 0 ][ 'taxonomy' ] );
		$this->assertSame( [ 5 ], $result[ 'tax_query' ][ 0 ][ 'terms' ] );
		$this->assertSame( 'term_id', $result[ 'tax_query' ][ 0 ][ 'field' ] );
		$this->assertFalse( $result[ 'tax_query' ][ 0 ][ 'include_children' ] );

		unset( $_REQUEST[ 'query' ] );
	}

	/**
	 * Test filter_ajax_query_args handles uncategorized filter.
	 */
	public function test_filter_ajax_query_args_uncategorized(): void {
		$_REQUEST[ 'query' ][ 'vmfo_folder_exclude' ] = 'all';

		Functions\expect( 'taxonomy_exists' )
			->once()
			->with( 'vmfo_folder' )
			->andReturn( true );

		Functions\expect( 'sanitize_text_field' )
			->once()
			->andReturnUsing( function ( $val ) {
				return $val;
			} );

		Functions\expect( 'wp_unslash' )
			->once()
			->andReturnUsing( function ( $val ) {
				return $val;
			} );

		Functions\expect( 'get_terms' )
			->once()
			->andReturn( [ 1, 2, 3 ] );

		Functions\expect( 'is_wp_error' )
			->once()
			->andReturn( false );

		$query_args = [ 'post_type' => 'attachment' ];

		$result = Editor::filter_ajax_query_args( $query_args );

		$this->assertArrayHasKey( 'tax_query', $result );
		$this->assertSame( 'NOT IN', $result[ 'tax_query' ][ 0 ][ 'operator' ] );
		$this->assertSame( [ 1, 2, 3 ], $result[ 'tax_query' ][ 0 ][ 'terms' ] );

		unset( $_REQUEST[ 'query' ] );
	}

	/**
	 * Test filter_ajax_query_args handles empty folders for uncategorized.
	 */
	public function test_filter_ajax_query_args_uncategorized_no_folders(): void {
		$_REQUEST[ 'query' ][ 'vmfo_folder_exclude' ] = 'all';

		Functions\expect( 'taxonomy_exists' )
			->once()
			->with( 'vmfo_folder' )
			->andReturn( true );

		Functions\expect( 'sanitize_text_field' )
			->once()
			->andReturnUsing( function ( $val ) {
				return $val;
			} );

		Functions\expect( 'wp_unslash' )
			->once()
			->andReturnUsing( function ( $val ) {
				return $val;
			} );

		Functions\expect( 'get_terms' )
			->once()
			->andReturn( [] );

		Functions\expect( 'is_wp_error' )
			->once()
			->andReturn( false );

		$query_args = [ 'post_type' => 'attachment' ];

		$result = Editor::filter_ajax_query_args( $query_args );

		// Should not add tax_query if no folders exist
		$this->assertArrayNotHasKey( 'tax_query', $result );

		unset( $_REQUEST[ 'query' ] );
	}

	/**
	 * Test filter_ajax_query_args handles WP_Error from get_terms.
	 */
	public function test_filter_ajax_query_args_get_terms_error(): void {
		$_REQUEST[ 'query' ][ 'vmfo_folder_exclude' ] = 'all';

		$wp_error = \Mockery::mock( 'WP_Error' );

		Functions\expect( 'taxonomy_exists' )
			->once()
			->with( 'vmfo_folder' )
			->andReturn( true );

		Functions\expect( 'sanitize_text_field' )
			->once()
			->andReturnUsing( function ( $val ) {
				return $val;
			} );

		Functions\expect( 'wp_unslash' )
			->once()
			->andReturnUsing( function ( $val ) {
				return $val;
			} );

		Functions\expect( 'get_terms' )
			->once()
			->andReturn( $wp_error );

		Functions\expect( 'is_wp_error' )
			->once()
			->with( $wp_error )
			->andReturn( true );

		$query_args = [ 'post_type' => 'attachment' ];

		$result = Editor::filter_ajax_query_args( $query_args );

		// Should not add tax_query on error
		$this->assertArrayNotHasKey( 'tax_query', $result );

		unset( $_REQUEST[ 'query' ] );
	}

	/**
	 * Test filter_ajax_query_args returns early when taxonomy doesn't exist.
	 */
	public function test_filter_ajax_query_args_taxonomy_not_exists(): void {
		Functions\expect( 'taxonomy_exists' )
			->once()
			->with( 'vmfo_folder' )
			->andReturn( false );

		$query_args = [ 'post_type' => 'attachment' ];

		$result = Editor::filter_ajax_query_args( $query_args );

		$this->assertSame( $query_args, $result );
	}
}
