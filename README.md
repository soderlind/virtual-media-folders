# Virtual Media Folders

Virtual folder organization and smart management for the WordPress Media Library.

<a href="https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/soderlind/virtual-media-folders/refs/heads/main/assets/blueprint.json"><img src="https://img.shields.io/badge/▶_Try_in_WordPress_Playground-blue?style=for-the-badge" alt="Try in WordPress Playground" /></a>

>Way back in 2006 (almost 20 years ago!), I released [ImageManager 2.0](assets/imagemnager-2006.md), a popular WordPress plugin for image management and editing. Virtual Media Folders is my modern take on media organization for WordPress, built with React and modern tooling.

## Description

Virtual Media Folders brings virtual folder organization to your WordPress Media Library. Organize your media files into hierarchical folders without moving files on disk—folders are virtual, so your URLs never change.

<a href="https://www.youtube.com/watch?v=C81ttYpji_c"><img width="899" height="449" alt="virtual-media-folders" src="https://github.com/user-attachments/assets/58322a25-0635-4376-85f4-7ea3b3b55ccb" /></a>

### Features

- **Virtual Folders**: Create hierarchical folder structures to organize media
- **Drag & Drop**: Easily move media between folders with drag and drop
- **Sticky Sidebar**: Folder navigation stays visible while scrolling through media
- **Gutenberg Integration**: Filter media by folder directly in the block editor
- **Bulk Actions**: Move multiple media items at once
- **Keyboard Accessible**: Full keyboard navigation support
- **Internationalized**: Ready for translation (Norwegian Bokmål included)

## Requirements

- WordPress 6.8 or higher
- PHP 8.3 or higher

## Installation

- Download [`virtual-media-folders.zip`](https://github.com/soderlind/virtual-media-folders/releases/latest/download/virtual-media-folders.zip)
- Upload via  Plugins > Add New > Upload Plugin
- Activate the plugin.

Plugin [updates are handled automatically](https://github.com/soderlind/wordpress-plugin-github-updater#readme) via GitHub. No need to manually download and install updates.

### Development

```bash
# Add via Composer
composer require soderlind/virtual-media-folders

# Install dependencies
composer install
npm install

# Start development build with watch
npm run start

# Build for production
npm run build

# Run PHP tests
composer test

# Run JavaScript tests
npm test
```

## Usage

### Organizing Media

1. Go to **Media > Library** in your WordPress admin
2. Click the folder icon next to the view switcher to show the folder sidebar
3. Use the **+** button to create new folders
4. Drag and drop media items onto folders to organize them
5. Click a folder to filter the media library view

### Gutenberg Block Editor

When inserting media in the block editor:

1. Open the Media Library modal from a block (e.g., Image or Gallery block etc.)
2. Use the folder sidebar to filter by folder
3. Select your media as usual

## Folder Structure

```
virtual-media-folders/
├── build/              # Compiled assets
├── docs/               # Documentation
├── languages/          # Translation files
├── src/
│   ├── Admin.php       # Media Library integration
│   ├── Editor.php      # Gutenberg integration  
│   ├── RestApi.php     # REST API endpoints
│   ├── Settings.php    # Settings page
│   ├── Suggestions.php # Smart suggestions
│   ├── Taxonomy.php    # Custom taxonomy
│   ├── admin/          # Media Library UI
│   │   ├── components/ # React components
│   │   └── styles/     # CSS
│   ├── editor/         # Gutenberg integration
│   └── shared/         # Shared components & hooks
├── tests/
│   ├── js/             # Vitest tests
│   └── php/            # PHPUnit tests
├── uninstall.php       # Cleanup on uninstall
└── virtual-media-folders.php    # Main plugin file
```

## REST API

The plugin provides REST API endpoints under `vmf/v1`:

### Folders

- `GET /folders` - List all folders
- `POST /folders` - Create a folder
- `GET /folders/{id}` - Get a folder
- `PUT /folders/{id}` - Update a folder
- `DELETE /folders/{id}` - Delete a folder
- `POST /folders/{id}/media` - Add media to folder
- `DELETE /folders/{id}/media` - Remove media from folder

## Hooks & Filters

### Actions

- `vmf_folder_created` - Fired when a folder is created
- `vmf_folder_deleted` - Fired when a folder is deleted
- `vmf_media_moved` - Fired when media is moved to a folder

### Filters

- `vmf_suggestion_matchers` - Customize suggestion matching logic
- `vmf_folder_capabilities` - Modify capability requirements

## Translation

Generate translation files:

```bash
# Generate POT file
npm run i18n:make-pot

# Generate JSON files for JavaScript
npm run i18n:make-json

# Generate PHP files for faster loading
npm run i18n:make-php
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

# Copyright and License

Virtual Media Folders is copyright 2025 Per Soderlind

Virtual Media Folders is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License, or (at your option) any later version.

Virtual Media Folders is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with the Extension. If not, see http://www.gnu.org/licenses/.

