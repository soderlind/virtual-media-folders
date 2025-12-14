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
 * - Deletes all vmfo_folder terms and their relationships
 * - Removes plugin options from the options table
 * - Cleans up any transients
 */

// Delete all terms in the vmfo_folder taxonomy.
// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Variable is prefixed with vmfo_
$vmfo_terms = get_terms(
	array(
		'taxonomy'   => 'vmfo_folder',
		'hide_empty' => false,
		'fields'     => 'ids',
	)
);

if ( ! is_wp_error( $vmfo_terms ) && ! empty( $vmfo_terms ) ) {
	// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Variable is prefixed with vmfo_
	foreach ( $vmfo_terms as $vmfo_term_id ) {
		wp_delete_term( $vmfo_term_id, 'vmfo_folder' );
	}
}

// Delete plugin options.
delete_option( 'vmfo_options' );
delete_option( 'vmfo_taxonomy_migrated' );

// Delete any transients.
delete_transient( 'vmfo_folder_counts' );

// Clean up user meta (sidebar visibility state).
delete_metadata( 'user', 0, 'vmfo_sidebar_visible', '', true );
