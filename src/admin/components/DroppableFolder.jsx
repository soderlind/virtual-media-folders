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
			console.log('Drop received, raw data:', rawData);
			
			if (!rawData) {
				console.error('No data received in drop');
				return;
			}
			
			const data = JSON.parse(rawData);
			console.log('Parsed drop data:', data, 'Target folder:', folderId);
			
			if (data.mediaId) {
				// Get the move handler from the global scope
				if (window.mediaManagerMoveToFolder) {
					console.log('Calling mediaManagerMoveToFolder with:', data.mediaId, folderId);
					window.mediaManagerMoveToFolder(data.mediaId, folderId);
					
					// After moving, select the target folder to show its contents
					if (window.mediaManagerSelectFolder) {
						// Small delay to let the move complete
						setTimeout(() => {
							window.mediaManagerSelectFolder(folderId);
						}, 200);
					}
				} else {
					console.error('window.mediaManagerMoveToFolder not found');
				}
			} else {
				console.error('No mediaId in drop data');
			}
		} catch (error) {
			console.error('Error handling drop:', error);
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
