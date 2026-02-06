# Add-on Development Guide

This comprehensive guide covers everything you need to know to build add-on plugins for Virtual Media Folders.

## Table of Contents

- [Philosophy & Architecture](#philosophy--architecture)
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Plugin Structure](#plugin-structure)
- [Bootstrap File](#bootstrap-file)
- [Settings Tab Integration](#settings-tab-integration)
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

Two official add-ons are available as reference implementations:

- **[AI Organizer](https://github.com/soderlind/vmfa-ai-organizer)** – Uses AI vision models to automatically suggest folders for images
- **[Rules Engine](https://github.com/soderlind/vmfa-rules-engine)** – Rule-based automatic folder assignment based on metadata

## Prerequisites

- Virtual Media Folders 1.6.0 or later
- PHP 8.3 or later
- WordPress 6.8 or later

## Plugin Structure

A typical add-on follows this structure:

```
my-vmfa-addon/
├── build/                    # Compiled assets
├── src/
│   ├── php/                  # PHP classes
│   │   ├── Plugin.php        # Main plugin class
│   │   ├── Admin.php         # Admin integration
│   │   └── REST/             # REST API controllers
│   ├── js/                   # React components
│   │   ├── index.js          # Entry point
│   │   ├── settings/         # Settings page components
│   │   │   ├── index.jsx
│   │   │   ├── SettingsPanel.jsx
│   │   │   └── StatsCard.jsx
│   │   └── components/       # Shared React components
│   └── css/                  # Stylesheets
│       └── settings.css
├── languages/                # Translation files
├── my-vmfa-addon.php         # Plugin bootstrap
├── package.json
├── composer.json
└── webpack.config.js
```

## Bootstrap File

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
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Fallback check for WordPress < 6.5 (which doesn't support Requires Plugins header).
add_action( 'plugins_loaded', function() {
    if ( ! defined( 'VMFO_VERSION' ) ) {
        add_action( 'admin_notices', function() {
            echo '<div class="notice notice-error"><p>';
            esc_html_e( 'My VMFA Add-on requires Virtual Media Folders to be installed and activated.', 'my-vmfa-addon' );
            echo '</p></div>';
        });
        return;
    }

    // Initialize your add-on.
    require_once __DIR__ . '/src/php/Plugin.php';
    \MyVmfaAddon\Plugin::get_instance();
});
```

## Settings Tab Integration

Virtual Media Folders provides a tab-based settings page architecture that allows add-on plugins to register their own settings tabs within the parent plugin's "Folder Settings" page.

### Detecting Tab Support

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

### Rendering Tab Content

The callback function receives two parameters:

```php
public function render_tab_content( string $active_tab, string $active_subtab ): void {
    ?>
    <div id="my-addon-app"></div>
    <?php
}
```

### Sub-tabs (Standard Structure)

All add-ons **must** implement the following 4 sub-tabs in this exact order:

| Sub-tab | Purpose | Content Guidelines |
|---------|---------|-------------------|
| **Overview** | Landing page | KPI cards, description, primary action button |
| **Dashboard** | Status & monitoring | KPI cards, last run status, recent activity |
| **Actions** | Operations only | Run/Scan/Reset buttons. **No settings** |
| **Configure** | Settings only | Form fields, checkboxes, dropdowns. **No action buttons** |

**Important Rules:**
- Do NOT put action buttons (Run Scan, Reset) inside Configure — Configure is settings-only
- Do NOT put settings (checkboxes, dropdowns) inside Actions — Actions is operations-only
- If a section is not applicable, show it disabled or display an empty state (don't hide it)

### Using the Add-on Shell Component

The parent plugin provides a shared `AddonShell` React component that enforces consistent UI:

```jsx
import { AddonShell, StatsCard } from '@vmfo/shared';
// Or if not using webpack externals:
// const { AddonShell, StatsCard } = window.vmfo.shared;

function MyAddonPanel() {
    const stats = [
        { label: 'Total Media', value: 1060 },
        { label: 'Processed', value: 1037 },
        { label: 'Pending', value: 23 },
        { label: 'Errors', value: 0 },
    ];

    return (
        <AddonShell
            addonKey="my-addon"
            addonLabel="My Add-on"
            enabled={true}
            stats={stats}
            overviewContent={<OverviewPage stats={stats} />}
            dashboardContent={<DashboardPage />}
            actionsContent={<ActionsPage />}
            configureContent={<ConfigurePage />}
        />
    );
}
```

#### PHP Setup for Add-on Shell

Your PHP should render a simple container and let React handle the sub-tabs:

```php
public function render_tab_content( string $active_tab, string $active_subtab ): void {
    ?>
    <div id="my-addon-app"></div>
    <?php
}
```

The `AddonShell` component automatically:
- Reads `subtab` from the URL query string
- Updates the URL when tabs are clicked (browser history support)
- Renders the appropriate content based on active sub-tab
- Handles disabled tabs and empty states

### URL Structure

The settings page uses the following URL pattern:

```
/wp-admin/upload.php?page=vmfo-settings&tab={tab-slug}&subtab={subtab-slug}
```

- `page`: Always `vmfo-settings`
- `tab`: Your add-on's tab slug (e.g., `my-addon`)
- `subtab`: One of: `overview`, `dashboard`, `actions`, `configure`

### Enqueuing Scripts

Only enqueue when your tab is active. Add `vmfo-shared` as a dependency to use the shared components:

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

    // Add vmfo-shared to dependencies to use AddonShell components.
    $dependencies = array_merge( $asset['dependencies'], [ 'vmfo-shared' ] );

    wp_enqueue_script(
        'my-addon-admin',
        MY_ADDON_URL . 'build/index.js',
        $dependencies,
        $asset['version'],
        true
    );

    wp_enqueue_style(
        'my-addon-admin',
        MY_ADDON_URL . 'build/index.css',
        [ 'wp-components', 'vmfo-shared' ],
        $asset['version']
    );

    wp_localize_script( 'my-addon-admin', 'myAddonData', [
        'restUrl' => rest_url( 'my-addon/v1/' ),
        'nonce'   => wp_create_nonce( 'wp_rest' ),
        'folders' => $this->get_folders(),
    ]);
}, 10, 2);
```

#### Webpack Configuration for Shared Components

To import shared components cleanly, configure webpack externals:

```javascript
// webpack.config.js
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
    ...defaultConfig,
    externals: {
        ...defaultConfig.externals,
        '@vmfo/shared': 'vmfo.shared',
    },
};
```

Then import in your JavaScript:

```jsx
import { AddonShell, StatsCard } from '@vmfo/shared';
```

If you're not using webpack externals, access via the global:

```jsx
const { AddonShell, StatsCard } = window.vmfo.shared;
```

### Backwards Compatibility

Support older versions or standalone operation:

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

### Add-on Shell Layout

All add-ons must use the shared `AddonShell` component for a uniform UI:

```
┌─────────────────────────────────────────────────────────────────┐
│  Virtual Media Folders Settings                                 │
├─────────┬─────────────────┬──────────────┬─────────────┬────────┤
│ General │  AI Organizer   │ Edit. Workfl │ Media Clean │  ...   │  ← Top-level tabs
└─────────┴─────────────────┴──────────────┴─────────────┴────────┘
   Overview   Dashboard   Actions   Configure                        ← Sub-tabs (inline submenu)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1060        │    1037       │     23        │      0          │  ← KPI cards (4 columns)
│  Total Media  │   Assigned    │  Unassigned   │    Errors       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Content area - varies by sub-tab]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

The sub-tabs appear as an inline submenu directly below the add-on tab, visually connected to it.

### Sub-tab Content Guidelines

#### Overview Page
- KPI cards row at top
- Description card explaining the add-on
- Two buttons: Primary action (e.g., "Run Scan") + "Configure Settings"

```jsx
function OverviewPage({ stats, onRunScan }) {
    return (
        <>
            <StatsCard stats={stats} />
            <div className="vmfo-overview-card">
                <h3 className="vmfo-overview-card__title">AI Organizer</h3>
                <p className="vmfo-overview-card__description">
                    Automatically organizes your media library by analyzing and 
                    assigning media files into virtual folders based on content 
                    and metadata.
                </p>
                <div className="vmfo-overview-card__actions">
                    <Button variant="primary" onClick={onRunScan}>
                        Run Scan
                    </Button>
                    <Button variant="secondary" onClick={() => { /* navigate to configure */ }}>
                        Configure Settings
                    </Button>
                </div>
            </div>
        </>
    );
}
```

#### Dashboard Page
- KPI cards row at top
- Status row: Last Run timestamp + Current Status
- Recent activity or results summary

#### Configure Page
- Form sections with settings fields
- **No action buttons** — only configuration
- Save button at bottom

#### Actions Page
- Action cards with buttons: Run Scan, Re-scan Existing, Reset Results
- Destructive actions show warning text
- **No settings** — only operations

```jsx
function ActionsPage({ onRunScan, onReset }) {
    return (
        <>
            <div className="vmfo-actions-card">
                <h3 className="vmfo-actions-card__title">Run Scan</h3>
                <p className="vmfo-actions-card__description">
                    Analyze unassigned media and suggest folder assignments.
                </p>
                <Button variant="primary" onClick={onRunScan}>
                    Start Scan
                </Button>
            </div>
            
            <div className="vmfo-actions-card vmfo-actions-card--danger">
                <h3 className="vmfo-actions-card__title">Reset Results</h3>
                <p className="vmfo-actions-card__description">
                    Clear all scan results and start fresh.
                </p>
                <Button variant="secondary" isDestructive onClick={onReset}>
                    Reset All
                </Button>
                <p className="vmfo-actions-card__warning">
                    Warning: This action cannot be undone.
                </p>
            </div>
        </>
    );
}
```

### Color Palette

Use WordPress admin colors for consistency:

| Purpose | Color | Usage |
|---------|-------|-------|
| Primary text | `#1d2327` | Headings, important text |
| Secondary text | `#646970` | Descriptions, help text |
| Muted text | `#a7aaad` | Disabled, placeholders |
| Border | `#c3c4c7` | Card borders |
| Light border | `#f0f0f1` | Internal dividers |
| Background | `#f6f7f7` | Expandable headers, hover states |
| Primary action | `#2271b1` | Links, icons, primary buttons |
| Success | `#00a32a` | Success states, approved |
| Warning | `#dba617` | Warnings, pending |
| Error | `#d63638` | Errors, needs attention |

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

Use the shared `StatsCard` component instead of custom CSS:

```jsx
import { StatsCard } from '@vmfo/shared';

const stats = [
    { label: 'Total Media', value: 1002 },
    { label: 'In Folders', value: 1002 },
    { label: 'Unassigned', value: 0 },
    { label: 'Folders', value: 217 },
];

<StatsCard stats={stats} />
```

**CSS (for reference — use shared styles instead):**

```css
.my-addon-stats-card {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 24px 20px;
    text-align: center;
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    margin-bottom: 20px;
}

.my-addon-stat-item {
    padding: 0 16px;
    border-right: 1px solid #f0f0f1;
}

.my-addon-stat-item:last-child {
    border-right: none;
}

.my-addon-stat-value {
    font-size: 32px;
    font-weight: 600;
    line-height: 1.2;
    color: #1d2327;
}

.my-addon-stat-label {
    font-size: 13px;
    color: #646970;
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
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    margin-bottom: 20px;
}

.my-addon-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f1;
}

.my-addon-card-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1d2327;
}

.my-addon-card-body {
    padding: 20px;
}

.my-addon-card-description {
    margin: 0 0 20px;
    color: #646970;
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
    background: #f6f7f7;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    transition: background-color 0.15s;
}

.my-addon-expandable-header:hover {
    background: #f0f0f1;
}

.my-addon-toggle-icon {
    margin-right: 8px;
    color: #50575e;
}

.my-addon-item-name {
    flex: 1;
    font-weight: 500;
    color: #1d2327;
}

.my-addon-item-count {
    font-size: 12px;
    color: #646970;
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
    border-top: 1px solid #dcdcde;
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

| Constant | Type | Description |
|----------|------|-------------|
| `VMFO_VERSION` | string | Parent plugin version |
| `VMFO_PATH` | string | Parent plugin path |
| `VMFO_URL` | string | Parent plugin URL |
| `VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS` | bool | Tab system support |
| `VirtualMediaFolders\Settings::PAGE_SLUG` | string | Settings page slug (`vmfo-settings`) |

## Best Practices

1. **Declare dependency** – Use the `Requires Plugins: virtual-media-folders` header (WordPress 6.5+)
2. **Check parent plugin** – Also verify `VMFO_VERSION` is defined for older WordPress versions
3. **Use priorities** – Hook into upload filters with priority 20+ to run after VMFO
4. **Namespace everything** – Use unique prefixes for options, meta keys, and hooks
5. **Support fallbacks** – Work with or without the tab system
6. **Follow WordPress standards** – Use WordPress Coding Standards and components
7. **Test thoroughly** – Include both PHP and JavaScript tests
8. **Internationalize** – Make all strings translatable

### UI/UX Checklist

Before releasing your add-on, verify:

**Add-on Shell:**
- [ ] Uses `AddonShell` component from parent plugin
- [ ] All 4 sub-tabs implemented (Overview, Dashboard, Actions, Configure)
- [ ] Sub-tabs that are not applicable show disabled or empty state (don't hide them)

**Overview Page:**
- [ ] KPI cards display 4 relevant metrics
- [ ] Description block explains the add-on
- [ ] Primary action button is prominent
- [ ] "Configure Settings" secondary button present

**Dashboard Page:**
- [ ] KPI cards show current status
- [ ] Last run timestamp displayed
- [ ] Status indicator shows current state

**Configure Page:**
- [ ] Contains only settings (no action buttons)
- [ ] Form fields have proper labels
- [ ] Save button at bottom

**Actions Page:**
- [ ] Contains only actions (no settings)
- [ ] Destructive actions show warning text
- [ ] Actions have clear descriptions

**General:**
- [ ] Loading states show spinner
- [ ] Success/error notices display properly
- [ ] UI is responsive on mobile (< 782px)
- [ ] All text is translatable with `__()` or `_e()`
- [ ] REST endpoints return proper error responses
- [ ] Assets are properly enqueued only on your tab
- [ ] `vmfo-shared` is listed as a script dependency
- [ ] No console errors or warnings

## Resources

- [Parent Plugin Source](https://github.com/soderlind/virtual-media-folders)
- [Development Guide](development.md) – Parent plugin development setup
- [REST API Documentation](development.md#rest-api) – API endpoints
- [AI Organizer Source](https://github.com/soderlind/vmfa-ai-organizer) – Reference implementation
- [Rules Engine Source](https://github.com/soderlind/vmfa-rules-engine) – Reference implementation
- [Editorial Workflow Source](https://github.com/soderlind/vmfa-editorial-workflow) – Reference implementation
- [Media Cleanup Source](https://github.com/soderlind/vmfa-media-cleanup) – Reference implementation
- [Smart Folders Source](https://github.com/soderlind/vmfa-smart-folders) – Reference implementation
