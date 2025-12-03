<?php

namespace MediaManagerTests;

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
		Monkey\Functions\expect( 'add_action' )
			->once()
			->with( 'init', [ Taxonomy::class, 'register_taxonomy' ] );

		Taxonomy::init();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}

	public function test_register_taxonomy_registers_media_folder(): void {
		Monkey\Functions\expect( 'register_taxonomy' )
			->once();

		Monkey\Functions\when( '_x' )->alias( static fn( $text ) => $text );
		Monkey\Functions\when( '__' )->alias( static fn( $text ) => $text );

		Taxonomy::register_taxonomy();

		$this->assertTrue( true ); // Expectation verified by Brain\Monkey
	}
}
