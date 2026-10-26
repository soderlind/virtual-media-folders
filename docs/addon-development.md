# Add-on Development Guide

This comprehensive guide covers everything you need to know to build add-on plugins for Virtual Media Folders.

## Table of Contents

- [Philosophy & Architecture](#philosophy--architecture)
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Base Classes](#base-classes)
- [Plugin Structure](#plugin-structure)
- [Bootstrap File](#bootstrap-file)
- [Settings Tab Integration](#settings-tab-integration)
- [Action Scheduler](#action-scheduler)
- [Working with Folders](#working-with-folders)
- [REST API](#rest-api)
- [Hooks & Filters](#hooks--filters)
- [React Development](#react-development)
- [UI/UX Patterns](#uiux-patterns)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Constants Reference](#constants-reference)
- [Best Practices](#best-practices)
- [Resources](#resources)

## Philosophy & Architecture

Virtual Media Folders uses a **virtual folder** approach that's fundamentally different from traditional file-based organization:

### Key Principles

1. **Files Never Move** – Media files stay exactly where WordPress uploaded them. The physical file location and URL never change when you "move" media between folders.

2. **Folders Are Taxonomy Terms** – Folders are implemented as terms in a custom hierarchical taxonomy (`vmfo_folder`). This leverages WordPress's mature term system for relationships, hierarchy, and querying.

3. **One Folder Per Item** – Each media attachment belongs to zero or one folder at a time (single-term assignment), mimicking traditional file system behavior.

4. **Non-Destructive** – Deleting a folder only removes the organizational structure. The media files themselves remain in the library.

### Why This Approach?

- **URL Stability** – Embedded images and links never break when reorganizing
- **Performance** – No file I/O operations when moving media
- **Reversibility** – Easy to undo or reorganize without consequences
- **WordPress Native** – Uses standard taxonomy APIs that themes and plugins understand

### Technical Implementation

```
Media Attachment (post_type: attachment)
    └── vmfo_folder (taxonomy term relationship)
            └── Term: "Photos" (term_id: 5, parent: 0)
                    └── Term: "Events" (term_id: 12, parent: 5)
```

When you "move" a file to a folder, the plugin simply calls:
```php
wp_set_object_terms( $attachment_id, $folder_term_id, 'vmfo_folder' );
```

This philosophy should guide your add-on development: work with taxonomy terms, not file operations.

## Overview

Virtual Media Folders is designed to be extensible. Add-ons can:

- Register settings tabs within the parent plugin's settings page
- Use the folder taxonomy (`vmfo_folder`) to organize media
- Hook into media upload and folder assignment events
- Extend the REST API for custom functionality
- Integrate with the folder sidebar in both Media Library and Gutenberg

## Existing Add-ons

Five official add-ons are available as reference implementations:

- **[AI Organizer](https://github.com/soderlind/vmfa-ai-organizer)** – Uses AI vision models to automatically suggest folders for images
- **[Editorial Workflow](https://github.com/soderlind/vmfa-editorial-workflow)** – Role-based folder access, move restrictions, and Inbox workflow
- **[Folder Exporter](https://github.com/soderlind/vmfa-folder-exporter)** – Export folders as ZIP archives with optional CSV manifests
- **[Media Cleanup](https://github.com/soderlind/vmfa-media-cleanup)** – Tools to identify and clean up unused or duplicate media files
- **[Rules Engine](https://github.com/soderlind/vmfa-rules-engine)** – Rule-based automatic folder assignment based on metadata

## Prerequisites

- Virtual Media Folders 2.0.0 or later (for base classes; 1.6.0 minimum for raw hook integration)
- PHP 8.3 or later
- WordPress 6.8 or later

## Plugin Structure

A typical add-on follows this structure:

```
my-vmfa-addon/
├── build/                    # Compiled assets
├── src/
│   ├── php/                  # PHP classes
│   │   ├── Plugin.php        # Main plugin class (extends AbstractPlugin)
│   │   ├── Admin/
│   │   │   └── SettingsTab.php  # Settings tab (extends AbstractSettingsTab)
│   │   └── REST/             # REST API controllers
│   ├── js/                   # React components
│   │   ├── index.js          # Entry point
│   │   ├── settings/         # Settings page components
│   │   │   ├── index.jsx
│   │   │   ├── SettingsPanel.jsx
│   │   │   └── StatsCard.jsx
│   │   └── components/       # Shared React components
│   └── styles/               # Stylesheets
│       └── settings.scss
├── languages/                # Translation files
├── my-vmfa-addon.php         # Plugin bootstrap
├── package.json
├── composer.json
└── webpack.config.js
```

## Base Classes

VMF core provides three base classes in the `VirtualMediaFolders\Addon` namespace that eliminate boilerplate from add-on plugins. All official add-ons use these base classes.

### AbstractPlugin

`VirtualMediaFolders\Addon\AbstractPlugin` — Singleton lifecycle, text domain loading, and parent-tab detection.

**Abstract methods (required):**

| Method | Return | Purpose |
|--------|--------|---------|
| `get_text_domain()` | `string` | Plugin text domain, e.g. `'vmfa-rules-engine'` |
| `get_plugin_file()` | `string` | Absolute path to the main `.php` file (typically a constant like `VMFA_RULES_ENGINE_FILE`) |

**Template methods (override as needed):**

| Method | Default | Purpose |
|--------|---------|---------|
| `init_services()` | no-op | Create service objects and the SettingsTab instance |
| `init_hooks()` | no-op | Register WordPress hooks (admin, REST, filters) |
| `init_cli()` | no-op | Register WP-CLI commands |

**Inherited concrete methods:**

| Method | Purpose |
|--------|---------|
| `get_instance(): static` | Per-subclass singleton accessor |
| `init(): void` | Boot sequence — calls `init_services()`, `init_hooks()`, `init_cli()`, schedules `load_textdomain` |
| `load_textdomain(): void` | Loads `languages/{text-domain}-{locale}.mo` |
| `supports_parent_tabs(): bool` | Checks `VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS` |

**Minimal example:**

```php
<?php
declare(strict_types=1);

namespace MyVmfaAddon;

use VirtualMediaFolders\Addon\AbstractPlugin;

final class Plugin extends AbstractPlugin {

    protected function get_text_domain(): string {
        return 'my-vmfa-addon';
    }

    protected function get_plugin_file(): string {
        return MY_VMFA_ADDON_FILE;
    }

    protected function init_services(): void {
        // Create your service objects here.
    }

    protected function init_hooks(): void {
        // Register WordPress hooks here.
    }
}
```

### AbstractSettingsTab

`VirtualMediaFolders\Addon\AbstractSettingsTab` — Tab registration, asset enqueue (JS + CSS + WP 7 compat), `wp_localize_script`, fallback standalone menu, and default React mount-point.

**Abstract methods (required):**

| Method | Return | Purpose |
|--------|--------|---------|
| `get_tab_slug()` | `string` | Tab slug, e.g. `'rules-engine'` |
| `get_tab_label()` | `string` | Translated tab label |
| `get_text_domain()` | `string` | Plugin text domain |
| `get_build_path()` | `string` | Absolute path to `build/` (trailing slash) |
| `get_build_url()` | `string` | URL to `build/` (trailing slash) |
| `get_languages_path()` | `string` | Absolute path to `languages/` directory |
| `get_plugin_version()` | `string` | Plugin version (fallback for asset versioning) |
| `get_localized_data()` | `array` | Data for `wp_localize_script` |
| `get_localized_name()` | `string` | JS global variable name for localized data |

**Optional overrides:**

| Method | Default | Purpose |
|--------|---------|---------|
| `get_asset_entry()` | `'index'` | Build entry-point basename (e.g. `'settings'`) |
| `get_style_deps()` | `['wp-components']` | CSS dependencies |
| `get_tab_definition()` | `{title, callback}` | Override to add `'subtabs'` |
| `get_menu_capability()` | `'manage_options'` | Capability for fallback menu |
| `get_app_container_id()` | `'vmfa-{slug}-app'` | React mount-point div id |

**Public API (called by Plugin's `init_hooks()`):**

| Method | Used as |
|--------|---------|
| `register_tab( $tabs )` | `vmfo_settings_tabs` filter callback |
| `enqueue_tab_scripts( $tab, $subtab )` | `vmfo_settings_enqueue_scripts` action callback |
| `render_tab( $tab, $subtab )` | Tab render callback |
| `register_admin_menu()` | `admin_menu` action callback (fallback) |
| `enqueue_admin_assets( $hook )` | `admin_enqueue_scripts` action callback (fallback) |
| `render_admin_page()` | Fallback standalone page render |

The base class handles:
- Loading `build/{entry}.asset.php` for dependency/version info
- Enqueuing JS, CSS, and script translations
- Design tokens: the main style depends on `vmfo-tokens` (`--wpds-*` tokens with a WP < 7 fallback)
- WP 7+ compat CSS (shared `wp7-compat-base.css` from VMF core + plugin-specific `build/wp7-compat.css`)
- Fallback standalone admin menu under Media when the parent plugin doesn't support tabs

**Minimal example:**

```php
<?php
declare(strict_types=1);

namespace MyVmfaAddon\Admin;

use VirtualMediaFolders\Addon\AbstractSettingsTab;

class SettingsTab extends AbstractSettingsTab {

    protected function get_tab_slug(): string {
        return 'my-addon';
    }

    protected function get_tab_label(): string {
        return __( 'My Add-on', 'my-vmfa-addon' );
    }

    protected function get_text_domain(): string {
        return 'my-vmfa-addon';
    }

    protected function get_build_path(): string {
        return MY_VMFA_ADDON_PATH . 'build/';
    }

    protected function get_build_url(): string {
        return MY_VMFA_ADDON_URL . 'build/';
    }

    protected function get_languages_path(): string {
        return MY_VMFA_ADDON_PATH . 'languages';
    }

    protected function get_plugin_version(): string {
        return MY_VMFA_ADDON_VERSION;
    }

    protected function get_localized_name(): string {
        return 'myVmfaAddon';
    }

    protected function get_localized_data(): array {
        return [
            'restUrl' => rest_url( 'my-addon/v1/' ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
            'folders' => $this->get_folders(), // your method
        ];
    }
}
```

**With subtabs:**

```php
protected function get_tab_definition(): array {
    return [
        'title'    => $this->get_tab_label(),
        'callback' => [ $this, 'render_tab' ],
        'subtabs'  => [
            'scan'     => __( 'Scan', 'my-vmfa-addon' ),
            'results'  => __( 'Results', 'my-vmfa-addon' ),
            'settings' => __( 'Settings', 'my-vmfa-addon' ),
        ],
    ];
}
```

### ActionSchedulerLoader

`VirtualMediaFolders\Addon\ActionSchedulerLoader` — Static helper to load Action Scheduler from an add-on's vendor directory.

```php
use VirtualMediaFolders\Addon\ActionSchedulerLoader;

// In the main plugin file, before plugins_loaded:
ActionSchedulerLoader::maybe_load( MY_VMFA_ADDON_PATH );
```

`maybe_load( string $plugin_dir ): bool` probes two paths:

1. `{$plugin_dir}vendor/woocommerce/action-scheduler/action-scheduler.php`
2. `{$plugin_dir}woocommerce/action-scheduler/action-scheduler.php`

Returns `true` if `as_schedule_single_action` is available (already loaded or just loaded). Safe to call from multiple add-ons — Action Scheduler's internal version registry (`ActionScheduler_Versions`) ensures only the highest version boots.

### Wiring It All Together

In your Plugin class, create the SettingsTab in `init_services()` and wire the hooks in `init_hooks()`:

```php
protected function init_services(): void {
    $this->settings_tab = new Admin\SettingsTab();
}

protected function init_hooks(): void {
    if ( is_admin() ) {
        if ( $this->supports_parent_tabs() ) {
            add_filter( 'vmfo_settings_tabs', [ $this->settings_tab, 'register_tab' ] );
            add_action( 'vmfo_settings_enqueue_scripts', [ $this->settings_tab, 'enqueue_tab_scripts' ], 10, 2 );
        } else {
            add_action( 'admin_menu', [ $this->settings_tab, 'register_admin_menu' ] );
            add_action( 'admin_enqueue_scripts', [ $this->settings_tab, 'enqueue_admin_assets' ] );
        }
    }

    add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
}
```

## Bootstrap File

The main plugin file defines constants, loads the autoloader, optionally loads Action Scheduler, and boots the Plugin singleton:

```php
<?php
/**
 * Plugin Name: My VMFA Add-on
 * Description: Description of your add-on
 * Version: 1.0.0
 * Requires at least: 6.8
 * Requires PHP: 8.3
 * Requires Plugins: virtual-media-folders
 * Author: Your Name
 * License: GPL-2.0-or-later
 * Text Domain: my-vmfa-addon
 * Domain Path: /languages
 */

declare(strict_types=1);

namespace MyVmfaAddon;

defined( 'ABSPATH' ) || exit;

// Plugin constants.
define( 'MY_VMFA_ADDON_VERSION', '1.0.0' );
define( 'MY_VMFA_ADDON_FILE', __FILE__ );
define( 'MY_VMFA_ADDON_PATH', plugin_dir_path( __FILE__ ) );
define( 'MY_VMFA_ADDON_URL', plugin_dir_url( __FILE__ ) );

// Composer autoload.
if ( file_exists( MY_VMFA_ADDON_PATH . 'vendor/autoload.php' ) ) {
    require_once MY_VMFA_ADDON_PATH . 'vendor/autoload.php';
}

// (Optional) Load Action Scheduler early — only if your add-on uses it.
use VirtualMediaFolders\Addon\ActionSchedulerLoader;
ActionSchedulerLoader::maybe_load( MY_VMFA_ADDON_PATH );

/**
 * Initialize the plugin.
 */
function init(): void {
    Plugin::get_instance()->init();
}
add_action( 'plugins_loaded', __NAMESPACE__ . '\\init', 20 );
```

> **Note:** The `Requires Plugins: virtual-media-folders` header (WordPress 6.5+) ensures VMF is loaded first. For older WordPress, add a fallback check for `defined( 'VMFO_VERSION' )` inside `init()`.

### What AbstractPlugin gives you for free

- **Singleton** — `Plugin::get_instance()` returns a per-subclass singleton; private constructor, `__clone`, `__wakeup` are handled.
- **Text domain** — `load_textdomain()` is called on the `init` hook automatically.
- **supports_parent_tabs()** — Checks the VMF parent constant; no need to duplicate this in every add-on.

## Settings Tab Integration

VMF provides a tab-based settings page. Add-ons register their own tabs within the parent plugin's "Folder Settings" page.

### Recommended: Use AbstractSettingsTab

The simplest approach is to extend `AbstractSettingsTab` (see [Base Classes](#abstractsettingstab) above). The base class handles tab registration, asset enqueuing, WP 7 compat CSS, `wp_localize_script`, and the fallback standalone menu — all from a set of abstract getters.

Your Plugin class wires the SettingsTab to the correct hooks:

```php
protected function init_hooks(): void {
    if ( is_admin() ) {
        if ( $this->supports_parent_tabs() ) {
            add_filter( 'vmfo_settings_tabs', [ $this->settings_tab, 'register_tab' ] );
            add_action( 'vmfo_settings_enqueue_scripts', [ $this->settings_tab, 'enqueue_tab_scripts' ], 10, 2 );
        } else {
            add_action( 'admin_menu', [ $this->settings_tab, 'register_admin_menu' ] );
            add_action( 'admin_enqueue_scripts', [ $this->settings_tab, 'enqueue_admin_assets' ] );
        }
    }
}
```

That's it — no inline `do_enqueue_assets()`, no WP 7 compat logic, no fallback menu boilerplate.

### Manual approach (without base class)

If you prefer not to use the base class, you can wire the hooks directly.

#### Detecting Tab Support

Check if the parent plugin supports the tab system:

```php
private function supports_parent_tabs(): bool {
    return defined( 'VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS' )
        && \VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS;
}
```

### Registering a Tab

Use the `vmfo_settings_tabs` filter to register your add-on's tab:

```php
add_filter( 'vmfo_settings_tabs', function( array $tabs ): array {
    $tabs['my-addon'] = [
        'title'    => __( 'My Add-on', 'my-vmfa-addon' ),
        'callback' => [ $this, 'render_tab_content' ],
    ];
    return $tabs;
});
```

> **Note:** Tabs are automatically sorted alphabetically by title. The "General" tab always appears first, followed by add-on tabs in alphabetical order.

#### Tab Array Structure

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `title` | string | Yes | The tab label displayed in the navigation |
| `callback` | callable | Yes | Function to render the tab content. Receives `$active_tab` and `$active_subtab` as parameters. |
| `subtabs` | array | No | Optional secondary navigation: `[ 'slug' => 'Title', ... ]` |

### Rendering Tab Content

The callback function receives two parameters:

```php
public function render_tab_content( string $active_tab, string $active_subtab ): void {
    ?>
    <div id="my-addon-app"></div>
    <?php
}
```

### Sub-tabs (Optional)

If your add-on has multiple sections, you can register subtabs for secondary navigation. The parent plugin renders the subtab bar automatically.

```php
add_filter( 'vmfo_settings_tabs', function( array $tabs ): array {
    $tabs['my-addon'] = [
        'title'    => __( 'My Add-on', 'my-vmfa-addon' ),
        'callback' => [ $this, 'render_tab_content' ],
        'subtabs'  => [
            'scanner'  => __( 'Scanner', 'my-vmfa-addon' ),
            'settings' => __( 'Settings', 'my-vmfa-addon' ),
            'logs'     => __( 'Logs', 'my-vmfa-addon' ),
        ],
    ];
    return $tabs;
});
```

When subtabs are registered:
- The parent plugin renders a secondary navigation bar below the main tabs
- The first subtab is selected by default if none specified in URL
- Your callback receives `$active_subtab` with the current selection

```php
public function render_tab_content( string $active_tab, string $active_subtab ): void {
    // Render content based on active subtab.
    switch ( $active_subtab ) {
        case 'scanner':
            $this->render_scanner_content();
            break;
        case 'settings':
            $this->render_settings_content();
            break;
        case 'logs':
            $this->render_logs_content();
            break;
    }
}
```

### Simple Add-on (No Subtabs)

For simpler add-ons, subtabs are optional. Just register a tab without the `subtabs` array:

```php
$tabs['my-addon'] = [
    'title'    => __( 'My Add-on', 'my-vmfa-addon' ),
    'callback' => [ $this, 'render_tab_content' ],
];
```

### Rendering with React

Render a container element and mount your React app:

```php
public function render_tab_content( string $active_tab, string $active_subtab ): void {
    // Pass the active subtab to React via data attribute or localized script.
    ?>
    <div id="my-addon-app" data-subtab="<?php echo esc_attr( $active_subtab ); ?>"></div>
    <?php
}
```

### URL Structure

The settings page uses the following URL pattern:

```
/wp-admin/upload.php?page=vmfo-settings&tab={tab-slug}&subtab={subtab-slug}
```

- `page`: Always `vmfo-settings`
- `tab`: Your add-on's tab slug (e.g., `my-addon`)
- `subtab`: Your subtab slug (if using subtabs)

### Enqueuing Scripts

Only enqueue when your tab is active:

```php
add_action( 'vmfo_settings_enqueue_scripts', function( string $active_tab, string $active_subtab ): void {
    if ( 'my-addon' !== $active_tab ) {
        return;
    }

    $asset_file = MY_ADDON_PATH . 'build/index.asset.php';
    if ( ! file_exists( $asset_file ) ) {
        return;
    }

    $asset = require $asset_file;

    wp_enqueue_script(
        'my-addon-admin',
        MY_ADDON_URL . 'build/index.js',
        $asset['dependencies'],
        $asset['version'],
        true
    );

    wp_enqueue_style(
        'my-addon-admin',
        MY_ADDON_URL . 'build/index.css',
        [ 'wp-components' ],
        $asset['version']
    );

    wp_localize_script( 'my-addon-admin', 'myAddonData', [
        'restUrl'      => rest_url( 'my-addon/v1/' ),
        'nonce'        => wp_create_nonce( 'wp_rest' ),
        'activeSubtab' => $active_subtab,
        'folders'      => $this->get_folders(),
    ]);
}, 10, 2);
```

### Backwards Compatibility (handled by AbstractSettingsTab)

When using `AbstractSettingsTab`, backwards compatibility is built in. The Plugin class's `init_hooks()` already branches between tab mode and standalone fallback mode (see above). If you're wiring hooks manually, the same pattern applies:

```php
public function init_admin(): void {
    if ( $this->supports_parent_tabs() ) {
        add_filter( 'vmfo_settings_tabs', [ $this, 'register_tab' ] );
        add_action( 'vmfo_settings_enqueue_scripts', [ $this, 'enqueue_scripts' ], 10, 2 );
    } else {
        // Fallback to standalone menu.
        add_action( 'admin_menu', [ $this, 'add_standalone_menu' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_standalone_scripts' ] );
    }
}

public function add_standalone_menu(): void {
    add_submenu_page(
        'upload.php',
        __( 'My Add-on Settings', 'my-addon' ),
        __( 'My Add-on', 'my-addon' ),
        'manage_options',
        'my-addon-settings',
        [ $this, 'render_standalone_page' ]
    );
}

public function render_standalone_page(): void {
    ?>
    <div class="wrap">
        <h1><?php esc_html_e( 'My Add-on', 'my-addon' ); ?></h1>
        <div id="my-addon-app"></div>
    </div>
    <?php
}

public function enqueue_standalone_scripts( string $hook_suffix ): void {
    if ( 'media_page_my-addon-settings' !== $hook_suffix ) {
        return;
    }
    // Enqueue your assets here.
}
```

## Action Scheduler

If your add-on needs background processing (batch jobs, scheduled scans, etc.), use [Action Scheduler](https://actionscheduler.org/) via Composer:

```bash
composer require woocommerce/action-scheduler
```

Load it in your main plugin file **before** `plugins_loaded` using the shared helper:

```php
use VirtualMediaFolders\Addon\ActionSchedulerLoader;

ActionSchedulerLoader::maybe_load( MY_VMFA_ADDON_PATH );
```

This is safe to call from multiple add-ons. Action Scheduler's internal `ActionScheduler_Versions` registry ensures only the highest version boots. See [ActionSchedulerLoader](#actionschedulerloader) for details.

## Working with Folders

### The Folder Taxonomy

Folders use a custom taxonomy: `vmfo_folder`

```php
// Get all folders.
$folders = get_terms([
    'taxonomy'   => 'vmfo_folder',
    'hide_empty' => false,
    'orderby'    => 'meta_value_num',
    'meta_key'   => 'vmfo_order',
    'order'      => 'ASC',
]);

// Create a folder.
$result = wp_insert_term( 'My Folder', 'vmfo_folder', [
    'parent' => 0, // 0 for root level
]);

// Assign media to a folder.
wp_set_object_terms( $attachment_id, $folder_id, 'vmfo_folder' );

// Get folder for a media item.
$folders = wp_get_object_terms( $attachment_id, 'vmfo_folder' );

// Remove media from all folders.
wp_set_object_terms( $attachment_id, [], 'vmfo_folder' );
```

### Folder Order

Folders have a custom order stored in term meta:

```php
// Get folder order.
$order = get_term_meta( $term_id, 'vmfo_order', true );

// Set folder order.
update_term_meta( $term_id, 'vmfo_order', 5 );
```

## REST API

### Parent Plugin Endpoints

The parent plugin provides REST API endpoints under `/wp-json/vmfo/v1`:

#### Folder Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/folders` | List all folders |
| POST | `/folders` | Create a folder |
| GET | `/folders/{id}` | Get a folder |
| PUT | `/folders/{id}` | Update a folder |
| DELETE | `/folders/{id}` | Delete a folder |
| GET | `/folders/{id}/can-delete` | Check if a folder can be deleted |
| POST | `/folders/{id}/media` | Add media to folder |
| DELETE | `/folders/{id}/media` | Remove media from folder |
| POST | `/folders/reorder` | Reorder folders |
| GET | `/folders/counts` | Get folder counts (supports `media_type` filter) |

### Creating Custom Endpoints

```php
add_action( 'rest_api_init', function() {
    register_rest_route( 'my-addon/v1', '/process', [
        'methods'             => 'POST',
        'callback'            => [ $this, 'process_media' ],
        'permission_callback' => function() {
            return current_user_can( 'upload_files' );
        },
        'args'                => [
            'attachment_id' => [
                'required'          => true,
                'type'              => 'integer',
                'sanitize_callback' => 'absint',
            ],
        ],
    ]);
});
```

### Stats Endpoint Pattern

Provide a `/stats` endpoint for statistics cards:

```php
register_rest_route(
    'my-addon/v1',
    '/stats',
    [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => [ $this, 'get_stats' ],
        'permission_callback' => [ $this, 'check_admin_permission' ],
    ]
);

public function get_stats( WP_REST_Request $request ): WP_REST_Response {
    return rest_ensure_response( [
        'totalMedia'  => wp_count_posts( 'attachment' )->inherit,
        'processed'   => $this->get_processed_count(),
        'pending'     => $this->get_pending_count(),
        'activeRules' => $this->get_active_rules_count(),
    ] );
}
```

### Settings Endpoint Pattern

```php
register_rest_route(
    'my-addon/v1',
    '/settings',
    [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ $this, 'get_settings' ],
            'permission_callback' => [ $this, 'check_admin_permission' ],
        ],
        [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [ $this, 'update_settings' ],
            'permission_callback' => [ $this, 'check_admin_permission' ],
        ],
    ]
);
```

## Hooks & Filters

### Available Hooks

#### Settings Filters

```php
// Modify default settings.
add_filter( 'vmfo_default_settings', function( $defaults ) {
    $defaults['my_option'] = true;
    return $defaults;
});

// Filter all settings.
add_filter( 'vmfo_settings', function( $options ) {
    // Modify options.
    return $options;
});

// Filter a specific setting.
add_filter( 'vmfo_setting_default_folder', function( $value, $key, $options ) {
    // Return modified value.
    return $value;
}, 10, 3);
```

#### Settings Actions

```php
// Enqueue scripts on settings page.
add_action( 'vmfo_settings_enqueue_scripts', function( $active_tab, $active_subtab ) {
    // Enqueue your assets.
}, 10, 2);

// Register settings tabs.
add_filter( 'vmfo_settings_tabs', function( $tabs ) {
    $tabs['my-addon'] = [
        'title'    => __( 'My Add-on', 'my-addon' ),
        'callback' => [ $this, 'render_content' ],
    ];
    return $tabs;
});
```

#### Media Events

```php
// Fired after media is assigned to a folder.
add_action( 'vmfo_folder_assigned', function( $attachment_id, $folder_id, $result ) {
    // Handle the folder assignment.
    // $result contains the return value from wp_set_object_terms.
}, 10, 3);
```

#### Folder Deletion

```php
// Prevent folder deletion (e.g., if folder has rules).
add_filter( 'vmfo_can_delete_folder', function( $can_delete, $folder_id, $term ) {
    // Check if folder has associated rules.
    $has_rules = get_term_meta( $folder_id, 'my_addon_has_rules', true );
    
    if ( $has_rules ) {
        return new WP_Error(
            'folder_has_rules',
            __( 'Cannot delete folder: it has active rules. Remove the rules first.', 'my-addon' ),
            [ 'status' => 400 ]
        );
    }
    
    return $can_delete;
}, 10, 3);
```

#### Query Filters

```php
// Include child folder media when querying a parent folder.
add_filter( 'vmfo_include_child_folders', function( $include, $folder_id ) {
    // Return true to include media from child folders.
    return $include;
}, 10, 2);
```

### Hooking into Media Upload

Process media on upload:

```php
add_filter( 'wp_generate_attachment_metadata', function( $metadata, $attachment_id, $context ) {
    // Only process on new uploads.
    if ( 'create' !== $context ) {
        return $metadata;
    }

    // Get attachment data.
    $attachment = get_post( $attachment_id );
    $file_path  = get_attached_file( $attachment_id );
    $mime_type  = get_post_mime_type( $attachment_id );

    // Your processing logic here.
    // ...

    // Assign to a folder.
    wp_set_object_terms( $attachment_id, $folder_id, 'vmfo_folder' );

    return $metadata;
}, 20, 3); // Priority 20 to run after VMFO
```

### Hooks Reference Table

#### Filters

| Hook | Parameters | Description |
|------|------------|-------------|
| `vmfo_settings_tabs` | `array $tabs` | Register add-on tabs |
| `vmfo_default_settings` | `array $defaults` | Modify default settings |
| `vmfo_settings` | `array $options` | Filter all settings |
| `vmfo_setting_{$key}` | `mixed $value, string $key, array $options` | Filter a specific setting |
| `vmfo_include_child_folders` | `bool $include, int $folder_id` | Include child folder media in queries |
| `vmfo_can_delete_folder` | `bool|WP_Error $can_delete, int $folder_id, WP_Term $term` | Control folder deletion |

#### Actions

| Hook | Parameters | Description |
|------|------------|-------------|
| `vmfo_settings_enqueue_scripts` | `string $active_tab, string $active_subtab` | Enqueue tab-specific scripts |
| `vmfo_folder_assigned` | `int $attachment_id, int $folder_id, array $result` | Fired after media is assigned to a folder |

## React Development

### Build Setup

Use `@wordpress/scripts` for consistency with WordPress:

```json
{
  "scripts": {
    "build": "wp-scripts build",
    "start": "wp-scripts start",
    "lint:js": "wp-scripts lint-js",
    "lint:css": "wp-scripts lint-style"
  },
  "devDependencies": {
    "@wordpress/scripts": "^30.0.0"
  }
}
```

### webpack.config.js

For multiple entry points:

```javascript
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        settings: path.resolve( __dirname, 'src/js/settings/index.jsx' ),
        // Add other entry points as needed
    },
    output: {
        ...defaultConfig.output,
        path: path.resolve( __dirname, 'build' ),
    },
};
```

### Using WordPress Components

```jsx
import { useState, useEffect } from '@wordpress/element';
import { Button, Modal, TextControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

function MyAddonApp() {
    const [folders, setFolders] = useState([]);

    useEffect(() => {
        apiFetch({ path: '/vmfo/v1/folders' }).then(setFolders);
    }, []);

    return (
        <div className="my-addon-container">
            <h2>{__('My Add-on Settings', 'my-addon')}</h2>
            <SelectControl
                label={__('Select Folder', 'my-addon')}
                options={folders.map(f => ({ label: f.name, value: f.id }))}
            />
        </div>
    );
}
```

### Rendering in Tab

```jsx
import { createRoot } from '@wordpress/element';
import MyAddonApp from './components/MyAddonApp';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('my-addon-app');
    if (container) {
        createRoot(container).render(<MyAddonApp />);
    }
});
```

### Main Settings Panel Pattern

```jsx
import { useState, useEffect, useCallback } from '@wordpress/element';
import { Button, Spinner, Notice } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

export default function SettingsPanel() {
    const [ isLoading, setIsLoading ] = useState( true );
    const [ isSaving, setIsSaving ] = useState( false );
    const [ notice, setNotice ] = useState( null );
    const [ settings, setSettings ] = useState( {} );
    const [ stats, setStats ] = useState( {} );

    useEffect( () => {
        fetchSettings();
        fetchStats();
    }, [] );

    const fetchSettings = useCallback( async () => {
        setIsLoading( true );
        try {
            const response = await apiFetch( { path: '/my-addon/v1/settings' } );
            setSettings( response );
        } catch ( error ) {
            setNotice( { status: 'error', message: error.message } );
        } finally {
            setIsLoading( false );
        }
    }, [] );

    const saveSettings = useCallback( async () => {
        setIsSaving( true );
        setNotice( null );
        try {
            await apiFetch( {
                path: '/my-addon/v1/settings',
                method: 'POST',
                data: settings,
            } );
            setNotice( { status: 'success', message: __( 'Settings saved.', 'my-addon' ) } );
        } catch ( error ) {
            setNotice( { status: 'error', message: error.message } );
        } finally {
            setIsSaving( false );
        }
    }, [ settings ] );

    if ( isLoading ) {
        return (
            <div className="my-addon-loading">
                <Spinner />
                <p>{ __( 'Loading…', 'my-addon' ) }</p>
            </div>
        );
    }

    return (
        <div className="my-addon-settings-panel">
            { notice && (
                <Notice
                    status={ notice.status }
                    isDismissible
                    onRemove={ () => setNotice( null ) }
                >
                    { notice.message }
                </Notice>
            ) }

            {/* Your settings cards here */}

            <div className="my-addon-actions">
                <Button
                    variant="primary"
                    onClick={ saveSettings }
                    isBusy={ isSaving }
                    disabled={ isSaving }
                >
                    { isSaving ? __( 'Saving…', 'my-addon' ) : __( 'Save Changes', 'my-addon' ) }
                </Button>
            </div>
        </div>
    );
}
```

## UI/UX Patterns

VMF add-ons should provide a consistent, modern user experience that integrates seamlessly with the WordPress admin.

### Settings Page Layout

Add-ons appear as tabs within the Virtual Media Folders settings page:

```
┌─────────────────────────────────────────────────────────────────┐
│  Virtual Media Folders Settings                                 │
├─────────┬─────────────────┬──────────────┬─────────────┬────────┤
│ General │  AI Organizer   │ Edit. Workfl │ Media Clean │  ...   │  ← Top-level tabs
└─────────┴─────────────────┴──────────────┴─────────────┴────────┘
   Scanner   Settings   AI Provider                                  ← Sub-tabs (optional)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Your add-on content]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Sub-tabs (when registered) appear as a secondary navigation bar directly below the main tabs.

### Flexible Structure

Add-ons have complete control over their UI within their tab content area. You can:

1. **Simple add-on**: Single settings form, no subtabs needed
2. **Multi-section add-on**: Register subtabs that make sense for your features
3. **Complex add-on**: Use React for interactive dashboards with statistics

### Example Structures

**Rules Engine** (simple): Single tab with rule list and settings
```php
$tabs['rules-engine'] = [
    'title'    => __( 'Rules', 'vmfa-rules-engine' ),
    'callback' => [ $this, 'render_rules_panel' ],
];
```

**AI Organizer** (with subtabs): Scanner, Settings, and Provider sections
```php
$tabs['ai-organizer'] = [
    'title'    => __( 'AI Organizer', 'vmfa-ai-organizer' ),
    'callback' => [ $this, 'render_tab' ],
    'subtabs'  => [
        'scanner'  => __( 'Media Scanner', 'vmfa-ai-organizer' ),
        'settings' => __( 'Settings', 'vmfa-ai-organizer' ),
        'provider' => __( 'AI Provider', 'vmfa-ai-organizer' ),
    ],
];
```

**Media Cleanup** (many subtabs): Multiple cleanup category views
```php
$tabs['media-cleanup'] = [
    'title'    => __( 'Media Cleanup', 'vmfa-media-cleanup' ),
    'callback' => [ $this, 'render_tab' ],
    'subtabs'  => [
        'scan'       => __( 'Scan', 'vmfa-media-cleanup' ),
        'unused'     => __( 'Unused', 'vmfa-media-cleanup' ),
        'duplicates' => __( 'Duplicates', 'vmfa-media-cleanup' ),
        'oversized'  => __( 'Oversized', 'vmfa-media-cleanup' ),
        'settings'   => __( 'Settings', 'vmfa-media-cleanup' ),
    ],
];
```

### Color Palette (Design Tokens)

Use WordPress Design System (`--wpds-*`) tokens instead of hardcoded colors. WordPress 7.0+ provides them via the core `wp-theme` stylesheet. On older versions, VMF's `vmfo-tokens` style handle provides a fallback with the classic WP 6.x palette. `AbstractSettingsTab::get_style_deps()` already includes `vmfo-tokens`; if you enqueue styles yourself, add `'vmfo-tokens'` to the dependencies.

| Purpose | Token | WP 6.x fallback |
|---------|-------|-----------------|
| Primary text | `--wpds-color-foreground-content-neutral` | `#1e1e1e` |
| Secondary text | `--wpds-color-foreground-content-neutral-weak` | `#757575` |
| Secondary icons / links | `--wpds-color-foreground-interactive-neutral-weak` | `#50575e` |
| Text on brand background | `--wpds-color-foreground-interactive-brand-strong` | `#fff` |
| Surface (cards) | `--wpds-color-background-surface-neutral-strong` | `#fff` |
| Background (headers) | `--wpds-color-background-surface-neutral-weak` | `#f6f7f7` |
| Hover / active background | `--wpds-color-background-interactive-neutral-weak-active` | `#e0e0e0` |
| Border | `--wpds-color-stroke-surface-neutral` | `#dcdcde` |
| Light border | `--wpds-color-stroke-surface-neutral-weak` | `#f0f0f1` |
| Input border | `--wpds-color-stroke-interactive-neutral` | `#8c8f94` |
| Success text / background | `--wpds-color-foreground-content-success-weak` / `--wpds-color-background-surface-success-weak` | `#00a32a` / `#edfaef` |
| Warning text / background / border | `--wpds-color-foreground-content-warning-weak` / `--wpds-color-background-surface-warning-weak` / `--wpds-color-stroke-surface-warning-strong` | `#996800` / `#fff8e5` / `#dba617` |
| Error text / background / border | `--wpds-color-foreground-content-error-weak` / `--wpds-color-background-surface-error-weak` / `--wpds-color-stroke-surface-error-strong` | `#d63638` / `#fcf0f1` / `#d63638` |
| Radius | `--wpds-border-radius-sm` / `-md` / `-lg` | `2px` / `4px` / `8px` |
| Elevation | `--wpds-elevation-md` / `-lg` | Subtle / overlay shadow |
| Primary action (accent) | `var(--wp-admin-theme-color, #2271b1)` | Follows the admin color scheme |

Notes:

- Don't add fallback values to `--wpds-*` tokens (`var(--wpds-…, #fff)`); the fallback file handles that.
- Use `--wp-admin-theme-color` (with a hex fallback) for accent colors. It follows the user's admin color scheme; the `--wpds-*` brand tokens do not.
- Only tokens defined in VMF's `src/css/wpds-tokens-fallback.css` are guaranteed on WP < 7. Need another token? Add it there (`npm run lint:tokens` validates it).
- A few values core itself hardcodes (for example `#c3c4c7` nav-tab borders, `#a7aaad` view-switch icons) can stay literal.

### Statistics Card

Display key metrics at the top of your settings page using a 4-column grid:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1002        │    1002       │     0         │     217         │
│  Total Media  │   In Folders  │  Unassigned   │    Folders      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Example React component:**

```jsx
function StatsCard({ stats }) {
    return (
        <div className="my-addon-stats-card">
            {stats.map((stat, index) => (
                <div key={index} className="my-addon-stat-item">
                    <div className="my-addon-stat-value">{stat.value}</div>
                    <div className="my-addon-stat-label">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}

// Usage:
const stats = [
    { label: 'Total Media', value: 1002 },
    { label: 'In Folders', value: 1002 },
    { label: 'Unassigned', value: 0 },
    { label: 'Folders', value: 217 },
];

<StatsCard stats={stats} />
```

**CSS:**

```css
.my-addon-stats-card {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 24px 20px;
    text-align: center;
    background: var(--wpds-color-background-surface-neutral-strong);
    border: 1px solid var(--wpds-color-stroke-surface-neutral);
    border-radius: 4px;
    margin-bottom: 20px;
}

.my-addon-stat-item {
    padding: 0 16px;
    border-right: 1px solid var(--wpds-color-stroke-surface-neutral-weak);
}

.my-addon-stat-item:last-child {
    border-right: none;
}

.my-addon-stat-value {
    font-size: 32px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--wpds-color-foreground-content-neutral);
}

.my-addon-stat-label {
    font-size: 13px;
    color: var(--wpds-color-foreground-content-neutral-weak);
    margin-top: 4px;
}

@media (max-width: 782px) {
    .my-addon-stats-card {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }

    .my-addon-stat-item {
        border-right: none;
    }
}
```

### Card Container

Use card containers for grouping related settings:

```
┌─────────────────────────────────────────────────────────────────┐
│  Section Title                                      [Toggle]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Description text explaining this section.                      │
│                                                                 │
│  [Content area - forms, lists, etc.]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS:**

```css
.my-addon-card {
    background: var(--wpds-color-background-surface-neutral-strong);
    border: 1px solid var(--wpds-color-stroke-surface-neutral);
    border-radius: 4px;
    margin-bottom: 20px;
}

.my-addon-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--wpds-color-stroke-surface-neutral-weak);
}

.my-addon-card-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--wpds-color-foreground-content-neutral);
}

.my-addon-card-body {
    padding: 20px;
}

.my-addon-card-description {
    margin: 0 0 20px;
    color: var(--wpds-color-foreground-content-neutral-weak);
}
```

### Expandable Lists

For complex data like permissions or rules:

```css
.my-addon-expandable-header {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    background: var(--wpds-color-background-surface-neutral-weak);
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    transition: background-color 0.15s;
}

.my-addon-expandable-header:hover {
    background: var(--wpds-color-background-interactive-neutral-weak-active);
}

.my-addon-toggle-icon {
    margin-right: 8px;
    color: var(--wpds-color-foreground-interactive-neutral-weak);
}

.my-addon-item-name {
    flex: 1;
    font-weight: 500;
    color: var(--wpds-color-foreground-content-neutral);
}

.my-addon-item-count {
    font-size: 12px;
    color: var(--wpds-color-foreground-content-neutral-weak);
}
```

### Action Buttons

Primary actions should use WordPress button patterns:

```jsx
import { Button } from '@wordpress/components';

<div className="my-addon-actions">
    <Button
        variant="primary"
        onClick={ handleSave }
        isBusy={ isSaving }
        disabled={ isSaving }
    >
        { isSaving ? __( 'Saving…', 'my-addon' ) : __( 'Save Changes', 'my-addon' ) }
    </Button>
</div>
```

**CSS:**

```css
.my-addon-actions {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--wpds-color-stroke-surface-neutral);
}
```

### Grid Layouts

Use CSS Grid for multi-column form layouts:

```css
.my-addon-field-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

/* Responsive auto-fill grid */
.my-addon-auto-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

@media (max-width: 782px) {
    .my-addon-field-grid {
        grid-template-columns: 1fr;
    }
}
```

### Accessibility

1. **Use semantic HTML** - Use appropriate heading levels, lists, and buttons
2. **Keyboard navigation** - Ensure all interactive elements are focusable
3. **ARIA attributes** - Add `aria-expanded` for expandable sections
4. **Color contrast** - Maintain WCAG AA compliance (4.5:1 for text)
5. **Focus indicators** - Use WordPress default focus styles

```jsx
<button
    type="button"
    className="my-addon-expandable-header"
    onClick={ () => toggleSection( id ) }
    aria-expanded={ isExpanded }
>
    {/* content */}
</button>
```

## Internationalization

### PHP Strings

```php
__( 'My string', 'my-vmfa-addon' );
_e( 'My string', 'my-vmfa-addon' );
sprintf( __( 'Processed %d items', 'my-vmfa-addon' ), $count );
```

### JavaScript Strings

```javascript
import { __, sprintf } from '@wordpress/i18n';

const label = __('My string', 'my-vmfa-addon');
const message = sprintf(__('Processed %d items', 'my-vmfa-addon'), count);
```

### Generating Translation Files

```bash
# Generate POT file.
wp i18n make-pot . languages/my-vmfa-addon.pot --domain=my-vmfa-addon

# Generate JSON for JavaScript.
wp i18n make-json languages/ --no-purge
```

### JavaScript Translation Mapping (i18n-map.json)

When using `@wordpress/scripts` to bundle JavaScript, source files are combined into build output files. WordPress needs to know which build file contains translations from which source files. Create an `i18n-map.json` file to map source files to their build outputs:

```json
{
    "src/js/index.js": "build/index.js",
    "src/js/components/MyComponent.jsx": "build/index.js",
    "src/js/components/AnotherComponent.jsx": "build/index.js",
    "src/js/admin.js": "build/admin.js"
}
```

Then use the map when generating JSON translation files:

```bash
wp i18n make-json languages/ --no-purge --use-map=i18n-map.json
```

**Key points:**
- Only include files that contain translatable strings (`__()`, `_x()`, `_n()`, `sprintf()`)
- Map each source file to its corresponding bundled output file
- Use `--no-purge` to keep existing JSON files when regenerating
- The map ensures translations load correctly from the bundled scripts

## Testing

### PHP Tests with PHPUnit

```php
<?php
use Brain\Monkey;
use PHPUnit\Framework\TestCase;

class MyAddonTest extends TestCase {
    protected function setUp(): void {
        parent::setUp();
        Monkey\setUp();
    }

    protected function tearDown(): void {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_example(): void {
        // Your test.
    }
}
```

### JavaScript Tests with Vitest

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
    it('renders correctly', () => {
        render(<MyComponent />);
        expect(screen.getByText('Expected text')).toBeInTheDocument();
    });
});
```

## Constants Reference

| Constant / Class | Type | Description |
|------------------|------|-------------|
| `VMFO_VERSION` | string | Parent plugin version |
| `VMFO_PATH` | string | Parent plugin path |
| `VMFO_URL` | string | Parent plugin URL |
| `VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS` | bool | Tab system support |
| `VirtualMediaFolders\Settings::PAGE_SLUG` | string | Settings page slug (`vmfo-settings`) |
| `VirtualMediaFolders\Addon\AbstractPlugin` | class | Base class for add-on Plugin |
| `VirtualMediaFolders\Addon\AbstractSettingsTab` | class | Base class for add-on SettingsTab |
| `VirtualMediaFolders\Addon\ActionSchedulerLoader` | class | Action Scheduler loader helper |

## Best Practices

1. **Use the base classes** — Extend `AbstractPlugin` and `AbstractSettingsTab` to eliminate boilerplate
2. **Declare dependency** — Use the `Requires Plugins: virtual-media-folders` header (WordPress 6.5+)
3. **Check parent plugin** — Also verify `VMFO_VERSION` is defined for older WordPress versions
4. **Use priorities** — Hook into upload filters with priority 20+ to run after VMFO
5. **Namespace everything** — Use unique prefixes for options, meta keys, and hooks
6. **Support fallbacks** — Branch on `supports_parent_tabs()` for tab vs standalone menu
7. **Follow WordPress standards** — Use WordPress Coding Standards and components
8. **Test thoroughly** — Include both PHP and JavaScript tests
9. **Internationalize** — Make all strings translatable

### UI/UX Checklist

Before releasing your add-on, verify:

**Tab Integration:**
- [ ] Tab registered via `vmfo_settings_tabs` filter
- [ ] Tab title is descriptive and concise
- [ ] Subtabs registered if add-on has multiple sections (optional)
- [ ] Content renders correctly within the tab area

**User Interface:**
- [ ] Loading states show spinner
- [ ] Success/error notices display properly
- [ ] UI is responsive on mobile (< 782px)
- [ ] Form fields have proper labels
- [ ] Save/action buttons are clearly labeled

**Code Quality:**
- [ ] Plugin extends `AbstractPlugin`
- [ ] SettingsTab extends `AbstractSettingsTab`
- [ ] All text is translatable with `__()` or `_e()`
- [ ] REST endpoints return proper error responses
- [ ] Assets are properly enqueued only on your tab
- [ ] No console errors or warnings
- [ ] Fallback works if parent plugin not available

## Resources

- [Parent Plugin Source](https://github.com/soderlind/virtual-media-folders)
- [Development Guide](development.md) – Parent plugin development setup
- [REST API Documentation](development.md#rest-api) – API endpoints
- [AI Organizer Source](https://github.com/soderlind/vmfa-ai-organizer) – Reference implementation
- [Editorial Workflow Source](https://github.com/soderlind/vmfa-editorial-workflow) – Reference implementation
- [Folder Exporter Source](https://github.com/soderlind/vmfa-folder-exporter) – Reference implementation
- [Media Cleanup Source](https://github.com/soderlind/vmfa-media-cleanup) – Reference implementation
- [Rules Engine Source](https://github.com/soderlind/vmfa-rules-engine) – Reference implementation
- [Smart Folders Source](https://github.com/soderlind/vmfa-smart-folders) – Reference implementation
