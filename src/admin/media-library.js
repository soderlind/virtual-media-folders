/**
 * Media Library integration.
 *
 * Extends the WordPress Media Library to add folder filtering
 * by injecting a folder tree into the AttachmentsBrowser view.
 */

import { createRoot } from '@wordpress/element';
import { SlotFillProvider, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import FolderTree from './components/FolderTree';

// Track folder view state
let folderViewActive = false;
let folderTreeRoot = null;
let currentBrowser = null;

/**
 * If the user lands on upload.php with mode=folder, WordPress may still render
 * the list table (it only recognizes grid/list). Folder view requires the grid
 * (wp.media AttachmentsBrowser), so redirect to grid while preserving intent.
 */
function ensureGridModeForFolderView() {
	const urlParams = new URLSearchParams(window.location.search);
	const redirectKey = 'vmfo_folder_mode_redirected';

	// Clear the one-time redirect guard on any non-folder page so future
	// navigations to mode=folder can still trigger a redirect.
	if (urlParams.get('mode') !== 'folder') {
		try {
			if (window.sessionStorage) {
				sessionStorage.removeItem(redirectKey);
			}
		} catch (e) {
			// Ignore storage errors.
		}
	}

	const wantsFolderMode = urlParams.get('mode') === 'folder' || urlParams.has('vmfo_folder');
	if (!wantsFolderMode) {
		return;
	}

	// Detect list-table view (no AttachmentsBrowser DOM).
	const isListTableView = !!document.querySelector('.wp-list-table') && !document.querySelector('.attachments-browser');
	if (!isListTableView) {
		return;
	}

	// Prevent potential redirect loops in edge cases.
	try {
		if (window.sessionStorage && sessionStorage.getItem(redirectKey) === '1') {
			return;
		}
		sessionStorage.setItem(redirectKey, '1');
	} catch (e) {
		// Ignore storage errors.
	}

	// Ensure folder view is enabled once we reach grid mode.
	try {
		localStorage.setItem('vmfo_folder_view', '1');
	} catch (e) {
		// Ignore storage errors.
	}

	const url = new URL(window.location.href);
	url.searchParams.set('mode', 'grid');
	window.location.replace(url.toString());
}

// Run after DOM is ready to ensure elements are available for detection
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', ensureGridModeForFolderView);
} else {
	ensureGridModeForFolderView();
}

/**
 * Global function to hide folder view - can be called from anywhere
 */
function hideFolderView() {
	folderViewActive = false;
	localStorage.setItem('vmfo_folder_view', '0');
	
	const $container = jQuery('#vmf-folder-tree');
	const $toggle = jQuery('.vmf-folder-toggle-button');
	
	$container.removeClass('is-visible');
	$toggle.removeClass('is-active');
	document.body.classList.remove('vmf-folder-view-active');
	jQuery('.attachments-browser').removeClass('vmf-sidebar-visible');

	// Cleanup sticky listeners/observers if they were installed
	const sidebar = document.querySelector('.vmf-folder-tree-sidebar');
	if (sidebar && typeof sidebar._cleanupSticky === 'function') {
		sidebar._cleanupSticky();
	}

	// Cleanup drag observer + handlers to avoid duplicate work
	if (currentBrowser) {
		const attachmentsEl = currentBrowser.$el.find('.attachments')[0];
		if (attachmentsEl && attachmentsEl._vmfoDragObserver) {
			attachmentsEl._vmfoDragObserver.disconnect();
			delete attachmentsEl._vmfoDragObserver;
		}
		currentBrowser.$el.find('.attachments').off('dragstart.vmfo dragend.vmfo');
	}

	// Update URL to grid mode if we were using mode=folder
	// This prevents re-activation when the browser re-renders
	try {
		const url = new URL(window.location.href);
		if (url.searchParams.get('mode') === 'folder') {
			url.searchParams.set('mode', 'grid');
			window.history.replaceState({}, '', url);
		}
	} catch (e) {
		// Ignore URL errors.
	}

	// Restore 'current' class to grid icon (we're in grid mode)
	jQuery('.view-switch a.view-grid').addClass('current');
}

// Listen for clicks on view switcher at document level (before page load completes)
// Namespace the handler to avoid duplicate bindings if scripts re-run.
// IMPORTANT: Only handle actual view-switch links, not the folder toggle button
jQuery(document).off('click.vmfo', '.view-switch a').on('click.vmfo', '.view-switch a', function(e) {
	// Don't hide folder view if clicking on our folder toggle button
	if (jQuery(this).hasClass('vmf-folder-toggle-button')) {
		return;
	}
	// Only respond to actual view switch links (list/grid icons)
	if (!jQuery(this).hasClass('view-list') && !jQuery(this).hasClass('view-grid')) {
		return;
	}
	
	// Prevent default navigation - we'll handle it ourselves
	e.preventDefault();
	
	hideFolderView();
	
	// Navigate to clean grid or list URL without folder parameters
	const mode = jQuery(this).hasClass('view-grid') ? 'grid' : 'list';
	window.location.href = 'upload.php?mode=' + mode;
});

// When "Add Media File" button is clicked, ensure uploader is visible
jQuery(document).off('click.vmfo', '.page-title-action').on('click.vmfo', '.page-title-action', function() {
	// The uploader is hidden when vmf-folder-filtered class is present
	// Temporarily remove the filter to show the uploader
	const $browser = jQuery('.attachments-browser');
	if ($browser.hasClass('vmf-folder-filtered')) {
		$browser.removeClass('vmf-folder-filtered');
		// Recalculate sidebar position after uploader becomes visible
		const sidebar = document.querySelector('.vmf-folder-tree-sidebar');
		if (sidebar && sidebar._recalculateOffset) {
			setTimeout(() => sidebar._recalculateOffset(), 50);
		}
	}
});

/**
 * Update folder toggle button state.
 * The button is now added by PHP with the correct href,
 * this function just ensures the active state is correct.
 */
function updateFolderToggleButtonState() {
	const $existingButton = jQuery('.vmf-folder-toggle-button');
	if (!$existingButton.length) {
		return;
	}
	
	// Check if folder view should be active on load
	const savedPref = localStorage.getItem('vmfo_folder_view');
	const urlParams = new URLSearchParams(window.location.search);
	
	let shouldBeActive = urlParams.has('vmfo_folder') || urlParams.get('mode') === 'folder';
	if (!shouldBeActive && savedPref !== null) {
		shouldBeActive = savedPref === '1';
	}
	
	if (shouldBeActive) {
		$existingButton.addClass('is-active');
	}
}

// Update button state on DOM ready
jQuery(document).ready(function() {
	updateFolderToggleButtonState();
});

/**
 * Move media to a folder via AJAX.
 */
async function moveMediaToFolder(mediaId, folderId) {
	const { ajaxUrl, nonce } = window.vmfData || {};

	if (!ajaxUrl || !nonce) {
		console.error('Virtual Media Folders: Missing AJAX configuration');
		return;
	}

	// Check if this is the last file in the current folder BEFORE the move
	const isAllMediaView = !document.querySelector('.attachments-browser')?.classList.contains('vmf-folder-filtered');
	const totalAttachments = document.querySelectorAll('.attachments .attachment').length;
	const willBeEmpty = !isAllMediaView && totalAttachments <= 1;

	const formData = new FormData();
	formData.append('action', 'vmfo_move_to_folder');
	formData.append('nonce', nonce);
	formData.append('media_id', mediaId);
	formData.append('folder_id', folderId ?? '');

	try {
		const response = await fetch(ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: formData,
		});

		const data = await response.json();

		if (data.success) {
			if (data.data?.message) {
				showNotice(data.data.message, 'success');
			}
			// Refresh the folder counts (await to avoid race condition)
			if (window.vmfRefreshFolders) {
				await window.vmfRefreshFolders();
			}
			
			// If current folder is now empty, jump to target folder
			if (willBeEmpty && window.vmfSelectFolder) {
				window.vmfSelectFolder(folderId);
			} else {
				// Refresh the media library view
				refreshMediaLibrary();
			}
		} else {
			showNotice(data.data?.message || __('Failed to move media.', 'virtual-media-folders'), 'error');
		}
	} catch (error) {
		console.error('Error moving media:', error);
		showNotice(__('Failed to move media.', 'virtual-media-folders'), 'error');
	}
}

/**
 * Refresh the media library after a move operation.
 * Preserves the current sort order.
 * Does NOT refresh when in "All Media" view to preserve item positions.
 */
function refreshMediaLibrary() {
	// Check if we're in "All Media" view - don't refresh the grid
	// because items should stay in place (they're still visible in All Media)
	const isAllMediaView = !document.querySelector('.attachments-browser')?.classList.contains('vmf-folder-filtered');
	if (isAllMediaView) {
		// In All Media view, just update folder counts (already done via vmfRefreshFolders)
		// No need to refresh the media grid
		return;
	}
	
	// Re-trigger the current folder selection to refresh the view
	// This ensures the filter is properly re-applied
	const $selectedFolder = jQuery('.vmf-folder-button.is-selected');
	if ($selectedFolder.length) {
		// Small delay to ensure the server has processed the move
		setTimeout(() => {
			$selectedFolder.trigger('click');
		}, 100);
		return;
	}
	
	// Fallback: try to refresh the collection directly while preserving sort order
	try {
		if (wp.media?.frame?.content?.get) {
			const content = wp.media.frame.content.get();
			if (content && content.collection) {
				// Preserve current sort order
				const currentOrderby = content.collection.props.get('orderby') || 'date';
				const currentOrder = content.collection.props.get('order') || 'DESC';
				
				content.collection.reset();
				content.collection.props.set({
					orderby: currentOrderby,
					order: currentOrder
				});
				content.collection.more({ remove: false });
			}
		}
	} catch (e) {
		console.error('Error refreshing media library:', e);
	}
}

window.vmfMoveToFolder = moveMediaToFolder;
window.vmfRefreshMediaLibrary = refreshMediaLibrary;

/**
 * Show a temporary notice.
 */
function showNotice(message, type = 'success') {
	const notice = document.createElement('div');
	notice.className = `notice notice-${type} vmf-notice is-dismissible`;
	const p = document.createElement('p');
	p.textContent = String(message ?? '');
	notice.appendChild(p);
	notice.style.cssText = 'position: fixed; top: 40px; right: 20px; z-index: 100000; max-width: 300px;';
	document.body.appendChild(notice);
	setTimeout(() => notice.remove(), 3000);
}

/**
 * Align folder tree sidebar with the toolbar.
 * This is now handled by setupStickySidebar, but we keep this for backward compatibility.
 */
function alignSidebarWithGrid(browser) {
	// No-op - alignment is now handled by setupStickySidebar using transform
}

/**
 * Setup sticky sidebar behavior using JavaScript.
 * Aligns sidebar with the attachments grid and makes it sticky on scroll.
 */
function setupStickySidebar(browser) {
	// Wait for sidebar to be rendered by React
	const waitForSidebar = () => {
		const sidebar = document.querySelector('.vmf-folder-tree-sidebar');
		const attachmentsWrapper = browser.$el.find('.attachments-wrapper')[0];
		const attachments = browser.$el.find('.attachments')[0];
		
		if (!sidebar) {
			setTimeout(waitForSidebar, 100);
			return;
		}
		
		if (!attachmentsWrapper || !attachments) {
			return;
		}

		// If sticky behavior was previously initialized, clean it up first to avoid
		// accumulating scroll/resize listeners and MutationObservers.
		if (typeof sidebar._cleanupSticky === 'function') {
			sidebar._cleanupSticky();
		}
		if (sidebar._vmfoUploaderObserver) {
			sidebar._vmfoUploaderObserver.disconnect();
			delete sidebar._vmfoUploaderObserver;
		}
		
		const adminBarHeight = 32;
		let ticking = false;
		let recalculateTimeout = null;
		
		// Get the offset to align sidebar with attachments-wrapper top
		function getContentOffset() {
			// Align with the top of attachments-wrapper (offset = 0)
			return 0;
		}
		
		// Cache initial offset
		let initialOffset = getContentOffset();
		
		// Debounced recalculate to prevent multiple rapid calls
		function scheduleRecalculate(delay = 50) {
			if (recalculateTimeout) {
				clearTimeout(recalculateTimeout);
			}
			recalculateTimeout = setTimeout(() => {
				recalculateTimeout = null;
				recalculateOffset();
			}, delay);
		}
		
		// Calculate offset after content is loaded
		function recalculateOffset() {
			initialOffset = getContentOffset();
			// Ensure offset is never negative
			if (initialOffset < 0) initialOffset = 0;
			updateSidebarPosition();
			// Show sidebar after positioning (removes visibility:hidden)
			sidebar.classList.add('vmf-positioned');
		}
		
		// Initial calculation with delays to ensure content is rendered
		setTimeout(recalculateOffset, 100);
		setTimeout(recalculateOffset, 300);
		setTimeout(recalculateOffset, 600);
		
		// Watch for uploader visibility changes
		const uploaderInline = browser.$el.find('.uploader-inline')[0];
		if (uploaderInline) {
			const observer = new MutationObserver(() => {
				scheduleRecalculate(50);
			});
			observer.observe(uploaderInline, { 
				attributes: true, 
				attributeFilter: ['style', 'class'] 
			});
			sidebar._vmfoUploaderObserver = observer;
		}
		
		// Watch for contextual help panel toggle and tab changes
		const helpWrap = document.getElementById('contextual-help-wrap');
		const helpToggle = document.getElementById('contextual-help-link');
		const helpClickHandler = () => scheduleRecalculate(10);
		const helpTabHandlers = [];
		
		if (helpWrap) {
			const helpObserver = new MutationObserver(() => {
				scheduleRecalculate(50);
			});
			// Watch for class changes on the help wrap itself (open/close state)
			helpObserver.observe(helpWrap, { 
				attributes: true, 
				attributeFilter: ['class']
			});
			sidebar._vmfHelpObserver = helpObserver;
			
			// Listen for clicks on help tabs for immediate response
			const helpTabs = helpWrap.querySelectorAll('.contextual-help-tabs a');
			helpTabs.forEach(tab => {
				tab.addEventListener('click', helpClickHandler);
				helpTabHandlers.push(tab);
			});
		}
		
		// Listen for Help toggle button click for immediate response
		if (helpToggle) {
			helpToggle.addEventListener('click', helpClickHandler);
		}
		
		function updateSidebarPosition() {
			// Get current scroll-aware position of attachments
			const attachmentsRect = attachments.getBoundingClientRect();
			const attachmentsTop = attachmentsRect.top;
			const wrapperRect = attachmentsWrapper.getBoundingClientRect();
			
			// Target position: just below admin bar
			const targetTop = adminBarHeight;
			
			// Always use fixed positioning to avoid parent clipping issues
			sidebar.style.position = 'fixed';
			sidebar.style.left = `${wrapperRect.left}px`;
			sidebar.style.transform = 'none';
			
			if (attachmentsTop >= targetTop) {
				// Attachments haven't scrolled past the admin bar yet
				// Position sidebar at the attachments level
				const sidebarTop = wrapperRect.top + initialOffset;
				sidebar.style.top = `${sidebarTop}px`;
				// Height from sidebar top to viewport bottom
				const availableHeight = window.innerHeight - sidebarTop;
				sidebar.style.height = `${Math.max(availableHeight, 200)}px`;
			} else {
				// Attachments have scrolled past - fix sidebar at admin bar
				sidebar.style.top = `${adminBarHeight}px`;
				// Height from admin bar to viewport bottom
				const availableHeight = window.innerHeight - adminBarHeight;
				sidebar.style.height = `${availableHeight}px`;
			}
			
			ticking = false;
		}
		
		function onScroll() {
			if (!ticking) {
				requestAnimationFrame(updateSidebarPosition);
				ticking = true;
			}
		}
		
		function onResize() {
			recalculateOffset();
		}
		
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		updateSidebarPosition();
		
		// Expose recalculate function for external use
		sidebar._recalculateOffset = recalculateOffset;
		
		sidebar._cleanupSticky = () => {
			// Clear any pending timeout
			if (recalculateTimeout) {
				clearTimeout(recalculateTimeout);
				recalculateTimeout = null;
			}
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			if (sidebar._vmfoUploaderObserver) {
				sidebar._vmfoUploaderObserver.disconnect();
				delete sidebar._vmfoUploaderObserver;
			}
			if (sidebar._vmfHelpObserver) {
				sidebar._vmfHelpObserver.disconnect();
				delete sidebar._vmfHelpObserver;
			}
			// Clean up help toggle listener
			if (helpToggle) {
				helpToggle.removeEventListener('click', helpClickHandler);
			}
			// Clean up help tab listeners
			helpTabHandlers.forEach(tab => {
				tab.removeEventListener('click', helpClickHandler);
			});
		};
	};
	
	waitForSidebar();
}

/**
 * Remove 'current' class from view-switch icons.
 */
function removeViewSwitchCurrent() {
	jQuery('.view-switch a').removeClass('current');
}

/**
 * Toggle folder view visibility.
 */
function toggleFolderView(browser, show) {
	folderViewActive = show;
	const $container = browser.$el.find('#vmf-folder-tree');
	const $toggle = jQuery('.vmf-folder-toggle-button');
	
	if (show) {
		$container.addClass('is-visible');
		$toggle.addClass('is-active');
		document.body.classList.add('vmf-folder-view-active');
		// Add class to the browser element itself
		browser.$el.addClass('vmf-sidebar-visible');
		// Remove 'current' class from grid/list icons (with delay to ensure DOM is ready)
		removeViewSwitchCurrent();
		setTimeout(removeViewSwitchCurrent, 100);
		setTimeout(removeViewSwitchCurrent, 500);
		// Setup drag and drop when showing
		setupDragAndDrop(browser);
		// Align sidebar with grid
		alignSidebarWithGrid(browser);
		// Setup sticky behavior
		setupStickySidebar(browser);

		// Keep URL in sync with folder mode.
		try {
			const url = new URL(window.location.href);
			url.searchParams.set('mode', 'folder');
			window.history.replaceState({}, '', url);
		} catch (e) {
			// Ignore URL errors.
		}
	} else {
		$container.removeClass('is-visible');
		$toggle.removeClass('is-active');
		document.body.classList.remove('vmf-folder-view-active');
		// Remove the class
		browser.$el.removeClass('vmf-sidebar-visible');

		// Cleanup sticky listeners/observers if they were installed.
		const sidebar = document.querySelector('.vmf-folder-tree-sidebar');
		if (sidebar && typeof sidebar._cleanupSticky === 'function') {
			sidebar._cleanupSticky();
		}

		// Cleanup drag observer + handlers to avoid duplicate work.
		const attachmentsEl = browser.$el.find('.attachments')[0];
		if (attachmentsEl && attachmentsEl._vmfoDragObserver) {
			attachmentsEl._vmfoDragObserver.disconnect();
			delete attachmentsEl._vmfoDragObserver;
		}
		browser.$el.find('.attachments').off('dragstart.vmfo dragend.vmfo');

		// Revert URL back to grid mode if we were using mode=folder.
		try {
			const url = new URL(window.location.href);
			if (url.searchParams.get('mode') === 'folder') {
				url.searchParams.set('mode', 'grid');
				window.history.replaceState({}, '', url);
			}
		} catch (e) {
			// Ignore URL errors.
		}
		// Restore 'current' class to grid icon (we're in grid mode)
		jQuery('.view-switch a.view-grid').addClass('current');
	}
	
	// Save preference
	localStorage.setItem('vmfo_folder_view', show ? '1' : '0');
}

/**
 * Add folder toggle button to the view switcher.
 * Now just sets up the browser reference and applies saved preferences,
 * since the button is already added by PHP in the admin footer.
 */
function addFolderToggleButton(browser) {
	// Store the browser reference for later use
	currentBrowser = browser;
	
	// Button is created by PHP - we just need to check if folder view should be active
	// Check saved preference or URL param and apply
	const savedPref = localStorage.getItem('vmfo_folder_view');
	const urlParams = new URLSearchParams(window.location.search);
	if (savedPref === '1' || urlParams.has('vmfo_folder') || urlParams.get('mode') === 'folder') {
		toggleFolderView(browser, true);
	}
}

/**
 * Inject folder tree into an AttachmentsBrowser instance.
 */
function injectFolderTree(browser) {
	// Always update the browser reference
	currentBrowser = browser;

	// Check if sidebar already exists in this browser
	if (browser.$el.find('#vmf-folder-tree').length) {
		// Sidebar is already in this browser, just ensure visibility classes are correct
		if (folderViewActive) {
			browser.$el.addClass('vmf-sidebar-visible');
			document.body.classList.add('vmf-folder-view-active');
		}
		return;
	}

	// Check if sidebar exists elsewhere (orphaned from previous browser render)
	const existingSidebar = document.getElementById('vmf-folder-tree');
	
	// Check if the existing sidebar is actually attached to the document
	// If it's detached (orphaned), we need to recreate it
	const sidebarIsAttached = existingSidebar && document.body.contains(existingSidebar);
	
	// Check if folder view should be active
	const savedPref = localStorage.getItem('vmfo_folder_view');
	const urlParams = new URLSearchParams(window.location.search);
	const shouldBeVisible = savedPref === '1' || urlParams.has('vmfo_folder') || urlParams.get('mode') === 'folder' || folderViewActive;

	// Find the best insertion point - we want the sidebar next to attachments,
	// not overlapping the uploader
	const $attachmentsWrapper = browser.$el.find('.attachments-wrapper').first();
	const $attachmentsBrowser = browser.$el;
	
	let container;
	
	if (sidebarIsAttached) {
		// Reuse existing sidebar - preserve its visibility state
		container = existingSidebar;
		// Move it to the new browser element
		if ($attachmentsWrapper.length) {
			$attachmentsWrapper.prepend(container);
		} else {
			$attachmentsBrowser.prepend(container);
		}
		// Ensure visibility classes are applied to the new browser element
		if (container.classList.contains('is-visible') || shouldBeVisible) {
			container.classList.add('is-visible');
			browser.$el.addClass('vmf-sidebar-visible');
			document.body.classList.add('vmf-folder-view-active');
			folderViewActive = true;
		}
		
		// Re-setup toggle button reference and drag/drop if folder view is active
		if (folderViewActive) {
			addFolderToggleButton(browser);
			setupDragAndDrop(browser);
			setupStickySidebar(browser);
		}
		return; // Don't recreate the React root
	}
	
	// If there's a detached sidebar, clean up the old React root
	if (existingSidebar && !sidebarIsAttached) {
		if (folderTreeRoot) {
			try {
				folderTreeRoot.unmount();
			} catch (e) {
				// Ignore unmount errors
			}
			folderTreeRoot = null;
		}
	}

	// Create new container
	container = document.createElement('div');
	container.id = 'vmf-folder-tree';
	container.className = 'vmf-folder-tree-sidebar';
	
	// Add is-visible class immediately if folder view should be active
	// This prevents layout shift when React renders
	if (shouldBeVisible) {
		container.classList.add('is-visible');
		browser.$el.addClass('vmf-sidebar-visible');
		document.body.classList.add('vmf-folder-view-active');
		folderViewActive = true;
	}

	if ($attachmentsWrapper.length) {
		// Insert sidebar into attachments-wrapper
		$attachmentsWrapper.prepend(container);
	} else {
		// Fallback: prepend to browser element
		$attachmentsBrowser.prepend(container);
	}

	// Mount React component
	folderTreeRoot = createRoot(container);
	folderTreeRoot.render(
		<SlotFillProvider>
			<FolderTree
				onFolderSelect={(folderId) => {
					// Update URL state with mode=folder when folder view is active
					const url = new URL(window.location);
					if (folderId) {
						url.searchParams.set('vmfo_folder', folderId);
					} else {
						url.searchParams.delete('vmfo_folder');
					}
					// Always use mode=folder when in folder view (sidebar visible)
					url.searchParams.set('mode', 'folder');
					window.history.pushState({}, '', url);

					// Get the current collection from the browser
					const currentCollection = browser.collection;
					
					if (currentCollection) {
						// Preserve current sort order
						const currentOrderby = currentCollection.props.get('orderby') || 'date';
						const currentOrder = currentCollection.props.get('order') || 'DESC';
						
						// Add loading class for smooth transition
						const $attachments = browser.$el.find('.attachments');
						$attachments.addClass('vmf-loading');
						
						// Hide/show uploader based on folder selection
						// Only show uploader for "All Media" (folderId === null)
						const wasFiltered = browser.$el.hasClass('vmf-folder-filtered');
						const willBeFiltered = folderId !== null;
						
						if (willBeFiltered) {
							browser.$el.addClass('vmf-folder-filtered');
						} else {
							browser.$el.removeClass('vmf-folder-filtered');
						}
						
						// Only recalculate sidebar if uploader visibility changed
						if (wasFiltered !== willBeFiltered) {
							const sidebar = document.querySelector('.vmf-folder-tree-sidebar');
							if (sidebar && sidebar._recalculateOffset) {
								setTimeout(() => sidebar._recalculateOffset(), 50);
							}
						}
						
						// Clear existing folder filters
						currentCollection.props.unset('vmfo_folder');
						currentCollection.props.unset('vmfo_folder_exclude');

						// Set the new filter while preserving sort order
						if (folderId === 'uncategorized') {
							currentCollection.props.set({ 
								vmfo_folder_exclude: 'all',
								orderby: currentOrderby,
								order: currentOrder
							});
						} else if (folderId) {
							currentCollection.props.set({ 
								vmfo_folder: folderId,
								orderby: currentOrderby,
								order: currentOrder
							});
						} else {
							// All Media - just ensure sort order is preserved
							currentCollection.props.set({
								orderby: currentOrderby,
								order: currentOrder
							});
						}
						
						// Force a complete reset and re-fetch
						currentCollection.reset();
						currentCollection.more({ remove: false }).then(() => {
							// Remove loading class after content loads
							$attachments.removeClass('vmf-loading');
						}).catch(() => {
							$attachments.removeClass('vmf-loading');
						});
					}
				}}
			/>
			<Popover.Slot />
		</SlotFillProvider>
	);

	// Add the toggle button
	addFolderToggleButton(browser);

	// Listen for media changes (uploads, deletions) to refresh folder counts
	setupMediaChangeListener(browser);
}

/**
 * Setup listener for media changes to refresh folder counts.
 * This ensures folder counts update after any file upload or deletion,
 * including uploads redirected by add-ons like vmfa-rules-engine.
 */
function setupMediaChangeListener(browser) {
	// Avoid duplicate listeners
	if (browser._vmfMediaChangeListenerSetup) {
		return;
	}
	browser._vmfMediaChangeListenerSetup = true;

	// Listen for attachments added (uploads) or removed (deletions) from the collection
	if (browser.collection) {
		browser.collection.on('add', debounceRefresh);
		browser.collection.on('remove', debounceRefresh);
	}

	// Also listen for uploader success events if available
	if (browser.uploader && browser.uploader.uploader) {
		const uploader = browser.uploader.uploader;
		uploader.bind('FileUploaded', debounceRefresh);
	}
}

// Debounce the refresh to avoid multiple rapid calls during batch operations
let mediaChangeRefreshTimeout = null;
function debounceRefresh() {
	if (mediaChangeRefreshTimeout) {
		clearTimeout(mediaChangeRefreshTimeout);
	}
	mediaChangeRefreshTimeout = setTimeout(() => {
		if (window.vmfRefreshFolders) {
			window.vmfRefreshFolders();
		}
		mediaChangeRefreshTimeout = null;
	}, 500); // Wait 500ms after last change before refreshing
}

/**
 * Setup drag and drop for media items in the browser.
 */
function setupDragAndDrop(browser) {
	const $attachments = browser.$el.find('.attachments');
	
	if (!$attachments.length) {
		return;
	}

	// Make existing attachments draggable
	function makeAttachmentsDraggable() {
		$attachments.find('.attachment:not([draggable="true"])').each(function() {
			const $el = jQuery(this);
			$el.attr('draggable', 'true');
			
			// Get attachment ID from data-id attribute
			const id = $el.data('id');
			if (id) {
				$el.data('attachment-id', id);
			}
		});
	}

	// Initial setup
	makeAttachmentsDraggable();

	// Watch for new attachments being added (disconnect any previous observer first)
	const attachmentsEl = $attachments[0];
	if (attachmentsEl && attachmentsEl._vmfoDragObserver) {
		attachmentsEl._vmfoDragObserver.disconnect();
		delete attachmentsEl._vmfoDragObserver;
	}
	const observer = new MutationObserver(makeAttachmentsDraggable);
	observer.observe(attachmentsEl, { childList: true, subtree: true });
	attachmentsEl._vmfoDragObserver = observer;

	// Remove existing handlers to avoid duplicates.
	// Use a plugin-specific namespace to avoid clobbering other plugins.
	$attachments.off('dragstart.vmfo dragend.vmfo');

	// Handle drag start
	$attachments.on('dragstart.vmfo', '.attachment', function(e) {
		// Cancel keyboard move mode if active - mouse drag takes precedence
		if (window.vmfMoveMode && window.vmfMoveMode.isActive()) {
			window.vmfMoveMode.cancel();
		}

		const $attachment = jQuery(this);
		let mediaId = $attachment.data('attachment-id') || $attachment.data('id');
		
		// Try to get ID from aria-label or other attributes
		if (!mediaId) {
			const ariaLabel = $attachment.attr('aria-label');
			if (ariaLabel) {
				const match = ariaLabel.match(/id[:\s]+(\d+)/i);
				if (match) {
					mediaId = parseInt(match[1], 10);
				}
			}
		}

		if (mediaId) {
			e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
				mediaId: mediaId,
				title: $attachment.find('.filename').text() || '',
				thumbnail: $attachment.find('img').attr('src') || ''
			}));
			e.originalEvent.dataTransfer.effectAllowed = 'move';
			$attachment.addClass('vmf-dragging');
			
			// Hide WordPress uploader overlay during internal drag
			document.body.classList.add('vmf-internal-drag');
		}
	});

	$attachments.on('dragend.vmfo', '.attachment', function() {
		jQuery(this).removeClass('vmf-dragging');
		// Re-enable WordPress uploader overlay
		document.body.classList.remove('vmf-internal-drag');
	});

	// Setup keyboard move mode (M key)
	setupKeyboardMoveMode(browser);
}

/**
 * Setup keyboard-accessible move mode for media items.
 * Press M on a focused attachment to pick it up for moving.
 */
function setupKeyboardMoveMode(browser) {
	const $attachments = browser.$el.find('.attachments');
	
	if (!$attachments.length) {
		return;
	}

	// Remove existing handler to avoid duplicates
	$attachments.off('keydown.vmfmove');

	// Handle M key on attachments
	$attachments.on('keydown.vmfmove', '.attachment', function(e) {
		// M key to toggle move mode
		if (e.key === 'm' || e.key === 'M') {
			e.preventDefault();
			e.stopPropagation();
			
			const $attachment = jQuery(this);
			let mediaId = $attachment.data('attachment-id') || $attachment.data('id');
			
			// Try to get ID from aria-label or other attributes
			if (!mediaId) {
				const ariaLabel = $attachment.attr('aria-label');
				if (ariaLabel) {
					const match = ariaLabel.match(/id[:\s]+(\d+)/i);
					if (match) {
						mediaId = parseInt(match[1], 10);
					}
				}
			}

			if (!mediaId) return;

			// Get title from the attachment
			const title = $attachment.find('.filename').text() || 
			              $attachment.attr('aria-label') || 
			              __('Media item', 'virtual-media-folders');

			// Check if move mode is available
			if (window.vmfMoveMode) {
				// Get all selected items if in bulk select mode
				const $selected = $attachments.find('.attachment.selected, .attachment.details');
				
				if ($selected.length > 1 && $selected.is($attachment)) {
					// Multiple items selected - pick up all of them
					const items = [];
					$selected.each(function() {
						const $el = jQuery(this);
						const id = $el.data('attachment-id') || $el.data('id');
						const itemTitle = $el.find('.filename').text() || 
						                  $el.attr('aria-label') || 
						                  __('Media item', 'virtual-media-folders');
						if (id) {
							items.push({ id, title: itemTitle });
						}
					});
					window.vmfMoveMode.toggle(items);
				} else {
					// Single item
					window.vmfMoveMode.toggle([{ id: mediaId, title }]);
				}
			}
		}
		
		// Escape to cancel move mode
		if (e.key === 'Escape' && window.vmfMoveMode && window.vmfMoveMode.isActive()) {
			e.preventDefault();
			window.vmfMoveMode.cancel();
		}
	});

	// Also listen at document level for Escape to cancel
	jQuery(document).off('keydown.vmfmovecancel').on('keydown.vmfmovecancel', function(e) {
		if (e.key === 'Escape' && window.vmfMoveMode && window.vmfMoveMode.isActive()) {
			e.preventDefault();
			window.vmfMoveMode.cancel();
		}
	});
}

/**
 * Initialize folder tree in the Grid view's AttachmentsBrowser.
 */
function initFolderTree() {
	if (typeof wp === 'undefined' || typeof wp.media === 'undefined') {
		return;
	}

	// Override the render method to inject our folder tree
	const originalRender = wp.media.view.AttachmentsBrowser.prototype.render;
	
	wp.media.view.AttachmentsBrowser.prototype.render = function() {
		const result = originalRender.apply(this, arguments);
		
		// Inject folder tree after render
		injectFolderTree(this);
		
		return result;
	};
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initFolderTree);
} else {
	initFolderTree();
}

export { initFolderTree };
