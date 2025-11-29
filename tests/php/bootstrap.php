<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package MediaManager
 */

// Load autoloader first - this includes Patchwork before any function definitions
require dirname( __DIR__, 2 ) . '/vendor/autoload.php';

// Define WordPress constants for testing.
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', '/tmp/wordpress/' );
}

// Mock WordPress REST API classes needed for testing.
if ( ! class_exists( 'WP_REST_Controller' ) ) {
	// phpcs:ignore
	class WP_REST_Controller {
		protected $namespace = '';
	}
}

if ( ! class_exists( 'WP_REST_Server' ) ) {
	// phpcs:ignore
	class WP_REST_Server {
		const READABLE   = 'GET';
		const CREATABLE  = 'POST';
		const EDITABLE   = 'POST, PUT, PATCH';
		const DELETABLE  = 'DELETE';
		const ALLMETHODS = 'GET, POST, PUT, PATCH, DELETE';
	}
}

if ( ! class_exists( 'WP_REST_Request' ) ) {
	// phpcs:ignore
	class WP_REST_Request {
		private array $params = [];

		public function get_param( string $key ) {
			return $this->params[ $key ] ?? null;
		}

		public function set_param( string $key, $value ): void {
			$this->params[ $key ] = $value;
		}
	}
}

if ( ! class_exists( 'WP_REST_Response' ) ) {
	// phpcs:ignore
	class WP_REST_Response {
		public $data;
		public int $status;

		public function __construct( $data = null, int $status = 200 ) {
			$this->data   = $data;
			$this->status = $status;
		}

		public function get_data() {
			return $this->data;
		}

		public function get_status(): int {
			return $this->status;
		}
	}
}

if ( ! class_exists( 'WP_Error' ) ) {
	// phpcs:ignore
	class WP_Error {
		public string $code;
		public string $message;
		public array $data;

		public function __construct( string $code = '', string $message = '', $data = '' ) {
			$this->code    = $code;
			$this->message = $message;
			$this->data    = is_array( $data ) ? $data : [];
		}

		public function get_error_code(): string {
			return $this->code;
		}

		public function get_error_message(): string {
			return $this->message;
		}
	}
}

if ( ! class_exists( 'WP_Term' ) ) {
	// phpcs:ignore
	class WP_Term {
		public int $term_id = 0;
		public string $name = '';
		public string $slug = '';
		public string $description = '';
		public int $parent = 0;
		public int $count = 0;
		public string $taxonomy = 'media_folder';

		public function __construct( array $data = [] ) {
			$this->term_id     = $data[ 'term_id' ] ?? 0;
			$this->name        = $data[ 'name' ] ?? '';
			$this->slug        = $data[ 'slug' ] ?? '';
			$this->description = $data[ 'description' ] ?? '';
			$this->parent      = $data[ 'parent' ] ?? 0;
			$this->count       = $data[ 'count' ] ?? 0;
			$this->taxonomy    = $data[ 'taxonomy' ] ?? 'media_folder';
		}
	}
}

// Mock WordPress functions for REST API.
if ( ! function_exists( 'rest_url' ) ) {
	function rest_url( string $path = '' ): string {
		return 'https://example.com/wp-json/' . ltrim( $path, '/' );
	}
}

if ( ! function_exists( 'rest_authorization_required_code' ) ) {
	function rest_authorization_required_code(): int {
		return 401;
	}
}

// Load plugin classes needed in tests.
require dirname( __DIR__, 2 ) . '/includes/class-taxonomy.php';
require dirname( __DIR__, 2 ) . '/includes/class-suggestions.php';
require dirname( __DIR__, 2 ) . '/includes/class-admin.php';
require dirname( __DIR__, 2 ) . '/includes/class-editor.php';
require dirname( __DIR__, 2 ) . '/includes/class-rest-api.php';
