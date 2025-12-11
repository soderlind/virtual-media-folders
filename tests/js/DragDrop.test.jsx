/**
 * DroppableFolder component tests.
 *
 * Tests the native HTML5 drag-and-drop functionality for moving media to folders,
 * including keyboard-accessible drop functionality.
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

describe('DroppableFolder keyboard accessibility', () => {
	it('adds vmf-drop-target class when move mode is active', () => {
		const { container } = render(
			<DroppableFolder folderId={1} isMoveModeActive={true}>
				<span>Folder</span>
			</DroppableFolder>
		);

		expect(container.firstChild).toHaveClass('vmf-drop-target');
	});

	it('does not add vmf-drop-target class when move mode is inactive', () => {
		const { container } = render(
			<DroppableFolder folderId={1} isMoveModeActive={false}>
				<span>Folder</span>
			</DroppableFolder>
		);

		expect(container.firstChild).not.toHaveClass('vmf-drop-target');
	});

	it('has aria-dropeffect move when move mode is active', () => {
		const { container } = render(
			<DroppableFolder folderId={1} isMoveModeActive={true}>
				<span>Folder</span>
			</DroppableFolder>
		);

		expect(container.firstChild).toHaveAttribute('aria-dropeffect', 'move');
	});

	it('has no aria-dropeffect when move mode is inactive', () => {
		const { container } = render(
			<DroppableFolder folderId={1} isMoveModeActive={false}>
				<span>Folder</span>
			</DroppableFolder>
		);

		expect(container.firstChild).not.toHaveAttribute('aria-dropeffect');
	});

	it('calls onKeyboardDrop when Enter is pressed during move mode', () => {
		const onKeyboardDrop = vi.fn();
		const { container } = render(
			<DroppableFolder 
				folderId={42} 
				isMoveModeActive={true} 
				onKeyboardDrop={onKeyboardDrop}
			>
				<span>Folder</span>
			</DroppableFolder>
		);

		fireEvent.keyDown(container.firstChild, { key: 'Enter' });

		expect(onKeyboardDrop).toHaveBeenCalledWith(42);
	});

	it('calls onKeyboardDrop when Enter is pressed on folder button during move mode', () => {
		const onKeyboardDrop = vi.fn();
		render(
			<DroppableFolder 
				folderId={42} 
				isMoveModeActive={true} 
				onKeyboardDrop={onKeyboardDrop}
			>
				<button className="vmf-folder-button">Folder Button</button>
			</DroppableFolder>
		);

		const button = screen.getByRole('button', { name: 'Folder Button' });
		fireEvent.keyDown(button, { key: 'Enter' });

		expect(onKeyboardDrop).toHaveBeenCalledWith(42);
	});

	it('does not call onKeyboardDrop when Enter is pressed but move mode is inactive', () => {
		const onKeyboardDrop = vi.fn();
		const { container } = render(
			<DroppableFolder 
				folderId={42} 
				isMoveModeActive={false} 
				onKeyboardDrop={onKeyboardDrop}
			>
				<span>Folder</span>
			</DroppableFolder>
		);

		fireEvent.keyDown(container.firstChild, { key: 'Enter' });

		expect(onKeyboardDrop).not.toHaveBeenCalled();
	});

	it('does not call onKeyboardDrop for other keys during move mode', () => {
		const onKeyboardDrop = vi.fn();
		const { container } = render(
			<DroppableFolder 
				folderId={42} 
				isMoveModeActive={true} 
				onKeyboardDrop={onKeyboardDrop}
			>
				<span>Folder</span>
			</DroppableFolder>
		);

		fireEvent.keyDown(container.firstChild, { key: 'Space' });
		fireEvent.keyDown(container.firstChild, { key: 'Tab' });
		fireEvent.keyDown(container.firstChild, { key: 'a' });

		expect(onKeyboardDrop).not.toHaveBeenCalled();
	});

	it('does not call onKeyboardDrop when no callback provided', () => {
		const { container } = render(
			<DroppableFolder folderId={42} isMoveModeActive={true}>
				<span>Folder</span>
			</DroppableFolder>
		);

		// Should not throw
		expect(() => {
			fireEvent.keyDown(container.firstChild, { key: 'Enter' });
		}).not.toThrow();
	});

	it('handles null folderId for keyboard drop on root', () => {
		const onKeyboardDrop = vi.fn();
		const { container } = render(
			<DroppableFolder 
				folderId={null} 
				isMoveModeActive={true} 
				onKeyboardDrop={onKeyboardDrop}
			>
				<span>Root</span>
			</DroppableFolder>
		);

		fireEvent.keyDown(container.firstChild, { key: 'Enter' });

		expect(onKeyboardDrop).toHaveBeenCalledWith(null);
	});
});
