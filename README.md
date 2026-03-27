# Virtual Media Folders

Virtual folder organization for the WordPress Media Library.

[![Try in WordPress Playground](https://img.shields.io/badge/▶_Try_in_WordPress_Playground-blue?style=for-the-badge)](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/soderlind/virtual-media-folders/refs/heads/main/.wordpress-org/blueprints/blueprint.json)

>Way back in 2006 (20 years ago!), I released [ImageManager 2.0](assets/imagemnager-2006.md), a popular WordPress plugin for image management and editing. Virtual Media Folders is my modern take on media organization for WordPress, built with React and modern tooling.

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

### Free add-ons
Use the [**add-on manager**](https://github.com/soderlind/vmfa) to install and manage add-ons that extend Virtual Media Folders from a dedicated admin screen:

- [**AI Organizer**](https://github.com/soderlind/vmfa-ai-organizer) – Uses vision-capable AI models to analyze actual image content and automatically organize your media library into virtual folders. This is add-on functionality requiring an API key from a supported AI service provider.
- [**Editorial Workflow**](https://github.com/soderlind/vmfa-editorial-workflow) – Role-based folder access, move restrictions, and Inbox workflow.
- [**Folder Exporter**](https://github.com/soderlind/vmfa-folder-exporter) – Export folders (or subtrees) as ZIP archives with optional CSV manifests.
- [**Media Cleanup**](https://github.com/soderlind/vmfa-media-cleanup) – Detect unused, duplicate, and oversized media — then archive, trash, or flag for review.
- [**Rules Engine**](https://github.com/soderlind/vmfa-rules-engine) – Rule-based automatic folder assignment for media uploads, based on metadata, file type, or other criteria.



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

### AI Abilities

Virtual Media Folders exposes Abilities API tools that can be used by AI agents and MCP adapters.

- **`vmfo/list-folders`** (read-only): Lists folders with `id`, `name`, `parent_id`, `path`, and `count`.
- **`vmfo/create-folder`** (write): Creates a folder with `name` and optional `parent_id`.
- **`vmfo/add-to-folder`** (write): Adds one or more attachments to a folder using `folder_id` and `attachment_ids`.

Recommended flow for AI clients:

1. Call `vmfo/list-folders` to resolve folder names and paths to a stable `id`.
2. If needed, call `vmfo/create-folder` to create the target folder.
3. Call `vmfo/add-to-folder` with that `folder_id` and one or more `attachment_ids`.

This avoids ambiguity when folder names are duplicated under different parents.

Permission model:

- `vmfo/list-folders` and `vmfo/add-to-folder` require the `upload_files` capability.
- `vmfo/create-folder` requires the `manage_categories` capability.

WordPress MCP adapter (default server) example:

```bash
# Endpoint:
# /wp-json/mcp/mcp-adapter-default-server

# List tools
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
	-u "username:application-password" \
	-H "Content-Type: application/json" \
	-d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Resolve folder id via gateway
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
	-u "username:application-password" \
	-H "Content-Type: application/json" \
	-d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"mcp-adapter-execute-ability","arguments":{"ability_name":"vmfo/list-folders","parameters":{"search":"travel","hide_empty":false}}}}'

# Add attachments to folder via gateway
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
	-u "username:application-password" \
	-H "Content-Type: application/json" \
	-d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"mcp-adapter-execute-ability","arguments":{"ability_name":"vmfo/add-to-folder","parameters":{"folder_id":2285,"attachment_ids":[101,205,309]}}}}'

# Create folder via gateway
curl -X POST "https://example.com/wp-json/mcp/mcp-adapter-default-server" \
	-u "username:application-password" \
	-H "Content-Type: application/json" \
	-d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"mcp-adapter-execute-ability","arguments":{"ability_name":"vmfo/create-folder","parameters":{"name":"Travel","parent_id":0}}}}'
```

[Smoke test](./scripts/mcp-adapter-smoke-test.sh):

```bash
MCP_BASE_URL="https://example.com/wp-json/mcp/mcp-adapter-default-server" \
MCP_USER="per" \
MCP_APP_PASS="xxxx xxxx xxxx xxxx xxxx xxxx" \
./scripts/mcp-adapter-smoke-test.sh
```

## Documentation

- [Accessibility](docs/a11y.md) – Keyboard navigation and screen reader support
- [Development](docs/development.md) – Setup, API reference, hooks, and contributing
- [Add-on Development](docs/addon-development.md) – Guide to building add-on plugins
- [MCP Integration](docs/mcp.md) – Upload, find/create folder, and assign media via MCP

## License

Virtual Media Folders is free software licensed under the [GPL v2 or later](https://www.gnu.org/licenses/gpl-2.0.html).

Copyright 2025 Per Soderlind
