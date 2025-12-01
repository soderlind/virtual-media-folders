# Changelog

All notable changes to MediaManager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- `MEDIAMANAGER_VERSION` now uses actual version number in production (when `WP_DEBUG` is false)
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


[0.1.9]: https://github.com/soderlind/mediamanager/compare/0.1.8...0.1.9
[0.1.8]: https://github.com/soderlind/mediamanager/compare/0.1.7...0.1.8
[0.1.7]: https://github.com/soderlind/mediamanager/compare/0.1.6...0.1.7
[0.1.6]: https://github.com/soderlind/mediamanager/compare/0.1.5...0.1.6
[0.1.5]: https://github.com/soderlind/mediamanager/compare/0.1.4...0.1.5
[0.1.4]: https://github.com/soderlind/mediamanager/compare/0.1.3...0.1.4
[0.1.3]: https://github.com/soderlind/mediamanager/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/soderlind/mediamanager/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/soderlind/mediamanager/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/soderlind/mediamanager/releases/tag/0.1.0
