/**
 * Draggable Media component.
 *
 * Makes a media item draggable for organizing into folders.
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/**
 * DraggableMedia component.
 *
 * @param {Object}   props
 * @param {number}   props.mediaId   The attachment ID.
 * @param {string}   props.title     The attachment title.
 * @param {string}   props.thumbnail The thumbnail URL.
 * @param {React.ReactNode} props.children
 */
export function DraggableMedia({ mediaId, title, thumbnail, children }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		isDragging,
	} = useDraggable({
		id: `media-${mediaId}`,
		data: {
			type: 'media',
			mediaId,
			title,
			thumbnail,
		},
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`vmf-draggable-media ${isDragging ? 'is-dragging' : ''}`}
			{...listeners}
			{...attributes}
		>
			{children}
		</div>
	);
}

export default DraggableMedia;
