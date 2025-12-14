<?php
/**
 * REST API tests.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

namespace VirtualMediaFolders\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use VirtualMediaFolders\RestApi;
use PHPUnit\Framework\TestCase;

/**
 * REST API test class.
 */
class RestApiTest extends TestCase {
	/**
	 * Test instance.
	 */
	private RestApi $api;

	/**
	 * Set up each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Mock WordPress translation function.
		Functions\when( '__' )->returnArg();
		Functions\when( 'esc_html__' )->returnArg();

		$this->api = new RestApi();
	}

	/**
	 * Tear down after each test.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test that RestApi class can be instantiated.
	 */
	public function test_class_exists(): void {
		$this->assertInstanceOf( RestApi::class, $this->api );
	}

	/**
	 * Test namespace is set correctly.
	 */
	public function test_namespace(): void {
		$reflection = new \ReflectionClass( $this->api );
		$property   = $reflection->getProperty( 'namespace' );
		$property->setAccessible( true );

		$this->assertEquals( 'vmfo/v1', $property->getValue( $this->api ) );
	}

	/**
	 * Test get_folder_schema returns valid schema.
	 */
	public function test_get_folder_schema(): void {
		$schema = $this->api->get_folder_schema();

		$this->assertIsArray( $schema );
		$this->assertArrayHasKey( '$schema', $schema );
		$this->assertArrayHasKey( 'title', $schema );
		$this->assertArrayHasKey( 'type', $schema );
		$this->assertArrayHasKey( 'properties', $schema );
		$this->assertEquals( 'vmfo-folder', $schema[ 'title' ] );
		$this->assertEquals( 'object', $schema[ 'type' ] );
	}

	/**
	 * Test schema has required properties.
	 */
	public function test_folder_schema_properties(): void {
		$schema     = $this->api->get_folder_schema();
		$properties = $schema[ 'properties' ];

		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'parent', $properties );
		$this->assertArrayHasKey( 'count', $properties );
	}

	/**
	 * Test get_collection_params returns valid params.
	 */
	public function test_get_collection_params(): void {
		$params = $this->api->get_collection_params();

		$this->assertIsArray( $params );
		$this->assertArrayHasKey( 'hide_empty', $params );
		$this->assertArrayHasKey( 'parent', $params );
	}

	/**
	 * Test collection params have correct defaults.
	 */
	public function test_collection_params_defaults(): void {
		$params = $this->api->get_collection_params();

		$this->assertFalse( $params[ 'hide_empty' ][ 'default' ] );
		$this->assertNull( $params[ 'parent' ][ 'default' ] );
	}

	/**
	 * Test prepare_folder_for_response using reflection.
	 */
	public function test_prepare_folder_for_response(): void {
		// Mock get_term_meta for vmfo_order
		Functions\when( 'get_term_meta' )->justReturn( 3 );

		$term = new \WP_Term( [
			'term_id'     => 42,
			'name'        => 'Test Folder',
			'slug'        => 'test-folder',
			'description' => 'A test folder',
			'parent'      => 0,
			'count'       => 5,
		] );

		$reflection = new \ReflectionClass( $this->api );
		$method     = $reflection->getMethod( 'prepare_folder_for_response' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->api, $term );

		$this->assertIsArray( $result );
		$this->assertEquals( 42, $result[ 'id' ] );
		$this->assertEquals( 'Test Folder', $result[ 'name' ] );
		$this->assertEquals( 'test-folder', $result[ 'slug' ] );
		$this->assertEquals( 'A test folder', $result[ 'description' ] );
		$this->assertEquals( 0, $result[ 'parent' ] );
		$this->assertEquals( 5, $result[ 'count' ] );
		$this->assertEquals( 3, $result[ 'vmfo_order' ] );
		$this->assertArrayHasKey( '_links', $result );
	}

	/**
	 * Test response links structure.
	 */
	public function test_prepare_folder_response_links(): void {
		// Mock get_term_meta for vmfo_order
		Functions\when( 'get_term_meta' )->justReturn( '' );

		$term = new \WP_Term( [
			'term_id' => 42,
			'name'    => 'Test Folder',
			'slug'    => 'test-folder',
		] );

		$reflection = new \ReflectionClass( $this->api );
		$method     = $reflection->getMethod( 'prepare_folder_for_response' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->api, $term );

		$this->assertArrayHasKey( 'self', $result[ '_links' ] );
		$this->assertArrayHasKey( 'collection', $result[ '_links' ] );
	}
}
