/**
 * MediaUploadFilter component tests.
 *
 * @package VirtualMediaFolders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock WordPress dependencies before importing the module
vi.mock('@wordpress/hooks', () => ({
	addFilter: vi.fn(),
}));

vi.mock('@wordpress/element', () => ({
	useState: vi.fn((initial) => [initial, vi.fn()]),
	useCallback: vi.fn((fn) => fn),
}));

vi.mock('@wordpress/compose', () => ({
	createHigherOrderComponent: vi.fn((fn, name) => {
		// Return a HOC that wraps the component
		return (WrappedComponent) => {
			const EnhancedComponent = (props) => {
				// The actual enhanced component logic would be here
				return fn(WrappedComponent)(props);
			};
			EnhancedComponent.displayName = name;
			return EnhancedComponent;
		};
	}),
}));

vi.mock('@wordpress/i18n', () => ({
	__: (str) => str,
}));

// Mock the FolderFilter component
vi.mock('../../../src/editor/components/FolderFilter.jsx', () => ({
	FolderFilter: () => null,
}));

// Import after mocks
import { addFilter } from '@wordpress/hooks';
import { registerMediaUploadFilter } from '../../../src/editor/components/MediaUploadFilter.jsx';

describe('MediaUploadFilter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('registerMediaUploadFilter', () => {
		it('should register filter with WordPress hooks', () => {
			registerMediaUploadFilter();

			expect(addFilter).toHaveBeenCalledWith(
				'editor.MediaUpload',
				'vmfo/folder-filter',
				expect.any(Function)
			);
		});

		it('should register with correct hook name', () => {
			registerMediaUploadFilter();

			expect(addFilter).toHaveBeenCalledWith(
				'editor.MediaUpload',
				expect.stringContaining('vmf'),
				expect.any(Function)
			);
		});

		it('should pass a HOC function as the filter', () => {
			registerMediaUploadFilter();

			const [, , hoc] = addFilter.mock.calls[0];
			expect(typeof hoc).toBe('function');
		});
	});
});
