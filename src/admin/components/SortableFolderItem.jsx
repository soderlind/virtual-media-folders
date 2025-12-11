/**
 * SortableFolderItem component.
 *
 * Makes a folder item sortable (reorderable) via drag and drop.
 * Uses @dnd-kit/sortable for sorting folders within the tree.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';

/**
 * SortableFolderItem component.
 *
 * @param {Object}   props
 * @param {number|string} props.id The folder ID used for sorting.
 * @param {React.ReactNode} props.children The folder content.
 * @param {boolean}  props.disabled Whether sorting is disabled.
 */
export function SortableFolderItem({ id, children, disabled = false }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ 
		id,
		disabled,
		data: {
			type: 'folder',
			folderId: id,
		},
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 100 : undefined,
	};

	// If disabled (e.g., for virtual folders), just render children without sortable wrapper
	if (disabled) {
		return children;
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`vmf-sortable-folder ${isDragging ? 'is-dragging' : ''}`}
			{...attributes}
		>
			<div className="vmf-sortable-folder__row">
				<span 
					className="vmf-sortable-folder__grip"
					{...listeners}
					role="button"
					tabIndex={0}
					aria-label={__('Drag to reorder folder', 'virtual-media-folders')}
					aria-describedby="vmf-drag-instructions"
					aria-roledescription={__('sortable', 'virtual-media-folders')}
				>
					⋮⋮
				</span>
				<div className="vmf-sortable-folder__content">
					{children}
				</div>
			</div>
		</div>
	);
}

export default SortableFolderItem;
