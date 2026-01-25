# Virtual Media Folders Add-on UI/UX Guide

This guide provides design patterns and standards for building consistent user interfaces across Virtual Media Folders (VMF) add-ons.

## Overview

VMF add-ons should provide a consistent, modern user experience that integrates seamlessly with the WordPress admin. This guide covers the settings tab UI patterns used by official add-ons like AI Organizer, Rules Engine, and Editorial Workflow.

## Tab Registration

### Registering with VMF Settings

Add-ons register their settings tab using the `vmfo_settings_tabs` filter:

```php
add_filter( 'vmfo_settings_tabs', [ $this, 'register_tab' ] );

public function register_tab( array $tabs ): array {
    $tabs['your-addon-id'] = [
        'title'    => __( 'Your Add-on Name', 'your-textdomain' ),
        'callback' => [ $this, 'render_tab' ],
    ];
    return $tabs;
}
```

### Render Method Signature

The render callback receives two parameters:

```php
public function render_tab( string $active_tab, string $active_subtab ): void {
    ?>
    <div id="your-addon-settings-root">
        <!-- React app mounts here -->
    </div>
    <?php
}
```

### Enqueuing Assets

Use the `vmfo_settings_enqueue_scripts` action:

```php
add_action( 'vmfo_settings_enqueue_scripts', [ $this, 'enqueue_assets' ], 10, 2 );

public function enqueue_assets( string $active_tab, string $active_subtab ): void {
    if ( 'your-addon-id' !== $active_tab ) {
        return;
    }

    // Use wp-scripts asset file for dependencies
    $asset_file = YOUR_PLUGIN_PATH . 'build/settings.asset.php';
    $asset = file_exists( $asset_file ) ? require $asset_file : [
        'dependencies' => [ 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n' ],
        'version'      => YOUR_PLUGIN_VERSION,
    ];

    wp_enqueue_style(
        'your-addon-settings',
        YOUR_PLUGIN_URL . 'build/settings.css',
        [ 'wp-components' ],
        $asset['version']
    );

    wp_enqueue_script(
        'your-addon-settings',
        YOUR_PLUGIN_URL . 'build/settings.js',
        $asset['dependencies'],
        $asset['version'],
        true
    );

    wp_localize_script( 'your-addon-settings', 'yourAddonSettings', [
        'restUrl' => rest_url( 'your-addon/v1' ),
        'nonce'   => wp_create_nonce( 'wp_rest' ),
        // Add other data needed by your JS
    ] );
}
```

---

## UI Component Patterns

### 1. Statistics Card

Display key metrics at the top of your settings page using a 4-column grid:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1002        │    1002       │     0         │     217        │
│  Total Media  │   In Folders  │  Unassigned   │    Folders     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS Structure:**

```css
.your-addon-stats-card {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 24px 20px;
    text-align: center;
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    margin-bottom: 20px;
}

.your-addon-stat-item {
    padding: 0 16px;
    border-right: 1px solid #f0f0f1;
}

.your-addon-stat-item:last-child {
    border-right: none;
}

.your-addon-stat-value {
    font-size: 32px;
    font-weight: 600;
    line-height: 1.2;
    color: #1d2327;
}

.your-addon-stat-label {
    font-size: 13px;
    color: #646970;
    margin-top: 4px;
}
```

**Responsive (mobile):**

```css
@media (max-width: 782px) {
    .your-addon-stats-card {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }

    .your-addon-stat-item {
        border-right: none;
    }
}
```

### 2. Card Container

Use card containers for grouping related settings:

```
┌─────────────────────────────────────────────────────────────────┐
│  Section Title                                      [Toggle]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Description text explaining this section.                      │
│                                                                 │
│  [Content area - forms, lists, etc.]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS Structure:**

```css
.your-addon-card {
    background: #fff;
    border: 1px solid #c3c4c7;
    border-radius: 4px;
    margin-bottom: 20px;
}

.your-addon-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f1;
}

.your-addon-card-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1d2327;
}

.your-addon-card-body {
    padding: 20px;
}

.your-addon-card-description {
    margin: 0 0 20px;
    color: #646970;
}
```

### 3. Expandable Lists

For complex data like permissions or rules, use expandable sections:

```
┌─────────────────────────────────────────────────────────────────┐
│  ▶ Editor                                        3 permissions  │
├─────────────────────────────────────────────────────────────────┤
│  ▼ Author                                        5 permissions  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Folder          │ View │ Move │ Upload │ Remove │        │  │
│  │  ─────────────────────────────────────────────────        │  │
│  │  Inbox           │  ☑   │  ☐   │   ☑    │   ☐    │        │  │
│  │  Published       │  ☑   │  ☑   │   ☐    │   ☐    │        │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ▶ Contributor                                   0 permissions  │
└─────────────────────────────────────────────────────────────────┘
```

**CSS for expandable headers:**

```css
.your-addon-expandable-header {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    background: #f6f7f7;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    transition: background-color 0.15s;
}

.your-addon-expandable-header:hover {
    background: #f0f0f1;
}

.your-addon-toggle-icon {
    margin-right: 8px;
    color: #50575e;
}

.your-addon-item-name {
    flex: 1;
    font-weight: 500;
    color: #1d2327;
}

.your-addon-item-count {
    font-size: 12px;
    color: #646970;
}
```

### 4. Action Buttons

Primary actions should use WordPress button patterns:

```jsx
import { Button } from '@wordpress/components';

<div className="your-addon-actions">
    <Button
        variant="primary"
        onClick={ handleSave }
        isBusy={ isSaving }
        disabled={ isSaving }
    >
        { isSaving ? __( 'Saving…', 'textdomain' ) : __( 'Save Changes', 'textdomain' ) }
    </Button>
</div>
```

**Actions container CSS:**

```css
.your-addon-actions {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #dcdcde;
}
```

### 5. Grid Layouts for Form Fields

Use CSS Grid for multi-column form layouts:

```css
.your-addon-field-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

/* Or for auto-fill responsive grids */
.your-addon-auto-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

@media (max-width: 782px) {
    .your-addon-field-grid {
        grid-template-columns: 1fr;
    }
}
```

---

## Color Palette

Use WordPress admin colors for consistency:

| Purpose | Color | Usage |
|---------|-------|-------|
| Primary text | `#1d2327` | Headings, important text |
| Secondary text | `#646970` | Descriptions, help text |
| Muted text | `#a7aaad` | Disabled, placeholders |
| Border | `#c3c4c7` | Card borders |
| Light border | `#f0f0f1` | Internal dividers |
| Background | `#f6f7f7` | Expandable headers, hover states |
| Primary action | `#2271b1` | Links, icons, primary buttons |
| Success | `#00a32a` | Success states, approved |
| Warning | `#dba617` | Warnings, pending |
| Error | `#d63638` | Errors, needs attention |

---

## React Component Structure

### Entry Point

```jsx
// src/js/settings/index.jsx
import { createRoot } from '@wordpress/element';
import SettingsPanel from './SettingsPanel';
import '../../css/settings.css';

document.addEventListener( 'DOMContentLoaded', () => {
    const container = document.getElementById( 'your-addon-settings-root' );
    if ( container ) {
        const root = createRoot( container );
        root.render( <SettingsPanel /> );
    }
} );
```

### Main Settings Panel

```jsx
// src/js/settings/SettingsPanel.jsx
import { useState, useEffect, useCallback } from '@wordpress/element';
import { Button, Spinner, Notice } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import StatsCard from './StatsCard';
// ... other components

export default function SettingsPanel() {
    const [ isLoading, setIsLoading ] = useState( true );
    const [ isSaving, setIsSaving ] = useState( false );
    const [ notice, setNotice ] = useState( null );
    const [ settings, setSettings ] = useState( {} );
    const [ stats, setStats ] = useState( {} );

    useEffect( () => {
        fetchSettings();
        fetchStats();
    }, [] );

    const fetchSettings = useCallback( async () => {
        setIsLoading( true );
        try {
            const response = await apiFetch( { path: '/your-addon/v1/settings' } );
            setSettings( response );
        } catch ( error ) {
            setNotice( { status: 'error', message: error.message } );
        } finally {
            setIsLoading( false );
        }
    }, [] );

    const saveSettings = useCallback( async () => {
        setIsSaving( true );
        setNotice( null );
        try {
            await apiFetch( {
                path: '/your-addon/v1/settings',
                method: 'POST',
                data: settings,
            } );
            setNotice( { status: 'success', message: __( 'Settings saved.', 'textdomain' ) } );
        } catch ( error ) {
            setNotice( { status: 'error', message: error.message } );
        } finally {
            setIsSaving( false );
        }
    }, [ settings ] );

    if ( isLoading ) {
        return (
            <div className="your-addon-loading">
                <Spinner />
                <p>{ __( 'Loading…', 'textdomain' ) }</p>
            </div>
        );
    }

    return (
        <div className="your-addon-settings-panel">
            { notice && (
                <Notice
                    status={ notice.status }
                    isDismissible
                    onRemove={ () => setNotice( null ) }
                >
                    { notice.message }
                </Notice>
            ) }

            <StatsCard stats={ stats } />

            {/* Your settings cards here */}

            <div className="your-addon-actions">
                <Button
                    variant="primary"
                    onClick={ saveSettings }
                    isBusy={ isSaving }
                    disabled={ isSaving }
                >
                    { isSaving ? __( 'Saving…', 'textdomain' ) : __( 'Save Changes', 'textdomain' ) }
                </Button>
            </div>
        </div>
    );
}
```

---

## Build Configuration

### Using @wordpress/scripts

**package.json:**

```json
{
    "scripts": {
        "build": "wp-scripts build",
        "start": "wp-scripts start",
        "lint:js": "wp-scripts lint-js",
        "lint:css": "wp-scripts lint-style"
    },
    "devDependencies": {
        "@wordpress/scripts": "^30.0.0"
    }
}
```

**webpack.config.js** (for multiple entry points):

```javascript
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
    ...defaultConfig,
    entry: {
        settings: path.resolve( __dirname, 'src/js/settings/index.jsx' ),
        // Add other entry points as needed
    },
    output: {
        ...defaultConfig.output,
        path: path.resolve( __dirname, 'build' ),
    },
};
```

---

## REST API Patterns

### Stats Endpoint

Provide a `/stats` endpoint for the statistics card:

```php
register_rest_route(
    'your-addon/v1',
    '/stats',
    [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => [ $this, 'get_stats' ],
        'permission_callback' => [ $this, 'check_admin_permission' ],
    ]
);

public function get_stats( WP_REST_Request $request ): WP_REST_Response {
    return rest_ensure_response( [
        'totalMedia'  => wp_count_posts( 'attachment' )->inherit,
        'processed'   => $this->get_processed_count(),
        'pending'     => $this->get_pending_count(),
        'activeRules' => $this->get_active_rules_count(),
    ] );
}
```

### Settings Endpoint

```php
register_rest_route(
    'your-addon/v1',
    '/settings',
    [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ $this, 'get_settings' ],
            'permission_callback' => [ $this, 'check_admin_permission' ],
        ],
        [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [ $this, 'update_settings' ],
            'permission_callback' => [ $this, 'check_admin_permission' ],
        ],
    ]
);
```

---

## Accessibility

1. **Use semantic HTML** - Use appropriate heading levels, lists, and buttons
2. **Keyboard navigation** - Ensure all interactive elements are focusable
3. **ARIA attributes** - Add `aria-expanded` for expandable sections
4. **Color contrast** - Maintain WCAG AA compliance (4.5:1 for text)
5. **Focus indicators** - Use WordPress default focus styles

```jsx
<button
    type="button"
    className="your-addon-expandable-header"
    onClick={ () => toggleSection( id ) }
    aria-expanded={ isExpanded }
>
    {/* content */}
</button>
```

---

## File Structure

Recommended file structure for add-on settings:

```
src/
├── css/
│   └── settings.css
├── js/
│   └── settings/
│       ├── index.jsx           # Entry point
│       ├── SettingsPanel.jsx   # Main container
│       ├── StatsCard.jsx       # Statistics display
│       ├── SettingsCard.jsx    # Reusable card component
│       └── [FeatureName]Card.jsx
└── php/
    └── Admin/
        └── SettingsTab.php     # Tab registration & assets
```

---

## Checklist

Before releasing your add-on, verify:

- [ ] Stats card displays relevant metrics
- [ ] Cards use consistent styling and spacing
- [ ] Loading states show spinner
- [ ] Success/error notices display properly
- [ ] Save button shows busy state while saving
- [ ] UI is responsive on mobile (< 782px)
- [ ] All text is translatable with `__()` or `_e()`
- [ ] REST endpoints return proper error responses
- [ ] Assets are properly enqueued only on your tab
- [ ] No console errors or warnings
