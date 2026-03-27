<?php
/**
 * Abilities integration tests.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

namespace VirtualMediaFolders\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use VirtualMediaFolders\AbilitiesIntegration;

/**
 * Tests for AbilitiesIntegration.
 */
class AbilitiesIntegrationTest extends TestCase {
	/**
	 * Set up each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		$GLOBALS['vmfo_registered_abilities'] = [];
		$GLOBALS['vmfo_registered_ability_categories'] = [];

		Functions\when( '__' )->returnArg();
		Functions\when( 'absint' )->alias( static fn( mixed $value ): int => abs( (int) $value ) );
		Functions\when( 'is_wp_error' )->alias( static fn( mixed $value ): bool => $value instanceof \WP_Error );
	}

	/**
	 * Tear down after each test.
	 */
	protected function tearDown(): void {
		unset( $GLOBALS['vmfo_registered_abilities'] );
		unset( $GLOBALS['vmfo_registered_ability_categories'] );

		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test category registration metadata.
	 */
	public function test_register_categories_registers_folder_management_category(): void {
		AbilitiesIntegration::register_categories();

		$this->assertArrayHasKey( 'vmfo-folder-management', $GLOBALS['vmfo_registered_ability_categories'] );

		$args = $GLOBALS['vmfo_registered_ability_categories']['vmfo-folder-management'];

		$this->assertSame( 'Folder Management', $args['label'] );
		$this->assertNotEmpty( $args['description'] );
	}

	/**
	 * Test hook registration.
	 */
	public function test_init_registers_hook(): void {
		Functions\expect( 'add_action' )
			->once()
			->with( 'wp_abilities_api_categories_init', [ AbilitiesIntegration::class, 'register_categories' ] );

		Functions\expect( 'add_action' )
			->once()
			->with( 'wp_abilities_api_init', [ AbilitiesIntegration::class, 'register_abilities' ] );

		AbilitiesIntegration::init();

		$this->assertTrue( true );
	}

	/**
	 * Test ability registration metadata.
	 */
	public function test_register_abilities_registers_public_tool(): void {
		AbilitiesIntegration::register_abilities();

		$this->assertArrayHasKey( 'vmfo/list-folders', $GLOBALS['vmfo_registered_abilities'] );
		$this->assertArrayHasKey( 'vmfo/create-folder', $GLOBALS['vmfo_registered_abilities'] );
		$this->assertArrayHasKey( 'vmfo/add-to-folder', $GLOBALS['vmfo_registered_abilities'] );

		$list_args = $GLOBALS['vmfo_registered_abilities']['vmfo/list-folders'];

		$this->assertSame( 'vmfo-folder-management', $list_args['category'] );
		$this->assertTrue( $list_args['meta']['show_in_rest'] );
		$this->assertTrue( $list_args['meta']['mcp']['public'] );
		$this->assertSame( 'tool', $list_args['meta']['mcp']['type'] );
		$this->assertTrue( $list_args['meta']['annotations']['readonly'] );
		$this->assertIsCallable( $list_args['execute_callback'] );
		$this->assertIsCallable( $list_args['permission_callback'] );

		$create_args = $GLOBALS['vmfo_registered_abilities']['vmfo/create-folder'];

		$this->assertSame( 'vmfo-folder-management', $create_args['category'] );
		$this->assertTrue( $create_args['meta']['show_in_rest'] );
		$this->assertTrue( $create_args['meta']['mcp']['public'] );
		$this->assertSame( 'tool', $create_args['meta']['mcp']['type'] );
		$this->assertFalse( $create_args['meta']['annotations']['readonly'] );
		$this->assertFalse( $create_args['meta']['annotations']['idempotent'] );
		$this->assertIsCallable( $create_args['execute_callback'] );
		$this->assertIsCallable( $create_args['permission_callback'] );

		$args = $GLOBALS['vmfo_registered_abilities']['vmfo/add-to-folder'];

		$this->assertSame( 'vmfo-folder-management', $args['category'] );
		$this->assertTrue( $args['meta']['show_in_rest'] );
		$this->assertTrue( $args['meta']['mcp']['public'] );
		$this->assertSame( 'tool', $args['meta']['mcp']['type'] );
		$this->assertTrue( $args['meta']['annotations']['idempotent'] );
		$this->assertIsCallable( $args['execute_callback'] );
		$this->assertIsCallable( $args['permission_callback'] );
	}

	/**
	 * Test permission success.
	 */
	public function test_can_add_to_folder_allows_uploaders(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'upload_files' )
			->andReturn( true );

		$this->assertTrue( AbilitiesIntegration::can_add_to_folder() );
	}

	/**
	 * Test permission failure.
	 */
	public function test_can_add_to_folder_returns_wp_error_when_capability_missing(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'upload_files' )
			->andReturn( false );

		$result = AbilitiesIntegration::can_add_to_folder();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );
	}

	/**
	 * Test create-folder permission success.
	 */
	public function test_can_create_folder_allows_category_managers(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_categories' )
			->andReturn( true );

		$this->assertTrue( AbilitiesIntegration::can_create_folder() );
	}

	/**
	 * Test create-folder permission failure.
	 */
	public function test_can_create_folder_returns_wp_error_when_capability_missing(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_categories' )
			->andReturn( false );

		$result = AbilitiesIntegration::can_create_folder();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'rest_forbidden', $result->get_error_code() );
	}

	/**
	 * Test successful folder creation.
	 */
	public function test_execute_create_folder_returns_folder_payload(): void {
		Functions\when( 'get_term' )->alias(
			static function ( int $term_id, string $taxonomy ) {
				if ( 9 === $term_id ) {
					return (object) [
						'term_id'  => 9,
						'taxonomy' => $taxonomy,
						'name'     => 'Travel',
						'parent'   => 0,
						'count'    => 0,
					];
				}

				return null;
			}
		);
		Functions\when( 'wp_insert_term' )->alias(
			static fn( string $name, string $taxonomy, array $args ) => [
				'term_id'          => 9,
				'term_taxonomy_id' => 9,
			]
		);

		$result = AbilitiesIntegration::execute_create_folder(
			[
				'name'      => 'Travel',
				'parent_id' => 0,
			]
		);

		$this->assertIsArray( $result );
		$this->assertSame( 9, $result['id'] );
		$this->assertSame( 'Travel', $result['name'] );
		$this->assertSame( 0, $result['parent_id'] );
		$this->assertSame( 'Travel', $result['path'] );
		$this->assertSame( 0, $result['count'] );
	}

	/**
	 * Test create-folder duplicate mapping.
	 */
	public function test_execute_create_folder_maps_term_exists_error(): void {
		Functions\when( 'wp_insert_term' )->justReturn(
			new \WP_Error( 'term_exists', 'Term exists.' )
		);

		$result = AbilitiesIntegration::execute_create_folder(
			[
				'name'      => 'Travel',
				'parent_id' => 0,
			]
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'term_exists', $result->get_error_code() );
		$this->assertSame( 'A folder with this name already exists.', $result->get_error_message() );
	}

	/**
	 * Test successful multi-item assignment.
	 */
	public function test_execute_add_to_folder_processes_multiple_items(): void {
		Functions\when( 'get_term' )->alias(
			static fn( int $folder_id, string $taxonomy ) => (object) [
				'term_id'  => $folder_id,
				'taxonomy' => $taxonomy,
			]
		);
		Functions\when( 'get_post' )->alias(
			static fn( int $attachment_id ) => (object) [
				'ID'        => $attachment_id,
				'post_type' => 'attachment',
			]
		);
		Functions\when( 'wp_set_object_terms' )->justReturn( [ 19 ] );
		Functions\when( 'delete_post_meta' )->justReturn( true );

		$result = AbilitiesIntegration::execute_add_to_folder(
			[
				'folder_id'      => 19,
				'attachment_ids' => [ 3, 7 ],
			]
		);

		$this->assertIsArray( $result );
		$this->assertTrue( $result['success'] );
		$this->assertSame( 19, $result['folder_id'] );
		$this->assertSame( [ 3, 7 ], $result['attachment_ids'] );
		$this->assertSame( 2, $result['processed_count'] );
		$this->assertCount( 2, $result['results'] );
		$this->assertSame( 3, $result['results'][0]['media_id'] );
		$this->assertSame( 7, $result['results'][1]['media_id'] );
	}

	/**
	 * Test failed attachment validation before mutation.
	 */
	public function test_execute_add_to_folder_fails_before_mutation_when_attachment_missing(): void {
		Functions\when( 'get_term' )->alias(
			static fn( int $folder_id, string $taxonomy ) => (object) [
				'term_id'  => $folder_id,
				'taxonomy' => $taxonomy,
			]
		);
		Functions\when( 'get_post' )->alias(
			static fn( int $attachment_id ) => 11 === $attachment_id
				? null
				: (object) [
					'ID'        => $attachment_id,
					'post_type' => 'attachment',
				]
		);
		Functions\expect( 'wp_set_object_terms' )->never();

		$result = AbilitiesIntegration::execute_add_to_folder(
			[
				'folder_id'      => 19,
				'attachment_ids' => [ 11, 12 ],
			]
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'rest_media_not_found', $result->get_error_code() );
	}

	/**
	 * Test list-folders payload includes id/name/path mapping.
	 */
	public function test_execute_list_folders_returns_id_name_and_path_mapping(): void {
		$root = new \WP_Term(
			[
				'term_id' => 5,
				'name'    => 'Projects',
				'parent'  => 0,
				'count'   => 4,
			]
		);

		$child = new \WP_Term(
			[
				'term_id' => 11,
				'name'    => 'Client A',
				'parent'  => 5,
				'count'   => 2,
			]
		);

		Functions\when( 'get_terms' )->justReturn( [ $root, $child ] );

		$result = AbilitiesIntegration::execute_list_folders( [] );

		$this->assertIsArray( $result );
		$this->assertSame( 2, $result['total'] );
		$this->assertCount( 2, $result['folders'] );
		$this->assertSame( 5, $result['folders'][0]['id'] );
		$this->assertSame( 'Projects', $result['folders'][0]['path'] );
		$this->assertSame( 11, $result['folders'][1]['id'] );
		$this->assertSame( 'Projects / Client A', $result['folders'][1]['path'] );
	}
}