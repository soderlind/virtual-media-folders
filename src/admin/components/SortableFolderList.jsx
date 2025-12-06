/**
 * SortableFolderList component.
 *
 * Wraps a list of folders with @dnd-kit sortable context for reordering.
 * Handles the drag-and-drop sorting of folders within a parent level.
 */

import {
	DndContext,
	DragOverlay,
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
} from '@dnd-kit/sortable';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * SortableFolderList component.
 *
 * @param {Object}   props
 * @param {Array}    props.folders Array of folder objects at this level.
 * @param {number}   props.parentId Parent folder ID (0 for root level).
 * @param {Function} props.onReorder Callback after reorder completes.
 * @param {React.ReactNode} props.children The sortable folder items.
 */
export function SortableFolderList({ folders, parentId = 0, onReorder, children }) {
	const [activeId, setActiveId] = useState(null);
	const [activeFolder, setActiveFolder] = useState(null);

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

	// Get folder IDs for this level only
	const folderIds = folders.map((f) => f.id);

	const handleDragStart = useCallback((event) => {
		const { active } = event;
		setActiveId(active.id);
		setActiveFolder(folders.find((f) => f.id === active.id));
	}, [folders]);

	const handleDragEnd = useCallback(async (event) => {
		const { active, over } = event;

		setActiveId(null);
		setActiveFolder(null);

		if (!over || active.id === over.id) {
			return;
		}

		// Calculate new order
		const oldIndex = folderIds.indexOf(active.id);
		const newIndex = folderIds.indexOf(over.id);

		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		// Create new order array
		const newOrder = [...folderIds];
		newOrder.splice(oldIndex, 1);
		newOrder.splice(newIndex, 0, active.id);

		// Save to server
		try {
			await apiFetch({
				path: '/vmf/v1/folders/reorder',
				method: 'POST',
				data: {
					order: newOrder,
					parent: parentId,
				},
			});

			// Refresh folder list
			onReorder?.();
		} catch (error) {
			console.error('Failed to reorder folders:', error);
		}
	}, [folderIds, parentId, onReorder]);

	const handleDragCancel = useCallback(() => {
		setActiveId(null);
		setActiveFolder(null);
	}, []);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
				{children}
			</SortableContext>
			<DragOverlay>
				{activeId && activeFolder ? (
					<div className="vmf-folder-drag-overlay">
						<span className="vmf-folder-name">{activeFolder.name}</span>
						<span className="vmf-folder-count">({activeFolder.count || 0})</span>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

export default SortableFolderList;
