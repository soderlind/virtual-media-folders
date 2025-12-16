<?php

namespace VirtualMediaFolders\Tests;

use Brain\Monkey;
use VirtualMediaFolders\Taxonomy;
use PHPUnit\Framework\TestCase;

class TaxonomyTest extends TestCase {
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_init_hooks_into_wordpress(): void {
		Monkey\Functions\when( 'is_admin' )->justReturn( false );

		Monkey\Functions\expect( 'add_action' )
			->once()
			->with( 'init', [ Taxonomy::class, 'register_taxonomy' ] );

		Taxonomy::init();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	public function test_init_adds_terms_clauses_filter_in_admin(): void {
		Monkey\Functions\when( 'is_admin' )->justReturn( true );

		Monkey\Functions\expect( 'add_action' )
			->once()
			->with( 'init', [ Taxonomy::class, 'register_taxonomy' ] );

		Monkey\Functions\expect( 'add_filter' )
			->once()
			->with( 'terms_clauses', [ Taxonomy::class, 'filter_terms_clauses_vmfo_order' ], 10, 3 );

		Monkey\Functions\expect( 'add_filter' )
			->once()
			->with( 'manage_edit-' . Taxonomy::TAXONOMY . '_sortable_columns', [ Taxonomy::class, 'filter_sortable_columns' ] );

		Taxonomy::init();

		$this->assertTrue( true );
	}

	public function test_filter_terms_clauses_vmfo_order_noop_outside_screen(): void {
		Monkey\Functions\when( 'is_admin' )->justReturn( true );
		Monkey\Functions\when( 'sanitize_text_field' )->alias( static fn( $v ) => $v );
		Monkey\Functions\when( 'wp_unslash' )->alias( static fn( $v ) => $v );

		$GLOBALS[ 'pagenow' ] = 'edit.php';

		$pieces = [ 'join' => '', 'orderby' => 'ORDER BY t.name ASC' ];
		$result = Taxonomy::filter_terms_clauses_vmfo_order( $pieces, [ Taxonomy::TAXONOMY ], [] );

		$this->assertSame( $pieces, $result );
	}

	public function test_filter_terms_clauses_vmfo_order_applies_on_edit_tags_screen(): void {
		Monkey\Functions\when( 'is_admin' )->justReturn( true );
		Monkey\Functions\when( 'sanitize_text_field' )->alias( static fn( $v ) => $v );
		Monkey\Functions\when( 'wp_unslash' )->alias( static fn( $v ) => $v );

		global $wpdb;
		$GLOBALS[ 'pagenow' ] = 'edit-tags.php';
		$wpdb               = (object) [ 'termmeta' => 'wp_termmeta' ];

		$_GET[ 'taxonomy' ]  = Taxonomy::TAXONOMY;
		$_GET[ 'post_type' ] = 'attachment';
		unset( $_GET[ 'orderby' ] );

		$pieces = [ 'join' => '', 'orderby' => 'ORDER BY t.name ASC', 'fields' => 't.*' ];
		$result = Taxonomy::filter_terms_clauses_vmfo_order( $pieces, [ Taxonomy::TAXONOMY ], [] );

		$this->assertStringContainsString( 'vmfo_order_meta', $result[ 'join' ] );
		$this->assertStringContainsString( "meta_key = 'vmfo_order'", $result[ 'join' ] );
		$this->assertStringContainsString( 'vmfo_parent', $result[ 'fields' ] );
		$this->assertStringContainsString( 'vmfo_order_missing', $result[ 'fields' ] );
		$this->assertStringContainsString( 'vmfo_order_num', $result[ 'fields' ] );
		$this->assertStringContainsString( 'vmfo_parent', $result[ 'orderby' ] );
		$this->assertStringContainsString( 'vmfo_order_num', $result[ 'orderby' ] );
		$this->assertStringContainsString( 't.name', $result[ 'orderby' ] );
	}

	public function test_register_taxonomy_registers_vmfo_folder(): void {
		Monkey\Functions\expect( 'register_taxonomy' )
			->once();

		Monkey\Functions\when( '_x' )->alias( static fn( $text ) => $text );
		Monkey\Functions\when( '__' )->alias( static fn( $text ) => $text );

		Taxonomy::register_taxonomy();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}
}
