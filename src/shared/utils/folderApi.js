/**
 * Shared folder API helpers.
 */

import apiFetch from '@wordpress/api-fetch';

export async function fetchAllFolders() {
	return apiFetch({
		path: '/wp/v2/media-folders?per_page=100',
	});
}
