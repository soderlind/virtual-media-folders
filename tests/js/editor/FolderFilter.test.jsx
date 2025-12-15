/**
 * FolderFilter component tests.
 *
 * @package VirtualMediaFolders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock WordPress dependencies
vi.mock('@wordpress/components', () => ({
	SelectControl: ({ label, value, options, onChange }) => (
		<label>
			{label}
			<select
				data-testid="folder-select"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</label>
	),
}));

vi.mock('@wordpress/api-fetch', () => ({
	default: vi.fn(),
}));

vi.mock('@wordpress/i18n', () => ({
	__: (str) => str,
	_x: (str) => str,
}));

// Import after mocks
import { FolderFilter } from '../../../src/editor/components/FolderFilter.jsx';
import apiFetch from '@wordpress/api-fetch';

describe('FolderFilter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render with default "All Folders" option', async () => {
		apiFetch.mockResolvedValue([]);

		render(<FolderFilter value="" onFilterChange={vi.fn()} />);

		await waitFor(() => {
			const select = screen.getByTestId('folder-select');
			expect(select).toBeDefined();
		});
	});

	it('should fetch folders from REST API on mount', async () => {
		const mockFolders = [
			{ id: 1, name: 'Photos', parent: 0 },
			{ id: 2, name: 'Documents', parent: 0 },
		];
		apiFetch.mockResolvedValue(mockFolders);

		render(<FolderFilter value="" onFilterChange={vi.fn()} />);

		await waitFor(() => {
			expect(apiFetch).toHaveBeenCalledWith({
				path: '/wp/v2/vmfo_folder?per_page=100',
			});
		});
	});

	it('should call onFilterChange when selection changes', async () => {
		const mockFolders = [{ id: 1, name: 'Photos', parent: 0 }];
		apiFetch.mockResolvedValue(mockFolders);
		const onFilterChange = vi.fn();

		render(<FolderFilter value="" onFilterChange={onFilterChange} />);

		await waitFor(() => {
			expect(screen.getByTestId('folder-select')).toBeDefined();
		});

		const user = userEvent.setup();
		const select = screen.getByTestId('folder-select');
		await user.selectOptions(select, '1');

		expect(onFilterChange).toHaveBeenCalledWith('1');
	});

	it('should include Uncategorized option', async () => {
		apiFetch.mockResolvedValue([]);

		render(<FolderFilter value="" onFilterChange={vi.fn()} />);

		await waitFor(() => {
			const select = screen.getByTestId('folder-select');
			const options = select.querySelectorAll('option');
			const optionValues = Array.from(options).map((opt) => opt.value);
			expect(optionValues).toContain('uncategorized');
		});
	});

	it('should show selected folder value', async () => {
		apiFetch.mockResolvedValue([{ id: 1, name: 'Photos', parent: 0 }]);

		render(<FolderFilter value="1" onFilterChange={vi.fn()} />);

		await waitFor(() => {
			const select = screen.getByTestId('folder-select');
			expect(select.value).toBe('1');
		});
	});

	it('should handle API error gracefully', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		apiFetch.mockRejectedValue(new Error('API Error'));

		// Should not throw
		render(<FolderFilter value="" onFilterChange={vi.fn()} />);

		await waitFor(() => {
			const select = screen.getByTestId('folder-select');
			expect(select).toBeDefined();
		});

		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});

	it('should indent child folders in the list', async () => {
		const mockFolders = [
			{ id: 1, name: 'Photos', parent: 0 },
			{ id: 2, name: 'Vacation', parent: 1 },
		];
		apiFetch.mockResolvedValue(mockFolders);

		render(<FolderFilter value="" onFilterChange={vi.fn()} />);

		await waitFor(() => {
			const select = screen.getByTestId('folder-select');
			const options = Array.from(select.querySelectorAll('option'));
			const vacationOption = options.find((opt) => opt.value === '2');
			// The label should be indented with "— "
			expect(vacationOption?.textContent).toContain('—');
		});
	});
});
