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
 * Global function to hide folder view - can be called from anywhere
 */
function hideFolderView() {
	folderViewActive = false;
	localStorage.setItem('vmf_folder_view', '0');
	
	const $container = jQuery('#vmf-folder-tree');
	const $toggle = jQuery('.vmf-folder-toggle-button');
	
	$container.removeClass('is-visible');
	$toggle.removeClass('is-active');
	document.body.classList.remove('vmf-folder-view-active');
	jQuery('.attachments-browser').removeClass('vmf-sidebar-visible');
}

// Listen for clicks on view switcher at document level (before page load completes)
jQuery(document).on('click', '.view-switch a', function() {
	hideFolderView();
});

// When "Add Media File" button is clicked while a folder is selected, switch to All Media
jQuery(document).on('click', '.page-title-action', function() {
	// Check if a folder is currently selected (not All Media)
	if (jQuery('.attachments-browser').hasClass('vmf-folder-filtered')) {
		// Select All Media via the global function
		if (typeof window.vmfSelectFolder === 'function') {
			window.vmfSelectFolder(null);
		}
	}
});

/**
 * Add folder toggle button to the view switcher (independent of browser).
 * This ensures the button appears on both grid and list views.
 */
function addFolderToggleButtonToPage() {
	// Check if folder view should be active on load
	// Priority: URL params > localStorage > default (false)
	const savedPref = localStorage.getItem('vmf_folder_view');
	const urlParams = new URLSearchParams(window.location.search);
	
	let shouldBeActive = urlParams.has('vmf_folder') || urlParams.get('mode') === 'folder';
	if (!shouldBeActive && savedPref !== null) {
		// Use localStorage if set
		shouldBeActive = savedPref === '1';
	}
	// If no URL params and no localStorage, default to hidden (shouldBeActive stays false)
	
	// If button already exists, just update its state
	const $existingButton = jQuery('.vmf-folder-toggle-button');
	if ($existingButton.length) {
		if (shouldBeActive) {
			$existingButton.addClass('is-active');
		}
		return;
	}
	
	// Folder icon SVG - using a bolder folder-like icon
	const folderIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7.5l-2-2H4z"/></svg>`;
	
	// Find the view switcher - it's in the page header area on upload.php
	const $viewSwitcher = jQuery('.view-switch');
	
	if ($viewSwitcher.length) {
		const $button = jQuery(`
			<a href="#" class="vmf-folder-toggle-button${shouldBeActive ? ' is-active' : ''}" title="${__('Show Folders', 'virtual-media-folders')}">
				<span class="screen-reader-text">${__('Show Folders', 'virtual-media-folders')}</span>
				${folderIcon}
			</a>
		`);
		
		// Insert BEFORE the view-switch so it's always first: [Folder] [List] [Grid]
		$viewSwitcher.before($button);
		
		// Folder button click - only works in grid mode, navigates to grid mode if in list
		$button.on('click', (e) => {
			e.preventDefault();
			
			// Check if we're in list mode (URL has mode=list)
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.get('mode') === 'list') {
				// Navigate to grid mode with folder view enabled
				localStorage.setItem('vmf_folder_view', '1');
				window.location.href = window.location.pathname + '?mode=grid';
				return;
			}
			
			// We're in grid mode - toggle folder view on
			if (currentBrowser) {
				toggleFolderView(currentBrowser, true);
			} else {
				// Set preference, will be applied when browser renders
				localStorage.setItem('vmf_folder_view', '1');
				folderViewActive = true;
				$button.addClass('is-active');
			}
		});
	}
}

// Add button on DOM ready
jQuery(document).ready(function() {
	addFolderToggleButtonToPage();
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

	const formData = new FormData();
	formData.append('action', 'vmf_move_to_folder');
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
			// Refresh the folder counts
			if (window.vmfRefreshFolders) {
				window.vmfRefreshFolders();
			}
			// Refresh the media library view
			refreshMediaLibrary();
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

/**
 * Show a temporary notice.
 */
function showNotice(message, type = 'success') {
	const notice = document.createElement('div');
	notice.className = `notice notice-${type} vmf-notice is-dismissible`;
	notice.innerHTML = `<p>${message}</p>`;
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
		
		const adminBarHeight = 32;
		let ticking = false;
		
		// Get the offset from wrapper top to attachments grid
		function getContentOffset() {
			// Use the attachments container offsetTop plus padding/margin adjustments
			const style = window.getComputedStyle(attachments);
			const paddingTop = parseInt(style.paddingTop, 10) || 0;
			
			// Grid items have spacing that's not captured by margin (could be gap or padding)
			// Add 8px to align sidebar with actual image top
			const gridSpacing = 8;
			
			return (attachments.offsetTop || 0) + paddingTop + gridSpacing;
		}
		
		// Cache initial offset
		let initialOffset = getContentOffset();
		
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
				setTimeout(recalculateOffset, 50);
			});
			observer.observe(uploaderInline, { 
				attributes: true, 
				attributeFilter: ['style', 'class'] 
			});
		}
		
		function updateSidebarPosition() {
			// Get current scroll-aware position of attachments
			const attachmentsRect = attachments.getBoundingClientRect();
			const attachmentsTop = attachmentsRect.top;
			const wrapperRect = attachmentsWrapper.getBoundingClientRect();
			
			// Target position: just below admin bar
			const targetTop = adminBarHeight;
			
			if (attachmentsTop >= targetTop) {
				// Attachments haven't scrolled past the admin bar yet
				// Position sidebar at the attachments level using stable offset
				sidebar.style.position = 'absolute';
				sidebar.style.top = '0';
				sidebar.style.left = '0';
				sidebar.style.transform = `translateY(${initialOffset}px)`;
			} else {
				// Attachments have scrolled past - make sidebar fixed at admin bar
				sidebar.style.position = 'fixed';
				sidebar.style.top = `${adminBarHeight}px`;
				sidebar.style.left = `${wrapperRect.left}px`;
				sidebar.style.transform = 'translateY(0)';
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
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
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
	} else {
		$container.removeClass('is-visible');
		$toggle.removeClass('is-active');
		document.body.classList.remove('vmf-folder-view-active');
		// Remove the class
		browser.$el.removeClass('vmf-sidebar-visible');
		// Restore 'current' class to grid icon (we're in grid mode)
		jQuery('.view-switch a.view-grid').addClass('current');
	}
	
	// Save preference
	localStorage.setItem('vmf_folder_view', show ? '1' : '0');
}

/**
 * Add folder toggle button to the view switcher.
 * Now just sets up the browser reference and applies saved preferences,
 * since the button is already added by addFolderToggleButtonToPage().
 */
function addFolderToggleButton(browser) {
	// Store the browser reference for later use
	currentBrowser = browser;
	
	// If button doesn't exist yet (fallback), add it to the media toolbar
	if (!jQuery('.vmf-folder-toggle-button').length) {
		// Folder icon SVG - bold folder icon
		const folderIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7.5l-2-2H4z"/></svg>`;
		
		const $toolbar = browser.$el.find('.media-toolbar-secondary');
		if ($toolbar.length) {
			const $button = jQuery(`
				<button type="button" class="vmf-folder-toggle-button" title="${__('Show Folders', 'virtual-media-folders')}">
					<span class="screen-reader-text">${__('Show Folders', 'virtual-media-folders')}</span>
					${folderIcon}
				</button>
			`);
			
			$toolbar.prepend($button);
			
			$button.on('click', (e) => {
				e.preventDefault();
				toggleFolderView(browser, true);
			});
		}
	}
	
	// Check saved preference or URL param and apply
	const savedPref = localStorage.getItem('vmf_folder_view');
	const urlParams = new URLSearchParams(window.location.search);
	if (savedPref === '1' || urlParams.has('vmf_folder') || urlParams.get('mode') === 'folder') {
		toggleFolderView(browser, true);
	}
}

/**
 * Inject folder tree into an AttachmentsBrowser instance.
 */
function injectFolderTree(browser) {
	// Check if sidebar already exists in this browser
	if (browser.$el.find('#vmf-folder-tree').length) {
		return;
	}

	// Check if sidebar exists elsewhere (orphaned from previous browser render)
	const existingSidebar = document.getElementById('vmf-folder-tree');
	
	// Check if folder view should be active
	const savedPref = localStorage.getItem('vmf_folder_view');
	const urlParams = new URLSearchParams(window.location.search);
	const shouldBeVisible = savedPref === '1' || urlParams.has('vmf_folder') || urlParams.get('mode') === 'folder' || folderViewActive;

	// Find the best insertion point - we want the sidebar next to attachments,
	// not overlapping the uploader
	const $attachmentsWrapper = browser.$el.find('.attachments-wrapper').first();
	const $attachmentsBrowser = browser.$el;
	
	let container;
	
	if (existingSidebar) {
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
		return; // Don't recreate the React root
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
						url.searchParams.set('vmf_folder', folderId);
					} else {
						url.searchParams.delete('vmf_folder');
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
						currentCollection.props.unset('media_folder');
						currentCollection.props.unset('media_folder_exclude');

						// Set the new filter while preserving sort order
						if (folderId === 'uncategorized') {
							currentCollection.props.set({ 
								media_folder_exclude: 'all',
								orderby: currentOrderby,
								order: currentOrder
							});
						} else if (folderId) {
							currentCollection.props.set({ 
								media_folder: folderId,
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

	// Watch for new attachments being added
	const observer = new MutationObserver(makeAttachmentsDraggable);
	observer.observe($attachments[0], { childList: true, subtree: true });

	// Remove existing handlers to avoid duplicates
	$attachments.off('dragstart.mm dragend.mm');

	// Handle drag start
	$attachments.on('dragstart.mm', '.attachment', function(e) {
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

	$attachments.on('dragend.mm', '.attachment', function() {
		jQuery(this).removeClass('vmf-dragging');
		// Re-enable WordPress uploader overlay
		document.body.classList.remove('vmf-internal-drag');
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
