# Changelog

All notable changes to MediaManager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Sticky sidebar that follows scroll position
- "Load more" button support with dynamic height adjustment
- Smooth scroll-to-top when switching folders

#### Gutenberg Block Editor Integration
- Folder sidebar in block editor media selection
- Folder filter dropdown for quick navigation
- Seamless integration with core media blocks (Image, Gallery, Cover, etc.)

#### Folder Management UI
- Create, rename, and delete folders
- Drag-and-drop folder reordering
- Expand/collapse folder tree nodes with SVG chevron icons
- Visual feedback during drag operations
- Folder item counts

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

[0.1.0]: https://github.com/developer/mediamanager/releases/tag/v0.1.0
