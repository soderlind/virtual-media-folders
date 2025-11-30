/**
 * FolderSidebar component for Gutenberg media modal.
 *
 * Renders a sidebar with folder tree for filtering media
 * in the block editor media modal.
 * 
 * Uses shared components for the base tree structure.
 * Simplified version without drag-drop or folder management.
 */

import useFolderData from '../../shared/hooks/useFolderData';
import { BaseFolderTree } from '../../shared/components';

/**
 * FolderSidebar component.
 *
 * @param {Object}   props
 * @param {Function} props.onFolderSelect Called when a folder is selected.
 */
export default function FolderSidebar({ onFolderSelect }) {
	const {
		folders,
		selectedId,
		loading,
		uncategorizedCount,
		handleSelect,
	} = useFolderData({ 
		trackUrl: false, 
		onFolderSelect 
	});

	return (
		<BaseFolderTree
			folders={folders}
			selectedId={selectedId}
			onSelect={handleSelect}
			uncategorizedCount={uncategorizedCount}
			loading={loading}
			enableKeyboardNav={false}
			enableAutoExpand={false}
			enableAria={false}
		/>
	);
}
