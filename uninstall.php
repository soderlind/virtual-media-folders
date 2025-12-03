<?php
/**
 * Uninstall Virtual Media Folders
 *
 * Removes all plugin data when the plugin is deleted via the WordPress admin.
 * This file is called automatically by WordPress when the plugin is deleted.
 *
 * @package VirtualMediaFolders
 */

// Exit if accessed directly or not in uninstall context.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Remove all Virtual Media Folders data.
 *
 * - Deletes all media_folder terms and their relationships
 * - Removes plugin options from the options table
 * - Cleans up any transients
 */

// Delete all terms in the media_folder taxonomy.
$vmf_terms = get_terms(
	array(
		'taxonomy'   => 'media_folder',
		'hide_empty' => false,
		'fields'     => 'ids',
	)
);

if ( ! is_wp_error( $vmf_terms ) && ! empty( $vmf_terms ) ) {
	foreach ( $vmf_terms as $vmf_term_id ) {
		wp_delete_term( $vmf_term_id, 'media_folder' );
	}
}

// Delete plugin options.
delete_option( 'vmf_options' );

// Delete any transients.
delete_transient( 'vmf_folder_counts' );

// Clean up user meta (sidebar visibility state).
delete_metadata( 'user', 0, 'vmf_sidebar_visible', '', true );
