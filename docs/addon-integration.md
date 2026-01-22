# Add-on Integration Guide

This document describes how to integrate add-on plugins with Virtual Media Folders' settings page tab system.

## Overview

Virtual Media Folders provides a tab-based settings page architecture that allows add-on plugins to register their own settings tabs within the parent plugin's "Folder Settings" page. This provides a unified user experience where all folder-related settings are accessible from a single location.

## Prerequisites

- Virtual Media Folders version 1.6.0 or later
- PHP 8.3 or later
- WordPress 6.8 or later

For comprehensive add-on development guidance, see the [Add-on Development Guide](addon-development.md).

## Detecting Tab Support

Before registering a tab, add-ons should check if the parent plugin supports the tab system:

```php
/**
 * Check if the parent plugin supports add-on tabs.
 *
 * @return bool True if parent supports tabs, false otherwise.
 */
private function supports_parent_tabs(): bool {
    return defined( 'VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS' )
        && \VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS;
}
```

## Registering a Tab

Use the `vmfo_settings_tabs` filter to register your add-on's tab:

```php
add_filter( 'vmfo_settings_tabs', array( $this, 'register_tab' ) );

/**
 * Register add-on tab.
 *
 * @param array $tabs Existing tabs array.
 * @return array Modified tabs array.
 */
public function register_tab( array $tabs ): array {
    $tabs['my-addon'] = array(
        'title'    => __( 'My Add-on', 'my-addon-textdomain' ),
        'callback' => array( $this, 'render_tab_content' ),
    );
    return $tabs;
}
```

### Tab Array Structure

Each tab entry should contain:

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `title` | string | Yes | The tab label displayed in the navigation |
| `callback` | callable | Yes | Function to render the tab content. Receives `$active_tab` and `$active_subtab` as parameters. |

## Rendering Tab Content

The callback function receives two parameters:

```php
/**
 * Render tab content.
 *
 * @param string $active_tab    The currently active tab slug.
 * @param string $active_subtab The currently active subtab slug (if any).
 * @return void
 */
public function render_tab_content( string $active_tab, string $active_subtab ): void {
    // Render your settings UI here
    ?>
    <div id="my-addon-settings">
        <!-- Your settings content -->
    </div>
    <?php
}
```

## Sub-tabs

If your add-on needs multiple sections, you can implement sub-tabs within your tab content:

```php
public function render_tab_content( string $active_tab, string $active_subtab ): void {
    // Default to first subtab.
    if ( empty( $active_subtab ) ) {
        $active_subtab = 'settings';
    }

    $base_url = admin_url( 'upload.php?page=' . \VirtualMediaFolders\Settings::PAGE_SLUG . '&tab=' . $active_tab );
    ?>
    <nav class="nav-tab-wrapper my-addon-subtabs" style="margin-top: 1em;">
        <a href="<?php echo esc_url( $base_url . '&subtab=settings' ); ?>" 
           class="nav-tab <?php echo 'settings' === $active_subtab ? 'nav-tab-active' : ''; ?>">
            <?php esc_html_e( 'Settings', 'my-addon' ); ?>
        </a>
        <a href="<?php echo esc_url( $base_url . '&subtab=advanced' ); ?>" 
           class="nav-tab <?php echo 'advanced' === $active_subtab ? 'nav-tab-active' : ''; ?>">
            <?php esc_html_e( 'Advanced', 'my-addon' ); ?>
        </a>
    </nav>
    
    <div class="my-addon-subtab-content">
        <?php
        if ( 'settings' === $active_subtab ) {
            $this->render_settings_subtab();
        } elseif ( 'advanced' === $active_subtab ) {
            $this->render_advanced_subtab();
        }
        ?>
    </div>
    <?php
}
```

## URL Structure

The settings page uses the following URL pattern:

```
/wp-admin/upload.php?page=vmfo-settings&tab={tab-slug}&subtab={subtab-slug}
```

- `page`: Always `vmfo-settings`
- `tab`: Your add-on's tab slug (e.g., `my-addon`)
- `subtab`: Optional sub-tab within your tab (e.g., `settings`, `advanced`)

## Enqueuing Scripts and Styles

Use the `vmfo_settings_enqueue_scripts` action to conditionally enqueue your assets only when your tab is active:

```php
add_action( 'vmfo_settings_enqueue_scripts', array( $this, 'enqueue_scripts' ), 10, 2 );

/**
 * Enqueue scripts for the settings page.
 *
 * @param string $active_tab    The currently active tab slug.
 * @param string $active_subtab The currently active subtab slug.
 * @return void
 */
public function enqueue_scripts( string $active_tab, string $active_subtab ): void {
    // Only enqueue on your tab.
    if ( 'my-addon' !== $active_tab ) {
        return;
    }

    $asset_file = MY_ADDON_PATH . 'build/index.asset.php';
    if ( ! file_exists( $asset_file ) ) {
        return;
    }

    $asset = require $asset_file;

    wp_enqueue_script(
        'my-addon-admin',
        MY_ADDON_URL . 'build/index.js',
        $asset['dependencies'],
        $asset['version'],
        true
    );

    wp_enqueue_style(
        'my-addon-admin',
        MY_ADDON_URL . 'build/index.css',
        array( 'wp-components' ),
        $asset['version']
    );

    // Localize script data.
    wp_localize_script(
        'my-addon-admin',
        'myAddonData',
        array(
            'restUrl' => rest_url( 'my-addon/v1/' ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
        )
    );
}
```

## Backwards Compatibility

To ensure your add-on works with older versions of Virtual Media Folders (or when the parent plugin is not active), implement a fallback:

```php
/**
 * Initialize admin menu.
 *
 * @return void
 */
public function init_admin(): void {
    if ( $this->supports_parent_tabs() ) {
        // Register as a tab in the parent plugin.
        add_filter( 'vmfo_settings_tabs', array( $this, 'register_tab' ) );
        add_action( 'vmfo_settings_enqueue_scripts', array( $this, 'enqueue_scripts' ), 10, 2 );
    } else {
        // Fall back to standalone menu.
        add_action( 'admin_menu', array( $this, 'add_standalone_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_standalone_scripts' ) );
    }
}

/**
 * Add standalone menu when parent doesn't support tabs.
 *
 * @return void
 */
public function add_standalone_menu(): void {
    add_submenu_page(
        'upload.php',
        __( 'My Add-on Settings', 'my-addon' ),
        __( 'My Add-on', 'my-addon' ),
        'manage_options',
        'my-addon-settings',
        array( $this, 'render_standalone_page' )
    );
}
```

## Complete Example

Here's a complete example of an add-on integrating with the tab system:

```php
<?php
namespace MyAddon;

class SettingsIntegration {

    /**
     * Initialize the settings integration.
     *
     * @return void
     */
    public function init(): void {
        if ( $this->supports_parent_tabs() ) {
            add_filter( 'vmfo_settings_tabs', array( $this, 'register_tab' ) );
            add_action( 'vmfo_settings_enqueue_scripts', array( $this, 'enqueue_scripts' ), 10, 2 );
        } else {
            add_action( 'admin_menu', array( $this, 'add_standalone_menu' ) );
            add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_standalone_scripts' ) );
        }
    }

    /**
     * Check if parent plugin supports tabs.
     *
     * @return bool
     */
    private function supports_parent_tabs(): bool {
        return defined( 'VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS' )
            && \VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS;
    }

    /**
     * Register tab with parent plugin.
     *
     * @param array $tabs Existing tabs.
     * @return array Modified tabs.
     */
    public function register_tab( array $tabs ): array {
        $tabs['my-addon'] = array(
            'title'    => __( 'My Add-on', 'my-addon' ),
            'callback' => array( $this, 'render_tab_content' ),
        );
        return $tabs;
    }

    /**
     * Render tab content.
     *
     * @param string $active_tab    Active tab slug.
     * @param string $active_subtab Active subtab slug.
     * @return void
     */
    public function render_tab_content( string $active_tab, string $active_subtab ): void {
        ?>
        <div id="my-addon-app"></div>
        <?php
    }

    /**
     * Enqueue scripts when tab is active.
     *
     * @param string $active_tab    Active tab slug.
     * @param string $active_subtab Active subtab slug.
     * @return void
     */
    public function enqueue_scripts( string $active_tab, string $active_subtab ): void {
        if ( 'my-addon' !== $active_tab ) {
            return;
        }
        // Enqueue your assets here.
    }

    /**
     * Fallback: Add standalone menu.
     *
     * @return void
     */
    public function add_standalone_menu(): void {
        add_submenu_page(
            'upload.php',
            __( 'My Add-on', 'my-addon' ),
            __( 'My Add-on', 'my-addon' ),
            'manage_options',
            'my-addon',
            array( $this, 'render_standalone_page' )
        );
    }

    /**
     * Fallback: Render standalone page.
     *
     * @return void
     */
    public function render_standalone_page(): void {
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'My Add-on', 'my-addon' ); ?></h1>
            <div id="my-addon-app"></div>
        </div>
        <?php
    }

    /**
     * Fallback: Enqueue standalone scripts.
     *
     * @param string $hook_suffix Admin page hook suffix.
     * @return void
     */
    public function enqueue_standalone_scripts( string $hook_suffix ): void {
        if ( 'media_page_my-addon' !== $hook_suffix ) {
            return;
        }
        // Enqueue your assets here.
    }
}
```

## Available Hooks

### Filters

| Hook | Parameters | Description |
|------|------------|-------------|
| `vmfo_settings_tabs` | `array $tabs` | Register add-on tabs |
| `vmfo_default_settings` | `array $defaults` | Modify default settings |
| `vmfo_settings` | `array $options` | Filter all settings |
| `vmfo_setting_{$key}` | `mixed $value, string $key, array $options` | Filter a specific setting |
| `vmfo_include_child_folders` | `bool $include, int $folder_id` | Include child folder media in queries |

### Actions

| Hook | Parameters | Description |
|------|------------|-------------|
| `vmfo_settings_enqueue_scripts` | `string $active_tab, string $active_subtab` | Enqueue tab-specific scripts |
| `vmfo_folder_assigned` | `int $attachment_id, int $folder_id, array $result` | Fired after media is assigned to a folder |

## Constants

| Constant | Type | Description |
|----------|------|-------------|
| `VirtualMediaFolders\Settings::SUPPORTS_ADDON_TABS` | bool | Whether tab system is supported |
| `VirtualMediaFolders\Settings::PAGE_SLUG` | string | The settings page slug (`vmfo-settings`) |
