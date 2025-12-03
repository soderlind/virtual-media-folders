/**
 * Drag and Drop context provider.
 *
 * Wraps the Media Library with @dnd-kit context for drag-and-drop support.
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
	sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Media Manager DnD Provider.
 *
 * @param {Object}   props
 * @param {Function} props.onMoveToFolder Callback when media is dropped on a folder.
 * @param {React.ReactNode} props.children
 */
export function MediaManagerDndProvider({ onMoveToFolder, children }) {
	const [activeId, setActiveId] = useState(null);
	const [activeData, setActiveData] = useState(null);

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

	function handleDragStart(event) {
		const { active } = event;
		setActiveId(active.id);
		setActiveData(active.data.current);
	}

	function handleDragEnd(event) {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const mediaId = active.data.current?.mediaId;
			const folderId = over.data.current?.folderId;

			if (mediaId && folderId !== undefined) {
				onMoveToFolder?.(mediaId, folderId);
			}
		}

		setActiveId(null);
		setActiveData(null);
	}

	function handleDragCancel() {
		setActiveId(null);
		setActiveData(null);
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			{children}
			<DragOverlay>
				{activeId ? (
					<div className="vmf-drag-overlay">
						{activeData?.thumbnail ? (
							<img
								src={activeData.thumbnail}
								alt={activeData.title || ''}
								className="vmf-drag-overlay__image"
							/>
						) : (
							<div className="vmf-drag-overlay__placeholder">
								{activeData?.title || __('Media', 'virtual-media-folders')}
							</div>
						)}
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}

export default MediaManagerDndProvider;
