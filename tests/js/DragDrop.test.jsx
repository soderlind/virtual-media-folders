/**
 * DroppableFolder component tests.
 *
 * Tests the native HTML5 drag-and-drop functionality for moving media to folders.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DroppableFolder } from '../../src/admin/components/DroppableFolder.jsx';

// Mock WordPress i18n
vi.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

beforeEach(() => {
	vi.clearAllMocks();
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

		expect(container.firstChild).toHaveClass('vmf-droppable-folder');
	});
});
