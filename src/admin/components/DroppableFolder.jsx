/**
 * Droppable Folder component.
 *
 * Makes a folder item a valid drop target for dragged media items.
 * Uses native HTML5 drag and drop events for compatibility with WordPress media items.
 */

import { useState, useCallback, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Create a context to pass the move handler
import { createContext } from '@wordpress/element';
export const MoveToFolderContext = createContext(null);

/**
 * DroppableFolder component.
 *
 * @param {Object}   props
 * @param {number|string|null} props.folderId The folder ID (null for root, 'uncategorized' for uncategorized).
 * @param {React.ReactNode}    props.children
 * @param {string}   props.className Additional CSS classes.
 */
export function DroppableFolder({ folderId, children, className = '' }) {
	const [isOver, setIsOver] = useState(false);

	const handleDragOver = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOver(true);
	}, []);

	const handleDragLeave = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOver(false);
	}, []);

	const handleDrop = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOver(false);

		try {
			const rawData = e.dataTransfer.getData('text/plain');
			
			if (!rawData) {
				return;
			}
			
			const data = JSON.parse(rawData);
			
			if (data.mediaId) {
				// Get the move handler from the global scope
				if (window.mediaManagerMoveToFolder) {
					window.mediaManagerMoveToFolder(data.mediaId, folderId);
					
					// After moving, select the target folder (if setting is enabled)
					const { jumpToFolderAfterMove = true } = window.mediaManagerData || {};
					if (jumpToFolderAfterMove && window.mediaManagerSelectFolder) {
						// Small delay to let the move complete
						setTimeout(() => {
							window.mediaManagerSelectFolder(folderId);
						}, 200);
					} else {
						// When not jumping to folder, remove the moved item from the current view
						const attachment = document.querySelector(`.attachment[data-id="${data.mediaId}"]`);
						if (attachment) {
							// Small delay to let the move complete before removing
							setTimeout(() => {
								attachment.remove();
							}, 300);
						}
					}
				}
			}
		} catch (error) {
			// Silently ignore drop errors
		}
	}, [folderId]);

	return (
		<div
			className={`mm-droppable-folder ${className} ${isOver ? 'is-over' : ''}`}
			onDragOver={handleDragOver}
			onDragEnter={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{children}
			{isOver && (
				<span className="screen-reader-text">
					{__('Drop here to move media to this folder', 'mediamanager')}
				</span>
			)}
		</div>
	);
}

export default DroppableFolder;
