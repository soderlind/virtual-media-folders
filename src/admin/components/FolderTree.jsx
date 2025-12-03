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
 * - Media type filter tracking for accurate counts
 * - Settings integration (showUncategorized)
 */

import { useEffect, useCallback, useState } from '@wordpress/element';
import useFolderData from '../../shared/hooks/useFolderData';
import { BaseFolderTree } from '../../shared/components';
import { DroppableFolder } from './DroppableFolder';
import FolderManager from './FolderManager';
import BulkFolderAction from './BulkFolderAction';

// Get settings from server
const { showAllMedia = true, showUncategorized = true } = window.vmfData || {};

/**
 * FolderTree component.
 *
 * @param {Object}   props
 * @param {Function} props.onFolderSelect Called when a folder is selected.
 */
export default function FolderTree({ onFolderSelect }) {
	// Track the current media type filter from WordPress dropdown
	const [mediaType, setMediaType] = useState('');

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
		onFolderSelect,
		mediaType,
	});

	// Listen for changes to the WordPress media type filter dropdown
	useEffect(() => {
		/**
		 * Get the current media type filter value from WordPress dropdown.
		 * WordPress uses select#media-attachment-filters with class .attachment-filters
		 */
		function getCurrentMediaType() {
			// The WordPress media type filter dropdown - try multiple selectors
			const filterSelect = document.querySelector(
				'select.attachment-filters[id="media-attachment-filters"], ' +
				'select.attachment-filters[id*="media-attachment"]'
			);
			if (filterSelect) {
				const value = filterSelect.value;
				// WordPress uses values like 'image', 'audio', 'video', 'application'
				// Also handles 'all' which means no filter
				return value === 'all' ? '' : value;
			}
			return '';
		}

		// Set initial value
		setMediaType(getCurrentMediaType());

		// Watch for changes to the filter dropdown using event delegation
		function handleFilterChange(e) {
			// Match any attachment-filters select that contains media type options
			if (e.target.matches('select.attachment-filters') && 
				(e.target.id === 'media-attachment-filters' || e.target.id.includes('media-attachment'))) {
				const value = e.target.value;
				setMediaType(value === 'all' ? '' : value);
			}
		}

		document.addEventListener('change', handleFilterChange);

		// Also watch for WordPress Backbone events if available
		if (typeof wp !== 'undefined' && wp.media && wp.media.frame) {
			const frame = wp.media.frame;
			if (frame.content && frame.content.get) {
				const content = frame.content.get();
				if (content && content.collection) {
					content.collection.on('change:type', () => {
						setMediaType(getCurrentMediaType());
					});
				}
			}
		}

		return () => {
			document.removeEventListener('change', handleFilterChange);
		};
	}, []);

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

	// Refresh handler that also dispatches event for other components
	const handleRefresh = useCallback(() => {
		fetchFolders();
		// Dispatch custom event so other components can refresh their folder lists
		window.dispatchEvent(new CustomEvent('mediamanager:folders-updated'));
	}, [fetchFolders]);

	useEffect(() => {
		// Expose refresh function globally
		window.vmfRefreshFolders = handleRefresh;
		
		// Expose folder selection function globally (for drop-to-folder navigation)
		window.vmfSelectFolder = (folderId) => {
			setSelectedId(folderId);
			onFolderSelect?.(folderId);
		};
		
		return () => {
			delete window.vmfRefreshFolders;
			delete window.vmfSelectFolder;
		};
	}, [handleRefresh, onFolderSelect, setSelectedId]);

	// Wrapper for folder items - uses DroppableFolder for drag-and-drop
	const renderWrapper = useCallback(({ folderId, children }) => (
		<DroppableFolder folderId={folderId}>
			{children}
		</DroppableFolder>
	), []);

	// Wrapper for uncategorized item - uses DroppableFolder for drag-and-drop
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
				onRefresh={handleRefresh}
				onDelete={handleDelete}
			/>
			<BulkFolderAction onComplete={handleRefresh} />
		</>
	), [flatFolders, selectedId, handleRefresh, handleDelete]);

	return (
		<BaseFolderTree
			folders={folders}
			selectedId={selectedId}
			onSelect={handleSelect}
			uncategorizedCount={uncategorizedCount}
			showAllMedia={showAllMedia}
			showUncategorized={showUncategorized}
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
