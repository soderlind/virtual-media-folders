/**
 * Shared folder API helpers with localStorage caching.
 */

import apiFetch from '@wordpress/api-fetch';

const CACHE_KEY = 'vmfo_folders_cache';

/**
 * Get cached folders from localStorage or preloaded vmfData.
 * Preloaded data from PHP is preferred as it's always fresh from the current page load.
 *
 * @return {Array|null} Cached folder array or null if not available.
 */
export function getCachedFolders() {
	// Prefer preloaded data from PHP - it's always fresh for this page load
	if (window.vmfData?.folders) {
		return window.vmfData.folders;
	}

	// Editor context - preloaded data is always fresh
	if (window.vmfEditor?.folders) {
		return window.vmfEditor.folders;
	}

	// Fall back to localStorage cache
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) {
			return JSON.parse(cached);
		}
	} catch (e) {
		// localStorage not available or parse error
	}

	return null;
}

/**
 * Save folders to localStorage cache.
 *
 * @param {Array} folders Folder array to cache.
 */
export function setCachedFolders(folders) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(folders));
	} catch (e) {
		// localStorage not available or quota exceeded
	}
}

/**
 * Clear the folder cache (call on mutations).
 */
export function clearFolderCache() {
	try {
		localStorage.removeItem(CACHE_KEY);
	} catch (e) {
		// localStorage not available
	}
}

/**
 * Deep equality check for folder arrays.
 * Compares only essential properties to detect real changes.
 *
 * @param {Array} a First folder array.
 * @param {Array} b Second folder array.
 * @return {boolean} True if folders are equal.
 */
export function foldersEqual(a, b) {
	if (!a || !b) return false;
	if (a.length !== b.length) return false;

	// Compare serialized essential properties
	const serialize = (folders) =>
		JSON.stringify(
			folders.map((f) => ({
				id: f.id,
				name: f.name,
				parent: f.parent,
				vmfo_order: f.vmfo_order,
			}))
		);

	return serialize(a) === serialize(b);
}

/**
 * Fetch all folders from REST API.
 * Uses custom endpoint which returns folders sorted by vmfo_order.
 *
 * @return {Promise<Array>} Folder array.
 */
export async function fetchAllFolders() {
	return apiFetch({
		path: '/vmfo/v1/folders',
	});
}
