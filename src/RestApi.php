<?php
/**
 * REST API Integration.
 *
 * Provides custom REST API endpoints for folder management
 * and folder suggestions.
 *
 * @package VirtualMediaFolders
 * @since 1.0.0
 */

declare(strict_types=1);

namespace VirtualMediaFolders;

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
	protected $namespace = 'vmfo/v1';

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
							'description'       => __( 'The folder name.', 'virtual-media-folders' ),
						],
						'parent' => [
							'type'              => 'integer',
							'default'           => 0,
							'sanitize_callback' => 'absint',
							'description'       => __( 'Parent folder ID.', 'virtual-media-folders' ),
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
							'description'       => __( 'The folder ID.', 'virtual-media-folders' ),
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
							'description'       => __( 'The folder ID.', 'virtual-media-folders' ),
						],
						'name'   => [
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => __( 'The folder name.', 'virtual-media-folders' ),
						],
						'parent' => [
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'Parent folder ID.', 'virtual-media-folders' ),
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
							'description'       => __( 'The folder ID.', 'virtual-media-folders' ),
						],
						'force' => [
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Whether to bypass trash and force deletion.', 'virtual-media-folders' ),
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
							'description'       => __( 'The folder ID.', 'virtual-media-folders' ),
						],
						'media_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The media attachment ID.', 'virtual-media-folders' ),
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
							'description'       => __( 'The folder ID.', 'virtual-media-folders' ),
						],
						'media_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The media attachment ID.', 'virtual-media-folders' ),
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
							'description'       => __( 'The media attachment ID.', 'virtual-media-folders' ),
						],
					],
				],
			]
		);

		// Folder counts filtered by media type.
		register_rest_route(
			$this->namespace,
			'/folders/counts',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_folder_counts' ],
					'permission_callback' => [ $this, 'get_folders_permissions_check' ],
					'args'                => [
						'media_type' => [
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => __( 'Filter counts by media type (image, audio, video, application).', 'virtual-media-folders' ),
						],
					],
				],
			]
		);

		// Folder reorder endpoint.
		register_rest_route(
			$this->namespace,
			'/folders/reorder',
			[
				[
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'reorder_folders' ],
					'permission_callback' => [ $this, 'update_folder_permissions_check' ],
					'args'                => [
						'order'  => [
							'required'    => true,
							'type'        => 'array',
							'description' => __( 'Array of folder IDs in desired order.', 'virtual-media-folders' ),
							'items'       => [
								'type' => 'integer',
							],
						],
						'parent' => [
							'type'              => 'integer',
							'default'           => 0,
							'sanitize_callback' => 'absint',
							'description'       => __( 'Parent folder ID (0 for root level).', 'virtual-media-folders' ),
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
							'description'       => __( 'The media attachment ID.', 'virtual-media-folders' ),
						],
						'folder_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'description'       => __( 'The folder ID to apply.', 'virtual-media-folders' ),
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
							'description'       => __( 'The media attachment ID.', 'virtual-media-folders' ),
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
		return $this->check_capability( 'upload_files', __( 'You do not have permission to view folders.', 'virtual-media-folders' ) );
	}

	/**
	 * Check if current user can create folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function create_folder_permissions_check( WP_REST_Request $request ) {
		return $this->check_capability( 'manage_categories', __( 'You do not have permission to create folders.', 'virtual-media-folders' ) );
	}

	/**
	 * Check if current user can update folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function update_folder_permissions_check( WP_REST_Request $request ) {
		return $this->check_capability( 'manage_categories', __( 'You do not have permission to update folders.', 'virtual-media-folders' ) );
	}

	/**
	 * Check if current user can delete folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function delete_folder_permissions_check( WP_REST_Request $request ) {
		return $this->check_capability( 'manage_categories', __( 'You do not have permission to delete folders.', 'virtual-media-folders' ) );
	}

	/**
	 * Get all folders.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_folders( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$args = [
			'taxonomy'   => Taxonomy::TAXONOMY,
			'hide_empty' => false,
			'number'     => 0, // Ensure no limit
		];

		$terms = get_terms( $args );

		if ( is_wp_error( $terms ) ) {
			return $terms;
		}

		// Sort terms: those with vmfo_order first (by order), then those without (by name)
		usort( $terms, function ( $a, $b ) {
			$order_a = get_term_meta( $a->term_id, 'vmfo_order', true );
			$order_b = get_term_meta( $b->term_id, 'vmfo_order', true );

			// If both have order, sort by order
			if ( $order_a !== '' && $order_b !== '' ) {
				return (int) $order_a - (int) $order_b;
			}
			// If only one has order, it comes first
			if ( $order_a !== '' ) {
				return -1;
			}
			if ( $order_b !== '' ) {
				return 1;
			}
			// Neither has order, sort by name
			return strcasecmp( $a->name, $b->name );
		} );

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
		$term      = $this->get_folder_or_error( $folder_id );

		if ( is_wp_error( $term ) ) {
			return $term;
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
			Taxonomy::TAXONOMY,
			[
				'parent' => $parent,
			]
		);

		if ( is_wp_error( $result ) ) {
			$error_code = $result->get_error_code();

			// Map WordPress term errors to user-friendly folder messages.
			$error_messages = [
				'term_exists'       => __( 'A folder with this name already exists.', 'virtual-media-folders' ),
				'empty_term_name'   => __( 'Folder name cannot be empty.', 'virtual-media-folders' ),
				'invalid_term'      => __( 'Invalid folder.', 'virtual-media-folders' ),
				'invalid_taxonomy'  => __( 'Invalid folder taxonomy.', 'virtual-media-folders' ),
				'parent_not_exists' => __( 'Parent folder does not exist.', 'virtual-media-folders' ),
			];

			$message = $error_messages[ $error_code ] ?? $result->get_error_message();

			return new WP_Error(
				$error_code,
				$message,
				[ 'status' => 400 ]
			);
		}

		$term = get_term( $result[ 'term_id' ], Taxonomy::TAXONOMY );

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
		$term      = $this->get_folder_or_error( $folder_id );

		if ( is_wp_error( $term ) ) {
			return $term;
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
					__( 'A folder cannot be its own parent.', 'virtual-media-folders' ),
					[ 'status' => 400 ]
				);
			}
			$args[ 'parent' ] = $parent;
		}

		if ( empty( $args ) ) {
			return new WP_REST_Response( $this->prepare_folder_for_response( $term ), 200 );
		}

		$result = wp_update_term( $folder_id, Taxonomy::TAXONOMY, $args );

		if ( is_wp_error( $result ) ) {
			$error_code = $result->get_error_code();

			// Map WordPress term errors to user-friendly folder messages.
			$error_messages = [
				'term_exists'       => __( 'A folder with this name already exists.', 'virtual-media-folders' ),
				'empty_term_name'   => __( 'Folder name cannot be empty.', 'virtual-media-folders' ),
				'invalid_term'      => __( 'Invalid folder.', 'virtual-media-folders' ),
				'invalid_taxonomy'  => __( 'Invalid folder taxonomy.', 'virtual-media-folders' ),
				'parent_not_exists' => __( 'Parent folder does not exist.', 'virtual-media-folders' ),
			];

			$message = $error_messages[ $error_code ] ?? $result->get_error_message();

			return new WP_Error(
				$error_code,
				$message,
				[ 'status' => 400 ]
			);
		}

		$term = get_term( $result[ 'term_id' ], Taxonomy::TAXONOMY );

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
		$term      = $this->get_folder_or_error( $folder_id );

		if ( is_wp_error( $term ) ) {
			return $term;
		}

		$result = wp_delete_term( $folder_id, Taxonomy::TAXONOMY );

		if ( is_wp_error( $result ) ) {
			$error_code = $result->get_error_code();

			// Map WordPress term errors to user-friendly folder messages.
			$error_messages = [
				'invalid_term'     => __( 'Invalid folder.', 'virtual-media-folders' ),
				'invalid_taxonomy' => __( 'Invalid folder taxonomy.', 'virtual-media-folders' ),
			];

			$message = $error_messages[ $error_code ] ?? $result->get_error_message();

			return new WP_Error(
				$error_code,
				$message,
				[ 'status' => 400 ]
			);
		}

		if ( ! $result ) {
			return new WP_Error(
				'rest_folder_delete_failed',
				__( 'Failed to delete folder.', 'virtual-media-folders' ),
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
	 * Reorder folders within a parent.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function reorder_folders( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$order     = $request->get_param( 'order' );
		$parent_id = $request->get_param( 'parent' );

		if ( ! is_array( $order ) ) {
			return new WP_Error(
				'rest_invalid_order',
				__( 'Order must be an array of folder IDs.', 'virtual-media-folders' ),
				[ 'status' => 400 ]
			);
		}

		// Update menu_order for each folder
		foreach ( $order as $position => $folder_id ) {
			$folder_id = absint( $folder_id );
			$term      = get_term( $folder_id, Taxonomy::TAXONOMY );

			if ( ! $term || is_wp_error( $term ) ) {
				continue;
			}

			// Only reorder folders with the specified parent
			if ( (int) $term->parent !== (int) $parent_id ) {
				continue;
			}

			update_term_meta( $folder_id, 'vmfo_order', $position );
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => __( 'Folders reordered successfully.', 'virtual-media-folders' ),
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

		$folder = $this->get_folder_or_error( $folder_id );
		if ( is_wp_error( $folder ) ) {
			return $folder;
		}

		$attachment = $this->get_attachment_or_error( $media_id );
		if ( is_wp_error( $attachment ) ) {
			return $attachment;
		}

		$result = $this->assign_media_to_folder( $media_id, $folder_id, __( 'Folder suggestion applied.', 'virtual-media-folders' ) );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $result, 200 );
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

		$attachment = $this->get_attachment_or_error( $media_id );
		if ( is_wp_error( $attachment ) ) {
			return $attachment;
		}

		$result = wp_remove_object_terms( $media_id, $folder_id, Taxonomy::TAXONOMY );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response(
			[
				'success'   => true,
				'media_id'  => $media_id,
				'folder_id' => $folder_id,
				'message'   => __( 'Media removed from folder.', 'virtual-media-folders' ),
			],
			200
		);
	}

	/**
	 * Get folder counts filtered by media type.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_folder_counts( WP_REST_Request $request ): WP_REST_Response {
		$media_type = $request->get_param( 'media_type' );

		// Build mime type query based on media_type.
		$mime_types = $this->get_mime_types_for_filter( $media_type );

		// Get all folders.
		// When no filter is active, ask WP to pad counts for hierarchical taxonomies.
		$terms = get_terms(
			[
				'taxonomy'     => Taxonomy::TAXONOMY,
				'hide_empty'   => false,
				'pad_counts'   => empty( $mime_types ),
				'number'       => 0,
				'hierarchical' => true,
			]
		);

		if ( is_wp_error( $terms ) ) {
			return new WP_REST_Response( [], 200 );
		}

		// Fast path: use the (padded) term counts already computed by WP.
		if ( empty( $mime_types ) ) {
			$counts = [];
			foreach ( $terms as $term ) {
				$counts[ (int) $term->term_id ] = (int) $term->count;
			}
			return new WP_REST_Response( $counts, 200 );
		}

		global $wpdb;

		// Aggregate direct counts per term in a single query.
		$placeholders = implode( ',', array_fill( 0, count( $mime_types ), '%s' ) );
		$sql          = "SELECT tt.term_id, COUNT(DISTINCT p.ID) AS cnt\n" .
			"FROM {$wpdb->term_relationships} tr\n" .
			"INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id\n" .
			"INNER JOIN {$wpdb->posts} p ON p.ID = tr.object_id\n" .
			"WHERE tt.taxonomy = %s\n" .
			"AND p.post_type = 'attachment'\n" .
			"AND p.post_status = 'inherit'\n" .
			"AND p.post_mime_type IN ({$placeholders})\n" .
			"GROUP BY tt.term_id";

		$params = array_merge( [ Taxonomy::TAXONOMY ], $mime_types );
		$rows   = $wpdb->get_results( $wpdb->prepare( $sql, $params ), 'ARRAY_A' );

		$direct_counts = [];
		foreach ( $rows as $row ) {
			$term_id                   = (int) ( $row[ 'term_id' ] ?? 0 );
			$direct_counts[ $term_id ] = (int) ( $row[ 'cnt' ] ?? 0 );
		}

		// Build parent/children maps from term hierarchy and pad counts (include children).
		$children = [];
		$totals   = [];
		foreach ( $terms as $term ) {
			$term_id              = (int) $term->term_id;
			$children[ $term_id ] = [];
			$totals[ $term_id ]   = $direct_counts[ $term_id ] ?? 0;
		}
		foreach ( $terms as $term ) {
			$term_id = (int) $term->term_id;
			$parent  = (int) $term->parent;
			if ( $parent > 0 && isset( $children[ $parent ] ) ) {
				$children[ $parent ][] = $term_id;
			}
		}

		$state = [];
		foreach ( array_keys( $children ) as $root_id ) {
			if ( ( $state[ $root_id ] ?? 0 ) === 2 ) {
				continue;
			}

			$stack = [ [ $root_id, false ] ];
			while ( ! empty( $stack ) ) {
				[ $node, $done ] = array_pop( $stack );

				if ( $done ) {
					$sum = $totals[ $node ] ?? 0;
					foreach ( $children[ $node ] ?? [] as $child ) {
						$sum += $totals[ $child ] ?? 0;
					}
					$totals[ $node ] = $sum;
					$state[ $node ]  = 2;
					continue;
				}

				if ( ( $state[ $node ] ?? 0 ) === 2 ) {
					continue;
				}

				$state[ $node ] = 1;
				$stack[]        = [ $node, true ];
				foreach ( $children[ $node ] ?? [] as $child ) {
					if ( ( $state[ $child ] ?? 0 ) !== 2 ) {
						$stack[] = [ $child, false ];
					}
				}
			}
		}

		return new WP_REST_Response( $totals, 200 );
	}

	/**
	 * Get MIME types for a given media type filter.
	 *
	 * @param string $media_type The media type filter (image, audio, video, application, or comma-separated MIME types).
	 * @return array Array of MIME types.
	 */
	private function get_mime_types_for_filter( ?string $media_type ): array {
		if ( empty( $media_type ) || $media_type === 'all' ) {
			return [];
		}

		// If it contains commas, it's a list of MIME types from WordPress filter
		if ( strpos( $media_type, ',' ) !== false ) {
			return array_map( 'trim', explode( ',', $media_type ) );
		}

		// Match WordPress media library filter values.
		switch ( $media_type ) {
			case 'image':
				return [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/heic' ];
			case 'audio':
				return [ 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-ms-wma', 'audio/x-ms-wax', 'audio/flac', 'audio/aac', 'audio/m4a' ];
			case 'video':
				return [ 'video/mp4', 'video/webm', 'video/ogg', 'video/x-ms-wmv', 'video/x-ms-asf', 'video/avi', 'video/quicktime', 'video/x-msvideo' ];
			case 'application':
			case 'document':
				return [
					'application/pdf',
					'application/msword',
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
					'application/vnd.ms-excel',
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'application/vnd.ms-powerpoint',
					'application/vnd.openxmlformats-officedocument.presentationml.presentation',
					'application/zip',
					'application/x-rar-compressed',
					'text/plain',
					'text/csv',
				];
			default:
				// If it looks like a full mime type, use it directly.
				if ( strpos( $media_type, '/' ) !== false ) {
					return [ $media_type ];
				}
				return [];
		}
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
				__( 'Media not found.', 'virtual-media-folders' ),
				[ 'status' => 404 ]
			);
		}

		// Check if suggestions were dismissed.
		$dismissed = get_post_meta( $media_id, '_vmfo_suggestions_dismissed', true );
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
		// Note: Suggestions are stored as strings (e.g. "Images", "2025/11").
		// For backward compatibility, numeric values are treated as term IDs and resolved to term names.
		$suggestions = get_post_meta( $media_id, '_vmfo_folder_suggestions', true );
		if ( ! is_array( $suggestions ) ) {
			$suggestions = [];
		}

		$labels = [];
		foreach ( $suggestions as $suggestion ) {
			$label = $this->normalize_suggestion_label( $suggestion );
			if ( $label !== '' ) {
				$labels[] = $label;
			}
		}

		$labels = array_values( array_unique( $labels ) );

		return new WP_REST_Response(
			[
				'suggestions' => $labels,
				'dismissed'   => false,
			],
			200
		);
	}

	/**
	 * Normalize a stored suggestion into a human-readable label.
	 *
	 * @param mixed $value Stored suggestion value.
	 * @return string Suggestion label.
	 */
	private function normalize_suggestion_label( $value ): string {
		if ( is_int( $value ) || ( is_string( $value ) && ctype_digit( $value ) ) ) {
			$term_id = is_int( $value ) ? $value : (int) $value;
			$term_id = abs( $term_id );
			if ( $term_id > 0 ) {
				$term = get_term( $term_id, Taxonomy::TAXONOMY );
				if ( $term && ! is_wp_error( $term ) && isset( $term->name ) ) {
					return (string) $term->name;
				}
			}
			return '';
		}

		if ( is_string( $value ) ) {
			return trim( $value );
		}

		return '';
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

		$attachment = $this->get_attachment_or_error( $media_id );
		if ( is_wp_error( $attachment ) ) {
			return $attachment;
		}

		$folder = $this->get_folder_or_error( $folder_id );
		if ( is_wp_error( $folder ) ) {
			return $folder;
		}

		$result = $this->assign_media_to_folder( $media_id, $folder_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Dismiss folder suggestions for a media item.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function dismiss_suggestions( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$media_id = $request->get_param( 'media_id' );

		$attachment = $this->get_attachment_or_error( $media_id );
		if ( is_wp_error( $attachment ) ) {
			return $attachment;
		}

		// Mark suggestions as dismissed.
		update_post_meta( $media_id, '_vmfo_suggestions_dismissed', true );

		return new WP_REST_Response(
			[
				'success'  => true,
				'media_id' => $media_id,
				'message'  => __( 'Suggestions dismissed.', 'virtual-media-folders' ),
			],
			200
		);
	}

	/**
	 * Check a capability and return a standard REST error when missing.
	 *
	 * @param string $capability Capability to check.
	 * @param string $message    Error message when unauthorized.
	 * @return bool|WP_Error
	 */
	private function check_capability( string $capability, string $message ) {
		if ( ! current_user_can( $capability ) ) {
			return new WP_Error(
				'rest_forbidden',
				$message,
				[ 'status' => rest_authorization_required_code() ]
			);
		}

		return true;
	}

	/**
	 * Fetch a folder term or return a REST-friendly error.
	 *
	 * @param int $folder_id Folder term ID.
	 * @return \WP_Term|WP_Error
	 */
	private function get_folder_or_error( int $folder_id ) {
		$term = get_term( $folder_id, Taxonomy::TAXONOMY );

		if ( is_wp_error( $term ) ) {
			return $term;
		}

		if ( ! $term ) {
			return new WP_Error(
				'rest_folder_not_found',
				__( 'Folder not found.', 'virtual-media-folders' ),
				[ 'status' => 404 ]
			);
		}

		return $term;
	}

	/**
	 * Fetch an attachment or return a REST-friendly error.
	 *
	 * @param int $media_id Attachment post ID.
	 * @return \WP_Post|WP_Error
	 */
	private function get_attachment_or_error( int $media_id ) {
		$attachment = get_post( $media_id );

		if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
			return new WP_Error(
				'rest_media_not_found',
				__( 'Media not found.', 'virtual-media-folders' ),
				[ 'status' => 404 ]
			);
		}

		return $attachment;
	}

	/**
	 * Assign media to a folder and clear suggestion metadata.
	 *
	 * @param int $media_id  Attachment ID.
	 * @param int $folder_id Folder term ID.
	 * @return array|WP_Error
	 */
	private function assign_media_to_folder( int $media_id, int $folder_id, string $message = '' ) {
		$result = wp_set_object_terms( $media_id, [ $folder_id ], Taxonomy::TAXONOMY, true );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		delete_post_meta( $media_id, '_vmfo_folder_suggestions' );
		delete_post_meta( $media_id, '_vmfo_suggestions_dismissed' );

		$success_message = $message !== '' ? $message : __( 'Media added to folder.', 'virtual-media-folders' );

		return [
			'success'   => true,
			'media_id'  => $media_id,
			'folder_id' => $folder_id,
			'message'   => $success_message,
		];
	}

	/**
	 * Prepare a folder term for API response.
	 *
	 * @param \WP_Term|object $term The term object.
	 * @return array<string, mixed>
	 */
	private function prepare_folder_for_response( object $term ): array {
		$vmfo_order = get_term_meta( $term->term_id, 'vmfo_order', true );

		return [
			'id'          => $term->term_id,
			'name'        => $term->name,
			'slug'        => $term->slug,
			'description' => $term->description,
			'parent'      => $term->parent,
			'count'       => $term->count,
			'vmfo_order'  => $vmfo_order !== '' ? (int) $vmfo_order : null,
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
			'title'      => 'vmfo-folder',
			'type'       => 'object',
			'properties' => [
				'id'          => [
					'description' => __( 'Unique identifier for the folder.', 'virtual-media-folders' ),
					'type'        => 'integer',
					'context'     => [ 'view', 'edit' ],
					'readonly'    => true,
				],
				'name'        => [
					'description' => __( 'The name of the folder.', 'virtual-media-folders' ),
					'type'        => 'string',
					'context'     => [ 'view', 'edit' ],
					'required'    => true,
				],
				'slug'        => [
					'description' => __( 'The slug of the folder.', 'virtual-media-folders' ),
					'type'        => 'string',
					'context'     => [ 'view', 'edit' ],
				],
				'description' => [
					'description' => __( 'The description of the folder.', 'virtual-media-folders' ),
					'type'        => 'string',
					'context'     => [ 'view', 'edit' ],
				],
				'parent'      => [
					'description' => __( 'The parent folder ID.', 'virtual-media-folders' ),
					'type'        => 'integer',
					'context'     => [ 'view', 'edit' ],
					'default'     => 0,
				],
				'count'       => [
					'description' => __( 'Number of media items in this folder.', 'virtual-media-folders' ),
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
				'description' => __( 'Whether to hide folders with no media.', 'virtual-media-folders' ),
				'type'        => 'boolean',
				'default'     => false,
			],
			'parent'     => [
				'description' => __( 'Filter by parent folder ID.', 'virtual-media-folders' ),
				'type'        => 'integer',
				'default'     => null,
			],
		];
	}
}
