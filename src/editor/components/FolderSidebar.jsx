/**
 * FolderSidebar component for Gutenberg media modal.
 *
 * Renders a sidebar with folder tree for filtering media
 * in the block editor media modal.
 * 
 * Uses shared components for the base tree structure.
 * Simplified version without drag-drop or folder management.
 */

import { useState, useCallback } from '@wordpress/element';
import useFolderData from '../../shared/hooks/useFolderData';
import { BaseFolderTree } from '../../shared/components';
import FolderSearch from './FolderSearch';

/**
 * FolderSidebar component.
 *
 * @param {Object}   props
 * @param {Function} props.onFolderSelect Called when a folder is selected.
 */
export default function FolderSidebar({ onFolderSelect }) {
	// Get settings from localized data - read inside component to ensure data is available
	const { showAllMedia = true, showUncategorized = true } = window.vmfEditor || {};
	
	// Search state
	const [searchQuery, setSearchQuery] = useState('');
	
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

	/**
	 * Filter folders recursively based on search query.
	 */
	const filterFolders = useCallback((folderList, query) => {
		if (!query.trim()) {
			return folderList;
		}
		const lowerQuery = query.toLowerCase();
		
		const filterRecursive = (folders) => {
			return folders.reduce((acc, folder) => {
				const nameMatches = folder.name.toLowerCase().includes(lowerQuery);
				const filteredChildren = folder.children ? filterRecursive(folder.children) : [];
				
				if (nameMatches || filteredChildren.length > 0) {
					acc.push({
						...folder,
						children: filteredChildren,
					});
				}
				return acc;
			}, []);
		};
		
		return filterRecursive(folderList);
	}, []);

	const filteredFolders = filterFolders(folders, searchQuery);

	// Only show search when there are more than 10 top-level folders
	const showSearch = folders.length > 10;

	// Header with search (only shown when there are many folders)
	const renderHeader = useCallback(() => {
		if (!showSearch) return null;
		return (
			<div className="vmf-folder-sidebar-header">
				<FolderSearch
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
				/>
			</div>
		);
	}, [searchQuery, showSearch]);

	return (
		<BaseFolderTree
			folders={filteredFolders}
			selectedId={selectedId}
			onSelect={handleSelect}
			uncategorizedCount={uncategorizedCount}
			loading={loading}
			showAllMedia={showAllMedia}
			showUncategorized={showUncategorized}
			renderHeader={renderHeader}
			enableKeyboardNav={false}
			enableAutoExpand={false}
			enableAria={false}
			forceExpand={!!searchQuery.trim()}
		/>
	);
}
