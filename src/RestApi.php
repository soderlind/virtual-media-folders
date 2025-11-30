<?php
/**
 * REST API Integration.
 *
 * Provides custom REST API endpoints for folder management
 * and folder suggestions.
 *
 * @package MediaManager
 * @since 1.0.0
 */

declare(strict_types=1);

namespace MediaManager;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * REST API handler.
 */
final class RestApi extends WP_REST_Controller {

	/**
	 * The namespace for the REST API.
	 *
	 * @var string
	 */
	protected $namespace = 'mediamanager/v1';

	/**
	 * Initialize the REST API.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'rest_api_init', [ new self(), 'register_routes' ] );
	}

	/**
	 * Register REST API routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		// Folder endpoints.
		register_rest_route(
			$this->namespace,
			'/folders',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_folders' ],
					'permission_callback' => [ $this, 'get_folders_permissions_check' ],
					'args'                => $this->get_collection_params(),
				],
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'create_folder' ],
					'permission_callback' => [ $this, 'create_folder_permissions_check' ],
					'args'                => [
						'name'   => [
							'required'          => true,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => __( 'The folder name.', 'mediamanager' ),
						],
						'parent' => [
							'type'              => 'integer',
							'default'           => 0,
							'sanitize_callback' => 'absint',
							'description'       => __( 'Parent folder ID.', 'mediamanager' ),
						],
					],
				],
				'schema' => [ $this, 'get_folder_schema' ],
			]
		);

		register_rest_route(
			$this->namespace,
			'/folders/(?P<id>[\d]+)',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_folder' ],
					'permission_callback' => [ $this, 'get_folders_permissions_check' ],
					'args'                => [
						'id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The folder ID.', 'mediamanager' ),
						],
					],
				],
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'update_folder' ],
					'permission_callback' => [ $this, 'update_folder_permissions_check' ],
					'args'                => [
						'id'     => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The folder ID.', 'mediamanager' ),
						],
						'name'   => [
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => __( 'The folder name.', 'mediamanager' ),
						],
						'parent' => [
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'Parent folder ID.', 'mediamanager' ),
						],
					],
				],
				[
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => [ $this, 'delete_folder' ],
					'permission_callback' => [ $this, 'delete_folder_permissions_check' ],
					'args'                => [
						'id'    => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The folder ID.', 'mediamanager' ),
						],
						'force' => [
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Whether to bypass trash and force deletion.', 'mediamanager' ),
						],
					],
				],
				'schema' => [ $this, 'get_folder_schema' ],
			]
		);

		// Folder media assignment endpoint.
		register_rest_route(
			$this->namespace,
			'/folders/(?P<id>[\d]+)/media',
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'add_media_to_folder' ],
					'permission_callback' => [ $this, 'update_folder_permissions_check' ],
					'args'                => [
						'id'       => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The folder ID.', 'mediamanager' ),
						],
						'media_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The media attachment ID.', 'mediamanager' ),
						],
					],
				],
				[
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => [ $this, 'remove_media_from_folder' ],
					'permission_callback' => [ $this, 'update_folder_permissions_check' ],
					'args'                => [
						'id'       => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The folder ID.', 'mediamanager' ),
						],
						'media_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The media attachment ID.', 'mediamanager' ),
						],
					],
				],
			]
		);

		// Suggestions endpoints.
		register_rest_route(
			$this->namespace,
			'/suggestions/(?P<media_id>[\d]+)',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_suggestions' ],
					'permission_callback' => [ $this, 'get_folders_permissions_check' ],
					'args'                => [
						'media_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The media attachment ID.', 'mediamanager' ),
						],
					],
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/suggestions/(?P<media_id>[\d]+)/apply',
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'apply_suggestion' ],
					'permission_callback' => [ $this, 'update_folder_permissions_check' ],
					'args'                => [
						'media_id'  => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The media attachment ID.', 'mediamanager' ),
						],
						'folder_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The folder ID to apply.', 'mediamanager' ),
						],
					],
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/suggestions/(?P<media_id>[\d]+)/dismiss',
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'dismiss_suggestions' ],
					'permission_callback' => [ $this, 'update_folder_permissions_check' ],
					'args'                => [
						'media_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The media attachment ID.', 'mediamanager' ),
						],
					],
				],
			]
		);
	}

	/**
	 * Check if current user can read folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_folders_permissions_check( WP_REST_Request $request ) {
		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to view folders.', 'mediamanager' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}
		return true;
	}

	/**
	 * Check if current user can create folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function create_folder_permissions_check( WP_REST_Request $request ) {
		if ( ! current_user_can( 'manage_categories' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to create folders.', 'mediamanager' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}
		return true;
	}

	/**
	 * Check if current user can update folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function update_folder_permissions_check( WP_REST_Request $request ) {
		if ( ! current_user_can( 'manage_categories' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to update folders.', 'mediamanager' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}
		return true;
	}

	/**
	 * Check if current user can delete folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function delete_folder_permissions_check( WP_REST_Request $request ) {
		if ( ! current_user_can( 'manage_categories' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to delete folders.', 'mediamanager' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}
		return true;
	}

	/**
	 * Get all folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_folders( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$args = [
			'taxonomy'   => 'media_folder',
			'hide_empty' => false,
			'orderby'    => 'name',
			'order'      => 'ASC',
		];

		$terms = get_terms( $args );

		if ( is_wp_error( $terms ) ) {
			return $terms;
		}

		$folders = [];
		foreach ( $terms as $term ) {
			$folders[] = $this->prepare_folder_for_response( $term );
		}

		return new WP_REST_Response( $folders, 200 );
	}

	/**
	 * Get a single folder.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_folder( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$folder_id = $request->get_param( 'id' );
		$term      = get_term( $folder_id, 'media_folder' );

		if ( is_wp_error( $term ) ) {
			return $term;
		}

		if ( ! $term ) {
			return new WP_Error(
				'rest_folder_not_found',
				__( 'Folder not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		return new WP_REST_Response( $this->prepare_folder_for_response( $term ), 200 );
	}

	/**
	 * Create a new folder.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_folder( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$name   = $request->get_param( 'name' );
		$parent = $request->get_param( 'parent' );

		$result = wp_insert_term(
			$name,
			'media_folder',
			[
				'parent' => $parent,
			]
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$term = get_term( $result[ 'term_id' ], 'media_folder' );

		return new WP_REST_Response( $this->prepare_folder_for_response( $term ), 201 );
	}

	/**
	 * Update a folder.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_folder( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$folder_id = $request->get_param( 'id' );
		$term      = get_term( $folder_id, 'media_folder' );

		if ( is_wp_error( $term ) ) {
			return $term;
		}

		if ( ! $term ) {
			return new WP_Error(
				'rest_folder_not_found',
				__( 'Folder not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		$args = [];

		$name = $request->get_param( 'name' );
		if ( $name !== null ) {
			$args[ 'name' ] = $name;
		}

		$parent = $request->get_param( 'parent' );
		if ( $parent !== null ) {
			// Prevent setting a folder as its own parent.
			if ( $parent === $folder_id ) {
				return new WP_Error(
					'rest_invalid_parent',
					__( 'A folder cannot be its own parent.', 'mediamanager' ),
					[ 'status' => 400 ]
				);
			}
			$args[ 'parent' ] = $parent;
		}

		if ( empty( $args ) ) {
			return new WP_REST_Response( $this->prepare_folder_for_response( $term ), 200 );
		}

		$result = wp_update_term( $folder_id, 'media_folder', $args );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$term = get_term( $result[ 'term_id' ], 'media_folder' );

		return new WP_REST_Response( $this->prepare_folder_for_response( $term ), 200 );
	}

	/**
	 * Delete a folder.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_folder( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$folder_id = $request->get_param( 'id' );
		$term      = get_term( $folder_id, 'media_folder' );

		if ( is_wp_error( $term ) ) {
			return $term;
		}

		if ( ! $term ) {
			return new WP_Error(
				'rest_folder_not_found',
				__( 'Folder not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		$result = wp_delete_term( $folder_id, 'media_folder' );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! $result ) {
			return new WP_Error(
				'rest_folder_delete_failed',
				__( 'Failed to delete folder.', 'mediamanager' ),
				[ 'status' => 500 ]
			);
		}

		return new WP_REST_Response(
			[
				'deleted' => true,
				'id'      => $folder_id,
			],
			200
		);
	}

	/**
	 * Add media to a folder.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function add_media_to_folder( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$folder_id = $request->get_param( 'id' );
		$media_id  = $request->get_param( 'media_id' );

		// Verify folder exists.
		$term = get_term( $folder_id, 'media_folder' );
		if ( is_wp_error( $term ) || ! $term ) {
			return new WP_Error(
				'rest_folder_not_found',
				__( 'Folder not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		// Verify media exists.
		$attachment = get_post( $media_id );
		if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
			return new WP_Error(
				'rest_media_not_found',
				__( 'Media not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		$result = wp_set_object_terms( $media_id, [ $folder_id ], 'media_folder', true );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Clear any dismissed suggestions since user is now organizing.
		delete_post_meta( $media_id, '_mm_suggestions_dismissed' );

		return new WP_REST_Response(
			[
				'success'   => true,
				'media_id'  => $media_id,
				'folder_id' => $folder_id,
				'message'   => __( 'Media added to folder.', 'mediamanager' ),
			],
			200
		);
	}

	/**
	 * Remove media from a folder.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function remove_media_from_folder( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$folder_id = $request->get_param( 'id' );
		$media_id  = $request->get_param( 'media_id' );

		// Verify media exists.
		$attachment = get_post( $media_id );
		if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
			return new WP_Error(
				'rest_media_not_found',
				__( 'Media not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		$result = wp_remove_object_terms( $media_id, $folder_id, 'media_folder' );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response(
			[
				'success'   => true,
				'media_id'  => $media_id,
				'folder_id' => $folder_id,
				'message'   => __( 'Media removed from folder.', 'mediamanager' ),
			],
			200
		);
	}

	/**
	 * Get folder suggestions for a media item.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_suggestions( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$media_id = $request->get_param( 'media_id' );

		// Verify media exists.
		$attachment = get_post( $media_id );
		if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
			return new WP_Error(
				'rest_media_not_found',
				__( 'Media not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		// Check if suggestions were dismissed.
		$dismissed = get_post_meta( $media_id, '_mm_suggestions_dismissed', true );
		if ( $dismissed ) {
			return new WP_REST_Response(
				[
					'suggestions' => [],
					'dismissed'   => true,
				],
				200
			);
		}

		// Get stored suggestions.
		$suggestions = get_post_meta( $media_id, '_mm_folder_suggestions', true );
		if ( ! is_array( $suggestions ) ) {
			$suggestions = [];
		}

		// Enrich suggestions with folder data.
		$enriched = [];
		foreach ( $suggestions as $folder_id ) {
			$term = get_term( $folder_id, 'media_folder' );
			if ( $term && ! is_wp_error( $term ) ) {
				$enriched[] = $this->prepare_folder_for_response( $term );
			}
		}

		return new WP_REST_Response(
			[
				'suggestions' => $enriched,
				'dismissed'   => false,
			],
			200
		);
	}

	/**
	 * Apply a folder suggestion.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function apply_suggestion( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$media_id  = $request->get_param( 'media_id' );
		$folder_id = $request->get_param( 'folder_id' );

		// Verify media exists.
		$attachment = get_post( $media_id );
		if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
			return new WP_Error(
				'rest_media_not_found',
				__( 'Media not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		// Verify folder exists.
		$term = get_term( $folder_id, 'media_folder' );
		if ( is_wp_error( $term ) || ! $term ) {
			return new WP_Error(
				'rest_folder_not_found',
				__( 'Folder not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		// Apply the folder.
		$result = wp_set_object_terms( $media_id, [ $folder_id ], 'media_folder', true );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Clear suggestions after applying.
		delete_post_meta( $media_id, '_mm_folder_suggestions' );
		delete_post_meta( $media_id, '_mm_suggestions_dismissed' );

		return new WP_REST_Response(
			[
				'success'   => true,
				'media_id'  => $media_id,
				'folder_id' => $folder_id,
				'message'   => __( 'Folder suggestion applied.', 'mediamanager' ),
			],
			200
		);
	}

	/**
	 * Dismiss folder suggestions for a media item.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function dismiss_suggestions( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$media_id = $request->get_param( 'media_id' );

		// Verify media exists.
		$attachment = get_post( $media_id );
		if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
			return new WP_Error(
				'rest_media_not_found',
				__( 'Media not found.', 'mediamanager' ),
				[ 'status' => 404 ]
			);
		}

		// Mark suggestions as dismissed.
		update_post_meta( $media_id, '_mm_suggestions_dismissed', true );

		return new WP_REST_Response(
			[
				'success'  => true,
				'media_id' => $media_id,
				'message'  => __( 'Suggestions dismissed.', 'mediamanager' ),
			],
			200
		);
	}

	/**
	 * Prepare a folder term for API response.
	 *
	 * @param \WP_Term|object $term The term object.
	 * @return array<string, mixed>
	 */
	private function prepare_folder_for_response( object $term ): array {
		return [
			'id'          => $term->term_id,
			'name'        => $term->name,
			'slug'        => $term->slug,
			'description' => $term->description,
			'parent'      => $term->parent,
			'count'       => $term->count,
			'_links'      => [
				'self'       => [
					[
						'href' => rest_url( $this->namespace . '/folders/' . $term->term_id ),
					],
				],
				'collection' => [
					[
						'href' => rest_url( $this->namespace . '/folders' ),
					],
				],
			],
		];
	}

	/**
	 * Get the folder schema.
	 *
	 * @return array<string, mixed>
	 */
	public function get_folder_schema(): array {
		return [
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'media-folder',
			'type'       => 'object',
			'properties' => [
				'id'          => [
					'description' => __( 'Unique identifier for the folder.', 'mediamanager' ),
					'type'        => 'integer',
					'context'     => [ 'view', 'edit' ],
					'readonly'    => true,
				],
				'name'        => [
					'description' => __( 'The name of the folder.', 'mediamanager' ),
					'type'        => 'string',
					'context'     => [ 'view', 'edit' ],
					'required'    => true,
				],
				'slug'        => [
					'description' => __( 'The slug of the folder.', 'mediamanager' ),
					'type'        => 'string',
					'context'     => [ 'view', 'edit' ],
				],
				'description' => [
					'description' => __( 'The description of the folder.', 'mediamanager' ),
					'type'        => 'string',
					'context'     => [ 'view', 'edit' ],
				],
				'parent'      => [
					'description' => __( 'The parent folder ID.', 'mediamanager' ),
					'type'        => 'integer',
					'context'     => [ 'view', 'edit' ],
					'default'     => 0,
				],
				'count'       => [
					'description' => __( 'Number of media items in this folder.', 'mediamanager' ),
					'type'        => 'integer',
					'context'     => [ 'view' ],
					'readonly'    => true,
				],
			],
		];
	}

	/**
	 * Get collection params for folders.
	 *
	 * @return array<string, array>
	 */
	public function get_collection_params(): array {
		return [
			'hide_empty' => [
				'description' => __( 'Whether to hide folders with no media.', 'mediamanager' ),
				'type'        => 'boolean',
				'default'     => false,
			],
			'parent'     => [
				'description' => __( 'Filter by parent folder ID.', 'mediamanager' ),
				'type'        => 'integer',
				'default'     => null,
			],
		];
	}
}
