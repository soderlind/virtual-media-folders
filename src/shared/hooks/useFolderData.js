/**
 * Shared hook for fetching and managing folder data.
 *
 * Uses optimistic loading: displays cached folders instantly,
 * then fetches fresh data and counts in the background.
 *
 * Used by both Media Library FolderTree and Gutenberg FolderSidebar.
 * Supports filtering counts by media type to match WordPress filter dropdown.
 */

import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	getCachedFolders,
	setCachedFolders,
	foldersEqual,
} from '../utils/folderApi';

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
 * Custom hook for fetching folder data with optimistic loading.
 *
 * Displays cached folders instantly, then fetches fresh data in background.
 * Only updates state if folder structure has changed.
 *
 * @param {Object} options Hook options.
 * @param {boolean} options.trackUrl Whether to sync with URL params (admin only).
 * @param {Function} options.onFolderSelect Callback when folder selection changes.
 * @param {string} options.mediaType Filter counts by media type (e.g., 'image', 'audio', 'video').
 * @param {string|number|null} options.defaultFolder Default folder when no URL param is set.
 * @return {Object} Folder data and state.
 */
export default function useFolderData({ trackUrl = false, onFolderSelect, mediaType = '', defaultFolder = null } = {}) {
	// Initialize with cached/preloaded data for instant render
	const initialFolders = getCachedFolders() || [];
	const initialTree = initialFolders.length > 0 ? buildTree(initialFolders) : [];
	const hasInitialData = initialFolders.length > 0;

	const [folders, setFolders] = useState(initialTree);
	const [flatFolders, setFlatFolders] = useState(initialFolders);
	const [selectedId, setSelectedId] = useState(defaultFolder);
	const [loading, setLoading] = useState(!hasInitialData);
	const [uncategorizedCount, setUncategorizedCount] = useState(0);
	const lastFetchedFolders = useRef(hasInitialData ? initialFolders : null);

	/**
	 * Sort folders by vmfo_order (if present) then by name.
	 */
	const sortFolders = useCallback((folderList) => {
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
	}, []);

	/**
	 * Apply folder data to state (used by both cache and fresh data).
	 */
	const applyFolderData = useCallback((folderList, counts = null) => {
		const sorted = sortFolders(folderList);
		const withCounts = counts
			? sorted.map((f) => ({ ...f, count: counts[f.id] ?? f.count }))
			: sorted;

		setFlatFolders(withCounts);
		setFolders(buildTree(withCounts));
	}, [sortFolders]);

	/**
	 * Fetch uncategorized count in background.
	 */
	const fetchUncategorizedCount = useCallback(async (typeFilter, foldersWithCounts) => {
		try {
			const normalizedType = normalizeMediaType(typeFilter);
			let mediaPath = '/wp/v2/media?per_page=1';
			if (normalizedType) {
				mediaPath += `&media_type=${encodeURIComponent(normalizedType)}`;
			}

			const totalResponse = await apiFetch({ path: mediaPath, parse: false });
			const totalCount = parseInt(totalResponse.headers.get('X-WP-Total'), 10) || 0;

			let categorizedCount = 0;
			foldersWithCounts.forEach((folder) => {
				categorizedCount += folder.count || 0;
			});

			setUncategorizedCount(Math.max(0, totalCount - categorizedCount));
		} catch (error) {
			// Silently fail - uncategorized count is non-critical
		}
	}, []);

	/**
	 * Fetch folders from REST API with optional media type filtering.
	 * Uses optimistic loading: state is already initialized with cached data,
	 * this function refreshes in background and updates if changed.
	 */
	const fetchFolders = useCallback(async (typeFilter = mediaType, forceRefresh = false) => {
		try {
			// Fetch fresh folder structure from custom endpoint
			// This endpoint already includes vmfo_order and is sorted
			const freshFolders = await apiFetch({
				path: '/vmfo/v1/folders',
			});

			// Check if structure changed (deep equality on essential props)
			const structureChanged = forceRefresh || !foldersEqual(lastFetchedFolders.current, freshFolders);

			if (structureChanged) {
				applyFolderData(freshFolders);
				setCachedFolders(freshFolders);
				lastFetchedFolders.current = freshFolders;
			}

			// Fetch filtered counts in background (if media type filter active)
			let finalFolders = freshFolders;
			if (typeFilter) {
				try {
					const filteredCounts = await apiFetch({
						path: `/vmfo/v1/folders/counts?media_type=${encodeURIComponent(typeFilter)}`,
					});
					finalFolders = freshFolders.map((f) => ({
						...f,
						count: filteredCounts[f.id] ?? f.count,
					}));
					applyFolderData(finalFolders);
				} catch (countError) {
					// Use default counts
				}
			}

			// Fetch uncategorized count in background
			fetchUncategorizedCount(typeFilter, finalFolders);
		} catch (error) {
			console.error('Error fetching folders:', error);
		} finally {
			setLoading(false);
		}
	}, [mediaType, applyFolderData, fetchUncategorizedCount]);

	useEffect(() => {
		// Get initial folder from URL (admin only)
		let initialFolder = defaultFolder;
		
		if (trackUrl) {
			const params = new URLSearchParams(window.location.search);
			const urlFolder = params.get('vmf_folder');
			const urlMode = params.get('mode');
			
			if (urlFolder) {
				initialFolder = urlFolder === 'uncategorized' ? 'uncategorized' : parseInt(urlFolder, 10);
				setSelectedId(initialFolder);
			} else if (urlMode === 'folder') {
				// mode=folder without specific folder means use default folder setting
				setSelectedId(defaultFolder);
				initialFolder = defaultFolder;
			}
			// If no URL params, selectedId keeps its initial value (defaultFolder)
		}

		fetchFolders();
		
		// Apply the initial folder filter if it's not "All Media" (null)
		// This ensures the media library is filtered on page load
		if (initialFolder !== null) {
			onFolderSelect?.(initialFolder);
		}
	}, [fetchFolders, trackUrl, defaultFolder, onFolderSelect]);

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
