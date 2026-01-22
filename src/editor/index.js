/**
 * Gutenberg Editor Integration for Virtual Media Folders.
 *
 * Entry point for block editor integration, including:
 * - Media library folder filtering via sidebar
 * - Enhanced MediaUpload component
 */

import { createRoot, createElement } from '@wordpress/element';
import FolderSidebar from './components/FolderSidebar.jsx';
import './styles/editor.css';

/**
 * Setup sticky sidebar behavior for Gutenberg media modal.
 * Makes the sidebar stay fixed when scrolling through attachments.
 * Returns a cleanup function to remove event listeners.
 */
function setupStickySidebar(browser, sidebarContainer) {
	const $attachmentsWrapper = browser.$el.find('.attachments-wrapper').first();
	const $attachments = browser.$el.find('.attachments').first();
	
	if (!$attachmentsWrapper.length || !$attachments.length) {
		return () => {}; // Return no-op cleanup
	}
	
	const attachmentsWrapper = $attachmentsWrapper[0];
	
	// The scrolling happens inside attachments-wrapper
	// We need to make sidebar fixed relative to viewport when user scrolls
	let isFixed = false;
	
	function updateSidebarPosition() {
		const wrapperRect = attachmentsWrapper.getBoundingClientRect();
		const scrollTop = attachmentsWrapper.scrollTop;
		
		// If we've scrolled down at all, make sidebar fixed
		const shouldBeFixed = scrollTop > 0;
		
		if (shouldBeFixed && !isFixed) {
			sidebarContainer.style.position = 'fixed';
			sidebarContainer.style.top = `${wrapperRect.top}px`;
			sidebarContainer.style.left = `${wrapperRect.left}px`;
			sidebarContainer.style.height = `${wrapperRect.height}px`;
			sidebarContainer.style.width = '220px';
			sidebarContainer.style.zIndex = '100';
			isFixed = true;
		} else if (!shouldBeFixed && isFixed) {
			sidebarContainer.style.position = 'absolute';
			sidebarContainer.style.top = '0';
			sidebarContainer.style.left = '0';
			sidebarContainer.style.height = '100%';
			sidebarContainer.style.width = '';
			sidebarContainer.style.zIndex = '';
			isFixed = false;
		} else if (isFixed) {
			// Update position in case modal moved
			sidebarContainer.style.top = `${wrapperRect.top}px`;
			sidebarContainer.style.left = `${wrapperRect.left}px`;
			sidebarContainer.style.height = `${wrapperRect.height}px`;
		}
	}
	
	// Named handlers for proper cleanup
	function onScroll() {
		requestAnimationFrame(updateSidebarPosition);
	}
	
	// Listen to scroll on attachments-wrapper
	attachmentsWrapper.addEventListener('scroll', onScroll, { passive: true });
	
	// Also update on resize
	window.addEventListener('resize', updateSidebarPosition, { passive: true });
	
	// Initial check
	setTimeout(updateSidebarPosition, 100);
	
	// Store cleanup function on sidebar container for later use
	sidebarContainer._cleanupSticky = () => {
		attachmentsWrapper.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', updateSidebarPosition);
	};
	
	return sidebarContainer._cleanupSticky;
}

/**
 * Initialize Gutenberg integration.
 */
function initGutenbergIntegration() {
	// Wait for wp.media to be fully available
	if (!window.wp?.media?.view?.AttachmentsBrowser) {
		// Retry after a short delay
		setTimeout(initGutenbergIntegration, 100);
		return;
	}

	// Extend AttachmentsBrowser to add folder sidebar in block editor media modals
	const originalRender = wp.media.view.AttachmentsBrowser.prototype.render;

	wp.media.view.AttachmentsBrowser.prototype.render = function () {
		originalRender.apply(this, arguments);

		// Only add sidebar if not already present
		if (!this.$el.find('.vmf-editor-folder-sidebar').length) {
			// Find the attachments container
			const $attachmentsWrapper = this.$el.find('.attachments-wrapper').first();
			const $attachments = this.$el.find('.attachments').first();
			
			if ($attachmentsWrapper.length || $attachments.length) {
				const sidebarContainer = document.createElement('div');
				sidebarContainer.className = 'vmf-editor-folder-sidebar';
				
				// Insert at the beginning of attachments-wrapper
				if ($attachmentsWrapper.length) {
					$attachmentsWrapper.prepend(sidebarContainer);
				} else {
					$attachments.before(sidebarContainer);
				}

				const collection = this.collection;
				const browser = this;

				const root = createRoot(sidebarContainer);
				root.render(
					createElement(FolderSidebar, {
						onFolderSelect: (folderId) => {
							if (!collection) return;

							// Add loading state
							const $attachmentsEl = browser.$el.find('.attachments');
							$attachmentsEl.addClass('vmf-loading');
							
							// Hide/show uploader based on folder selection
							if (folderId !== null) {
								browser.$el.addClass('vmf-folder-filtered');
							} else {
								browser.$el.removeClass('vmf-folder-filtered');
							}

							// Reset existing filters
							collection.props.unset('vmfo_folder');
							collection.props.unset('vmfo_folder_exclude');

							if (folderId === 'uncategorized') {
								collection.props.set({ vmfo_folder_exclude: 'all' });
							} else if (folderId && folderId !== '') {
								collection.props.set({ vmfo_folder: parseInt(folderId, 10) });
							}
							// null = All Media, no filter needed
							
							// Refresh the collection
							collection.reset();
							collection.more({ remove: false }).then(() => {
								$attachmentsEl.removeClass('vmf-loading');
							}).catch(() => {
								$attachmentsEl.removeClass('vmf-loading');
							});
						},
					})
				);
				
				// Add class to browser for CSS styling
				this.$el.addClass('vmf-has-folder-sidebar');
				
				// Setup sticky sidebar behavior
				setupStickySidebar(this, sidebarContainer);
			}
		}

		return this;
	};
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initGutenbergIntegration);
} else {
	initGutenbergIntegration();
}

export { initGutenbergIntegration };
