<?php
/**
 * Smart Folder Suggestions.
 *
 * Analyzes uploaded media files and suggests appropriate folders
 * based on file type, EXIF metadata, and IPTC keywords.
 *
 * @package MediaManager
 * @since   1.0.0
 */

declare(strict_types=1);

namespace MediaManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Suggestion generator for media folders.
 *
 * This class hooks into the media upload process to analyze newly uploaded
 * files and generate folder suggestions based on:
 * - MIME type (images, videos, audio, documents)
 * - EXIF creation date (for photos from cameras)
 * - IPTC keywords (embedded metadata in professional images)
 *
 * Suggestions are stored as post meta and displayed to users in the UI.
 */
class Suggestions {

	/**
	 * Meta key for storing folder suggestions.
	 *
	 * @var string
	 */
	public const META_KEY = '_mm_folder_suggestions';

	/**
	 * Initialize suggestion hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_filter( 'wp_generate_attachment_metadata', [ static::class, 'capture_suggestions' ], 10, 3 );
	}

	/**
	 * Capture smart folder suggestions for a newly uploaded attachment.
	 *
	 * Analyzes the attachment's MIME type and metadata to generate
	 * folder suggestions. Only runs on initial upload (context = 'create').
	 *
	 * @param array  $metadata      The attachment metadata array.
	 * @param int    $attachment_id The attachment post ID.
	 * @param string $context       The context: 'create' for new uploads, 'update' for edits.
	 * @return array The unmodified metadata array.
	 */
	public static function capture_suggestions( array $metadata, int $attachment_id, string $context ): array {
		// Only generate suggestions for new uploads, not re-generations.
		if ( $context !== 'create' ) {
			return $metadata;
		}

		$mime_type   = get_post_mime_type( $attachment_id ) ?: '';
		$suggestions = [];

		// Generate type-based suggestions from MIME type.
		if ( str_starts_with( $mime_type, 'image/' ) ) {
			$suggestions[] = 'Images';
		} elseif ( str_starts_with( $mime_type, 'video/' ) ) {
			$suggestions[] = 'Videos';
		} elseif ( str_starts_with( $mime_type, 'audio/' ) ) {
			$suggestions[] = 'Audio';
		} else {
			$suggestions[] = 'Documents';
		}

		// Generate date-based suggestions from EXIF creation timestamp.
		// This captures the original photo date from cameras.
		if ( ! empty( $metadata[ 'image_meta' ][ 'created_timestamp' ] ) ) {
			$timestamp = (int) $metadata[ 'image_meta' ][ 'created_timestamp' ];
			if ( $timestamp > 0 ) {
				$year  = gmdate( 'Y', $timestamp );
				$month = gmdate( 'm', $timestamp );
				// Suggest a YYYY/MM folder structure for chronological organization.
				$suggestions[] = sprintf( '%s/%s', $year, $month );
			}
		}

		// Extract IPTC keywords as folder suggestions.
		// Professional photographers often embed keywords in their images.
		if ( ! empty( $metadata[ 'image_meta' ][ 'keywords' ] ) && is_array( $metadata[ 'image_meta' ][ 'keywords' ] ) ) {
			foreach ( $metadata[ 'image_meta' ][ 'keywords' ] as $keyword ) {
				$keyword = trim( (string) $keyword );
				if ( $keyword !== '' ) {
					$suggestions[] = $keyword;
				}
			}
		}

		// Remove duplicates and re-index array.
		$suggestions = array_values( array_unique( $suggestions ) );

		// Store suggestions as post meta for later retrieval.
		if ( $suggestions !== [] ) {
			update_post_meta( $attachment_id, static::META_KEY, $suggestions );
		}

		return $metadata;
	}
}
