# Add-on Development Guide

This comprehensive guide covers everything you need to know to build add-on plugins for Virtual Media Folders.

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
│   └── js/                   # React components
│       ├── index.js          # Entry point
│       └── components/       # React components
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
 * Author: Your Name
 * License: GPL-2.0-or-later
 * Text Domain: my-vmfa-addon
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Check for parent plugin.
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

### Detecting Tab Support

Check if the parent plugin supports the tab system:

```php
private function supports_parent_tabs(): bool {
    return defined( 'VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS' )
        && \VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS;
}
```

### Registering a Tab

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

### Rendering Tab Content

```php
public function render_tab_content( string $active_tab, string $active_subtab ): void {
    ?>
    <div id="my-addon-app"></div>
    <?php
}
```

### Enqueuing Scripts

Only enqueue when your tab is active:

```php
add_action( 'vmfo_settings_enqueue_scripts', function( string $active_tab, string $active_subtab ): void {
    if ( 'my-addon' !== $active_tab ) {
        return;
    }

    $asset = require MY_ADDON_PATH . 'build/index.asset.php';

    wp_enqueue_script(
        'my-addon-admin',
        MY_ADDON_URL . 'build/index.js',
        $asset['dependencies'],
        $asset['version'],
        true
    );

    wp_localize_script( 'my-addon-admin', 'myAddonData', [
        'restUrl' => rest_url( 'my-addon/v1/' ),
        'nonce'   => wp_create_nonce( 'wp_rest' ),
        'folders' => $this->get_folders(),
    ]);
}, 10, 2);
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
    }
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
| POST | `/folders/{id}/media` | Add media to folder |
| DELETE | `/folders/{id}/media` | Remove media from folder |
| POST | `/folders/reorder` | Reorder folders |
| GET | `/folders/counts` | Get folder counts (supports `media_type` filter) |

#### Suggestion Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suggestions/{media_id}` | Get folder suggestions for a media item |
| POST | `/suggestions/{media_id}/apply` | Apply a suggested folder (requires `folder_id`) |
| POST | `/suggestions/{media_id}/dismiss` | Dismiss suggestions for a media item |

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

## React Development

### Build Setup

Use `@wordpress/scripts` for consistency with WordPress:

```json
{
  "scripts": {
    "build": "wp-scripts build",
    "start": "wp-scripts start"
  },
  "devDependencies": {
    "@wordpress/scripts": "^30.0.0"
  }
}
```

### webpack.config.js

```javascript
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
    ...defaultConfig,
    entry: {
        index: './src/js/index.js',
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

1. **Check parent plugin** – Always verify VMFO is active before initializing
2. **Use priorities** – Hook into upload filters with priority 20+ to run after VMFO
3. **Namespace everything** – Use unique prefixes for options, meta keys, and hooks
4. **Support fallbacks** – Work with or without the tab system
5. **Follow WordPress standards** – Use WordPress Coding Standards and components
6. **Test thoroughly** – Include both PHP and JavaScript tests
7. **Internationalize** – Make all strings translatable

## Resources

- [Parent Plugin Source](https://github.com/soderlind/virtual-media-folders)
- [Settings Tab Integration](addon-integration.md) – Detailed tab system documentation
- [Development Guide](development.md) – Parent plugin development setup
- [REST API Documentation](development.md#rest-api) – API endpoints
- [AI Organizer Source](https://github.com/soderlind/vmfa-ai-organizer) – Reference implementation
- [Rules Engine Source](https://github.com/soderlind/vmfa-rules-engine) – Reference implementation
