import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableMedia } from '../../src/admin/components/DraggableMedia.jsx';
import { DroppableFolder } from '../../src/admin/components/DroppableFolder.jsx';

// Mock @dnd-kit/core for DraggableMedia
const mockUseDraggable = vi.fn(() => ({
	attributes: { role: 'button', tabIndex: 0 },
	listeners: {},
	setNodeRef: vi.fn(),
	transform: null,
	isDragging: false,
}));

vi.mock('@dnd-kit/core', () => ({
	useDraggable: (...args) => mockUseDraggable(...args),
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
	CSS: {
		Translate: {
			toString: vi.fn(() => null),
		},
	},
}));

// Mock WordPress i18n
vi.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

beforeEach(() => {
	vi.clearAllMocks();
	// Reset mock to default behavior
	mockUseDraggable.mockReturnValue({
		attributes: { role: 'button', tabIndex: 0 },
		listeners: {},
		setNodeRef: vi.fn(),
		transform: null,
		isDragging: false,
	});
});

describe('DraggableMedia', () => {
	it('renders children with draggable wrapper', () => {
		render(
			<DraggableMedia mediaId={1} title="Test Image" thumbnail="test.jpg">
				<img src="test.jpg" alt="Test" />
			</DraggableMedia>
		);

		expect(screen.getByRole('img')).toBeInTheDocument();
	});

	it('applies dragging class when isDragging is true', () => {
		mockUseDraggable.mockReturnValue({
			attributes: {},
			listeners: {},
			setNodeRef: vi.fn(),
			transform: null,
			isDragging: true,
		});

		const { container } = render(
			<DraggableMedia mediaId={1} title="Test" thumbnail="">
				<span>Content</span>
			</DraggableMedia>
		);

		expect(container.firstChild).toHaveClass('is-dragging');
	});

	it('has correct data attributes for accessibility', () => {
		const { container } = render(
			<DraggableMedia mediaId={42} title="My Media" thumbnail="thumb.jpg">
				<span>Content</span>
			</DraggableMedia>
		);

		expect(container.firstChild).toHaveClass('mm-draggable-media');
	});
});

describe('DroppableFolder', () => {
	it('renders children inside droppable container', () => {
		render(
			<DroppableFolder folderId={1}>
				<span>Folder Content</span>
			</DroppableFolder>
		);

		expect(screen.getByText('Folder Content')).toBeInTheDocument();
	});

	it('applies is-over class when media is dragged over', () => {
		const { container } = render(
			<DroppableFolder folderId={1}>
				<span>Drop here</span>
			</DroppableFolder>
		);

		// Simulate dragOver event
		fireEvent.dragOver(container.firstChild);

		expect(container.firstChild).toHaveClass('is-over');
	});

	it('removes is-over class when drag leaves', () => {
		const { container } = render(
			<DroppableFolder folderId={1}>
				<span>Content</span>
			</DroppableFolder>
		);

		// Simulate dragOver then dragLeave
		fireEvent.dragOver(container.firstChild);
		expect(container.firstChild).toHaveClass('is-over');
		
		fireEvent.dragLeave(container.firstChild);
		expect(container.firstChild).not.toHaveClass('is-over');
	});

	it('handles null folderId for root folder', () => {
		const { container } = render(
			<DroppableFolder folderId={null}>
				<span>Root</span>
			</DroppableFolder>
		);

		expect(container.firstChild).toHaveClass('mm-droppable-folder');
	});
});
