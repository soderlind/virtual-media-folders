/**
 * FolderTree component.
 *
 * Renders a hierarchical tree of media folders with an "Uncategorized"
 * virtual folder for media without any folder assignment.
 * 
 * Uses shared components for the base tree structure, adding:
 * - DroppableFolder for drag-and-drop
 * - FolderManager for folder CRUD operations
 * - BulkFolderAction for bulk operations
 * - URL state management
 * - Global refresh function
 */

import { useEffect, useCallback } from '@wordpress/element';
import useFolderData from '../../shared/hooks/useFolderData';
import { BaseFolderTree } from '../../shared/components';
import { DroppableFolder } from './DroppableFolder';
import FolderManager from './FolderManager';
import BulkFolderAction from './BulkFolderAction';

/**
 * FolderTree component.
 *
 * @param {Object}   props
 * @param {Function} props.onFolderSelect Called when a folder is selected.
 */
export default function FolderTree({ onFolderSelect }) {
	const {
		folders,
		flatFolders,
		selectedId,
		setSelectedId,
		loading,
		uncategorizedCount,
		fetchFolders,
		handleSelect: baseHandleSelect,
	} = useFolderData({ 
		trackUrl: true, 
		onFolderSelect 
	});

	// Extended select handler that also exposes globally
	const handleSelect = useCallback((folderId) => {
		baseHandleSelect(folderId);
	}, [baseHandleSelect]);

	// Handler for after folder deletion - move focus to Uncategorized or All Media
	const handleDelete = useCallback(() => {
		// Move focus to Uncategorized if it has items, otherwise All Media
		const targetFolder = uncategorizedCount > 0 ? 'uncategorized' : null;
		setSelectedId(targetFolder);
		onFolderSelect?.(targetFolder);
	}, [uncategorizedCount, setSelectedId, onFolderSelect]);

	useEffect(() => {
		// Expose refresh function globally
		window.mediaManagerRefreshFolders = fetchFolders;
		
		// Expose folder selection function globally (for drop-to-folder navigation)
		window.mediaManagerSelectFolder = (folderId) => {
			setSelectedId(folderId);
			onFolderSelect?.(folderId);
		};
		
		return () => {
			delete window.mediaManagerRefreshFolders;
			delete window.mediaManagerSelectFolder;
		};
	}, [fetchFolders, onFolderSelect, setSelectedId]);

	// Wrapper for folder items with DroppableFolder
	const renderWrapper = useCallback(({ folderId, children }) => (
		<DroppableFolder folderId={folderId}>
			{children}
		</DroppableFolder>
	), []);

	// Wrapper for uncategorized item
	const renderUncategorizedWrapper = useCallback(({ children }) => (
		<DroppableFolder folderId="uncategorized">
			{children}
		</DroppableFolder>
	), []);

	// Header with folder management controls
	const renderHeader = useCallback(() => (
		<>
			<FolderManager
				folders={flatFolders}
				selectedId={selectedId}
				onRefresh={fetchFolders}
				onDelete={handleDelete}
			/>
			<BulkFolderAction onComplete={fetchFolders} />
		</>
	), [flatFolders, selectedId, fetchFolders, handleDelete]);

	return (
		<BaseFolderTree
			folders={folders}
			selectedId={selectedId}
			onSelect={handleSelect}
			uncategorizedCount={uncategorizedCount}
			loading={loading}
			renderWrapper={renderWrapper}
			renderUncategorizedWrapper={renderUncategorizedWrapper}
			renderHeader={renderHeader}
			enableKeyboardNav={true}
			enableAutoExpand={true}
			enableAria={true}
			loadingText="Loading folders…"
		/>
	);
}
