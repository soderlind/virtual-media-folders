<?php

namespace MediaManager;

if (!defined('ABSPATH')) {
    exit;
}

class Taxonomy
{
    public static function init(): void
    {
        add_action('init', [static::class, 'register_taxonomy']);
    }

    public static function register_taxonomy(): void
    {
        $labels = [
            'name'              => _x('Media Folders', 'taxonomy general name', 'mediamanager'),
            'singular_name'     => _x('Media Folder', 'taxonomy singular name', 'mediamanager'),
            'search_items'      => __('Search Folders', 'mediamanager'),
            'all_items'         => __('All Folders', 'mediamanager'),
            'parent_item'       => __('Parent Folder', 'mediamanager'),
            'parent_item_colon' => __('Parent Folder:', 'mediamanager'),
            'edit_item'         => __('Edit Folder', 'mediamanager'),
            'update_item'       => __('Update Folder', 'mediamanager'),
            'add_new_item'      => __('Add New Folder', 'mediamanager'),
            'new_item_name'     => __('New Folder Name', 'mediamanager'),
            'menu_name'         => __('Media Folders', 'mediamanager'),
        ];

        $args = [
            'hierarchical'          => true,
            'labels'                => $labels,
            'show_ui'               => true,
            'show_admin_column'     => false,
            'show_in_rest'          => true,
            'rest_base'             => 'media-folders',
            'query_var'             => true,
            'rewrite'               => ['slug' => 'media-folder'],
            'update_count_callback' => '_update_generic_term_count',
        ];

        register_taxonomy('media_folder', 'attachment', $args);
    }
}
