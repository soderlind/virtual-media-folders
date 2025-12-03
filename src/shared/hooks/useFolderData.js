/**
 * Shared hook for fetching and managing folder data.
 *
 * Used by both Media Library FolderTree and Gutenberg FolderSidebar.
 * Supports filtering counts by media type to match WordPress filter dropdown.
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
 * Normalize media type for WordPress REST API.
 * WordPress media_type parameter only accepts: image, video, audio, application, text
 * Complex MIME type strings need to be simplified.
 *
 * @param {string} mediaType The media type from the filter dropdown.
 * @return {string} Normalized media type for API calls.
 */
function normalizeMediaType(mediaType) {
	if (!mediaType || mediaType === 'all') {
		return '';
	}
	
	// If it contains commas or slashes, it's a complex MIME type list
	// Extract the base type (e.g., 'application' from 'application/pdf,application/msword')
	if (mediaType.includes('/') || mediaType.includes(',')) {
		const firstType = mediaType.split(',')[0].split('/')[0];
		// Only return valid WordPress media_type values
		if (['image', 'video', 'audio', 'application', 'text'].includes(firstType)) {
			return firstType;
		}
		return '';
	}
	
	return mediaType;
}

/**
 * Custom hook for fetching folder data.
 *
 * @param {Object} options Hook options.
 * @param {boolean} options.trackUrl Whether to sync with URL params (admin only).
 * @param {Function} options.onFolderSelect Callback when folder selection changes.
 * @param {string} options.mediaType Filter counts by media type (e.g., 'image', 'audio', 'video').
 * @return {Object} Folder data and state.
 */
export default function useFolderData({ trackUrl = false, onFolderSelect, mediaType = '' } = {}) {
	const [folders, setFolders] = useState([]);
	const [flatFolders, setFlatFolders] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [uncategorizedCount, setUncategorizedCount] = useState(0);

	/**
	 * Fetch folders from REST API with optional media type filtering.
	 */
	const fetchFolders = useCallback(async (typeFilter = mediaType) => {
		try {
			// Fetch folders from standard endpoint
			const response = await apiFetch({
				path: '/wp/v2/media-folders?per_page=100&hierarchical=1',
			});

			// If media type filter is applied, fetch filtered counts from our custom endpoint
			let filteredCounts = null;
			if (typeFilter) {
				filteredCounts = await apiFetch({
					path: `/mediamanager/v1/folders/counts?media_type=${encodeURIComponent(typeFilter)}`,
				});
			}

			// Apply filtered counts to folders
			const foldersWithCounts = response.map((folder) => ({
				...folder,
				count: filteredCounts ? (filteredCounts[folder.id] || 0) : folder.count,
			}));

			// Store flat list for manager components
			setFlatFolders(foldersWithCounts);

			// Build tree structure
			const tree = buildTree(foldersWithCounts);
			setFolders(tree);

			// Fetch total media count to calculate uncategorized
			// Normalize media type for WP REST API (only accepts simple types)
			const normalizedType = normalizeMediaType(typeFilter);
			let mediaPath = '/wp/v2/media?per_page=1';
			if (normalizedType) {
				mediaPath += `&media_type=${encodeURIComponent(normalizedType)}`;
			}
			
			const totalResponse = await apiFetch({ path: mediaPath, parse: false });
			const totalCount = parseInt(totalResponse.headers.get('X-WP-Total'), 10) || 0;

			// Calculate uncategorized as total minus sum of folder counts
			let categorizedCount = 0;
			foldersWithCounts.forEach((folder) => {
				categorizedCount += folder.count || 0;
			});

			// Account for items in multiple folders (use max of 0)
			setUncategorizedCount(Math.max(0, totalCount - categorizedCount));
		} catch (error) {
			console.error('Error fetching folders:', error);
		} finally {
			setLoading(false);
		}
	}, [mediaType]);

	useEffect(() => {
		// Get initial folder from URL (admin only)
		if (trackUrl) {
			const params = new URLSearchParams(window.location.search);
			const urlFolder = params.get('vmf_folder');
			const urlMode = params.get('mode');
			
			if (urlFolder) {
				setSelectedId(urlFolder === 'uncategorized' ? 'uncategorized' : parseInt(urlFolder, 10));
			} else if (urlMode === 'folder') {
				// mode=folder without specific folder means show folder view but no folder selected
				setSelectedId(null);
			}
		}

		fetchFolders();
	}, [fetchFolders, trackUrl]);

	// Re-fetch when media type changes
	useEffect(() => {
		if (mediaType !== undefined) {
			fetchFolders(mediaType);
		}
	}, [mediaType, fetchFolders]);

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
