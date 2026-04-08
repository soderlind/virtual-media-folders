# Hooks Reference

All actions and filters provided by Virtual Media Folders and its add-ons.

## Table of Contents

- [Virtual Media Folders (Core)](#virtual-media-folders-core)
  - [Filters](#core-filters)
  - [Actions](#core-actions)
- [Rules Engine](#rules-engine)
  - [Filters](#rules-engine-filters)
  - [Actions](#rules-engine-actions)
- [AI Organizer](#ai-organizer)
  - [Actions](#ai-organizer-actions)
- [Editorial Workflow](#editorial-workflow)
  - [Actions](#editorial-workflow-actions)
- [Media Cleanup](#media-cleanup)
  - [Filters](#media-cleanup-filters)
  - [Actions](#media-cleanup-actions)
- [Folder Exporter](#folder-exporter)
  - [Filters](#folder-exporter-filters)
- [Migrate](#migrate)
  - [Filters](#migrate-filters)
  - [Actions](#migrate-actions)

---

## Virtual Media Folders (Core)

### Core Filters

#### `vmfo_upload_folder`

Filter the folder to assign when a new attachment is uploaded.

| Property | Value |
|----------|-------|
| **Since** | 1.8.1 |
| **File** | `src/Admin.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$folder_id` | `int` | Default folder term ID (from settings, or 0). |
| `$attachment_id` | `int` | The attachment post ID. |
| `$metadata` | `array` | Attachment metadata (dimensions, EXIF, etc.). |

**Return:** `int` — Folder term ID. Return `0` to skip assignment.

**Example — always assign to a specific folder:**

```php
add_filter( 'vmfo_upload_folder', function ( int $folder_id, int $attachment_id, array $metadata ): int {
    return 42; // Always assign to folder term ID 42.
}, 10, 3 );
```

**Example — route PDFs to a "Documents" folder:**

```php
add_filter( 'vmfo_upload_folder', function ( int $folder_id, int $attachment_id, array $metadata ): int {
    $mime = get_post_mime_type( $attachment_id );
    if ( $mime === 'application/pdf' ) {
        $term = get_term_by( 'name', 'Documents', 'vmfo_folder' );
        return $term ? $term->term_id : $folder_id;
    }
    return $folder_id;
}, 10, 3 );
```

**Example — route images by EXIF date:**

```php
add_filter( 'vmfo_upload_folder', function ( int $folder_id, int $attachment_id, array $metadata ): int {
    if ( ! empty( $metadata['image_meta']['created_timestamp'] ) ) {
        $year = date( 'Y', $metadata['image_meta']['created_timestamp'] );
        $term = get_term_by( 'name', $year, 'vmfo_folder' );
        if ( $term ) {
            return $term->term_id;
        }
    }
    return $folder_id;
}, 10, 3 );
```

---

#### `vmfo_include_child_folders`

Control whether filtering by a folder also includes child-folder items.

| Property | Value |
|----------|-------|
| **Since** | 1.0.0 |
| **File** | `src/Editor.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$include_children` | `bool` | Default `false`. |
| `$folder_id` | `int` | The folder term ID being filtered. |

**Return:** `bool`

**Example:**

```php
// Always show child-folder media when a parent folder is selected.
add_filter( 'vmfo_include_child_folders', '__return_true' );
```

---

#### `vmfo_default_settings`

Override the default plugin settings before they are stored.

| Property | Value |
|----------|-------|
| **Since** | 1.0.5 |
| **File** | `src/Settings.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$defaults` | `array` | Default settings (`default_folder`, `show_all_media`, `show_uncategorized`, etc.). |

**Return:** `array`

**Example:**

```php
add_filter( 'vmfo_default_settings', function ( array $defaults ): array {
    $defaults['show_uncategorized'] = false; // Hide "Uncategorized" by default.
    return $defaults;
} );
```

---

#### `vmfo_setting_{$key}`

Filter a single setting value at read-time. The dynamic portion is the setting key.

| Property | Value |
|----------|-------|
| **Since** | 1.0.5 |
| **File** | `src/Settings.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$value` | `mixed` | The setting value. |
| `$key` | `string` | The setting key. |
| `$options` | `array` | All settings. |

**Return:** `mixed`

**Example:**

```php
// Force "jump to folder after move" on for editors+.
add_filter( 'vmfo_setting_jump_to_folder_after_move', function ( $value ): bool {
    return current_user_can( 'edit_others_posts' ) ? true : $value;
} );
```

---

#### `vmfo_settings`

Filter all settings at once, after individual `vmfo_setting_{$key}` filters.

| Property | Value |
|----------|-------|
| **Since** | 1.0.5 |
| **File** | `src/Settings.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$options` | `array` | All settings. |

**Return:** `array`

---

#### `vmfo_settings_tabs`

Register add-on tabs on the Settings page. Used by all official add-ons.

| Property | Value |
|----------|-------|
| **Since** | 1.1.0 |
| **File** | `src/Settings.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$tabs` | `array` | `[ 'slug' => [ 'title' => string, 'callback' => callable, 'subtabs' => array ] ]` |

**Return:** `array`

**Example:**

```php
add_filter( 'vmfo_settings_tabs', function ( array $tabs ): array {
    $tabs['my-addon'] = [
        'title'    => __( 'My Add-on', 'my-addon' ),
        'callback' => [ MyAddon\Settings::class, 'render' ],
    ];
    return $tabs;
} );
```

---

#### `vmfo_can_delete_folder`

Prevent a specific folder from being deleted. Return a `WP_Error` to block deletion with a message.

| Property | Value |
|----------|-------|
| **Since** | 1.6.5 |
| **File** | `src/RestApi.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$can_delete` | `bool\|WP_Error` | Default `true`. |
| `$folder_id` | `int` | Folder term ID. |
| `$term` | `object` | Folder term object. |

**Return:** `bool|WP_Error`

**Example:**

```php
add_filter( 'vmfo_can_delete_folder', function ( $can_delete, int $folder_id, $term ) {
    if ( $term->slug === 'important' ) {
        return new WP_Error( 'protected', 'This folder cannot be deleted.' );
    }
    return $can_delete;
}, 10, 3 );
```

---

### Core Actions

#### `vmfo_folder_assigned`

Fires after a media item is moved to a folder via drag-and-drop or AJAX.

| Property | Value |
|----------|-------|
| **Since** | 1.5.0 |
| **File** | `src/Admin.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$media_id` | `int` | Attachment ID. |
| `$folder_id` | `int` | Folder term ID. |
| `$result` | `array` | Result from `wp_set_object_terms()`. |

**Example:**

```php
add_action( 'vmfo_folder_assigned', function ( int $media_id, int $folder_id, array $result ): void {
    error_log( "Attachment {$media_id} assigned to folder {$folder_id}" );
}, 10, 3 );
```

---

#### `vmfo_settings_enqueue_scripts`

Fires when the settings page assets are loaded. Add-ons enqueue their tab scripts here.

| Property | Value |
|----------|-------|
| **Since** | 1.1.0 |
| **File** | `src/Settings.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$active_tab` | `string` | Current tab slug. |
| `$active_subtab` | `string` | Current subtab slug. |

**Example:**

```php
add_action( 'vmfo_settings_enqueue_scripts', function ( string $tab, string $subtab ): void {
    if ( $tab === 'my-addon' ) {
        wp_enqueue_script( 'my-addon-settings', plugins_url( 'build/settings.js', __FILE__ ) );
    }
}, 10, 2 );
```

---

## Rules Engine

*Plugin: vmfa-rules-engine*

### Rules Engine Filters

#### `vmfa_rules_engine_matchers`

Register custom condition matchers for rule evaluation.

| Property | Value |
|----------|-------|
| **Since** | 1.0.0 |
| **File** | `src/php/Services/RuleEvaluator.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$matchers` | `array<string, MatcherInterface>` | Keyed by matcher slug. |

**Return:** `array`

**Example:**

```php
add_filter( 'vmfa_rules_engine_matchers', function ( array $matchers ): array {
    $matchers['custom_field'] = new MyPlugin\CustomFieldMatcher();
    return $matchers;
} );
```

---

#### `vmfa_rules_engine_skip_if_assigned`

Control whether rule evaluation is skipped when the attachment already has a folder.

| Property | Value |
|----------|-------|
| **Since** | 1.3.0 |
| **File** | `src/php/Services/RuleEvaluator.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$skip` | `bool` | Default `true`. |
| `$attachment_id` | `int` | Attachment ID. |
| `$existing_terms` | `array` | Currently assigned folder terms. |

**Return:** `bool`

**Example:**

```php
// Always re-evaluate rules, even for already-assigned media.
add_filter( 'vmfa_rules_engine_skip_if_assigned', '__return_false' );
```

---

### Rules Engine Actions

#### `vmfa_rules_engine_folder_assigned`

Fires after the Rules Engine assigns a folder to an attachment.

| Property | Value |
|----------|-------|
| **Since** | 1.0.0 |
| **File** | `src/php/Services/RuleEvaluator.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |
| `$folder_id` | `int` | Assigned folder term ID. |
| `$rule` | `array` | The matching rule. |

**Example:**

```php
add_action( 'vmfa_rules_engine_folder_assigned', function ( int $attachment_id, int $folder_id, array $rule ): void {
    error_log( sprintf( 'Rule "%s" assigned attachment %d to folder %d', $rule['name'], $attachment_id, $folder_id ) );
}, 10, 3 );
```

---

## AI Organizer

*Plugin: vmfa-ai-organizer*

### AI Organizer Actions

#### `vmfa_cached_results_applied`

Fires when cached AI analysis results are applied to media.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/MediaScannerService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$applied` | `int` | Number of items successfully assigned. |
| `$failed` | `int` | Number of items that failed. |

---

#### `vmfa_scan_completed`

Fires when an AI scan batch completes.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/MediaScannerService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$progress` | `array` | Scan progress data. |

---

#### `vmfo_media_moved`

Fires when AI Organizer assigns media to a folder. Uses the `vmfo_` prefix for compatibility with core VMF folder-assignment hooks.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/AIAnalysisService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |
| `$folder_id` | `int` | Folder term ID. |
| `$result` | `array` | Term IDs returned by `wp_set_object_terms()`. |

**Example:**

```php
add_action( 'vmfo_media_moved', function ( int $attachment_id, int $folder_id, array $result ): void {
    error_log( sprintf( 'AI Organizer moved attachment %d to folder %d', $attachment_id, $folder_id ) );
}, 10, 3 );
```

---

## Editorial Workflow

*Plugin: vmfa-editorial-workflow*

### Editorial Workflow Actions

#### `vmfa_inbox_assigned`

Fires after a new upload is assigned to a user's inbox folder.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/InboxService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |
| `$inbox_folder_id` | `int` | Inbox folder term ID. |
| `$user_id` | `int` | WordPress user ID. |

**Example:**

```php
add_action( 'vmfa_inbox_assigned', function ( int $attachment_id, int $inbox_folder_id, int $user_id ): void {
    // Send notification when new media arrives in a user's inbox.
    $user = get_userdata( $user_id );
    wp_mail( $user->user_email, 'New media in your inbox', 'A new file was uploaded to your inbox folder.' );
}, 10, 3 );
```

---

#### `vmfa_marked_needs_review`

Fires after an attachment is marked for editorial review.

| Property | Value |
|----------|-------|
| **File** | `src/php/WorkflowState.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |
| `$folder_id` | `int` | Review folder term ID. |

---

#### `vmfa_approved`

Fires after an attachment is approved in the editorial workflow.

| Property | Value |
|----------|-------|
| **File** | `src/php/WorkflowState.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |
| `$folder_id` | `int` | Destination folder term ID. |

---

## Media Cleanup

*Plugin: vmfa-media-cleanup*

### Media Cleanup Filters

#### `vmfa_cleanup_is_unused`

Override whether an attachment is considered unused. Useful for excluding media referenced by third-party plugins (WooCommerce galleries, ACF fields, etc.).

| Property | Value |
|----------|-------|
| **File** | `src/php/Detectors/UnusedDetector.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$is_unused` | `bool` | Whether the attachment is unused. |
| `$attachment_id` | `int` | Attachment ID. |

**Return:** `bool`

**Example:**

```php
// Never flag WooCommerce product gallery images as unused.
add_filter( 'vmfa_cleanup_is_unused', function ( bool $is_unused, int $attachment_id ): bool {
    if ( ! $is_unused ) {
        return false;
    }
    global $wpdb;
    $in_gallery = $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_product_image_gallery' AND meta_value LIKE %s",
        '%' . $wpdb->esc_like( (string) $attachment_id ) . '%'
    ) );
    return $in_gallery ? false : $is_unused;
}, 10, 2 );
```

---

#### `vmfa_cleanup_oversized_thresholds`

Customize the dimension thresholds for detecting oversized images.

| Property | Value |
|----------|-------|
| **File** | `src/php/Detectors/OversizedDetector.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$thresholds` | `array<string, int>` | `[ 'width' => int, 'height' => int ]`. |

**Return:** `array`

**Example:**

```php
add_filter( 'vmfa_cleanup_oversized_thresholds', function ( array $thresholds ): array {
    $thresholds['width']  = 3840; // Flag images wider than 4K.
    $thresholds['height'] = 2160;
    return $thresholds;
} );
```

---

#### `vmfa_cleanup_archive_folder_name`

Customize the name of the folder created when archiving media.

| Property | Value |
|----------|-------|
| **File** | `src/php/REST/ActionsController.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$folder_name` | `string` | Default folder name. |

**Return:** `string`

---

#### `vmfa_cleanup_scan_batch_size`

Control how many attachments are processed per scan batch.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/ScanService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$batch_size` | `int` | Batch size. |

**Return:** `int`

---

#### `vmfa_cleanup_reference_meta_keys`

Extend the list of `postmeta` keys scanned for attachment references.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/ReferenceIndex.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$meta_keys` | `string[]` | Meta keys to scan. |

**Return:** `string[]`

**Example:**

```php
add_filter( 'vmfa_cleanup_reference_meta_keys', function ( array $keys ): array {
    $keys[] = '_my_plugin_gallery';  // Also scan this meta key for image IDs.
    return $keys;
} );
```

---

#### `vmfa_cleanup_reference_sources`

Register custom reference-detection callbacks beyond postmeta scanning.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/ReferenceIndex.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$sources` | `array` | `[ [ 'type' => string, 'callback' => callable(int $post_id): int[] ] ]` |

**Return:** `array`

---

#### `vmfa_cleanup_hash_algorithm`

Change the hashing algorithm for duplicate detection.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/HashService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$algorithm` | `string` | Default `sha256`. |

**Return:** `string`

---

### Media Cleanup Actions

#### `vmfa_cleanup_before_bulk_action`

Fires before a bulk cleanup action (archive, trash, delete) is processed.

| Property | Value |
|----------|-------|
| **File** | `src/php/REST/ActionsController.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$action` | `string` | Action name: `archive`, `trash`, or `delete`. |
| `$ids` | `int[]` | Attachment IDs. |

---

#### `vmfa_cleanup_media_archived`

Fires after a media item is archived to a cleanup folder.

| Property | Value |
|----------|-------|
| **File** | `src/php/REST/ActionsController.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |
| `$folder_id` | `int` | Archive folder term ID. |

---

#### `vmfa_cleanup_media_trashed`

Fires after a media item is moved to the trash.

| Property | Value |
|----------|-------|
| **File** | `src/php/REST/ActionsController.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |

---

#### `vmfa_cleanup_media_restored`

Fires after a media item is restored from trash.

| Property | Value |
|----------|-------|
| **File** | `src/php/REST/ActionsController.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |

---

#### `vmfa_cleanup_media_deleted`

Fires after a media item is permanently deleted.

| Property | Value |
|----------|-------|
| **File** | `src/php/REST/ActionsController.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |

---

#### `vmfa_cleanup_media_flagged`

Fires after a media item is flagged for review.

| Property | Value |
|----------|-------|
| **File** | `src/php/REST/ActionsController.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$attachment_id` | `int` | Attachment ID. |

---

#### `vmfa_cleanup_settings_updated`

Fires after cleanup settings are saved.

| Property | Value |
|----------|-------|
| **File** | `src/php/REST/SettingsController.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$updated` | `array` | New settings. |
| `$current` | `array` | Previous settings. |

---

#### `vmfa_cleanup_scan_complete`

Fires when a full cleanup scan finishes.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/ScanService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$results` | `array` | Scan results summary. |

---

## Folder Exporter

*Plugin: vmfa-folder-exporter*

### Folder Exporter Filters

#### `vmfa_export_dir`

Override the directory where export ZIP files are stored.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/ExportService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$export_dir` | `string` | Default export directory path. |

**Return:** `string`

---

#### `vmfa_export_manifest_columns`

Customize the CSV manifest column headers.

| Property | Value |
|----------|-------|
| **File** | `src/php/Services/ManifestService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$columns` | `array` | Column headers. |

**Return:** `array`

**Example:**

```php
add_filter( 'vmfa_export_manifest_columns', function ( array $columns ): array {
    $columns[] = 'alt_text'; // Add alt text column to the CSV export.
    return $columns;
} );
```

---

## Migrate

*Plugin: vmfa-migrate*

### Migrate Filters

#### `vmfa_migrate_drivers`

Filter the list of migration driver classes. Add custom drivers to support additional media folder plugins.

| Property | Value |
|----------|-------|
| **Since** | 0.1.0 |
| **File** | `src/php/Services/DetectorService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$driver_classes` | `array<int, class-string<DriverInterface>>` | List of driver class names. |

**Return:** `array`

**Example — add a custom driver:**

```php
add_filter( 'vmfa_migrate_drivers', function ( array $drivers ): array {
    $drivers[] = MyPlugin\Drivers\CustomFolderDriver::class;
    return $drivers;
} );
```

---

### Migrate Actions

#### `vmfa_migrate_process_batch`

Scheduled via Action Scheduler to process migration assignments in batches. Each invocation processes one batch and re-schedules itself until all assignments are migrated.

| Property | Value |
|----------|-------|
| **Since** | 0.1.0 |
| **File** | `src/php/Services/MigrationService.php` |

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `$job_id` | `string` | Unique migration job identifier. |
| `$offset` | `int` | Current batch offset. |

**Example — log batch progress:**

```php
add_action( 'vmfa_migrate_process_batch', function ( string $job_id, int $offset ): void {
    error_log( sprintf( 'Migration %s processing batch at offset %d', $job_id, $offset ) );
}, 5, 2 );
```

---

## Quick Reference

### All Hooks by Plugin

| Hook | Type | Plugin |
|------|------|--------|
| `vmfo_upload_folder` | filter | Core |
| `vmfo_include_child_folders` | filter | Core |
| `vmfo_default_settings` | filter | Core |
| `vmfo_setting_{$key}` | filter | Core |
| `vmfo_settings` | filter | Core |
| `vmfo_settings_tabs` | filter | Core |
| `vmfo_can_delete_folder` | filter | Core |
| `vmfo_folder_assigned` | action | Core |
| `vmfo_settings_enqueue_scripts` | action | Core |
| `vmfa_rules_engine_matchers` | filter | Rules Engine |
| `vmfa_rules_engine_skip_if_assigned` | filter | Rules Engine |
| `vmfa_rules_engine_folder_assigned` | action | Rules Engine |
| `vmfa_cached_results_applied` | action | AI Organizer |
| `vmfa_scan_completed` | action | AI Organizer |
| `vmfo_media_moved` | action | AI Organizer |
| `vmfa_inbox_assigned` | action | Editorial Workflow |
| `vmfa_marked_needs_review` | action | Editorial Workflow |
| `vmfa_approved` | action | Editorial Workflow |
| `vmfa_cleanup_is_unused` | filter | Media Cleanup |
| `vmfa_cleanup_oversized_thresholds` | filter | Media Cleanup |
| `vmfa_cleanup_archive_folder_name` | filter | Media Cleanup |
| `vmfa_cleanup_scan_batch_size` | filter | Media Cleanup |
| `vmfa_cleanup_reference_meta_keys` | filter | Media Cleanup |
| `vmfa_cleanup_reference_sources` | filter | Media Cleanup |
| `vmfa_cleanup_hash_algorithm` | filter | Media Cleanup |
| `vmfa_cleanup_before_bulk_action` | action | Media Cleanup |
| `vmfa_cleanup_media_archived` | action | Media Cleanup |
| `vmfa_cleanup_media_trashed` | action | Media Cleanup |
| `vmfa_cleanup_media_restored` | action | Media Cleanup |
| `vmfa_cleanup_media_deleted` | action | Media Cleanup |
| `vmfa_cleanup_media_flagged` | action | Media Cleanup |
| `vmfa_cleanup_settings_updated` | action | Media Cleanup |
| `vmfa_cleanup_scan_complete` | action | Media Cleanup |
| `vmfa_export_dir` | filter | Folder Exporter |
| `vmfa_export_manifest_columns` | filter | Folder Exporter |
| `vmfa_migrate_drivers` | filter | Migrate |
| `vmfa_migrate_process_batch` | action | Migrate |
