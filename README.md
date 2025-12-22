# Virtual Media Folders

Virtual folder organization for the WordPress Media Library.

[![Try in WordPress Playground](https://img.shields.io/badge/▶_Try_in_WordPress_Playground-blue?style=for-the-badge)](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/soderlind/virtual-media-folders/refs/heads/main/.wordpress-org/blueprints/blueprint.json)

>Way back in 2006 (almost 20 years ago!), I released [ImageManager 2.0](assets/imagemnager-2006.md), a popular WordPress plugin for image management and editing. Virtual Media Folders is my modern take on media organization for WordPress, built with React and modern tooling.

## Description

Virtual Media Folders brings folder organization to your WordPress Media Library. Organize your media files into hierarchical folders **without moving files on disk**—folders are virtual, so your URLs never change.

[![Screenshot of Virtual Media Folders](assets/virtual-media-folders.png)](https://www.youtube.com/watch?v=bA4lf7ynz24)
*Click to watch demo video on YouTube*

### Features

- **Virtual Folders** – Create hierarchical folder structures to organize media
- **Drag & Drop** – Move media between folders with drag and drop
- **Sticky Sidebar** – Folder navigation stays visible while scrolling
- **Gutenberg Integration** – Filter media by folder in the block editor
- **Bulk Actions** – Move multiple media items at once
- **Keyboard Accessible** – Full keyboard navigation with screen reader support
- **Internationalized** – Translation ready (Norwegian Bokmål included)

## Requirements

- WordPress 6.8+
- PHP 8.3+

## Installation

### From GitHub

1. Download [\`virtual-media-folders.zip\`](https://github.com/soderlind/virtual-media-folders/releases/latest/download/virtual-media-folders.zip)
2. Go to **Plugins > Add New > Upload Plugin**
3. Upload the zip file and activate

### From [WordPress.org](https://wordpress.org/plugins/virtual-media-folders/)

1. Go to **Plugins > Add New**
2. Search for "Virtual Media Folders"
3. Click **Install Now** and **Activate**

## Usage

### Organizing Media

1. Go to **Media > Library**
2. Click the folder icon to show the sidebar
3. Use **+** to create folders
4. Drag media onto folders to organize / Bulk select media and use the "Move to Folder" action
5. Click a folder to filter the view

### Settings

Go to **Media > Folder Settings** to configure:

| Setting | Description |
|---------|-------------|
| Show "All Media" | Display "All Media" option in sidebar |
| Show "Uncategorized" | Display folder for unassigned media |
| Jump to folder after move | Navigate to target folder after moving |
| Default folder for uploads | Auto-assign new uploads to a folder |

### Block Editor

When inserting media from a block:

1. Open the Media Library modal
2. Use the folder sidebar to filter
3. Select your media

## Documentation

- [Accessibility](docs/a11y.md) – Keyboard navigation and screen reader support
- [Development](docs/development.md) – Setup, API reference, hooks, and contributing

## License

Virtual Media Folders is free software licensed under the [GPL v2 or later](https://www.gnu.org/licenses/gpl-2.0.html).

Copyright 2025 Per Soderlind
