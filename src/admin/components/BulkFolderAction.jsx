/**
 * BulkFolderAction component.
 *
 * Provides a dropdown to assign multiple selected media items to a folder.
 */

import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

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

	// Fetch folders
	useEffect(() => {
		async function fetchFolders() {
			try {
				const response = await apiFetch({
					path: '/wp/v2/media-folders?per_page=100',
				});
				setFolders(response);
			} catch (error) {
				console.error('Error fetching folders:', error);
			}
		}
		fetchFolders();
	}, []);

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

		const { ajaxUrl, nonce } = window.mediaManagerData || {};

		try {
			// Process each media item
			const promises = mediaIds.map(async (mediaId) => {
				const formData = new FormData();
				formData.append('action', 'mm_move_to_folder');
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
				? __('Uncategorized', 'mediamanager')
				: folders.find(f => f.id === parseInt(selectedFolder, 10))?.name || '';

			showNotice(
				sprintf(
					/* translators: 1: number of items, 2: folder name */
					__('%1$d items moved to "%2$s".', 'mediamanager'),
					mediaIds.length,
					folderName
				),
				'success'
			);

			// Refresh folders and media
			if (window.mediaManagerRefreshFolders) {
				window.mediaManagerRefreshFolders();
			}
			onComplete?.();
		} catch (error) {
			console.error('Bulk move error:', error);
			showNotice(__('Failed to move some items.', 'mediamanager'), 'error');
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
		notice.className = `notice notice-${type} mm-notice is-dismissible`;
		notice.innerHTML = `<p>${message}</p>`;
		notice.style.cssText = 'position: fixed; top: 40px; right: 20px; z-index: 100000; max-width: 300px;';
		document.body.appendChild(notice);
		setTimeout(() => notice.remove(), 3000);
	}

	if (selectedCount === 0) {
		return null;
	}

	return (
		<div className="mm-bulk-folder-action">
			<select
				value={selectedFolder}
				onChange={(e) => setSelectedFolder(e.target.value)}
				disabled={isProcessing}
				className="mm-bulk-folder-select"
			>
				<option value="">{__('Move to folder…', 'mediamanager')}</option>
				<option value="uncategorized">{__('Uncategorized', 'mediamanager')}</option>
				{folders.map((folder) => (
					<option key={folder.id} value={folder.id}>
						{folder.name}
					</option>
				))}
			</select>
			<button
				type="button"
				className="button mm-bulk-folder-apply"
				onClick={handleBulkMove}
				disabled={!selectedFolder || isProcessing}
			>
				{isProcessing ? __('Moving…', 'mediamanager') : __('Apply', 'mediamanager')}
			</button>
			<span className="mm-bulk-folder-count">
				{sprintf(
					/* translators: %d: number of selected items */
					__('%d selected', 'mediamanager'),
					selectedCount
				)}
			</span>
		</div>
	);
}
