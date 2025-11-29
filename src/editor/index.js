/**
 * Gutenberg Editor Integration for Media Manager.
 *
 * Entry point for block editor integration, including:
 * - Media library folder filtering via sidebar
 * - Enhanced MediaUpload component
 */

import { createRoot, createElement } from '@wordpress/element';
import FolderSidebar from './components/FolderSidebar.jsx';
import './styles/editor.css';

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
		if (!this.$el.find('.mm-editor-folder-sidebar').length) {
			// Find the attachments container
			const $attachmentsWrapper = this.$el.find('.attachments-wrapper').first();
			const $attachments = this.$el.find('.attachments').first();
			
			if ($attachmentsWrapper.length || $attachments.length) {
				const sidebarContainer = document.createElement('div');
				sidebarContainer.className = 'mm-editor-folder-sidebar';
				
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
							$attachmentsEl.addClass('mm-loading');
							
							// Hide/show uploader based on folder selection
							if (folderId !== null) {
								browser.$el.addClass('mm-folder-filtered');
							} else {
								browser.$el.removeClass('mm-folder-filtered');
							}

							// Reset existing filters
							collection.props.unset('media_folder');
							collection.props.unset('media_folder_exclude');

							if (folderId === 'uncategorized') {
								collection.props.set({ media_folder_exclude: 'all' });
							} else if (folderId && folderId !== '') {
								collection.props.set({ media_folder: parseInt(folderId, 10) });
							}
							// null = All Media, no filter needed
							
							// Refresh the collection
							collection.reset();
							collection.more({ remove: false }).then(() => {
								$attachmentsEl.removeClass('mm-loading');
							}).catch(() => {
								$attachmentsEl.removeClass('mm-loading');
							});
						},
					})
				);
				
				// Add class to browser for CSS styling
				this.$el.addClass('mm-has-folder-sidebar');
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
