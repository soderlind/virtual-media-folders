/**
 * useAnnounce hook.
 *
 * Provides screen reader announcements for accessibility.
 * Creates live region announcements for drag-drop and folder operations.
 */

import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Custom hook for screen reader announcements.
 *
 * @return {Object} Announcement state and helper functions.
 */
export function useAnnounce() {
	const [announcement, setAnnouncement] = useState('');

	/**
	 * Announce a message to screen readers.
	 *
	 * @param {string} message The message to announce.
	 */
	const announce = useCallback((message) => {
		// Clear first to ensure re-announcement of same message
		setAnnouncement('');
		// Small delay ensures the announcement is read
		setTimeout(() => setAnnouncement(message), 100);
	}, []);

	/**
	 * Announce when media is moved to a folder.
	 *
	 * @param {string} fileName   The file name.
	 * @param {string} folderName The target folder name.
	 */
	const announceMove = useCallback((fileName, folderName) => {
		announce(
			sprintf(
				/* translators: 1: file name, 2: folder name */
				__('Moved %1$s to %2$s', 'virtual-media-folders'),
				fileName,
				folderName
			)
		);
	}, [announce]);

	/**
	 * Announce when multiple files are moved.
	 *
	 * @param {number} count      Number of files moved.
	 * @param {string} folderName The target folder name.
	 */
	const announceBulkMove = useCallback((count, folderName) => {
		announce(
			sprintf(
				/* translators: 1: number of files, 2: folder name */
				__('Moved %1$d files to %2$s', 'virtual-media-folders'),
				count,
				folderName
			)
		);
	}, [announce]);

	/**
	 * Announce when a folder is reordered.
	 *
	 * @param {string} folderName The folder name.
	 * @param {number} position   The new position (1-based).
	 */
	const announceReorder = useCallback((folderName, position) => {
		announce(
			sprintf(
				/* translators: 1: folder name, 2: position number */
				__('%1$s moved to position %2$d', 'virtual-media-folders'),
				folderName,
				position
			)
		);
	}, [announce]);

	/**
	 * Announce when a folder is selected.
	 *
	 * @param {string} folderName The folder name.
	 * @param {number} itemCount  Number of items in the folder.
	 */
	const announceFolderSelected = useCallback((folderName, itemCount) => {
		announce(
			sprintf(
				/* translators: 1: folder name, 2: item count */
				__('%1$s folder selected, %2$d items', 'virtual-media-folders'),
				folderName,
				itemCount
			)
		);
	}, [announce]);

	/**
	 * Announce when a folder is created.
	 *
	 * @param {string} folderName The new folder name.
	 */
	const announceFolderCreated = useCallback((folderName) => {
		announce(
			sprintf(
				/* translators: %s: folder name */
				__('Folder %s created', 'virtual-media-folders'),
				folderName
			)
		);
	}, [announce]);

	/**
	 * Announce when a folder is deleted.
	 *
	 * @param {string} folderName The deleted folder name.
	 */
	const announceFolderDeleted = useCallback((folderName) => {
		announce(
			sprintf(
				/* translators: %s: folder name */
				__('Folder %s deleted', 'virtual-media-folders'),
				folderName
			)
		);
	}, [announce]);

	/**
	 * Announce drag start.
	 *
	 * @param {string} itemName The item being dragged.
	 */
	const announceDragStart = useCallback((itemName) => {
		announce(
			sprintf(
				/* translators: %s: item name */
				__('Dragging %s. Drop on a folder to move.', 'virtual-media-folders'),
				itemName
			)
		);
	}, [announce]);

	/**
	 * Announce drag cancelled.
	 */
	const announceDragCancelled = useCallback(() => {
		announce(__('Drag cancelled', 'virtual-media-folders'));
	}, [announce]);

	return {
		announcement,
		announce,
		announceMove,
		announceBulkMove,
		announceReorder,
		announceFolderSelected,
		announceFolderCreated,
		announceFolderDeleted,
		announceDragStart,
		announceDragCancelled,
	};
}

export default useAnnounce;
