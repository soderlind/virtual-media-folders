import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FolderTree from '../../src/admin/components/FolderTree.jsx';

// Mock @wordpress/i18n - use actual module with our overrides
vi.mock('@wordpress/i18n', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		__: (text) => text,
	};
});

// Mock @wordpress/icons - use actual module
vi.mock('@wordpress/icons', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
	};
});

// Mock @wordpress/api-fetch
vi.mock('@wordpress/api-fetch', () => ({
	default: vi.fn(),
}));

import apiFetch from '@wordpress/api-fetch';

describe('FolderTree', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Mock successful API response
		apiFetch.mockImplementation(({ path, parse }) => {
			if (path.includes('media-folders')) {
				return Promise.resolve([
					{ id: 1, name: 'Images', parent: 0, count: 10 },
					{ id: 2, name: 'Documents', parent: 0, count: 5 },
					{ id: 3, name: 'Screenshots', parent: 1, count: 3 },
				]);
			}
			// Handle /wp/v2/media?per_page=1 call for total count (parse: false)
			if (path.includes('/wp/v2/media') && parse === false) {
				return Promise.resolve({
					headers: {
						get: (name) => (name === 'X-WP-Total' ? '25' : null),
					},
				});
			}
			if (path.includes('media_folder_exclude')) {
				return Promise.resolve({
					headers: {
						get: (name) => (name === 'X-WP-Total' ? '7' : null),
					},
				});
			}
			return Promise.resolve([]);
		});
	});

	it('renders loading state initially', () => {
		act(() => {
			render(<FolderTree onFolderSelect={() => {}} />);
		});
		expect(screen.getByText('Loading folders…')).toBeInTheDocument();
	});

	it('renders folder tree after loading', async () => {
		act(() => {
			render(<FolderTree onFolderSelect={() => {}} />);
		});

		await waitFor(() => {
			expect(screen.getByText('All Media')).toBeInTheDocument();
		});

		expect(screen.getByText('Uncategorized')).toBeInTheDocument();
		expect(screen.getByText('Images')).toBeInTheDocument();
		expect(screen.getByText('Documents')).toBeInTheDocument();
	});

	it('calls onFolderSelect when a folder is clicked', async () => {
		const onFolderSelect = vi.fn();
		act(() => {
			render(<FolderTree onFolderSelect={onFolderSelect} />);
		});

		await waitFor(() => {
			expect(screen.getByText('Images')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText('Images'));
		expect(onFolderSelect).toHaveBeenCalledWith(1);
	});

	it('selects All Media when clicked', async () => {
		const onFolderSelect = vi.fn();
		act(() => {
			render(<FolderTree onFolderSelect={onFolderSelect} />);
		});

		await waitFor(() => {
			expect(screen.getByText('All Media')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText('All Media'));
		expect(onFolderSelect).toHaveBeenCalledWith(null);
	});

	it('selects Uncategorized when clicked', async () => {
		const onFolderSelect = vi.fn();
		act(() => {
			render(<FolderTree onFolderSelect={onFolderSelect} />);
		});

		await waitFor(() => {
			expect(screen.getByText('Uncategorized')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText('Uncategorized'));
		expect(onFolderSelect).toHaveBeenCalledWith('uncategorized');
	});
});
