<?php
/**
 * Plugin Name: Media Manager
 * Description: Virtual folder organization and smart management for the WordPress Media Library.
 * Version: 0.1.0
 * Requires at least: 6.8
 * Requires PHP: 8.3
 * Author: Your Name
 * Text Domain: mediamanager
 */

if (!defined('ABSPATH')) {
    exit;
}

if (version_compare(PHP_VERSION, '8.3', '<')) {
    add_action('admin_notices', static function () {
        echo '<div class="notice notice-error"><p>' . esc_html__('Media Manager requires PHP 8.3 or higher.', 'mediamanager') . '</p></div>';
    });
    return;
}

if (version_compare(get_bloginfo('version'), '6.8', '<')) {
    add_action('admin_notices', static function () {
        echo '<div class="notice notice-error"><p>' . esc_html__('Media Manager requires WordPress 6.8 or higher.', 'mediamanager') . '</p></div>';
    });
    return;
}

define('MEDIAMANAGER_VERSION', '0.1.0');
define('MEDIAMANAGER_PLUGIN_FILE', __FILE__);
define('MEDIAMANAGER_PLUGIN_DIR', __DIR__ . '/');
define('MEDIAMANAGER_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once MEDIAMANAGER_PLUGIN_DIR . 'includes/class-taxonomy.php';
require_once MEDIAMANAGER_PLUGIN_DIR . 'includes/class-admin.php';
require_once MEDIAMANAGER_PLUGIN_DIR . 'includes/class-rest-api.php';
require_once MEDIAMANAGER_PLUGIN_DIR . 'includes/class-suggestions.php';

add_action('plugins_loaded', static function () {
    \MediaManager\Taxonomy::init();
    \MediaManager\Admin::init();
    \MediaManager\REST_API::init();
    \MediaManager\Suggestions::init();
});
