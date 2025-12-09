/**
 * BulkFolderAction component.
 *
 * Provides a dropdown to assign multiple selected media items to a folder.
 * The folder list is dynamically updated when folders are added/deleted.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { fetchAllFolders } from '../../shared/utils/folderApi';

/**
 * BulkFolderAction component.
 *
 * @param {Object}   props
 * @param {Function} props.onComplete Called after bulk action completes.
 */
export default function BulkFolderAction({ onComplete }) {
	const [folders, setFolders] = useState([]);
	const [selectedFolder, setSelectedFolder] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [selectedCount, setSelectedCount] = useState(0);

	// Fetch folders function
	const fetchFolders = useCallback(async () => {
		try {
			const response = await fetchAllFolders();
			setFolders(response);
		} catch (error) {
			console.error('Error fetching folders:', error);
		}
	}, []);

	// Fetch folders on mount and listen for refresh events
	useEffect(() => {
		fetchFolders();

		// Listen for custom folder refresh event
		const handleFolderRefresh = () => {
			fetchFolders();
		};

		window.addEventListener('vmf:folders-updated', handleFolderRefresh);

		return () => {
			window.removeEventListener('vmf:folders-updated', handleFolderRefresh);
		};
	}, [fetchFolders]);

	// Track selected media count
	useEffect(() => {
		function updateSelectedCount() {
			const selected = document.querySelectorAll('.attachment.selected, .attachment.details');
			setSelectedCount(selected.length);
		}

		// Initial count
		updateSelectedCount();

		// Watch for selection changes
		const observer = new MutationObserver(updateSelectedCount);
		const attachments = document.querySelector('.attachments');
		if (attachments) {
			observer.observe(attachments, {
				attributes: true,
				attributeFilter: ['class'],
				subtree: true,
			});
		}

		// Also listen for clicks
		document.addEventListener('click', updateSelectedCount);

		return () => {
			observer.disconnect();
			document.removeEventListener('click', updateSelectedCount);
		};
	}, []);

	/**
	 * Get selected media IDs from the grid.
	 */
	function getSelectedMediaIds() {
		const selected = document.querySelectorAll('.attachment.selected, .attachment.details');
		const ids = [];
		selected.forEach((el) => {
			const id = el.getAttribute('data-id');
			if (id) {
				ids.push(parseInt(id, 10));
			}
		});
		return ids;
	}

	/**
	 * Handle bulk move action.
	 */
	async function handleBulkMove() {
		if (!selectedFolder) {
			return;
		}

		const mediaIds = getSelectedMediaIds();
		if (mediaIds.length === 0) {
			return;
		}

		setIsProcessing(true);

		const { ajaxUrl, nonce } = window.vmfData || {};

		try {
			// Process each media item
			const promises = mediaIds.map(async (mediaId) => {
				const formData = new FormData();
				formData.append('action', 'vmf_move_to_folder');
				formData.append('nonce', nonce);
				formData.append('media_id', mediaId);
				formData.append('folder_id', selectedFolder);

				const response = await fetch(ajaxUrl, {
					method: 'POST',
					credentials: 'same-origin',
					body: formData,
				});
				return response.json();
			});

			await Promise.all(promises);

			// Show success notice
			const folderName = selectedFolder === 'uncategorized'
				? __('Uncategorized', 'virtual-media-folders')
				: folders.find(f => f.id === parseInt(selectedFolder, 10))?.name || '';

			showNotice(
				sprintf(
					/* translators: 1: number of items, 2: folder name */
					__('%1$d items moved to "%2$s".', 'virtual-media-folders'),
					mediaIds.length,
					folderName
				),
				'success'
			);

			// Refresh folders and media
			if (window.vmfRefreshFolders) {
				window.vmfRefreshFolders();
			}
			
			// Select the target folder to show moved items (if setting is enabled)
			const { jumpToFolderAfterMove = false } = window.vmfData || {};
			if (jumpToFolderAfterMove) {
				// Delay to ensure refresh completes
				setTimeout(() => {
					if (window.vmfSelectFolder) {
						const targetFolderId = selectedFolder === 'uncategorized' 
							? 'uncategorized' 
							: parseInt(selectedFolder, 10);
						window.vmfSelectFolder(targetFolderId);
					}
				}, 200);
			} else {
				// When not jumping to folder, remove the moved items from the current view
				// BUT only if we're not in "All Media" view (All Media shows all items regardless of folder)
				const isAllMediaView = !document.querySelector('.attachments-browser')?.classList.contains('vmf-folder-filtered');
				if (!isAllMediaView) {
					mediaIds.forEach((id) => {
						const attachment = document.querySelector(`.attachment[data-id="${id}"]`);
						if (attachment) {
							attachment.remove();
						}
					});
				}
			}
			
			// Disable bulk select mode by triggering WordPress media library's bulk select toggle
			const bulkSelectButton = document.querySelector('.select-mode-toggle-button');
			if (bulkSelectButton) {
				bulkSelectButton.click();
			}
			
			onComplete?.();
		} catch (error) {
			console.error('Bulk move error:', error);
			showNotice(__('Failed to move some items.', 'virtual-media-folders'), 'error');
		} finally {
			setIsProcessing(false);
			setSelectedFolder('');
		}
	}

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

	if (selectedCount === 0) {
		return null;
	}

	return (
		<div className="vmf-bulk-folder-action">
			<select
				value={selectedFolder}
				onChange={(e) => setSelectedFolder(e.target.value)}
				disabled={isProcessing}
				className="vmf-bulk-folder-select"
			>
				<option value="">{__('Move to folder…', 'virtual-media-folders')}</option>
				<option value="uncategorized">{__('Uncategorized', 'virtual-media-folders')}</option>
				{folders.map((folder) => (
					<option key={folder.id} value={folder.id}>
						{folder.name}
					</option>
				))}
			</select>
			<button
				type="button"
				className="button vmf-bulk-folder-apply"
				onClick={handleBulkMove}
				disabled={!selectedFolder || isProcessing}
				title={isProcessing ? __('Moving…', 'virtual-media-folders') : __('Apply', 'virtual-media-folders')}
				aria-label={isProcessing ? __('Moving…', 'virtual-media-folders') : __('Apply', 'virtual-media-folders')}
			>
				{isProcessing ? (
					<span className="spinner is-active" style={{ margin: 0 }} />
				) : (
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
						<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
					</svg>
				)}
			</button>
			<span className="vmf-bulk-folder-count">
				{sprintf(
					/* translators: %d: number of selected items */
					__('%d selected', 'virtual-media-folders'),
					selectedCount
				)}
			</span>
		</div>
	);
}
