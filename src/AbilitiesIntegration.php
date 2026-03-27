<?php
/**
 * WordPress Abilities API integration.
 *
 * @package VirtualMediaFolders
 */

declare(strict_types=1);

namespace VirtualMediaFolders;

defined( 'ABSPATH' ) || exit;

use WP_Error;

/**
 * Registers Abilities API integrations for Virtual Media Folders.
 */
final class AbilitiesIntegration {

	/**
	 * Category slug for Virtual Media Folders abilities.
	 */
	private const CATEGORY_SLUG = 'vmfo-folder-management';

	/**
	 * Ability name exposed through the Abilities API.
	 */
	private const ADD_TO_FOLDER_ABILITY = 'vmfo/add-to-folder';

	/**
	 * Ability name for creating folders.
	 */
	private const CREATE_FOLDER_ABILITY = 'vmfo/create-folder';

	/**
	 * Read-only ability for folder discovery.
	 */
	private const LIST_FOLDERS_ABILITY = 'vmfo/list-folders';

	/**
	 * Initialize abilities hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'wp_abilities_api_categories_init', [ self::class, 'register_categories' ] );
		add_action( 'wp_abilities_api_init', [ self::class, 'register_abilities' ] );
	}

	/**
	 * Register ability categories.
	 *
	 * @return void
	 */
	public static function register_categories(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category(
			self::CATEGORY_SLUG,
			[
				'label'       => __( 'Folder Management', 'virtual-media-folders' ),
				'description' => __( 'Abilities for assigning and organizing media in folders.', 'virtual-media-folders' ),
			]
		);
	}

	/**
	 * Register plugin abilities.
	 *
	 * @return void
	 */
	public static function register_abilities(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		wp_register_ability(
			self::LIST_FOLDERS_ABILITY,
			[
				'label'               => __( 'List Folders', 'virtual-media-folders' ),
				'description'         => __( 'Lists folders with IDs, names, and paths for name-to-ID resolution.', 'virtual-media-folders' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => [
					'type'                 => 'object',
					'properties'           => [
						'search'     => [
							'type'        => 'string',
							'description' => __( 'Optional search term for folder names.', 'virtual-media-folders' ),
						],
						'parent_id'  => [
							'type'        => 'integer',
							'minimum'     => 0,
							'description' => __( 'Optional parent folder ID to scope results.', 'virtual-media-folders' ),
						],
						'hide_empty' => [
							'type'        => 'boolean',
							'description' => __( 'Whether to exclude empty folders.', 'virtual-media-folders' ),
							'default'     => false,
						],
					],
					'additionalProperties' => false,
				],
				'output_schema'       => [
					'type'                 => 'object',
					'properties'           => [
						'folders' => [
							'type'  => 'array',
							'items' => [
								'type'                 => 'object',
								'properties'           => [
									'id'        => [ 'type' => 'integer' ],
									'name'      => [ 'type' => 'string' ],
									'parent_id' => [ 'type' => 'integer' ],
									'path'      => [ 'type' => 'string' ],
									'count'     => [ 'type' => 'integer' ],
								],
								'required'             => [ 'id', 'name', 'parent_id', 'path', 'count' ],
								'additionalProperties' => false,
							],
						],
						'total'   => [
							'type' => 'integer',
						],
					],
					'required'             => [ 'folders', 'total' ],
					'additionalProperties' => false,
				],
				'execute_callback'    => [ self::class, 'execute_list_folders' ],
				'permission_callback' => [ self::class, 'can_list_folders' ],
				'meta'                => [
					'show_in_rest' => true,
					'mcp'          => [
						'public' => true,
						'type'   => 'tool',
					],
					'annotations'  => [
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					],
				],
			]
		);

		wp_register_ability(
			self::ADD_TO_FOLDER_ABILITY,
			[
				'label'               => __( 'Add Media To Folder', 'virtual-media-folders' ),
				'description'         => __( 'Adds one or more media items to a Virtual Media Folders folder.', 'virtual-media-folders' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => [
					'type'                 => 'object',
					'properties'           => [
						'folder_id'      => [
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => __( 'The target folder term ID.', 'virtual-media-folders' ),
						],
						'attachment_ids' => [
							'type'        => 'array',
							'minItems'    => 1,
							'uniqueItems' => true,
							'items'       => [
								'type'    => 'integer',
								'minimum' => 1,
							],
							'description' => __( 'Attachment IDs to assign to the folder.', 'virtual-media-folders' ),
						],
					],
					'required'             => [ 'folder_id', 'attachment_ids' ],
					'additionalProperties' => false,
				],
				'output_schema'       => [
					'type'                 => 'object',
					'properties'           => [
						'success'         => [
							'type'        => 'boolean',
							'description' => __( 'Whether the folder assignment completed successfully.', 'virtual-media-folders' ),
						],
						'folder_id'       => [
							'type'        => 'integer',
							'description' => __( 'The folder that received the media items.', 'virtual-media-folders' ),
						],
						'attachment_ids'  => [
							'type'        => 'array',
							'items'       => [
								'type' => 'integer',
							],
							'description' => __( 'The media IDs processed by the ability.', 'virtual-media-folders' ),
						],
						'processed_count' => [
							'type'        => 'integer',
							'description' => __( 'The number of media items processed.', 'virtual-media-folders' ),
						],
						'message'         => [
							'type'        => 'string',
							'description' => __( 'Summary of the completed folder assignment.', 'virtual-media-folders' ),
						],
						'results'         => [
							'type'        => 'array',
							'items'       => [
								'type'                 => 'object',
								'properties'           => [
									'success'   => [ 'type' => 'boolean' ],
									'media_id'  => [ 'type' => 'integer' ],
									'folder_id' => [ 'type' => 'integer' ],
									'message'   => [ 'type' => 'string' ],
								],
								'required'             => [ 'success', 'media_id', 'folder_id', 'message' ],
								'additionalProperties' => false,
							],
							'description' => __( 'Per-item results from the folder assignment operations.', 'virtual-media-folders' ),
						],
					],
					'required'             => [ 'success', 'folder_id', 'attachment_ids', 'processed_count', 'message', 'results' ],
					'additionalProperties' => false,
				],
				'execute_callback'    => [ self::class, 'execute_add_to_folder' ],
				'permission_callback' => [ self::class, 'can_add_to_folder' ],
				'meta'                => [
					'show_in_rest' => true,
					'mcp'          => [
						'public' => true,
						'type'   => 'tool',
					],
					'annotations'  => [
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					],
				],
			]
		);

		wp_register_ability(
			self::CREATE_FOLDER_ABILITY,
			[
				'label'               => __( 'Create Folder', 'virtual-media-folders' ),
				'description'         => __( 'Creates a Virtual Media Folders folder with an optional parent.', 'virtual-media-folders' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => [
					'type'                 => 'object',
					'properties'           => [
						'name'      => [
							'type'        => 'string',
							'minLength'   => 1,
							'description' => __( 'Folder name to create.', 'virtual-media-folders' ),
						],
						'parent_id' => [
							'type'        => 'integer',
							'minimum'     => 0,
							'default'     => 0,
							'description' => __( 'Optional parent folder ID.', 'virtual-media-folders' ),
						],
					],
					'required'             => [ 'name' ],
					'additionalProperties' => false,
				],
				'output_schema'       => [
					'type'                 => 'object',
					'properties'           => [
						'id'        => [ 'type' => 'integer' ],
						'name'      => [ 'type' => 'string' ],
						'parent_id' => [ 'type' => 'integer' ],
						'path'      => [ 'type' => 'string' ],
						'count'     => [ 'type' => 'integer' ],
					],
					'required'             => [ 'id', 'name', 'parent_id', 'path', 'count' ],
					'additionalProperties' => false,
				],
				'execute_callback'    => [ self::class, 'execute_create_folder' ],
				'permission_callback' => [ self::class, 'can_create_folder' ],
				'meta'                => [
					'show_in_rest' => true,
					'mcp'          => [
						'public' => true,
						'type'   => 'tool',
					],
					'annotations'  => [
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => false,
					],
				],
			]
		);
	}

	/**
	 * Check whether the current user can add media to folders.
	 *
	 * @param array<string, mixed>|null $input Ability input.
	 * @return bool|WP_Error
	 */
	public static function can_add_to_folder( ?array $input = null ): bool|WP_Error {
		unset( $input );

		if ( current_user_can( 'upload_files' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'You are not allowed to add media to folders.', 'virtual-media-folders' ),
			[ 'status' => rest_authorization_required_code() ]
		);
	}

	/**
	 * Check whether the current user can list folders.
	 *
	 * @param array<string, mixed>|null $input Ability input.
	 * @return bool|WP_Error
	 */
	public static function can_list_folders( ?array $input = null ): bool|WP_Error {
		unset( $input );

		if ( current_user_can( 'upload_files' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'You are not allowed to view folders.', 'virtual-media-folders' ),
			[ 'status' => rest_authorization_required_code() ]
		);
	}

	/**
	 * Check whether the current user can create folders.
	 *
	 * @param array<string, mixed>|null $input Ability input.
	 * @return bool|WP_Error
	 */
	public static function can_create_folder( ?array $input = null ): bool|WP_Error {
		unset( $input );

		if ( current_user_can( 'manage_categories' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'You are not allowed to create folders.', 'virtual-media-folders' ),
			[ 'status' => rest_authorization_required_code() ]
		);
	}

	/**
	 * Execute list-folders ability.
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|WP_Error
	 */
	public static function execute_list_folders( array $input ): array|WP_Error {
		$search    = isset( $input['search'] ) ? trim( (string) $input['search'] ) : '';
		$hide_empty = isset( $input['hide_empty'] ) ? (bool) $input['hide_empty'] : false;

		$args = [
			'taxonomy'     => Taxonomy::TAXONOMY,
			'hide_empty'   => $hide_empty,
			'hierarchical' => true,
			'number'       => 0,
		];

		if ( isset( $input['parent_id'] ) && $input['parent_id'] !== null && $input['parent_id'] !== '' ) {
			$args['parent'] = absint( $input['parent_id'] );
		}

		if ( $search !== '' ) {
			$args['search'] = $search;
		}

		$terms = get_terms( $args );

		if ( is_wp_error( $terms ) ) {
			return $terms;
		}

		if ( ! is_array( $terms ) ) {
			return [
				'folders' => [],
				'total'   => 0,
			];
		}

		$term_cache = [];
		foreach ( $terms as $term ) {
			if ( isset( $term->term_id ) ) {
				$term_cache[ (int) $term->term_id ] = $term;
			}
		}

		$folders = [];
		foreach ( $terms as $term ) {
			$folders[] = [
				'id'        => (int) $term->term_id,
				'name'      => (string) $term->name,
				'parent_id' => (int) $term->parent,
				'path'      => self::build_folder_path( $term, $term_cache ),
				'count'     => (int) $term->count,
			];
		}

		return [
			'folders' => $folders,
			'total'   => count( $folders ),
		];
	}

	/**
	 * Execute create-folder ability.
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|WP_Error
	 */
	public static function execute_create_folder( array $input ): array|WP_Error {
		$name      = isset( $input['name'] ) ? trim( (string) $input['name'] ) : '';
		$parent_id = absint( $input['parent_id'] ?? 0 );

		if ( '' === $name ) {
			return new WP_Error(
				'ability_invalid_input',
				__( 'A non-empty folder name is required.', 'virtual-media-folders' )
			);
		}

		if ( $parent_id > 0 ) {
			$parent_validation = self::validate_folder( $parent_id );
			if ( is_wp_error( $parent_validation ) ) {
				return new WP_Error(
					'parent_not_exists',
					__( 'Parent folder does not exist.', 'virtual-media-folders' ),
					[ 'status' => 400 ]
				);
			}
		}

		$result = wp_insert_term(
			$name,
			Taxonomy::TAXONOMY,
			[
				'parent' => $parent_id,
			]
		);

		if ( is_wp_error( $result ) ) {
			$error_code = $result->get_error_code();

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

		$folder = get_term( $result['term_id'], Taxonomy::TAXONOMY );
		if ( is_wp_error( $folder ) || ! $folder ) {
			return new WP_Error(
				'rest_folder_not_found',
				__( 'Folder not found.', 'virtual-media-folders' ),
				[ 'status' => 404 ]
			);
		}

		$term_cache = [
			(int) $folder->term_id => $folder,
		];

		return [
			'id'        => (int) $folder->term_id,
			'name'      => (string) $folder->name,
			'parent_id' => (int) $folder->parent,
			'path'      => self::build_folder_path( $folder, $term_cache ),
			'count'     => (int) $folder->count,
		];
	}

	/**
	 * Execute add-to-folder ability.
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|WP_Error
	 */
	public static function execute_add_to_folder( array $input ): array|WP_Error {
		$folder_id      = absint( $input['folder_id'] ?? 0 );
		$attachment_ids = self::normalize_attachment_ids( $input['attachment_ids'] ?? [] );

		if ( $folder_id < 1 || [] === $attachment_ids ) {
			return new WP_Error(
				'ability_invalid_input',
				__( 'A valid folder_id and at least one attachment_id are required.', 'virtual-media-folders' )
			);
		}

		$folder_validation = self::validate_folder( $folder_id );
		if ( is_wp_error( $folder_validation ) ) {
			return $folder_validation;
		}

		$attachment_validation = self::validate_attachments( $attachment_ids );
		if ( is_wp_error( $attachment_validation ) ) {
			return $attachment_validation;
		}

		$rest_api = new RestApi();
		$results  = [];

		foreach ( $attachment_ids as $attachment_id ) {
			$result = $rest_api->assign_media_to_folder( $attachment_id, $folder_id );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$results[] = [
				'success'   => (bool) ( $result['success'] ?? false ),
				'media_id'  => absint( $result['media_id'] ?? 0 ),
				'folder_id' => absint( $result['folder_id'] ?? 0 ),
				'message'   => (string) ( $result['message'] ?? '' ),
			];
		}

		return [
			'success'         => true,
			'folder_id'       => $folder_id,
			'attachment_ids'  => $attachment_ids,
			'processed_count' => count( $results ),
			'message'         => sprintf(
				/* translators: %d: number of media items processed. */
				__( 'Processed %d media items.', 'virtual-media-folders' ),
				count( $results )
			),
			'results'         => $results,
		];
	}

	/**
	 * Normalize attachment IDs from input.
	 *
	 * @param mixed $attachment_ids Raw attachment IDs.
	 * @return array<int, int>
	 */
	private static function normalize_attachment_ids( mixed $attachment_ids ): array {
		if ( ! is_array( $attachment_ids ) ) {
			return [];
		}

		$attachment_ids = array_map( 'absint', $attachment_ids );
		$attachment_ids = array_filter( $attachment_ids );

		return array_values( array_unique( $attachment_ids ) );
	}

	/**
	 * Validate the target folder.
	 *
	 * @param int $folder_id Folder term ID.
	 * @return bool|WP_Error
	 */
	private static function validate_folder( int $folder_id ): bool|WP_Error {
		$folder = get_term( $folder_id, Taxonomy::TAXONOMY );

		if ( is_wp_error( $folder ) ) {
			return $folder;
		}

		if ( ! $folder ) {
			return new WP_Error(
				'rest_folder_not_found',
				__( 'Folder not found.', 'virtual-media-folders' ),
				[ 'status' => 404 ]
			);
		}

		return true;
	}

	/**
	 * Validate attachments before mutation.
	 *
	 * @param array<int, int> $attachment_ids Attachment IDs.
	 * @return bool|WP_Error
	 */
	private static function validate_attachments( array $attachment_ids ): bool|WP_Error {
		foreach ( $attachment_ids as $attachment_id ) {
			$attachment = get_post( $attachment_id );

			if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
				return new WP_Error(
					'rest_media_not_found',
					__( 'Media not found.', 'virtual-media-folders' ),
					[ 'status' => 404 ]
				);
			}
		}

		return true;
	}

	/**
	 * Build a human-readable folder path from hierarchy.
	 *
	 * @param object               $term Folder term.
	 * @param array<int, object> &$term_cache Cached terms by ID.
	 * @return string
	 */
	private static function build_folder_path( object $term, array &$term_cache ): string {
		$segments = [ (string) ( $term->name ?? '' ) ];
		$visited  = [];
		$parent   = (int) ( $term->parent ?? 0 );

		while ( $parent > 0 && ! isset( $visited[ $parent ] ) ) {
			$visited[ $parent ] = true;

			if ( isset( $term_cache[ $parent ] ) ) {
				$parent_term = $term_cache[ $parent ];
			} else {
				$parent_term = get_term( $parent, Taxonomy::TAXONOMY );
				if ( is_wp_error( $parent_term ) || ! $parent_term ) {
					break;
				}
				$term_cache[ $parent ] = $parent_term;
			}

			array_unshift( $segments, (string) ( $parent_term->name ?? '' ) );
			$parent = (int) ( $parent_term->parent ?? 0 );
		}

		return implode( ' / ', array_filter( $segments, static fn( string $value ): bool => $value !== '' ) );
	}
}