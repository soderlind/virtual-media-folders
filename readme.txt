=== Media Manager ===
Contributors: PerS
Tags: media, folders, organization, media library, virtual folders
Requires at least: 6.8
Tested up to: 6.8
Stable tag: 0.1.9
Requires PHP: 8.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Virtual folder organization and smart management for the WordPress Media Library.

== Description ==

Media Manager brings virtual folder organization to your WordPress Media Library. Organize your media files into hierarchical folders without moving files on disk—folders are virtual, so your URLs never change.

= Features =

* **Virtual Folders** – Create hierarchical folder structures to organize media
* **Drag & Drop** – Easily move media between folders with drag and drop
* **Sticky Sidebar** – Folder navigation stays visible while scrolling through media
* **Smart Suggestions** – Automatic folder suggestions based on file type, EXIF data, and IPTC keywords
* **Gutenberg Integration** – Filter media by folder directly in the block editor
* **Bulk Actions** – Move multiple media items at once
* **Keyboard Accessible** – Full keyboard navigation support
* **Internationalized** – Ready for translation (Norwegian Bokmål included)

= How It Works =

Media Manager uses a custom taxonomy to assign media to folders. This means:

* Your media files stay exactly where they are on the server
* URLs never change when you reorganize
* Folders can be nested to create hierarchies

= Smart Suggestions =

When you upload new media, Media Manager can automatically suggest folders based on:

* **File type** – Images, videos, documents, audio files
* **EXIF date** – Photo creation date from camera metadata
* **IPTC keywords** – Embedded keywords in professional images

Configure these options in Settings → Folder Settings.

== Installation ==

1. Upload the `mediamanager` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Media → Library to start organizing your media

= From WordPress Plugin Directory =

1. Go to Plugins → Add New in your WordPress admin
2. Search for "Media Manager"
3. Click "Install Now" and then "Activate"

== Frequently Asked Questions ==

= Will this move my actual files? =

No. Media Manager uses virtual folders. Your files stay exactly where they are on the server, and all URLs remain unchanged.

= Can I nest folders? =

Yes! You can create hierarchical folder structures with unlimited nesting levels.

= Does this work with Gutenberg? =

Yes! When inserting media in the block editor, you can filter by folder using the sidebar in the Media Library modal.

= Can I assign media to multiple folders? =

No, each media item belongs to one folder at a time. Moving media to a new folder removes it from the previous folder.

= What happens if I delete a folder? =

Only the folder organization is removed. Your media files are not deleted.

= Is this compatible with my theme? =

Media Manager works entirely within the WordPress admin. It doesn't affect your front-end theme.

== Changelog ==

= 0.1.9 =
* Added: New "Jump to Folder After Move" setting (enabled by default) to control whether view switches to target folder after moving files
* Added: URL now uses `mode=folder` parameter when folder view is active
* Changed: Bulk select mode is now automatically disabled after bulk moving files
* Changed: Smart Suggestions settings hidden until feature is fully implemented

= 0.1.8 =
* Added: Folder item counts now reflect the selected media type filter (Images, Videos, Audio, Documents)
* Added: New REST API endpoint for filtered folder counts

= 0.1.7 =
* Added: After bulk moving files, focus automatically switches to the target folder

= 0.1.6 =
* Fixed: Folder dropdowns now dynamically update when folders are added, renamed, or deleted
* Changed: BulkFolderAction and MoveToFolderMenu now listen for folder change events

= 0.1.5 =
* Changed: MEDIAMANAGER_VERSION now uses actual version number in production (WP_DEBUG=false)
* Removed: Debug console.log statements from JavaScript

= 0.1.4 =
* Changed: Refactored PHP classes to PSR-4 autoloading structure
* Changed: Moved class files from includes/ to src/ directory
* Changed: Renamed classes to follow PSR-4 naming conventions (REST_API → RestApi, GitHub_Plugin_Updater → GitHubPluginUpdater)

= 0.1.3 =
* Housekeeping

= 0.1.2 =
* Changed: Refactored folder sidebar to share code between Media Library and Gutenberg modal
* Changed: Created shared hooks and base components for folder tree
* Added: Focus moves to Uncategorized or All Media after deleting a folder
* Added: Comprehensive code documentation throughout

= 0.1.1 =
* Fixed: Sticky sidebar now works correctly in Gutenberg media modal
* Fixed: Improved scroll detection for modal attachments wrapper

= 0.1.0 =
* Initial release
* Virtual folder organization
* Drag and drop support
* Sticky sidebar with fixed positioning on scroll
* Bulk move action with compact UI
* Smart folder suggestions (MIME type, EXIF, IPTC)
* Gutenberg integration with folder sidebar
* Settings page
* Norwegian Bokmål translation

== Upgrade Notice ==

= 0.1.9 =
New setting to control jump-to-folder behavior after moving files. Bulk select now auto-disables after moves.

= 0.1.8 =
Folder counts now update based on the selected media type filter.

= 0.1.7 =
Bulk move now focuses on target folder to show moved files.

= 0.1.6 =
Folder dropdowns now update dynamically without page reload.

= 0.1.5 =
Production-ready version constant and cleaned up debug logging.

= 0.1.4 =
Refactored to PSR-4 autoloading for better Composer compatibility.

= 0.1.3 =
Housekeeping.

= 0.1.2 =
Refactored folder sidebar with shared components. Better UX after folder deletion.

= 0.1.1 =
Fixes sticky sidebar in Gutenberg media modal.

= 0.1.0 =
Initial release of Media Manager.

== Privacy Policy ==

Media Manager does not:

* Track users
* Send data to external servers
* Use cookies
* Collect any personal information

All data is stored locally in your WordPress database.
