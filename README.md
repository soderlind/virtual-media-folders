# Media Manager

Virtual folder organization and smart management for the WordPress Media Library.

![WordPress 6.8+](https://img.shields.io/badge/WordPress-6.8%2B-blue)
![PHP 8.3+](https://img.shields.io/badge/PHP-8.3%2B-purple)
![License: GPL v2+](https://img.shields.io/badge/License-GPL%20v2%2B-green)

>Way back in 2006 (20 years ago!), I released [ImageManager 2.0](assets/imagemnager-2006.md), a popular WordPress plugin for image management and editing. Media Manager is my modern take on media organization for WordPress, built with React and modern tooling.

## Description

Media Manager brings virtual folder organization to your WordPress Media Library. Organize your media files into hierarchical folders without moving files on disk—folders are virtual, so your URLs never change.


https://github.com/user-attachments/assets/1a6d353c-3803-48c8-987d-7057777b6b5b


### Features

- **Virtual Folders**: Create hierarchical folder structures to organize media
- **Drag & Drop**: Easily move media between folders with drag and drop
- **Sticky Sidebar**: Folder navigation stays visible while scrolling through media
- **Smart Suggestions**: Automatic folder suggestions based on file type, EXIF data, and IPTC keywords
- **Gutenberg Integration**: Filter media by folder directly in the block editor
- **Bulk Actions**: Move multiple media items at once
- **Keyboard Accessible**: Full keyboard navigation support
- **Internationalized**: Ready for translation (Norwegian Bokmål included)

## Requirements

- WordPress 6.8 or higher
- PHP 8.3 or higher

## Installation

- **Quick Install**

   - Download [`mediamanager.zip`](https://github.com/soderlind/mediamanager/releases/latest/download/mediamanager.zip)
   - Upload via  Plugins > Add New > Upload Plugin
   - Activate the plugin.

- **Updates**
   * Plugin [updates are handled automatically](https://github.com/soderlind/wordpress-plugin-github-updater#readme) via GitHub. No need to manually download and install updates.

### Development

```bash
# Add via Composer
composer require soderlind/mediamanager

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

### Smart Suggestions

When uploading new media, the plugin can suggest folders based on:

- **File type**: Images, videos, documents, etc.
- **EXIF date**: Photo creation date from camera metadata
- **IPTC keywords**: Embedded keywords in images

Configure suggestions in **Settings > Folder Settings**.

## Folder Structure

```
mediamanager/
├── build/              # Compiled assets
├── docs/               # Documentation
├── includes/           # PHP classes
│   ├── class-admin.php
│   ├── class-editor.php
│   ├── class-rest-api.php
│   ├── class-settings.php
│   ├── class-suggestions.php
│   └── class-taxonomy.php
├── languages/          # Translation files
├── src/
│   ├── admin/          # Media Library UI
│   │   ├── components/ # React components
│   │   └── styles/     # CSS
│   └── editor/         # Gutenberg integration
├── tests/
│   ├── js/             # Vitest tests
│   └── php/            # PHPUnit tests
└── mediamanager.php    # Main plugin file
```

## REST API

The plugin provides REST API endpoints under `mediamanager/v1`:

### Folders

- `GET /folders` - List all folders
- `POST /folders` - Create a folder
- `GET /folders/{id}` - Get a folder
- `PUT /folders/{id}` - Update a folder
- `DELETE /folders/{id}` - Delete a folder
- `POST /folders/{id}/media` - Add media to folder
- `DELETE /folders/{id}/media` - Remove media from folder

### Suggestions

- `GET /suggestions/{media_id}` - Get suggestions for media
- `POST /suggestions/{media_id}/apply` - Apply a suggestion
- `POST /suggestions/{media_id}/dismiss` - Dismiss suggestions

## Hooks & Filters

### Actions

- `mediamanager_folder_created` - Fired when a folder is created
- `mediamanager_folder_deleted` - Fired when a folder is deleted
- `mediamanager_media_moved` - Fired when media is moved to a folder

### Filters

- `mediamanager_suggestion_matchers` - Customize suggestion matching logic
- `mediamanager_folder_capabilities` - Modify capability requirements

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

Media Manager is copyright 2025 Per Soderlind

Media Manager is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License, or (at your option) any later version.

Media Manager is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with the Extension. If not, see http://www.gnu.org/licenses/.

