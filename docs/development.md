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
| GET | `/folders/counts` | Get folder counts (with optional media type filter) |

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

## Hooks & Filters

### Actions

| Hook | Description |
|------|-------------|
| `vmfo_folder_created` | Fired when a folder is created |
| `vmfo_folder_deleted` | Fired when a folder is deleted |
| `vmfo_media_moved` | Fired when media is moved to a folder |

### Settings Filters

#### `vmfo_default_settings`

Filter the default settings values.

```php
add_filter( 'vmfo_default_settings', function( $defaults ) {
    $defaults['show_all_media'] = true;
    $defaults['show_uncategorized'] = true;
    $defaults['jump_to_folder_after_move'] = false;
    $defaults['default_folder'] = 0;
    return $defaults;
} );
```

#### `vmfo_settings`

Filter all settings after loading from the database.

```php
add_filter( 'vmfo_settings', function( $options ) {
    // Force jump to folder after move for all users
    $options['jump_to_folder_after_move'] = true;
    return $options;
} );
```

#### `vmfo_setting_{$key}`

Filter a specific setting value. Available keys:
- `show_all_media`
- `show_uncategorized`
- `jump_to_folder_after_move`
- `default_folder`

```php
// Hide "All Media" option for non-administrators
add_filter( 'vmfo_setting_show_all_media', function( $value, $key, $options ) {
    if ( ! current_user_can( 'manage_options' ) ) {
        return false;
    }
    return $value;
}, 10, 3 );
```

> **Note:** At least one of `show_all_media` or `show_uncategorized` must be `true`. If both are set to `false`, `show_all_media` will automatically be enabled.

### Other Filters

| Filter | Description |
|--------|-------------|
| `vmfo_suggestion_matchers` | Customize suggestion matching logic |
| `vmfo_folder_capabilities` | Modify capability requirements |
| `vmfo_include_child_folders` | Include child folders in queries |

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
