/**
 * FolderSidebar component for Gutenberg media modal.
 *
 * Renders a sidebar with folder tree for filtering media
 * in the block editor media modal.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Folder item component.
 */
function FolderItem({ folder, selectedId, onSelect, level = 0 }) {
	const [expanded, setExpanded] = useState(false);
	const hasChildren = folder.children && folder.children.length > 0;
	const isSelected = selectedId === folder.id;

	return (
		<li className="mm-folder-item">
			<button
				type="button"
				className={`mm-folder-button ${isSelected ? 'is-selected' : ''}`}
				style={{ paddingLeft: `${level * 16 + 8}px` }}
				onClick={() => onSelect(folder.id)}
				aria-current={isSelected ? 'true' : undefined}
			>
				{hasChildren && (
					<span
						className="mm-folder-toggle"
						onClick={(e) => {
							e.stopPropagation();
							setExpanded(!expanded);
						}}
						aria-label={expanded ? __('Collapse', 'mediamanager') : __('Expand', 'mediamanager')}
					>
						{expanded ? '▾' : '▸'}
					</span>
				)}
				<span className="mm-folder-name">{folder.name}</span>
				{typeof folder.count === 'number' && (
					<span className="mm-folder-count">({folder.count})</span>
				)}
			</button>
			{hasChildren && expanded && (
				<ul className="mm-folder-children">
					{folder.children.map((child) => (
						<FolderItem
							key={child.id}
							folder={child}
							selectedId={selectedId}
							onSelect={onSelect}
							level={level + 1}
						/>
					))}
				</ul>
			)}
		</li>
	);
}

/**
 * FolderSidebar component.
 *
 * @param {Object}   props
 * @param {Function} props.onFolderSelect Called when a folder is selected.
 */
export default function FolderSidebar({ onFolderSelect }) {
	const [folders, setFolders] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [uncategorizedCount, setUncategorizedCount] = useState(0);

	/**
	 * Build a hierarchical tree from flat taxonomy terms.
	 */
	function buildTree(terms) {
		const map = {};
		const roots = [];

		terms.forEach((term) => {
			map[term.id] = { ...term, children: [] };
		});

		terms.forEach((term) => {
			if (term.parent && map[term.parent]) {
				map[term.parent].children.push(map[term.id]);
			} else {
				roots.push(map[term.id]);
			}
		});

		return roots;
	}

	const fetchFolders = useCallback(async () => {
		try {
			const response = await apiFetch({
				path: '/wp/v2/media-folders?per_page=100&hierarchical=1',
			});

			const tree = buildTree(response);
			setFolders(tree);

			// Fetch total media count to calculate uncategorized
			const totalResponse = await apiFetch({ path: '/wp/v2/media?per_page=1', parse: false });
			const totalCount = parseInt(totalResponse.headers.get('X-WP-Total'), 10) || 0;

			let categorizedCount = 0;
			response.forEach((folder) => {
				categorizedCount += folder.count || 0;
			});

			setUncategorizedCount(Math.max(0, totalCount - categorizedCount));
		} catch (error) {
			console.error('Error fetching folders:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchFolders();
	}, [fetchFolders]);

	function handleSelect(folderId) {
		setSelectedId(folderId);
		onFolderSelect?.(folderId);
	}

	if (loading) {
		return (
			<div className="mm-folder-sidebar mm-folder-sidebar--loading">
				<p>{__('Loading…', 'mediamanager')}</p>
			</div>
		);
	}

	return (
		<div className="mm-folder-sidebar">
			<ul className="mm-folder-list">
				{/* All Media */}
				<li className="mm-folder-item">
					<button
						type="button"
						className={`mm-folder-button ${selectedId === null ? 'is-selected' : ''}`}
						onClick={() => handleSelect(null)}
						aria-current={selectedId === null ? 'true' : undefined}
					>
						<span className="mm-folder-name">{__('All Media', 'mediamanager')}</span>
					</button>
				</li>

				{/* Uncategorized */}
				<li className="mm-folder-item">
					<button
						type="button"
						className={`mm-folder-button ${selectedId === 'uncategorized' ? 'is-selected' : ''}`}
						onClick={() => handleSelect('uncategorized')}
						aria-current={selectedId === 'uncategorized' ? 'true' : undefined}
					>
						<span className="mm-folder-name">{__('Uncategorized', 'mediamanager')}</span>
						<span className="mm-folder-count">({uncategorizedCount})</span>
					</button>
				</li>

				{/* Folder tree */}
				{folders.map((folder) => (
					<FolderItem
						key={folder.id}
						folder={folder}
						selectedId={selectedId}
						onSelect={handleSelect}
					/>
				))}
			</ul>
		</div>
	);
}
