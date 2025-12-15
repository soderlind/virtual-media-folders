import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useState } from 'react';
import { MoveToFolderMenu } from '../../src/admin/components/MoveToFolderMenu.jsx';

// Mock WordPress packages
vi.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));

vi.mock('@wordpress/api-fetch', () => ({
	default: vi.fn(),
}));

vi.mock('@wordpress/icons', () => ({
	Icon: ({ icon }) => <span data-testid="icon">{icon?.name || 'icon'}</span>,
	folder: { name: 'folder' },
}));

vi.mock('@wordpress/components', () => ({
	Button: ({ children, onClick, ...props }) => (
		<button onClick={onClick} {...props}>{children}</button>
	),
	Dropdown: ({ renderToggle, renderContent }) => {
		const [isOpen, setIsOpen] = useState(false);
		return (
			<div>
				{renderToggle({ isOpen, onToggle: () => setIsOpen(!isOpen) })}
				{isOpen && renderContent({ onClose: () => setIsOpen(false) })}
			</div>
		);
	},
	MenuGroup: ({ label, children }) => (
		<div role="group" aria-label={label}>{children}</div>
	),
	MenuItem: ({ children, onClick, disabled, isSelected }) => (
		<button
			onClick={onClick}
			disabled={disabled}
			aria-selected={isSelected}
			role="menuitem"
		>
			{children}
		</button>
	),
}));

import apiFetch from '@wordpress/api-fetch';

describe('MoveToFolderMenu', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders toggle button with folder icon', () => {
		// Prevent the background folder fetch from resolving and updating state
		// after the test has completed.
		apiFetch.mockImplementation(() => new Promise(() => {}));

		act(() => {
			render(<MoveToFolderMenu mediaId={1} currentFolderId={null} onMove={vi.fn()} />);
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
		expect(screen.getByText('Move to folder')).toBeInTheDocument();
	});

	it('shows loading state when fetching folders', async () => {
		const apiFetch = (await import('@wordpress/api-fetch')).default;
		apiFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

		act(() => {
			render(<MoveToFolderMenu mediaId={1} currentFolderId={null} onMove={vi.fn()} />);
		});

		// Open dropdown
		fireEvent.click(screen.getByRole('button'));

		await waitFor(() => {
			expect(screen.getByText('Loading…')).toBeInTheDocument();
		});
	});

	it('shows folders after loading', async () => {
		const apiFetch = (await import('@wordpress/api-fetch')).default;
		apiFetch.mockResolvedValue([
			{ id: 1, name: 'Images', parent: 0, children: [] },
			{ id: 2, name: 'Documents', parent: 0, children: [] },
		]);

		act(() => {
			render(<MoveToFolderMenu mediaId={1} currentFolderId={null} onMove={vi.fn()} />);
		});

		// Open dropdown
		fireEvent.click(screen.getByRole('button'));

		await waitFor(() => {
			expect(screen.getByText('Images')).toBeInTheDocument();
			expect(screen.getByText('Documents')).toBeInTheDocument();
		});
	});

	it('calls onMove when folder is selected', async () => {
		const apiFetch = (await import('@wordpress/api-fetch')).default;
		apiFetch.mockResolvedValue([
			{ id: 5, name: 'Photos', parent: 0, children: [] },
		]);

		const onMove = vi.fn();
		act(() => {
			render(<MoveToFolderMenu mediaId={42} currentFolderId={null} onMove={onMove} />);
		});

		// Open dropdown
		fireEvent.click(screen.getByRole('button'));

		await waitFor(() => {
			expect(screen.getByText('Photos')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText('Photos'));

		expect(onMove).toHaveBeenCalledWith(42, 5);
	});

	it('shows "Remove from folder" option', async () => {
		const apiFetch = (await import('@wordpress/api-fetch')).default;
		apiFetch.mockResolvedValue([]);

		act(() => {
			render(<MoveToFolderMenu mediaId={1} currentFolderId={2} onMove={vi.fn()} />);
		});

		fireEvent.click(screen.getByRole('button'));

		await waitFor(() => {
			expect(screen.getByText('Remove from folder')).toBeInTheDocument();
		});
	});
});
