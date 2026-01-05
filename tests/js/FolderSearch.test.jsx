/**
 * Tests for the admin FolderSearch component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FolderSearch from '../../src/admin/components/FolderSearch';

// Mock WordPress dependencies
vi.mock('@wordpress/element', async () => {
	const React = await import('react');
	return {
		useState: React.useState,
		useRef: React.useRef,
		useEffect: React.useEffect,
		createPortal: (children) => children, // Don't use portal in tests
	};
});

vi.mock('@wordpress/i18n', () => ({
	__: (str) => str,
}));

vi.mock('@wordpress/components', () => ({
	Button: ({ children, onClick, icon, label, className, ...props }) => (
		<button onClick={onClick} className={className} aria-label={label} {...props}>
			{icon && <span data-testid="icon">{icon.name || 'icon'}</span>}
			{children}
		</button>
	),
}));

vi.mock('@wordpress/icons', () => ({
	search: { name: 'search' },
	closeSmall: { name: 'closeSmall' },
}));

describe('FolderSearch (Admin)', () => {
	let mockOnSearchChange;

	beforeEach(() => {
		mockOnSearchChange = vi.fn();
		// Mock the folder manager container for portal
		const container = document.createElement('div');
		container.className = 'vmf-folder-manager';
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	describe('Closed state', () => {
		it('renders search button when closed', () => {
			render(
				<FolderSearch
					searchQuery=""
					onSearchChange={mockOnSearchChange}
				/>
			);

			expect(screen.getByRole('button', { name: 'Search folders' })).toBeInTheDocument();
		});

		it('opens search field when button is clicked', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery=""
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));

			expect(screen.getByPlaceholderText('Search folders…')).toBeInTheDocument();
		});
	});

	describe('Open state', () => {
		it('renders search input when open', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery=""
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));

			expect(screen.getByPlaceholderText('Search folders…')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Close search' })).toBeInTheDocument();
		});

		it('calls onSearchChange when typing', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery=""
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));
			const input = screen.getByPlaceholderText('Search folders…');
			await user.type(input, 'test');

			expect(mockOnSearchChange).toHaveBeenCalledWith('t');
			expect(mockOnSearchChange).toHaveBeenCalledWith('e');
			expect(mockOnSearchChange).toHaveBeenCalledWith('s');
			expect(mockOnSearchChange).toHaveBeenCalledWith('t');
		});

		it('shows clear button when there is a query', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery="test"
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));

			expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
		});

		it('clears search when clear button is clicked', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery="test"
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));
			await user.click(screen.getByRole('button', { name: 'Clear search' }));

			expect(mockOnSearchChange).toHaveBeenCalledWith('');
		});

		it('closes and clears search when close button is clicked', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery="test"
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));
			await user.click(screen.getByRole('button', { name: 'Close search' }));

			expect(mockOnSearchChange).toHaveBeenCalledWith('');
			expect(screen.getByRole('button', { name: 'Search folders' })).toBeInTheDocument();
		});

		it('closes search when Escape is pressed', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery="test"
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));
			const input = screen.getByPlaceholderText('Search folders…');
			await user.type(input, '{Escape}');

			expect(mockOnSearchChange).toHaveBeenCalledWith('');
		});
	});

	describe('Accessibility', () => {
		it('has proper aria-label on search input', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery=""
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));

			// The input should have the aria-label
			const input = screen.getByPlaceholderText('Search folders…');
			expect(input).toHaveAttribute('aria-label', 'Search folders');
		});

		it('focuses input when opened', async () => {
			const user = userEvent.setup();
			render(
				<FolderSearch
					searchQuery=""
					onSearchChange={mockOnSearchChange}
				/>
			);

			await user.click(screen.getByRole('button', { name: 'Search folders' }));
			const input = screen.getByPlaceholderText('Search folders…');

			expect(document.activeElement).toBe(input);
		});
	});
});
