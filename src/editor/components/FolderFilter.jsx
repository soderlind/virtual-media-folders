/**
 * Folder Filter component for Gutenberg media selection.
 *
 * Provides a dropdown to filter media by folder when selecting
 * images in the block editor.
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * FolderFilter component.
 *
 * @param {Object}   props
 * @param {Function} props.onFilterChange Callback when folder filter changes.
 * @param {string|number} props.value Current folder filter value.
 */
export function FolderFilter({ onFilterChange, value = '' }) {
	const [folders, setFolders] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchFolders() {
			try {
				const response = await apiFetch({
					path: '/wp/v2/media-folders?per_page=100',
				});

				// Build hierarchical options
				const options = buildOptions(response);
				setFolders(options);
			} catch (error) {
				console.error('Error fetching folders:', error);
			} finally {
				setLoading(false);
			}
		}

		fetchFolders();
	}, []);

	/**
	 * Build hierarchical select options from flat terms.
	 */
	function buildOptions(terms) {
		const map = {};
		const roots = [];

		// Create map
		terms.forEach((term) => {
			map[term.id] = { ...term, children: [] };
		});

		// Build tree
		terms.forEach((term) => {
			if (term.parent && map[term.parent]) {
				map[term.parent].children.push(map[term.id]);
			} else {
				roots.push(map[term.id]);
			}
		});

		// Flatten with indentation
		const options = [
			{ label: __('All Folders', 'virtual-media-folders'), value: '' },
			{ label: __('Uncategorized', 'virtual-media-folders'), value: 'uncategorized' },
		];

		function addToOptions(items, level = 0) {
			items.forEach((item) => {
				const prefix = '—'.repeat(level);
				options.push({
					label: level > 0 ? `${prefix} ${item.name}` : item.name,
					value: String(item.id),
				});
				if (item.children.length > 0) {
					addToOptions(item.children, level + 1);
				}
			});
		}

		addToOptions(roots);
		return options;
	}

	if (loading) {
		return (
			<SelectControl
				label={__('Folder', 'virtual-media-folders')}
				value=""
				options={[{ label: __('Loading…', 'virtual-media-folders'), value: '' }]}
				disabled
			/>
		);
	}

	return (
		<SelectControl
			label={__('Folder', 'virtual-media-folders')}
			value={String(value)}
			options={folders}
			onChange={(newValue) => onFilterChange(newValue)}
			className="vmf-folder-filter"
		/>
	);
}

export default FolderFilter;
