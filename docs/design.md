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
  - Native HTML5 drag-and-drop in `media-library.js` for dragging media to folders.
  - `DroppableFolder.jsx`: Makes folder tree items valid drop targets.
  - `MoveToFolderMenu.jsx`: Keyboard-accessible dropdown menu alternative to drag-and-drop.
  - `FolderTree.jsx`: Uses `@dnd-kit/sortable` for folder reordering.
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
  - `src/admin/components/FolderManager.jsx`: Create, rename, delete folder buttons with Modal dialogs.
  - Icon-only buttons with screen reader text for accessibility.
  - Uses SlotFillProvider for proper Modal rendering.
  - Delete confirmation with warning when folder contains media.
  - Integrated into FolderTree sidebar header.

- **Gutenberg Media Modal Sidebar**:
  - `src/editor/components/FolderSidebar.jsx`: Folder tree sidebar for Gutenberg media modal.
  - Replaces dropdown filter with full sidebar navigation.
  - Integrated with wp.media.view.MediaFrame for modal context.
  - Consistent UI with Media Library folder tree.

- **UI/UX Improvements**:
  - Folder toggle button: PHP-rendered `<a>` linking to `upload.php?mode=folder`, positioned before view switcher.
  - View switching handled server-side: PHP reads `$_GET['mode']` on `load-upload.php` to toggle sidebar preference in user meta.
  - Sidebar preference stored in `vmfo_sidebar_visible` user meta (replaces localStorage).
  - Activation hook defaults sidebar to visible for the activating user.
  - REST endpoint `POST /vmfo/v1/preferences` for programmatic preference updates.
  - Auto-expand parent folders when child folder is selected.
  - Smooth loading transitions when switching folders (opacity fade).
  - Empty folder handling with min-height to prevent sidebar collapse.
  - Hide uploader overlay when viewing filtered folders.
  - Auto-select folder after drag-drop move operation.

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

- **WordPress 7.0+ UI/UX Compatibility**:
  - WP 7 ships a visual reskin ("coat-of-paint") with the Modern color scheme as default (`#3858e9` theme color), and the WordPress Design System (`--wpds-*`) tokens via the core `wp-theme` style (`wp-includes/css/dist/theme/design-tokens.css`).
  - **Approach (2.2.0)**: Plugin CSS uses `--wpds-*` tokens directly, so a single stylesheet adapts to WP 7 automatically. The separate admin/editor `wp7-compat.css` overrides were removed.
  - **WP < 7 fallback**: `DesignTokens` registers the `vmfo-tokens` handle (`src/css/wpds-tokens-fallback.css`). It defines the used tokens with the classic WP 6.x palette under `:where(:root)` (zero specificity), so core values always win when present. It depends on `wp-theme` when registered.
  - **Theme color**: Accent colors use `var(--wp-admin-theme-color, <hex>)` and related custom properties, so the plugin follows the user's admin color scheme (the `--wpds-*` brand tokens are static).
  - **Lint**: `npm run lint:tokens` runs the `@wordpress/theme` stylelint rules (no unknown tokens, no fallbacks on tokens, no setting `--wpds-*`). It also runs `scripts/check-wpds-tokens.mjs`, which verifies every used token is in the fallback and compares the fallback with core.
  - **Add-ons**: `AbstractSettingsTab::get_style_deps()` includes `vmfo-tokens`. The shared `wp7-compat-base.css` is kept (tokenised) for add-on overrides until add-ons migrate.

## Next

- User documentation / README.
- Plugin release workflow (GitHub releases, version bumping).
- Integration with third-party DAM (Digital Asset Management) systems.
