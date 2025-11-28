<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package MediaManager
 */

require dirname(__DIR__, 2) . '/vendor/autoload.php';

// Define WordPress constants for testing.
if (!defined('ABSPATH')) {
    define('ABSPATH', '/tmp/wordpress/');
}

// Load plugin classes needed in tests.
require dirname(__DIR__, 2) . '/includes/class-taxonomy.php';
require dirname(__DIR__, 2) . '/includes/class-suggestions.php';
require dirname(__DIR__, 2) . '/includes/class-admin.php';
