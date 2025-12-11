/**
 * useMoveMode hook.
 *
 * Manages keyboard-accessible "move mode" for moving media items to folders.
 * Provides state and handlers for picking up items and dropping them on folders.
 */

import { useState, useCallback, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Custom hook for keyboard-accessible media moving.
 *
 * @param {Function} onMove Callback when media is moved to a folder.
 * @return {Object} Move mode state and handlers.
 */
export function useMoveMode(onMove) {
	const [grabbedMedia, setGrabbedMedia] = useState(null);
	const [announcement, setAnnouncement] = useState('');

	/**
	 * Announce a message to screen readers.
	 *
	 * @param {string} message The message to announce.
	 */
	const announce = useCallback((message) => {
		setAnnouncement('');
		setTimeout(() => setAnnouncement(message), 100);
	}, []);

	/**
	 * Pick up media items for moving.
	 *
	 * @param {Array} items Array of { id, title } objects.
	 */
	const pickUp = useCallback((items) => {
		if (!items || items.length === 0) return;
		
		setGrabbedMedia(items);
		
		const message = items.length === 1
			? sprintf(
				/* translators: %s: media item title */
				__('%s picked up. Navigate to a folder and press Enter to drop, or press M or Escape to cancel.', 'virtual-media-folders'),
				items[0].title || __('Item', 'virtual-media-folders')
			)
			: sprintf(
				/* translators: %d: number of items */
				__('%d items picked up. Navigate to a folder and press Enter to drop, or press M or Escape to cancel.', 'virtual-media-folders'),
				items.length
			);
		
		announce(message);
	}, [announce]);

	/**
	 * Cancel the current move operation.
	 */
	const cancel = useCallback(() => {
		if (grabbedMedia) {
			setGrabbedMedia(null);
			announce(__('Move cancelled', 'virtual-media-folders'));
		}
	}, [grabbedMedia, announce]);

	/**
	 * Drop grabbed media onto a folder.
	 *
	 * @param {number|string} folderId The target folder ID.
	 * @param {string}        folderName The target folder name for announcement.
	 */
	const drop = useCallback((folderId, folderName) => {
		if (!grabbedMedia || grabbedMedia.length === 0) return;

		const items = grabbedMedia;
		setGrabbedMedia(null);

		// Call the move callback for each item
		items.forEach(item => {
			onMove?.(item.id, folderId);
		});

		// Announce the result
		const message = items.length === 1
			? sprintf(
				/* translators: 1: media item title, 2: folder name */
				__('Moved %1$s to %2$s', 'virtual-media-folders'),
				items[0].title || __('item', 'virtual-media-folders'),
				folderName || __('folder', 'virtual-media-folders')
			)
			: sprintf(
				/* translators: 1: number of items, 2: folder name */
				__('Moved %1$d items to %2$s', 'virtual-media-folders'),
				items.length,
				folderName || __('folder', 'virtual-media-folders')
			);
		
		announce(message);
	}, [grabbedMedia, onMove, announce]);

	/**
	 * Toggle move mode for the given items.
	 * If already in move mode, cancels. Otherwise picks up the items.
	 *
	 * @param {Array} items Array of { id, title } objects.
	 */
	const toggle = useCallback((items) => {
		if (grabbedMedia) {
			cancel();
		} else {
			pickUp(items);
		}
	}, [grabbedMedia, cancel, pickUp]);

	// Expose globally for use in media-library.js
	useEffect(() => {
		window.vmfMoveMode = {
			isActive: () => !!grabbedMedia,
			getGrabbedMedia: () => grabbedMedia,
			pickUp,
			cancel,
			drop,
			toggle,
		};

		return () => {
			delete window.vmfMoveMode;
		};
	}, [grabbedMedia, pickUp, cancel, drop, toggle]);

	return {
		grabbedMedia,
		announcement,
		isActive: !!grabbedMedia,
		pickUp,
		cancel,
		drop,
		toggle,
	};
}

export default useMoveMode;
