/**
 * Folder toggle button for the Media Library view switcher.
 *
 * Reads configuration from vmfoFolderButton global (injected via wp_add_inline_script).
 *
 * @package VirtualMediaFolders
 * @since 1.7.1
 */
( function () {
	var config = window.vmfoFolderButton || {};

	function addFolderButton() {
		// Don't add if already exists.
		if ( document.querySelector( '.vmf-folder-toggle-button' ) ) {
			return;
		}

		var viewSwitch = document.querySelector( '.view-switch' );
		if ( ! viewSwitch ) {
			return;
		}

		// Check if folder view should be active.
		var urlParams = new URLSearchParams( window.location.search );
		var isActive =
			urlParams.has( 'vmfo_folder' ) ||
			urlParams.get( 'mode' ) === 'folder';
		if ( ! isActive ) {
			var savedPref = localStorage.getItem( 'vmfo_folder_view' );
			isActive = savedPref === '1';
		}

		var button = document.createElement( 'a' );
		button.href = config.folderUrl || '';
		button.className =
			'vmf-folder-toggle-button' + ( isActive ? ' is-active' : '' );
		button.title = config.title || '';
		button.innerHTML =
			'<span class="screen-reader-text">' +
			( config.screenReaderText || '' ) +
			'</span>' +
			'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7.5l-2-2H4z"/></svg>';

		button.addEventListener( 'click', function () {
			localStorage.setItem( 'vmfo_folder_view', '1' );
			// Let the link navigate naturally.
		} );

		viewSwitch.parentNode.insertBefore( button, viewSwitch );
	}

	// Try immediately.
	addFolderButton();

	// Try on DOM ready.
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', addFolderButton );
	}

	// Watch for dynamically added view-switch element.
	var observer = new MutationObserver( function () {
		if (
			! document.querySelector( '.vmf-folder-toggle-button' ) &&
			document.querySelector( '.view-switch' )
		) {
			addFolderButton();
			observer.disconnect();
		}
	} );
	observer.observe( document.body, { childList: true, subtree: true } );

	// Disconnect after 10 seconds to avoid memory leaks.
	setTimeout( function () {
		observer.disconnect();
	}, 10000 );
} )();
