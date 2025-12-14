/**
 * Enhanced MediaUpload component with folder filtering.
 *
 * Wraps the core MediaUpload component to add folder filtering
 * capabilities in the block editor.
 */

import { useState, useCallback } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { FolderFilter } from './FolderFilter.jsx';

/**
 * Higher-order component to add folder filtering to MediaUpload.
 *
 * This wraps the MediaUpload component to inject folder filter
 * into the media modal.
 */
const withFolderFilter = createHigherOrderComponent((MediaUpload) => {
	return function EnhancedMediaUpload(props) {
		const [folderFilter, setFolderFilter] = useState('');

		// Modify the media library query to include folder filter
		const modifiedProps = {
			...props,
			// Add folder filter to the media library
			addToGallery: props.addToGallery,
			gallery: props.gallery,
			multiple: props.multiple,
			// When the modal opens, we need to apply the filter
			onOpen: () => {
				if (props.onOpen) {
					props.onOpen();
				}
				// Apply folder filter to the media library
				if (folderFilter && window.wp?.media?.frame) {
					const frame = window.wp.media.frame;
					if (frame?.state()?.get('library')) {
						const query = { vmfo_folder: folderFilter };
						if (folderFilter === 'uncategorized') {
							query.vmfo_folder_exclude = 'all';
							delete query.vmfo_folder;
						}
						frame.state().get('library').props.set(query);
					}
				}
			},
		};

		return <MediaUpload {...modifiedProps} />;
	};
}, 'withFolderFilter');

/**
 * Register the filter for MediaUpload component.
 * This adds folder filtering capabilities to all MediaUpload instances.
 */
export function registerMediaUploadFilter() {
	addFilter(
		'editor.MediaUpload',
		'vmfo/folder-filter',
		withFolderFilter
	);
}

export default registerMediaUploadFilter;
