# Development Guide

This document covers development setup, project structure, and contribution guidelines for Virtual Media Folders.

## Requirements

- Node.js 18+
- PHP 8.3+
- Composer
- WordPress 6.8+

## Setup

```bash
# Clone the repository
git clone https://github.com/soderlind/virtual-media-folders.git
cd virtual-media-folders

# Install dependencies
composer install
npm install

# Start development build with watch
npm run start

# Build for production
npm run build
```

## Testing

```bash
# Run PHP tests (PHPUnit)
composer test
# or
vendor/bin/phpunit

# Run JavaScript tests (Vitest)
npm test

# Run JS tests in watch mode
npm test -- --watch
```

## Project Structure

```
virtual-media-folders/
├── build/                  # Compiled assets (generated)
├── docs/                   # Documentation
│   ├── a11y.md            # Accessibility documentation
│   ├── design.md          # Design decisions
│   └── development.md     # This file
├── languages/              # Translation files
├── src/
│   ├── Admin.php          # Media Library integration
│   ├── Editor.php         # Gutenberg integration  
│   ├── RestApi.php        # REST API endpoints
│   ├── Settings.php       # Settings page
│   ├── Suggestions.php    # Smart folder suggestions
│   ├── Taxonomy.php       # Custom taxonomy registration
│   ├── admin/             # Media Library UI (React)
│   │   ├── index.js       # Entry point
│   │   ├── media-library.js
│   │   ├── settings.js    # Settings page JS
│   │   ├── components/    # React components
│   │   └── styles/        # CSS files
│   ├── editor/            # Gutenberg integration (React)
│   │   ├── index.js
│   │   ├── components/
│   │   └── styles/
│   └── shared/            # Shared components & hooks
│       ├── components/    # BaseFolderTree, LiveRegion, etc.
│       ├── hooks/         # useFolderData, useMoveMode, etc.
│       └── utils/         # folderApi.js
├── tests/
│   ├── js/                # JavaScript tests (Vitest)
│   └── php/               # PHP tests (PHPUnit)
├── uninstall.php          # Cleanup on uninstall
└── virtual-media-folders.php  # Main plugin file
```

## Build System

The plugin uses `@wordpress/scripts` for building:

- **Entry points**: `admin`, `editor`, `settings` (configured in `webpack.config.js`)
- **Output**: `build/` directory with minified JS/CSS and asset manifests

## REST API

The plugin provides REST API endpoints under `/wp-json/vmfo/v1`:

### Endpoints

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
| GET | `/folders/counts` | Get folder counts (with optional `media_type` filter) |

### Authentication

Use [Application Passwords](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/) (WordPress 5.6+). Generate one at **Users > Profile > Application Passwords**.
- `username`: your WordPress username
- `xxxx xxxx xxxx xxxx xxxx xxxx`: the generated application password

### Examples

```bash
# Create a new folder
curl -X POST "https://example.com/wp-json/vmfo/v1/folders" \
  -u "username:xxxx xxxx xxxx xxxx xxxx xxxx" \
  -H "Content-Type: application/json" \
  -d '{"name": "Photos", "parent": 0}'

# Response: {"id": 5, "name": "Photos", "slug": "photos", "parent": 0, "count": 0}

# Add media (ID 123) to the folder (ID 5)
curl -X POST "https://example.com/wp-json/vmfo/v1/folders/5/media" \
  -u "username:xxxx xxxx xxxx xxxx xxxx xxxx" \
  -H "Content-Type: application/json" \
  -d '{"media_id": 123}'

# List all folders
curl "https://example.com/wp-json/vmfo/v1/folders" \
  -u "username:xxxx xxxx xxxx xxxx xxxx xxxx"
```

## AI Abilities API

Virtual Media Folders exposes two Abilities API tools for AI/MCP integrations:

- `vmfo/list-folders` (read-only)
- `vmfo/add-to-folder` (write)

Recommended flow:

1. Call `vmfo/list-folders` to resolve a folder name/path to a stable `id`.
2. Call `vmfo/add-to-folder` with that `folder_id` and one or more `attachment_ids`.

### Request/Response Examples

`vmfo/list-folders` request input:

```json
{
    "search": "travel",
    "hide_empty": false
}
```

`vmfo/list-folders` response output:

```json
{
    "folders": [
        {
            "id": 2285,
            "name": "Aerial Views",
            "parent_id": 2284,
            "path": "Travel / Aerial Views",
            "count": 2
        },
        {
            "id": 2321,
            "name": "Travel Portraits",
            "parent_id": 2284,
            "path": "Travel / Travel Portraits",
            "count": 6
        }
    ],
    "total": 2
}
```

`vmfo/add-to-folder` request input:

```json
{
    "folder_id": 2285,
    "attachment_ids": [
        101,
        205,
        309
    ]
}
```

`vmfo/add-to-folder` response output:

```json
{
    "success": true,
    "folder_id": 2285,
    "attachment_ids": [
        101,
        205,
        309
    ],
    "processed_count": 3,
    "message": "Processed 3 media items.",
    "results": [
        {
            "success": true,
            "media_id": 101,
            "folder_id": 2285,
            "message": "Media added to folder."
        },
        {
            "success": true,
            "media_id": 205,
            "folder_id": 2285,
            "message": "Media added to folder."
        },
        {
            "success": true,
            "media_id": 309,
            "folder_id": 2285,
            "message": "Media added to folder."
        }
    ]
}
```

Both abilities require the `upload_files` capability.

### WordPress MCP Adapter Examples

When using the default server from `wordpress/mcp-adapter`, the MCP HTTP endpoint is:

`/wp-json/mcp/mcp-adapter-default-server`

List available tools:

```bash
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
    -u "username:application-password" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list",
        "params": {}
    }'
```

Call `vmfo/list-folders` via the gateway tool (`mcp-adapter-execute-ability`):

```bash
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
    -u "username:application-password" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "mcp-adapter-execute-ability",
            "arguments": {
                "ability_name": "vmfo/list-folders",
                "parameters": {
                    "search": "travel",
                    "hide_empty": false
                }
            }
        }
    }'
```

Call `vmfo/add-to-folder` via the gateway tool (`mcp-adapter-execute-ability`):

```bash
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
    -u "username:application-password" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "mcp-adapter-execute-ability",
            "arguments": {
                "ability_name": "vmfo/add-to-folder",
                "parameters": {
                    "folder_id": 2285,
                    "attachment_ids": [101, 205, 309]
                }
            }
        }
    }'
```

In practice, the AI flow is:

1. `tools/call` -> `mcp-adapter-execute-ability` with `ability_name = vmfo/list-folders`
2. `tools/call` -> `mcp-adapter-execute-ability` with `ability_name = vmfo/add-to-folder`

### MCP Adapter Smoke Test

Use the bundled smoke test to verify MCP adapter gateway behavior end-to-end.

From the plugin root:

```bash
MCP_BASE_URL="https://example.com/wp-json/mcp/mcp-adapter-default-server" \
MCP_USER="per" \
MCP_APP_PASS="xxxx xxxx xxxx xxxx xxxx xxxx" \
./scripts/mcp-adapter-smoke-test.sh
```

What it checks:

1. `initialize` returns HTTP 200 and `Mcp-Session-Id`
2. `tools/list` includes `mcp-adapter-execute-ability`
3. `vmfo/list-folders` executes via gateway and returns folder data
4. `vmfo/add-to-folder` executes via gateway in safe negative mode (no data mutation)

## Hooks & Filters

See [hooks.md](hooks.md) for the complete hooks reference, including all core hooks and add-on hooks with examples.

## Preconfiguring Folders

Create folders programmatically using the WordPress taxonomy API:

```php
add_action( 'init', function() {
    // Only run once
    if ( get_option( 'my_theme_vmfo_folders_created' ) ) {
        return;
    }

    if ( ! taxonomy_exists( 'vmfo_folder' ) ) {
        return;
    }

    $folders = [
        'Photos' => [ 'Events', 'Products', 'Team' ],
        'Documents' => [ 'Reports', 'Presentations' ],
        'Videos',
        'Logos',
    ];

    foreach ( $folders as $parent => $children ) {
        if ( is_array( $children ) ) {
            $parent_term = wp_insert_term( $parent, 'vmfo_folder' );
            if ( ! is_wp_error( $parent_term ) ) {
                foreach ( $children as $child ) {
                    wp_insert_term( $child, 'vmfo_folder', [
                        'parent' => $parent_term['term_id'],
                    ] );
                }
            }
        } else {
            wp_insert_term( $children, 'vmfo_folder' );
        }
    }

    update_option( 'my_theme_vmfo_folders_created', true );
}, 20 );
```

Set custom folder order:

```php
update_term_meta( $term_id, 'vmfo_order', 0 ); // First position
update_term_meta( $term_id, 'vmfo_order', 1 ); // Second position
```

## Translation

```bash
# Generate all translation files
npm run i18n

# Or individually:
npm run i18n:make-pot   # Generate POT file
npm run i18n:update-po  # Update PO files
npm run i18n:make-mo    # Generate MO files
npm run i18n:make-json  # Generate JSON for JavaScript
npm run i18n:make-php   # Generate PHP for faster loading
```

The `i18n-map.json` file maps source files to their compiled outputs for proper string extraction.

## Creating a Distribution

```bash
# Install WP-CLI dist-archive command (one-time)
wp package install wp-cli/dist-archive-command

# Build and create zip
npm run build
composer install --no-dev
wp dist-archive . virtual-media-folders.zip --plugin-dirname=virtual-media-folders
```

The `.distignore` file controls what's excluded from the distribution.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`composer test && npm test`)
5. Commit your changes
6. Push to the branch
7. Submit a pull request

### Code Style

- PHP: WordPress Coding Standards
- JavaScript: WordPress Scripts ESLint config
- Use strict typing in PHP (`declare(strict_types=1)`)
