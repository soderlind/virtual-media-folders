/**
 * Droppable Folder component.
 *
 * Makes a folder item a valid drop target for dragged media items.
 * Uses native HTML5 drag and drop events for compatibility with WordPress media items.
 * Also supports keyboard-accessible move mode.
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
 * @param {Function} props.onKeyboardDrop Called when Enter is pressed in move mode.
 * @param {boolean}  props.isMoveModeActive Whether keyboard move mode is active.
 */
export function DroppableFolder({ 
	folderId, 
	children, 
	className = '',
	onKeyboardDrop,
	isMoveModeActive = false,
}) {
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
				if (window.vmfMoveToFolder) {
					window.vmfMoveToFolder(data.mediaId, folderId);
					
					// After moving, select the target folder (if setting is enabled)
					// Note: vmfMoveToFolder handles refreshing the view via refreshMediaLibrary()
					// so we only need to handle the jumpToFolderAfterMove case here
					const { jumpToFolderAfterMove = false } = window.vmfData || {};
					if (jumpToFolderAfterMove && window.vmfSelectFolder) {
						// Small delay to let the move complete
						setTimeout(() => {
							window.vmfSelectFolder(folderId);
						}, 200);
					}
					// When not jumping to folder, refreshMediaLibrary() handles removing/keeping items
					// based on whether we're in "All Media" view or a specific folder
				}
			}
		} catch (error) {
			// Silently ignore drop errors
		}
	}, [folderId]);

	// Handle keyboard drop (Enter key when move mode is active)
	const handleKeyDown = useCallback((e) => {
		if (!isMoveModeActive || !onKeyboardDrop) return;
		
		if (e.key === 'Enter') {
			const target = e.target;
			
			// Skip non-folder buttons and inputs (cancel button, etc.)
			if (target.tagName === 'INPUT') return;
			if (target.tagName === 'BUTTON' && !target.classList.contains('vmf-folder-button')) {
				return;
			}
			
			// Intercept Enter on folder buttons during move mode - drop instead of select
			e.preventDefault();
			e.stopPropagation();
			onKeyboardDrop(folderId);
		}
	}, [folderId, isMoveModeActive, onKeyboardDrop]);

	return (
		<div
			className={`vmf-droppable-folder ${className} ${isOver ? 'is-over' : ''} ${isMoveModeActive ? 'vmf-drop-target' : ''}`}
			onDragOver={handleDragOver}
			onDragEnter={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onKeyDown={handleKeyDown}
			aria-dropeffect={isMoveModeActive ? 'move' : undefined}
		>
			{children}
			{isOver && (
				<span className="screen-reader-text">
					{__('Drop here to move media to this folder', 'virtual-media-folders')}
				</span>
			)}
		</div>
	);
}

export default DroppableFolder;
