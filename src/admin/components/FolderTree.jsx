/**
 * FolderTree component.
 *
 * Renders a hierarchical tree of media folders with an "Uncategorized"
 * virtual folder for media without any folder assignment.
 * 
 * Uses shared components for the base tree structure, adding:
 * - DroppableFolder for drag-and-drop media to folders
 * - SortableFolderItem for reordering folders via drag-and-drop
 * - FolderManager for folder CRUD operations
 * - BulkFolderAction for bulk operations
 * - URL state management
 * - Global refresh function
 * - Media type filter tracking for accurate counts
 * - Settings integration (showUncategorized)
 */

import { useEffect, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	closestCenter,
} from '@dnd-kit/core';
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	arrayMove,
} from '@dnd-kit/sortable';
import apiFetch from '@wordpress/api-fetch';
import useFolderData from '../../shared/hooks/useFolderData';
import useAnnounce from '../../shared/hooks/useAnnounce';
import useMoveMode from '../../shared/hooks/useMoveMode';
import { setCachedFolders } from '../../shared/utils/folderApi';
import { BaseFolderTree, LiveRegion } from '../../shared/components';
import { DroppableFolder } from './DroppableFolder';
import { SortableFolderItem } from './SortableFolderItem';
import FolderManager from './FolderManager';
import BulkFolderAction from './BulkFolderAction';
import MoveModeBanner from './MoveModeBanner';

// Get settings from server
const { showAllMedia = true, showUncategorized = true, jumpToFolderAfterMove = false } = window.vmfData || {};

// Determine default folder based on settings:
// - If showAllMedia is true, default is null (All Media)
// - If showAllMedia is false, default is 'uncategorized'
const defaultFolder = showAllMedia ? null : 'uncategorized';

/**
 * FolderTree component.
 *
 * @param {Object}   props
 * @param {Function} props.onFolderSelect Called when a folder is selected.
 */
export default function FolderTree({ onFolderSelect }) {
	// Track the current media type filter from WordPress dropdown
	const [mediaType, setMediaType] = useState('');

	// Screen reader announcements for accessibility
	const { announcement, announceReorder, announceFolderDeleted } = useAnnounce();

	// Keyboard-accessible move mode for moving media to folders
	const moveMode = useMoveMode((mediaId, folderId) => {
		// Call the global move function
		if (window.vmfMoveToFolder) {
			window.vmfMoveToFolder(mediaId, folderId);
		}
	});

	const {
		folders: fetchedFolders,
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
		defaultFolder,
	});

	// Local state for optimistic UI updates during drag-drop
	const [folders, setFolders] = useState(fetchedFolders);

	// Sync local folders with fetched folders when data loads
	useEffect(() => {
		setFolders(fetchedFolders);
	}, [fetchedFolders]);

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
	const handleDelete = useCallback((deletedFolderName) => {
		// Announce deletion for screen readers
		if (deletedFolderName) {
			announceFolderDeleted(deletedFolderName);
		}
		// Move focus to Uncategorized if it has items, otherwise All Media
		const targetFolder = uncategorizedCount > 0 ? 'uncategorized' : null;
		setSelectedId(targetFolder);
		onFolderSelect?.(targetFolder);
	}, [uncategorizedCount, setSelectedId, onFolderSelect, announceFolderDeleted]);

	// Refresh handler that also dispatches event for other components
	const handleRefresh = useCallback(async () => {
		// Fetch fresh data (this will update the cache internally)
		await fetchFolders(mediaType, true); // forceRefresh=true
		// Dispatch custom event AFTER fetch completes so other components get fresh cache
		window.dispatchEvent(new CustomEvent('vmf:folders-updated'));
	}, [fetchFolders, mediaType]);

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

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Handle folder drag end - reorder folders with optimistic UI update
	const handleDragEnd = useCallback((event) => {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		// Find the folders at root level and their order
		const rootFolderIds = folders.map((f) => f.id);
		const oldIndex = rootFolderIds.indexOf(active.id);
		const newIndex = rootFolderIds.indexOf(over.id);

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		// Calculate new order
		const newOrder = arrayMove(rootFolderIds, oldIndex, newIndex);

		// Optimistic UI update - reorder folders immediately
		const reorderedFolders = arrayMove(folders, oldIndex, newIndex);
		setFolders(reorderedFolders);

		// Announce reorder for screen readers
		const movedFolder = folders.find((f) => f.id === active.id);
		if (movedFolder) {
			announceReorder(movedFolder.name, newIndex + 1);
		}

		// Update cache with new order so other components get correct order
		// Update vmfo_order for reordered root folders while keeping all folders
		const updatedFlatFolders = flatFolders.map((f) => {
			// Find if this folder is in the reordered list (root folders only)
			const newPosition = newOrder.indexOf(f.id);
			if (newPosition !== -1) {
				return { ...f, vmfo_order: newPosition };
			}
			// Keep existing order for non-root folders
			return f;
		});
		setCachedFolders(updatedFlatFolders);

		// Notify other components of the change
		window.dispatchEvent(new CustomEvent('vmf:folders-updated'));

		// Save to server in background
		apiFetch({
			path: '/vmfo/v1/folders/reorder',
			method: 'POST',
			data: {
				order: newOrder,
				parent: 0,
			},
		}).then(() => {
			// Refresh from server to ensure cache is in sync
			fetchFolders('', true);
		}).catch((error) => {
			console.error('Failed to reorder folders:', error);
			// Revert on error - fetch fresh data
			fetchFolders();
		});
	}, [folders, flatFolders, fetchFolders, announceReorder]);

	// Get root folder IDs for sortable context
	const rootFolderIds = folders.map((f) => f.id);

	// Handle keyboard drop when in move mode
	const handleKeyboardDrop = useCallback((folderId) => {
		if (!moveMode.isActive) return;
		
		// Get folder name for announcement
		let folderName = __('folder', 'virtual-media-folders');
		if (folderId === null) {
			folderName = __('All Media', 'virtual-media-folders');
		} else if (folderId === 'uncategorized') {
			folderName = __('Uncategorized', 'virtual-media-folders');
		} else {
			const folder = flatFolders.find(f => f.id === folderId);
			if (folder) {
				folderName = folder.name;
			}
		}
		
		moveMode.drop(folderId, folderName);
		handleRefresh();
		
		// Optionally jump to the target folder (if setting is enabled)
		if (jumpToFolderAfterMove) {
			setTimeout(() => {
				setSelectedId(folderId);
				onFolderSelect?.(folderId);
			}, 200);
		}
	}, [moveMode, flatFolders, handleRefresh, setSelectedId, onFolderSelect]);

	// Wrapper for folder items - combines DroppableFolder with SortableFolderItem
	const renderWrapper = useCallback(({ folderId, children }) => (
		<SortableFolderItem id={folderId} disabled={typeof folderId !== 'number'}>
			<DroppableFolder 
				folderId={folderId} 
				onKeyboardDrop={handleKeyboardDrop}
				isMoveModeActive={moveMode.isActive}
			>
				{children}
			</DroppableFolder>
		</SortableFolderItem>
	), [handleKeyboardDrop, moveMode.isActive]);

	// Wrapper for uncategorized item - uses DroppableFolder only (not sortable)
	const renderUncategorizedWrapper = useCallback(({ children }) => (
		<DroppableFolder 
			folderId="uncategorized"
			onKeyboardDrop={handleKeyboardDrop}
			isMoveModeActive={moveMode.isActive}
		>
			{children}
		</DroppableFolder>
	), [handleKeyboardDrop, moveMode.isActive]);

	// Header with folder management controls and move mode banner
	// Wrapped in sticky container so header stays visible when scrolling folders
	const renderHeader = useCallback(() => (
		<div className="vmf-folder-header">
			{moveMode.isActive && (
				<MoveModeBanner 
					itemCount={moveMode.grabbedMedia?.length || 0}
					onCancel={moveMode.cancel}
				/>
			)}
			<FolderManager
				folders={flatFolders}
				selectedId={selectedId}
				onRefresh={handleRefresh}
				onDelete={handleDelete}
			/>
			<BulkFolderAction onComplete={handleRefresh} />
		</div>
	), [flatFolders, selectedId, handleRefresh, handleDelete, moveMode]);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			{/* Screen reader live region for announcements */}
			<LiveRegion announcement={announcement || moveMode.announcement} />
			
			<SortableContext items={rootFolderIds} strategy={verticalListSortingStrategy}>
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
					isMoveModeActive={moveMode.isActive}
					loadingText={__('Loading folders…', 'virtual-media-folders')}
				/>
			</SortableContext>
		</DndContext>
	);
}
