# Media Manager Design

This document tracks the evolving design of the Media Manager plugin.

## Completed

- **Foundation**: Git repo, plugin bootstrap (`mediamanager.php`), Composer + PHPUnit + Brain\Monkey, npm + Vitest setup.
- **Taxonomy**: `media_folder` hierarchical taxonomy on attachments, with tests in `TaxonomyTest.php`.
- **Smart Suggestions**:
  - Backend: `MediaManager\Suggestions` stores `_mm_folder_suggestions` based on MIME type, EXIF created timestamp, and IPTC keywords on upload (`wp_generate_attachment_metadata` with `context === 'create'`).
  - UI: `SuggestionNotice` React component shows inline notice with suggested folders and **Apply** / **Dismiss** actions.
- **Tree View UI**:
  - `src/admin/media-library.js`: Hooks into `wp.media.view.AttachmentsBrowser` to inject React folder tree sidebar.
  - `src/admin/components/FolderTree.jsx`: Renders hierarchical folder list with "All Media" and virtual "Uncategorized" filters.
  - `includes/class-admin.php`: Enqueues admin JS/CSS on Media Library pages (`upload.php`, `media-new.php`).
  - URL state management via `?mm_folder=<id>` query param.
  - Vitest tests in `tests/js/FolderTree.test.jsx` with `@vitejs/plugin-react` for JSX transformation.
  - PHPUnit tests in `tests/php/AdminTest.php`.
- **Drag-and-Drop Organization**:
  - `DndContext.jsx`: Wraps Media Library with `@dnd-kit/core` context, handles drag start/end events.
  - `DraggableMedia.jsx`: Makes media grid items draggable with visual feedback.
  - `DroppableFolder.jsx`: Makes folder tree items valid drop targets.
  - `MoveToFolderMenu.jsx`: Keyboard-accessible dropdown menu alternative to drag-and-drop.
  - `drag-drop.css`: Styles for drag overlay, drop indicators, reduced motion support.
  - Tests in `DragDrop.test.jsx` and `MoveToFolderMenu.test.jsx`.

- **Gutenberg Integration**:
  - `src/editor/components/FolderFilter.jsx`: Dropdown component for filtering media by folder in block editor.
  - `src/editor/components/MediaUploadFilter.jsx`: Enhanced `MediaUpload` wrapper using `addFilter` on `editor.MediaUpload`.
  - `src/editor/index.js`: Entry point that registers filters and extends `wp.media.view.MediaFrame`.
  - `src/editor/styles/editor.css`: Editor-specific styles for folder filter UI.
  - `includes/class-editor.php`: Enqueues editor scripts on `enqueue_block_editor_assets`, filters `ajax_query_attachments_args` for folder/uncategorized filtering.
  - Tests in `tests/js/editor/FolderFilter.test.jsx` and `tests/js/editor/MediaUploadFilter.test.jsx`.
  - PHP tests in `tests/php/EditorTest.php`.

- **REST API**:
  - `includes/class-rest-api.php`: Custom REST API endpoints under `mediamanager/v1` namespace.
  - Folder endpoints: `GET/POST /folders`, `GET/PUT/DELETE /folders/{id}`, `POST/DELETE /folders/{id}/media`.
  - Suggestion endpoints: `GET /suggestions/{media_id}`, `POST /suggestions/{media_id}/apply`, `POST /suggestions/{media_id}/dismiss`.
  - Permission checks for `upload_files` and `manage_categories` capabilities.
  - Tests in `tests/php/RestApiTest.php`.

- **CI Workflow**:
  - `.github/workflows/ci.yml`: GitHub Actions workflow.
  - PHP tests on PHP 8.3 and 8.4 with Composer caching.
  - JavaScript tests on Node.js 20 and 22 with npm caching.
  - Build job that produces artifacts after tests pass.

- **Bulk Folder Assignment**:
  - `src/admin/components/BulkFolderAction.jsx`: Dropdown to assign multiple selected media to a folder.
  - Integrated into FolderTree sidebar, shows when media items are selected.
  - Supports moving to any folder or removing from all folders (Uncategorized).

- **Folder Management UI**:
  - `src/admin/components/FolderManager.jsx`: Create, rename, delete folder buttons.
  - Uses WordPress Modal component for confirmation dialogs.
  - Integrated into FolderTree sidebar header.
  - Uses REST API endpoints for CRUD operations.

- **Settings Page**:
  - `includes/class-settings.php`: Plugin settings page under Media menu.
  - Smart Suggestions options: enable/disable, MIME type matching, EXIF date, IPTC keywords.
  - Default behavior: default folder assignment, show/hide Uncategorized.
  - UI preferences: enable/disable drag-drop, sidebar default visibility.

- **Internationalization**:
  - `languages/mediamanager.pot`: Generated POT file for translations.
  - All user-facing strings use `__()` or `sprintf()` with translator comments.
  - npm scripts: `i18n:make-pot` and `i18n:make-json` for translation workflow.

## In Progress

- None.

## Next

- User documentation / README.
- Plugin release workflow (GitHub releases, version bumping).
- Integration with third-party DAM (Digital Asset Management) systems.
