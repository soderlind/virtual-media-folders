/**
 * Shared hook for fetching and managing folder data.
 *
 * Used by both Media Library FolderTree and Gutenberg FolderSidebar.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Build a hierarchical tree from flat taxonomy terms.
 *
 * @param {Array} terms Flat array of term objects with parent property.
 * @return {Array} Nested tree structure.
 */
export function buildTree(terms) {
	const map = {};
	const roots = [];

	// Create map
	terms.forEach((term) => {
		map[term.id] = { ...term, children: [] };
	});

	// Build tree
	terms.forEach((term) => {
		if (term.parent && map[term.parent]) {
			map[term.parent].children.push(map[term.id]);
		} else {
			roots.push(map[term.id]);
		}
	});

	return roots;
}

/**
 * Custom hook for fetching folder data.
 *
 * @param {Object} options Hook options.
 * @param {boolean} options.trackUrl Whether to sync with URL params (admin only).
 * @param {Function} options.onFolderSelect Callback when folder selection changes.
 * @return {Object} Folder data and state.
 */
export default function useFolderData({ trackUrl = false, onFolderSelect } = {}) {
	const [folders, setFolders] = useState([]);
	const [flatFolders, setFlatFolders] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [uncategorizedCount, setUncategorizedCount] = useState(0);

	/**
	 * Fetch folders from REST API.
	 */
	const fetchFolders = useCallback(async () => {
		try {
			const response = await apiFetch({
				path: '/wp/v2/media-folders?per_page=100&hierarchical=1',
			});

			// Store flat list for manager components
			setFlatFolders(response);

			// Build tree structure
			const tree = buildTree(response);
			setFolders(tree);

			// Fetch total media count to calculate uncategorized
			const totalResponse = await apiFetch({ path: '/wp/v2/media?per_page=1', parse: false });
			const totalCount = parseInt(totalResponse.headers.get('X-WP-Total'), 10) || 0;

			// Calculate uncategorized as total minus sum of folder counts
			let categorizedCount = 0;
			response.forEach((folder) => {
				categorizedCount += folder.count || 0;
			});

			// Account for items in multiple folders (use max of 0)
			setUncategorizedCount(Math.max(0, totalCount - categorizedCount));
		} catch (error) {
			console.error('Error fetching folders:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		// Get initial folder from URL (admin only)
		if (trackUrl) {
			const params = new URLSearchParams(window.location.search);
			const urlFolder = params.get('mm_folder');
			if (urlFolder) {
				setSelectedId(urlFolder === 'uncategorized' ? 'uncategorized' : parseInt(urlFolder, 10));
			}
		}

		fetchFolders();
	}, [fetchFolders, trackUrl]);

	/**
	 * Handle folder selection.
	 *
	 * @param {number|string|null} folderId The folder ID to select.
	 */
	const handleSelect = useCallback((folderId) => {
		setSelectedId(folderId);
		onFolderSelect?.(folderId);
	}, [onFolderSelect]);

	return {
		folders,
		flatFolders,
		selectedId,
		setSelectedId,
		loading,
		uncategorizedCount,
		fetchFolders,
		handleSelect,
	};
}
