/**
 * BulkFolderAction component.
 *
 * Provides a dropdown to assign multiple selected media items to a folder.
 * The folder list is dynamically updated when folders are added/deleted.
 */

import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { fetchAllFolders, getCachedFolders } from '../../shared/utils/folderApi';

/**
 * Sort folders by vmfo_order (if present) then by name.
 *
 * @param {Array} folderList Array of folder objects.
 * @return {Array} Sorted array.
 */
function sortFolders(folderList) {
	return [...folderList].sort((a, b) => {
		const orderA = a.vmfo_order;
		const orderB = b.vmfo_order;
		// If both have custom order, use it
		if (orderA !== undefined && orderA !== null && orderB !== undefined && orderB !== null) {
			return orderA - orderB;
		}
		// If only one has order, it comes first
		if (orderA !== undefined && orderA !== null) return -1;
		if (orderB !== undefined && orderB !== null) return 1;
		// Neither has order, sort by name
		return a.name.localeCompare(b.name);
	});
}

/**
 * Build hierarchical tree from flat folder list and flatten for dropdown.
 * Returns folders in tree order with depth info for indentation.
 *
 * @param {Array} folders Flat array of folder objects.
 * @return {Array} Flattened tree-ordered array with depth property.
 */
function buildFlattenedTree(folders) {
	const sorted = sortFolders(folders);
	const map = {};
	const roots = [];

	// Create map
	sorted.forEach((folder) => {
		map[folder.id] = { ...folder, children: [], depth: 0 };
	});

	// Build tree
	sorted.forEach((folder) => {
		if (folder.parent && map[folder.parent]) {
			map[folder.parent].children.push(map[folder.id]);
		} else {
			roots.push(map[folder.id]);
		}
	});

	// Sort children at each level
	function sortChildren(items) {
		items.sort((a, b) => {
			const orderA = a.vmfo_order;
			const orderB = b.vmfo_order;
			if (orderA !== undefined && orderA !== null && orderB !== undefined && orderB !== null) {
				return orderA - orderB;
			}
			if (orderA !== undefined && orderA !== null) return -1;
			if (orderB !== undefined && orderB !== null) return 1;
			return a.name.localeCompare(b.name);
		});
		items.forEach((item) => {
			if (item.children.length > 0) {
				sortChildren(item.children);
			}
		});
	}
	sortChildren(roots);

	// Flatten tree in order with depth
	const result = [];
	function flatten(items, depth) {
		items.forEach((item) => {
			result.push({ ...item, depth });
			if (item.children.length > 0) {
				flatten(item.children, depth + 1);
			}
		});
	}
	flatten(roots, 0);

	return result;
}

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

	// Fetch folders function with optimistic loading
	const fetchFolders = useCallback(async () => {
		try {
			// Show cached folders immediately
			const cached = getCachedFolders();
			if (cached && cached.length > 0) {
				setFolders(cached);
			}
			// Fetch fresh data in background
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
		// Just re-read from cache - FolderTree already fetched fresh data
		const handleFolderRefresh = () => {
			const cached = getCachedFolders();
			if (cached && cached.length > 0) {
				setFolders(cached);
			}
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
			// Single bulk request instead of multiple individual requests
			const formData = new FormData();
			formData.append('action', 'vmfo_bulk_move_to_folder');
			formData.append('nonce', nonce);
			formData.append('media_ids', JSON.stringify(mediaIds));
			formData.append('folder_id', selectedFolder);

			const response = await fetch(ajaxUrl, {
				method: 'POST',
				credentials: 'same-origin',
				body: formData,
			});
			const data = await response.json();

			if (data.success) {
				// Show success notice from server response
				showNotice(data.data.message, 'success');
			} else {
				// Show error from server
				showNotice(data.data?.message || __('Failed to move items.', 'virtual-media-folders'), 'error');
			}

			// Check if the current folder will be empty after the move
			const isAllMediaView = !document.querySelector('.attachments-browser')?.classList.contains('vmf-folder-filtered');
			const totalAttachments = document.querySelectorAll('.attachments .attachment').length;
			const willBeEmpty = !isAllMediaView && totalAttachments <= mediaIds.length;

			// Refresh folders and media (await to avoid race condition)
			if (window.vmfRefreshFolders) {
				await window.vmfRefreshFolders();
			}
			
			// Jump to target folder if current folder will be empty after the move
			if (willBeEmpty && window.vmfSelectFolder) {
				const targetFolderId = selectedFolder === 'uncategorized' 
					? 'uncategorized' 
					: parseInt(selectedFolder, 10);
				window.vmfSelectFolder(targetFolderId);
			} else if (!isAllMediaView) {
				// Remove the moved items from the current view
				mediaIds.forEach((id) => {
					const attachment = document.querySelector(`.attachment[data-id="${id}"]`);
					if (attachment) {
						attachment.remove();
					}
				});
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
		const p = document.createElement('p');
		p.textContent = String(message ?? '');
		notice.appendChild(p);
		notice.style.cssText = 'position: fixed; top: 40px; right: 20px; z-index: 100000; max-width: 300px;';
		document.body.appendChild(notice);
		setTimeout(() => notice.remove(), 3000);
	}

	// Build tree-ordered folder list for dropdown
	// This must be called before any early returns to avoid hooks order issues
	const orderedFolders = useMemo(() => buildFlattenedTree(folders), [folders]);

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
				{orderedFolders.map((folder) => (
					<option key={folder.id} value={folder.id}>
						{'—'.repeat(folder.depth) + (folder.depth > 0 ? ' ' : '') + folder.name}
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
