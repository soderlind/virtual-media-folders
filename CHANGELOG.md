# Changelog

All notable changes to Virtual Media Folders will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-01-16

### Added
- **Add-on Tab System**: Settings page now supports tabs for add-on plugins
  - Add-ons can register their settings as tabs within "Folder Settings"
  - New `vmfo_settings_tabs` filter for add-on registration
  - New `vmfo_settings_enqueue_scripts` action for conditional script loading
  - `SUPPORTS_ADDON_TABS` constant for add-on compatibility detection
- Added `docs/addon-integration.md` with comprehensive add-on development guide

### Changed
- Settings page refactored to use tab-based navigation
- `PAGE_SLUG` constant is now public for add-on access

## [1.5.2] - 2026-01-16

### Changed
- Default Folder setting now links to Rules Engine settings when VMFA Rules Engine add-on is active

## [1.5.1] - 2026-01-15

### Fixed
- Folder sidebar now repositions immediately when WordPress Help panel is opened, closed, or tabs are switched
- Added debouncing to prevent redundant sidebar position recalculations
- Fixed memory leak from event listeners not being cleaned up on sidebar removal

## [1.5.0] - 2026-01-05

### Added
- Folder search/filter functionality in sidebar header for both Media Library and Gutenberg modal
- Search icon appears when there are more than 10 top-level folders
- Search automatically expands parent folders to show matching subfolders
- Folders collapse back when search is cleared
- Norwegian translations for search UI strings

### Changed
- Gutenberg modal sidebar header now has contrasting background for better visual separation

## [1.4.2] - 2026-01-05

### Fixed
- Removed unintended folder name padding in Gutenberg media modal for folders without children

## [1.4.1] - 2026-01-04

### Fixed
- Folder names for folders without children now align vertically with folder names of folders that have children in the sidebar

## [1.4.0] - 2026-01-03

### Added
- Sticky sidebar header: folder management buttons (add, edit, delete) now stay visible when scrolling the folder list

## [1.3.9] - 2025-12-31

### Fixed
- Grid/List view icons now correctly show all media instead of forcing folder mode
- Folder icon now respects "Show All Media" setting (navigates to uncategorized when disabled)
- Fixed URL encoding issue causing duplicate `vmfo_folder` parameter
- Added proper cleanup of event listeners when hiding folder view to prevent memory leaks
- Fixed race condition where JavaScript created duplicate folder button before PHP script

## [1.3.8] - 2025-12-31

### Changed
- Hide (0) count on folders with subfolders to avoid confusion about empty folder branches

## [1.3.7] - 2025-12-31

### Changed
- Sidebar top now aligns horizontally with attachments-wrapper instead of first thumbnail

## [1.3.6] - 2025-12-31

### Fixed
- Folder sidebar now properly extends to viewport bottom and scrolls when content exceeds screen height
- Sidebar uses fixed positioning to avoid clipping by parent containers
- Improved sidebar top alignment with first image thumbnail

## [1.3.5] - 2025-12-21

### Fixed
- React hook order error (#310) when entering bulk select mode
- Race condition in folder refresh when moving media to folders
- Bulk move folder dropdown now ordered like folder tree with hierarchy

## [1.3.4] - 2025-12-21

### Added
- Direct URL support for folder view via `upload.php?mode=folder`

### Fixed
- Clicking folder icon from list view now correctly opens folder view
- URL mode parameter stays in sync when toggling folder view

## [1.3.3] - 2025-12-17

### Changed
- Admin taxonomy screen for `vmfo_folder` now follows the same ordering as the sidebar
- Removed sortable column UI from the Media Folders taxonomy list table
- Media Folders taxonomy UI is only shown when `WP_DEBUG` is true

## [1.3.2] - 2025-12-15

### Changed
- Folder counts endpoint now avoids per-folder queries for better performance

### Fixed
- Suggestions REST response now matches stored suggestion labels (string-based suggestions)
- Admin UI: hardened notice rendering to avoid HTML injection
- Admin UI: reduced risk of duplicate event handlers/observers when scripts re-run

## [1.3.1] - 2025-12-14

### Fixed
- Settings page default folder dropdown now uses correct taxonomy (`vmfo_folder`)
- Block editor folder filter now uses correct REST API endpoint (`/wp/v2/vmfo_folder`)
- REST API schema title updated to `vmfo-folder` for consistency
- Folder drag-drop reorder now persists correctly after page refresh

## [1.3.0] - 2025-12-13

### Added
- Automatic migration for existing folder assignments from old taxonomy (media_folder → vmfo_folder)
- .distignore file for proper distribution builds

### Changed
- Renamed all constants from VMF_ to VMFO_ for WordPress.org compliance (4+ character prefix required)
- Renamed taxonomy from `media_folder` to `vmfo_folder` for uniqueness
- Renamed all AJAX actions from `vmf_` to `vmfo_` prefix
- Renamed all option names from `vmf_` to `vmfo_` prefix
- Renamed all filter and action hooks from `vmf_` to `vmfo_` prefix
- Inline CSS now uses `wp_add_inline_style()` instead of embedded style tag

### Removed
- GitHub update checker library (WordPress.org handles updates)
- `load_plugin_textdomain` call (WordPress.org handles translations)

## [1.2.3] - 2025-12-13

### Changed
- "All Media" folder now disabled by default in settings

## [1.2.2] - 2025-12-12

### Fixed
- REST API now returns all folders (removed meta_key ordering that excluded folders without vmf_order)

## [1.2.1] - 2025-12-11

### Changed
- Updated i18n-map.json with new accessibility component mappings
- Updated Norwegian (nb_NO) translations for all new accessibility strings

## [1.2.0] - 2025-12-11

### Added
- Keyboard-accessible move mode: Press M on a focused media item to pick it up for moving
- Navigate to target folder with arrow keys and press Enter to drop
- Screen reader announcements for pick up, drop, and cancel actions
- MoveModeBanner component shows visual feedback during move mode
- LiveRegion component for ARIA live announcements
- useAnnounce hook for centralized screen reader announcements
- useMoveMode hook for keyboard move mode state management
- Visual drop target highlighting on folders during move mode
- Comprehensive test suite for all accessibility features (82 tests)

### Changed
- BaseFolderItem now supports isMoveModeActive prop to coordinate keyboard handling
- DroppableFolder handles both mouse drag-drop and keyboard move mode
- Mouse drag automatically cancels keyboard move mode to prevent conflicts

### Fixed
- Screen reader instructions now properly hidden with vmf-sr-only class
- Enter key during move mode drops to folder without navigating to it
- "Jump to Folder After Move" setting now respected for keyboard moves
- Event handler conflicts between mouse and keyboard interactions resolved

## [1.1.7] - 2025-12-09

### Added
- Auto-jump to target folder when moving the last file(s) from a folder (single or bulk move)

## [1.1.6] - 2025-12-09

### Added
- New `vmf_bulk_move_to_folder` AJAX endpoint for efficient bulk operations

### Changed
- Bulk move now uses single AJAX request instead of one per file (major performance improvement)

### Fixed
- Missing `sprintf` import in BulkFolderAction causing error when selecting files in bulk mode
- Sidebar visibility preserved when browser re-renders during bulk select mode

## [1.1.5] - 2025-12-09

### Added
- Optimistic folder loading with localStorage caching for instant sidebar display
- Critical inline CSS to prevent layout shift during sidebar positioning
- REST API now returns `vmf_order` field for proper client-side sorting

### Changed
- Secondary components (MoveToFolderMenu, BulkFolderAction) now read from cache instead of making API calls
- Event-driven architecture with single `vmf:folders-updated` event for cross-component sync
- Async refresh handler ensures cache is updated before notifying other components

### Fixed
- Layout shift eliminated - sidebar now hidden until positioned, then revealed
- Folder order persists correctly when dropping files on folders
- Drag-and-drop reorder updates cache with correct vmf_order values


## [1.1.4] - 2025-12-09

### Changed
- Refactored PHP REST API with shared helpers for capability checks, folder/attachment lookups, and media assignment
- Refactored Settings class with centralized `get_options()` and `normalize_visibility()` helpers
- Admin class now uses `Taxonomy::TAXONOMY` constant instead of hardcoded `'media_folder'` strings
- JavaScript folder API calls consolidated into `src/shared/utils/folderApi.js`

### Fixed
- Test mock for `useFolderData` to properly handle `parse: false` API responses

### Removed
- Unused `SortableFolderList.jsx` component

## [1.1.3] - 2025-12-07

### Fixed
- Block editor media modal now respects "Show All Media" and "Show Uncategorized" settings
- Folder sidebar in Gutenberg modal matches Media Library settings visibility

### Changed
- Replaced `wp_localize_script` with `wp_add_inline_script` for proper boolean handling in JS config

## [1.1.2] - 2025-12-06

### Fixed
- Fixed default folder filter not applying on initial page load when "Show All Media" is disabled
- Media Library now correctly shows only uncategorized files on load when Uncategorized is the default folder

## [1.1.1] - 2025-12-06

### Fixed
- Fixed 500 error on plugin information page when GitHub API returns null
- Added defensive handling for null plugin info in GitHubPluginUpdater

## [1.1.0] - 2025-12-06

### Added
- Drag-and-drop folder reordering with visible grip handle (⋮⋮)
- Custom folder order persists via `vmf_order` term meta
- Optimistic UI updates for instant visual feedback during reorder

### Changed
- Consolidated drag-drop implementation: native HTML5 for media-to-folder, @dnd-kit/sortable for folder reordering
- Removed unused `DndContext.jsx` and `DraggableMedia.jsx` components (reduces bundle size)
- Updated documentation to reflect actual drag-drop architecture

### Fixed
- Folder reorder now updates instantly without waiting for server response

## [1.0.7] - 2025-12-04

### Added
- Contextual help tab "Virtual Folders" on Media Library page with usage instructions
- GitHub repository link in the contextual help sidebar under "For more information"

## [1.0.6] - 2025-12-04

### Added
- Filter hooks for settings: `vmf_default_settings`, `vmf_settings`, and `vmf_setting_{$key}`
- When "Show All Media" is disabled, "Uncategorized" becomes the default selected folder
- Settings interdependency enforcement via hooks (at least one must be true)

### Changed
- Removed "Sidebar Default Visible" setting (sidebar visibility now remembered via localStorage)
- Moved "Jump to Folder After Move" from UI section to Default Behavior section
- Removed "User Interface" settings section (consolidated into Default Behavior)
- Moved settings page JavaScript to external file (`src/admin/settings.js`)

### Fixed
- Settings checkbox interdependency now correctly saves when one option is disabled
- Hidden field ensures disabled checkbox value is submitted with form

## [1.0.5] - 2025-12-04

### Changed
- Housekeeping

## [1.0.4] - 2025-12-03

### Fixed
- Removed duplicate item removal logic in `DroppableFolder.jsx` to prevent event conflicts
- Single file drag-drop now correctly delegates view refresh to `refreshMediaLibrary()` instead of handling removal separately
- Cleaner separation of concerns: `vmfMoveToFolder` handles AJAX + refresh, `DroppableFolder` only handles jump-to-folder option

## [1.0.3] - 2025-12-03

### Fixed
- Moving files from "All Media" view no longer removes them from view (both bulk and single file drag-drop moves)
- Sort order is now preserved when moving files from "All Media" view (grid no longer refreshes unnecessarily)

## [1.0.2] - 2025-12-03

### Fixed
- Updated all "Media Manager" references in source file comments to "Virtual Media Folders"
- Updated console.error message in `media-library.js` to use correct plugin name
- Files updated: `Admin.php`, `editor/index.js`, `admin/index.js`, `shared/index.js`, `editor/styles/editor.css`, `admin/styles/drag-drop.css`, `admin/media-library.js`

## [1.0.1] - 2025-12-03

### Fixed
- Updated REST API paths from `mediamanager/v1` to `vmf/v1` in JavaScript source files
- Updated custom event names from `mediamanager:folders-updated` to `vmf:folders-updated`
- Updated WordPress filter name from `mediamanager/folder-filter` to `vmf/folder-filter`
- Updated all text domains in Settings.php commented code from `mediamanager` to `virtual-media-folders`
- Renamed `MediaManagerDndProvider` component to `VmfDndProvider`
- Updated test namespaces from `MediaManagerTests` to `VirtualMediaFolders\Tests`
- Updated test file paths from `mediamanager-test` to `vmf-test`
- Regenerated translation files with correct references
- Regenerated `package-lock.json` with correct package name
- Regenerated `composer.lock` and vendor autoload files

## [1.0.0] - 2025-12-03

### Changed
- **Major Release**: Complete plugin rename from "Media Manager" to "Virtual Media Folders"
- New plugin slug: `virtual-media-folders`
- Updated PHP namespace from `MediaManager` to `VirtualMediaFolders`
- Updated constants from `MEDIAMANAGER_*` to `VMF_*`
- Updated REST API namespace from `mediamanager/v1` to `vmf/v1`
- Updated CSS class prefixes from `mm-` to `vmf-`
- Updated JavaScript globals from `mediaManagerData` to `vmfData`
- Updated text domain from `mediamanager` to `virtual-media-folders`
- Renamed all translation files to use new text domain
- Updated GitHub repository URL to `soderlind/virtual-media-folders`

### Note
- This is a breaking change. If you have customizations referencing the old namespace, constants, or CSS classes, you will need to update them.

## [0.1.17] - 2025-12-03

### Fixed
- Plugin Check compliance: Added phpcs:ignore comments for false positives
- Prefixed global variables in `uninstall.php` with `vmf_` prefix
- Removed `error_log` debug function from `GitHubPluginUpdater.php`

## [0.1.16] - 2025-12-02

### Added
- `uninstall.php` for clean plugin removal - deletes all folders, settings, transients, and user meta when plugin is deleted

### Changed
- Updated folder structure in README.md to reflect PSR-4 changes from 0.1.4

## [0.1.15] - 2025-12-02

### Added
- Collapsing a parent folder now automatically moves selection to the parent when a child folder was selected
- ArrowLeft keyboard navigation moves to parent folder when current folder is collapsed or has no children

## [0.1.14] - 2025-12-02

### Added
- Edit Folder modal now includes a Parent Folder selector to move folders within the hierarchy
- Folder's current parent is pre-selected when opening the Edit Folder modal

### Changed
- "Rename Folder" modal renamed to "Edit Folder" since it now handles both name and location

## [0.1.13] - 2025-12-02

### Added
- New "Show All Media" setting to show/hide the All Media option in the folder sidebar (default: enabled)

### Changed
- Removed "Enable Drag & Drop" setting - drag & drop is now always enabled (bulk move provides an alternative)
- Implemented all settings that were previously shown in UI but not functional:
  - "Default Folder" now auto-assigns new uploads to the selected folder
  - "Show Uncategorized" now controls visibility of the Uncategorized folder
  - "Sidebar Default Visible" now controls initial sidebar state on first visit

### Fixed
- Sidebar position now properly resets when uploader visibility changes (e.g., clicking a folder after Add Media File)
- Sidebar recalculation only triggers when uploader visibility actually changes, avoiding double resets

## [0.1.12] - 2025-12-01

### Changed
- "Jump to Folder After Move" setting now defaults to unchecked (disabled)

## [0.1.11] - 2025-12-01

### Fixed
- When "Jump to Folder After Move" is disabled, moved files are now removed from the source folder view

## [0.1.10] - 2025-12-01

### Fixed
- Sort order is now preserved after moving files between folders

## [0.1.9] - 2025-12-01

### Added
- New "Jump to Folder After Move" setting in Settings → Folder Settings (enabled by default)
- URL now uses `mode=folder` parameter when folder view is active, similar to `mode=grid` and `mode=list`

### Changed
- Bulk select mode is automatically disabled after bulk moving files
- Smart Suggestions settings section hidden until feature is fully implemented

## [0.1.8] - 2025-11-30

### Added
- Folder item counts now reflect the selected media type filter (Images, Videos, Audio, Documents)
- New REST API endpoint `/mediamanager/v1/folders/counts` for retrieving folder counts filtered by media type
- `FolderTree` component now observes the WordPress media type filter dropdown
- `useFolderData` hook accepts `mediaType` parameter to fetch filtered counts

## [0.1.7] - 2025-11-30

### Added
- After bulk moving files, focus automatically switches to the target folder to show moved items

## [0.1.6] - 2025-11-30

### Fixed
- Folder dropdowns (bulk move, move-to-folder menu) now dynamically update when folders are added, renamed, or deleted

### Changed
- `BulkFolderAction` and `MoveToFolderMenu` components now listen for `mediamanager:folders-updated` custom event
- `FolderTree` dispatches custom event when folders are refreshed

## [0.1.5] - 2025-11-30

### Changed
- `VMF_VERSION` now uses actual version number in production (when `WP_DEBUG` is false)
- Version constant uses `time()` for cache busting only during development

### Removed
- Debug `console.log` statements from JavaScript files

## [0.1.4] - 2025-11-30

### Changed
- Refactored PHP classes to PSR-4 autoloading structure
- Moved class files from `includes/` to `src/` directory
- Renamed classes to follow PSR-4 naming conventions:
  - `REST_API` → `RestApi`
  - `GitHub_Plugin_Updater` → `GitHubPluginUpdater`
- Updated Composer autoload configuration from classmap to PSR-4

## [0.1.3] - 2025-11-30

### Housekeeping
- Code cleanup and maintenance

## [0.1.2] - 2025-11-30

### Changed
- Refactored folder sidebar components to share code between Media Library and Gutenberg modal
- Created shared `useFolderData` hook and `BaseFolderTree`/`BaseFolderItem` components
- Reduced code duplication by ~60% in folder tree implementation

### Added
- After deleting a folder, focus moves to Uncategorized (if it has items) or All Media
- Comprehensive JSDoc and PHPDoc comments throughout codebase

## [0.1.1] - 2025-11-30

### Fixed
- Sticky sidebar now works correctly in Gutenberg media modal
- Improved scroll detection using `scrollTop` on attachments wrapper element

## [0.1.0] - 2025-11-29

### Added

#### Core Features
- Virtual folder organization for WordPress Media Library using `media_folder` taxonomy
- Smart folder suggestions based on MIME type, file metadata, and upload patterns
- Hierarchical folder structure with unlimited nesting depth
- Drag-and-drop media organization between folders
- Bulk folder assignment for multiple media items

#### Media Library Integration
- Folder tree sidebar in Media Library grid view
- Toggle between grid view and folder view
- Folder filtering in Media Library list view
- Sticky sidebar with fixed positioning when scrolled past admin bar
- Dynamic sidebar alignment with attachments grid (calculated positioning)
- "Load more" button support with dynamic height adjustment
- Smooth scroll-to-top when switching folders
- "Add Media File" button switches to All Media when folder is selected
- Bulk move action with compact check icon and yellow highlight indicator

#### Gutenberg Block Editor Integration
- Folder sidebar in block editor media selection
- Folder filter dropdown for quick navigation
- Seamless integration with core media blocks (Image, Gallery, Cover, etc.)
- SVG chevron icons for expand/collapse (consistent with Media Library)
- Wider sidebar with proper folder count alignment

#### Folder Management UI
- Create, rename, and delete folders
- Drag-and-drop folder reordering
- Expand/collapse folder tree nodes with SVG chevron icons
- Visual feedback during drag operations
- Folder item counts
- Hierarchical parent folder dropdown with visual indentation
- Pre-select current folder as parent when creating subfolders

#### REST API
- Full CRUD operations for folders
- Batch operations for bulk assignments
- Smart suggestion endpoints
- Secure permission handling

#### Internationalization
- Full i18n support for PHP and JavaScript
- Norwegian Bokmål (nb_NO) translation included
- Automated translation workflow with npm scripts

#### Developer Experience
- Comprehensive test suite with Vitest (29 tests)
- Modern build system with wp-scripts and webpack
- React components with @dnd-kit for drag-and-drop
- WordPress coding standards compliance

### Documentation
- README.md with installation, features, and developer guide
- readme.txt for WordPress.org plugin directory
- Translation workflow documentation

### Technical Details
- Requires WordPress 6.0+
- Requires PHP 7.4+
- Uses React 18 for UI components
- Leverages WordPress REST API for all operations

[1.5.2]: https://github.com/soderlind/virtual-media-folders/compare/1.5.1...1.5.2
[1.5.1]: https://github.com/soderlind/virtual-media-folders/compare/1.5.0...1.5.1
[1.5.0]: https://github.com/soderlind/virtual-media-folders/compare/1.4.2...1.5.0
[1.2.1]: https://github.com/soderlind/virtual-media-folders/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/soderlind/virtual-media-folders/compare/1.1.7...1.2.0
[1.1.7]: https://github.com/soderlind/virtual-media-folders/compare/1.1.6...1.1.7
[1.1.6]: https://github.com/soderlind/virtual-media-folders/compare/1.1.5...1.1.6
[1.1.5]: https://github.com/soderlind/virtual-media-folders/compare/1.1.4...1.1.5
[1.1.4]: https://github.com/soderlind/virtual-media-folders/compare/1.1.3...1.1.4
[1.1.3]: https://github.com/soderlind/virtual-media-folders/compare/1.1.2...1.1.3
[1.1.2]: https://github.com/soderlind/virtual-media-folders/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/soderlind/virtual-media-folders/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/soderlind/virtual-media-folders/compare/1.0.7...1.1.0
[1.0.7]: https://github.com/soderlind/virtual-media-folders/compare/1.0.6...1.0.7
[1.0.6]: https://github.com/soderlind/virtual-media-folders/compare/1.0.5...1.0.6
[1.0.5]: https://github.com/soderlind/virtual-media-folders/compare/1.0.4...1.0.5
[1.0.4]: https://github.com/soderlind/virtual-media-folders/compare/1.0.3...1.0.4
[1.0.3]: https://github.com/soderlind/virtual-media-folders/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/soderlind/virtual-media-folders/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/soderlind/virtual-media-folders/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/soderlind/virtual-media-folders/compare/0.1.17...1.0.0
[0.1.17]: https://github.com/soderlind/virtual-media-folders/compare/0.1.16...0.1.17
[0.1.16]: https://github.com/soderlind/virtual-media-folders/compare/0.1.15...0.1.16
[0.1.15]: https://github.com/soderlind/virtual-media-folders/compare/0.1.14...0.1.15
[0.1.14]: https://github.com/soderlind/virtual-media-folders/compare/0.1.13...0.1.14
[0.1.13]: https://github.com/soderlind/virtual-media-folders/compare/0.1.12...0.1.13
[0.1.12]: https://github.com/soderlind/virtual-media-folders/compare/0.1.11...0.1.12
[0.1.11]: https://github.com/soderlind/virtual-media-folders/compare/0.1.10...0.1.11
[0.1.10]: https://github.com/soderlind/virtual-media-folders/compare/0.1.9...0.1.10
[0.1.9]: https://github.com/soderlind/virtual-media-folders/compare/0.1.8...0.1.9
[0.1.8]: https://github.com/soderlind/virtual-media-folders/compare/0.1.7...0.1.8
[0.1.7]: https://github.com/soderlind/virtual-media-folders/compare/0.1.6...0.1.7
[0.1.6]: https://github.com/soderlind/virtual-media-folders/compare/0.1.5...0.1.6
[0.1.5]: https://github.com/soderlind/virtual-media-folders/compare/0.1.4...0.1.5
[0.1.4]: https://github.com/soderlind/virtual-media-folders/compare/0.1.3...0.1.4
[0.1.3]: https://github.com/soderlind/virtual-media-folders/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/soderlind/virtual-media-folders/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/soderlind/virtual-media-folders/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/soderlind/virtual-media-folders/releases/tag/0.1.0
