=== Virtual Media Folders ===
Contributors: PerS
Tags: media, ai, organization, media library, virtual folders
Requires at least: 6.8
Tested up to: 6.9
Stable tag: 1.4.2
Requires PHP: 8.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Virtual folder organization and smart management for the WordPress Media Library.

== Description ==

Virtual Media Folders brings virtual folder organization to your WordPress Media Library. Organize your media files into hierarchical folders without moving files on disk—folders are virtual, so your URLs never change.

= Features =

* **Virtual Folders** – Create hierarchical folder structures to organize media
* **Drag & Drop** – Easily move media between folders with drag and drop
* **Sticky Sidebar** – Folder navigation stays visible while scrolling through media
* **Gutenberg Integration** – Filter media by folder directly in the block editor
* **Bulk Actions** – Move multiple media items at once
* **Keyboard Accessible** – Full keyboard navigation support
* **Internationalized** – Ready for translation (Norwegian Bokmål included)
* **AI Organizer** – Uses vision-capable AI models to analyze actual image content and automatically organize your media library into virtual folders. This is [add-on functionality](https://github.com/soderlind/vmfa-ai-organizer) requiring an API key from a supported AI service provider.

https://www.youtube.com/watch?v=bA4lf7ynz24

= How It Works =

Virtual Media Folders uses a custom taxonomy to assign media to folders. This means:

* Your media files stay exactly where they are on the server
* URLs never change when you reorganize
* Folders can be nested to create hierarchies

= Usage =

**Organizing Media**

1. Go to **Media > Library**
2. Click the folder icon to show the sidebar
3. Use **+** to create folders
4. Drag media onto folders to organize / Bulk select media and use the "Move to Folder" action
5. Click a folder to filter the view

**Settings**

Go to **Media > Folder Settings** to configure:

* **Show "All Media"** – Display "All Media" option in sidebar
* **Show "Uncategorized"** – Display folder for unassigned media
* **Jump to folder after move** – Navigate to target folder after moving
* **Default folder for uploads** – Auto-assign new uploads to a folder

**Block Editor**

When inserting media from a block (Image, Gallery, etc.):

1. Open the Media Library modal
2. Use the folder sidebar to filter
3. Select your media as usual

= Documentation =

* [Accessibility](https://github.com/soderlind/virtual-media-folders/blob/main/docs/a11y.md) – Keyboard navigation and screen reader support
* [Development](https://github.com/soderlind/virtual-media-folders/blob/main/docs/development.md) – Setup, API reference, hooks, and contributing

= Add-ons =
* [Virtual Media Folders AI Organizer](https://github.com/soderlind/vmfa-ai-organizer) – Uses vision-capable AI models to analyze actual image content and automatically organize your media library into virtual folders.

== Installation ==

= From WordPress Plugin Directory =

1. Go to Plugins → Add New in your WordPress admin
2. Search for "Virtual Media Folders"
3. Click "Install Now" and then "Activate"



== Frequently Asked Questions ==

= Will this move my actual files? =

No. Virtual Media Folders uses virtual folders. Your files stay exactly where they are on the server, and all URLs remain unchanged.

= Can I nest folders? =

Yes! You can create hierarchical folder structures with unlimited nesting levels.

= Does this work with Gutenberg? =

Yes! When inserting media in the block editor, you can filter by folder using the sidebar in the Media Library modal.

= Can I assign media to multiple folders? =

No, each media item belongs to one folder at a time. Moving media to a new folder removes it from the previous folder.

= What happens if I delete a folder? =

Only the folder organization is removed. Your media files are not deleted.

= Is this compatible with my theme? =

Virtual Media Folders works entirely within the WordPress admin. It doesn't affect your front-end theme.

== Changelog ==

= 1.4.2 =
* Fixed: Removed unintended folder name padding in Gutenberg media modal for folders without children

= 1.4.1 =
* Fixed: Folder names for folders without children now align vertically with folder names of folders that have children in the sidebar

= 1.4.0 =
* Added: Sticky sidebar header - folder management buttons now stay visible when scrolling the folder list

= 1.3.9 =
* Fixed: Grid/List view icons now correctly show all media instead of forcing folder mode
* Fixed: Folder icon now respects "Show All Media" setting
* Fixed: URL encoding issue causing duplicate vmfo_folder parameter
* Fixed: Memory leaks from event listeners when hiding folder view
* Fixed: Race condition where duplicate folder button was created

= 1.3.8 =
* Changed: Hide (0) count on folders with subfolders to avoid confusion about empty folder branches

= 1.3.7 =
* Changed: Sidebar top now aligns horizontally with attachments-wrapper instead of first thumbnail

= 1.3.6 =
* Fixed: Folder sidebar now properly extends to viewport bottom and scrolls when content exceeds screen height
* Fixed: Sidebar uses fixed positioning to avoid clipping by parent containers
* Improved: Sidebar top alignment with first image thumbnail

= 1.3.5 =
* Fixed: React hook order error when entering bulk select mode
* Fixed: Race condition in folder refresh when moving media
* Improved: Bulk move folder dropdown now ordered like folder tree with hierarchy

= 1.3.4 =
* Added: Direct URL support for folder view via upload.php?mode=folder
* Fixed: Clicking folder icon from list view now correctly opens folder view

= 1.3.3 =
* Changed: Media folders taxonomy screen now mirrors sidebar ordering
* Changed: Removed sortable header UI from the Media Folders taxonomy list table
* Changed: Media Folders taxonomy UI is only visible when WP_DEBUG is true

= 1.3.2 =
* Changed: Folder counts endpoint now avoids per-folder queries for better performance
* Fixed: Suggestions REST response now matches stored suggestion labels (string-based suggestions)
* Fixed: Admin UI hardened notice rendering to avoid HTML injection
* Fixed: Admin UI reduced risk of duplicate event handlers/observers when scripts re-run

= 1.3.1 =
* Fixed: Settings page default folder dropdown now uses correct taxonomy (vmfo_folder)
* Fixed: Block editor folder filter now uses correct REST API endpoint (/wp/v2/vmfo_folder)
* Fixed: REST API schema title updated to vmfo-folder for consistency
* Fixed: Folder drag-drop reorder now persists correctly after page refresh

= 1.3.0 =
* Changed: Renamed all prefixes from VMF_ to VMFO_ for WordPress.org compliance
* Changed: Renamed taxonomy from media_folder to vmfo_folder for uniqueness
* Changed: Inline CSS now uses wp_add_inline_style() instead of embedded style tag
* Removed: GitHub update checker (WordPress.org handles updates)
* Added: Automatic migration for existing folder assignments from old taxonomy
* Added: .distignore file for proper distribution builds

= 1.2.3 =
* Changed: "All Media" folder now disabled by default in settings

= 1.2.2 =
* Fixed: REST API now returns all folders (removed meta_key ordering that excluded folders without vmf_order)

= 1.2.1 =
* Changed: Updated i18n-map.json with new accessibility component mappings
* Changed: Updated Norwegian (nb_NO) translations for all new accessibility strings

= 1.2.0 =
* Added: Keyboard-accessible move mode - press M to pick up media, arrow keys to navigate, Enter to drop
* Added: Screen reader announcements for all move mode actions
* Added: MoveModeBanner visual feedback during keyboard move mode
* Added: LiveRegion component for ARIA live announcements
* Added: useAnnounce and useMoveMode hooks for accessibility features
* Added: Visual drop target highlighting on folders during move mode
* Fixed: Screen reader instructions properly hidden from visual display
* Fixed: Enter key drops to folder without navigating during move mode
* Fixed: "Jump to Folder After Move" setting respected for keyboard moves
* Fixed: Mouse drag now cancels keyboard move mode to prevent conflicts

= 1.1.7 =
* Added: Auto-jump to target folder when moving the last file(s) from a folder

= 1.1.6 =
* Added: New bulk move AJAX endpoint for efficient bulk operations
* Performance: Bulk move now uses single AJAX request instead of one per file
* Fixed: Missing sprintf import causing error when selecting files in bulk mode
* Fixed: Sidebar visibility preserved when browser re-renders during bulk select mode

= 1.1.5 =
* Performance: Optimistic folder loading with localStorage caching for instant sidebar display
* Performance: Reduced API calls - secondary components read from cache instead of fetching
* Fixed: Eliminated layout shift with critical inline CSS for sidebar positioning
* Fixed: Folder order now persists correctly when dropping files on folders
* Fixed: REST API now returns vmf_order for proper client-side sorting

= 1.1.4 =
* Refactored: PHP REST API with shared helpers for capability checks, folder/attachment lookups
* Refactored: Settings class with centralized option retrieval and visibility enforcement
* Refactored: Admin class now uses Taxonomy::TAXONOMY constant instead of hardcoded strings
* Refactored: JavaScript folder API calls consolidated into shared utility
* Fixed: Test mock for useFolderData to properly handle parse:false API responses
* Removed: Unused SortableFolderList.jsx component

= 1.1.3 =
* Fixed: Block editor media modal now respects "Show All Media" and "Show Uncategorized" settings
* Fixed: Folder sidebar in Gutenberg modal matches Media Library settings visibility
* Changed: Replaced `wp_localize_script` with `wp_add_inline_script` for proper boolean handling in JS config

= 1.1.2 =
* Fixed: Default folder filter not applying on initial page load when "Show All Media" is disabled
* Fixed: Media Library now correctly shows only uncategorized files on load when Uncategorized is the default

= 1.1.1 =
* Fixed: 500 error on plugin information page when GitHub API returns null
* Fixed: Added defensive handling for null plugin info in GitHubPluginUpdater

= 1.1.0 =
* Added: Drag-and-drop folder reordering with visible grip handle
* Added: Custom folder order persists via vmf_order term meta
* Added: Optimistic UI updates for instant visual feedback during reorder
* Changed: Consolidated drag-drop implementation for better performance
* Changed: Removed unused DndContext and DraggableMedia components (smaller bundle)
* Fixed: Folder reorder now updates instantly without waiting for server response

= 1.0.7 =
* Added: Contextual help tab "Virtual Folders" on Media Library page
* Added: GitHub repository link in contextual help sidebar

= 1.0.6 =
* Added: Filter hooks for settings (`vmf_default_settings`, `vmf_settings`, `vmf_setting_{$key}`)
* Added: When "Show All Media" is disabled, "Uncategorized" becomes the default folder
* Changed: Removed "Sidebar Default Visible" setting (now uses localStorage)
* Changed: Consolidated settings into single "Default Behavior" section
* Fixed: Settings checkbox interdependency now saves correctly

= 1.0.5 =
* Housekeeping

= 1.0.4 =
* Fixed: Removed duplicate item removal logic in DroppableFolder to prevent event conflicts
* Fixed: Single file drag-drop now correctly delegates view refresh to refreshMediaLibrary()

= 1.0.3 =
* Fixed: Moving files from "All Media" view no longer removes them from view (both bulk and single file moves)
* Fixed: Sort order is now preserved when moving files from "All Media" view

= 1.0.2 =
* Fixed: Updated all "Media Manager" references in source comments to "Virtual Media Folders"
* Fixed: Updated console.error message in media-library.js

= 1.0.1 =
* Fixed: Updated REST API paths from mediamanager/v1 to vmf/v1
* Fixed: Updated custom event names from mediamanager: to vmf: prefix
* Fixed: Updated WordPress filter name from mediamanager/folder-filter to vmf/folder-filter
* Fixed: Updated all text domains in Settings.php commented code
* Fixed: Renamed MediaManagerDndProvider to VmfDndProvider
* Fixed: Updated test namespaces from MediaManagerTests to VirtualMediaFolders\Tests
* Fixed: Regenerated translation files with correct references
* Fixed: Regenerated composer autoload files

= 1.0.0 =
* **Major Release**: Complete plugin rename from "Media Manager" to "Virtual Media Folders"
* Changed: New plugin slug "virtual-media-folders"
* Changed: Updated PHP namespace from MediaManager to VirtualMediaFolders
* Changed: Updated constants from MEDIAMANAGER_* to VMF_*
* Changed: Updated REST API namespace from mediamanager/v1 to vmf/v1
* Changed: Updated CSS class prefixes from mm- to vmf-
* Changed: Updated JavaScript globals from mediaManagerData to vmfData
* Changed: Updated text domain from mediamanager to virtual-media-folders
* Changed: Renamed translation files to use new text domain
* Note: Breaking change - customizations using old namespace/classes need updating

= 0.1.17 =
* Fixed: Plugin Check compliance - added phpcs:ignore comments for false positives
* Fixed: Prefixed global variables in uninstall.php
* Fixed: Removed error_log debug function from GitHubPluginUpdater

= 0.1.16 =
* Added: uninstall.php for clean plugin removal (deletes folders, settings, transients, user meta)
* Changed: Updated folder structure in README.md to reflect PSR-4 changes

= 0.1.15 =
* Added: Collapsing a parent folder now moves selection to the parent when a child folder is selected
* Added: ArrowLeft keyboard navigation moves to parent folder when subfolder is collapsed or has no children

= 0.1.14 =
* Added: Edit Folder modal now includes Parent Folder selector to move folders within hierarchy
* Changed: "Rename Folder" modal renamed to "Edit Folder" for name and location changes

= 0.1.13 =
* Added: New "Show All Media" setting to show/hide the All Media option in sidebar
* Changed: Removed "Enable Drag & Drop" setting - always enabled (use bulk move as alternative)
* Changed: All settings now functional - Default Folder auto-assigns uploads, Show Uncategorized controls folder visibility, Sidebar Default Visible controls initial state
* Fixed: Sidebar position resets properly when uploader visibility changes

= 0.1.12 =
* Changed: "Jump to Folder After Move" setting now defaults to unchecked (disabled)

= 0.1.11 =
* Fixed: When "Jump to Folder After Move" is disabled, moved files are now removed from the source folder view

= 0.1.10 =
* Fixed: Sort order is now preserved after moving files between folders

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
* Changed: VMF_VERSION now uses actual version number in production (WP_DEBUG=false)
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
* Gutenberg integration with folder sidebar
* Settings page
* Norwegian Bokmål translation

== Upgrade Notice ==

= 1.0.1 =
Bugfix release: Fixed remaining mediamanager references in REST API paths, events, and filters.

= 1.0.0 =
Major release: Plugin renamed from "Media Manager" to "Virtual Media Folders". Breaking change for customizations.

= 0.1.17 =
Plugin Check compliance fixes.

= 0.1.16 =
Added uninstall.php for clean plugin removal.

= 0.1.15 =
Improved keyboard navigation: ArrowLeft moves to parent folder, collapsing parent selects it.

= 0.1.14 =
Edit Folder modal now allows moving folders to different parents.

= 0.1.13 =
New Show All Media setting. All settings now functional.

= 0.1.12 =
Jump to Folder After Move now defaults to disabled.

= 0.1.11 =
Fix: Moved files properly removed from source folder view.

= 0.1.10 =
Fix: Sort order is now preserved after moving files.

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
Initial release of Virtual Media Folders.

== Privacy Policy ==

Virtual Media Folders does not:

* Track users
* Send data to external servers
* Use cookies
* Collect any personal information

All data is stored locally in your WordPress database.
