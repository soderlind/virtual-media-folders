/**
 * FolderTree component.
 *
 * Renders a hierarchical tree of media folders with an "Uncategorized"
 * virtual folder for media without any folder assignment.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Icon, listView } from '@wordpress/icons';
import { DroppableFolder } from './DroppableFolder';
import FolderManager from './FolderManager';
import BulkFolderAction from './BulkFolderAction';

/**
 * Folder item component.
 *
 * @param {Object}   props
 * @param {Object}   props.folder
 * @param {number}   props.selectedId
 * @param {Function} props.onSelect
 * @param {number}   props.level
 */
function FolderItem({ folder, selectedId, onSelect, level = 0 }) {
	// Check if any child (recursively) is selected
	const isChildSelected = (f) => {
		if (!f.children || f.children.length === 0) return false;
		return f.children.some(child => 
			child.id === selectedId || isChildSelected(child)
		);
	};
	
	// Auto-expand if a child is selected OR if this folder itself is selected (to keep siblings visible)
	const shouldAutoExpand = isChildSelected(folder);
	const [manualExpanded, setManualExpanded] = useState(shouldAutoExpand);
	const expanded = manualExpanded || shouldAutoExpand;
	
	const hasChildren = folder.children && folder.children.length > 0;
	const isSelected = selectedId === folder.id;
	
	// Keep expanded state in sync when child gets selected
	useEffect(() => {
		if (shouldAutoExpand && !manualExpanded) {
			setManualExpanded(true);
		}
	}, [shouldAutoExpand]);

	return (
		<li className="mm-folder-item">
			<DroppableFolder folderId={folder.id}>
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
								setManualExpanded(!expanded);
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
			</DroppableFolder>
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
 * FolderTree component.
 *
 * @param {Object}   props
 * @param {Function} props.onFolderSelect Called when a folder is selected.
 */
export default function FolderTree({ onFolderSelect }) {
	const [folders, setFolders] = useState([]);
	const [flatFolders, setFlatFolders] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [uncategorizedCount, setUncategorizedCount] = useState(0);

	/**
	 * Build a hierarchical tree from flat taxonomy terms.
	 *
	 * @param {Array} terms Flat array of term objects with parent property.
	 * @return {Array} Nested tree structure.
	 */
	function buildTree(terms) {
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

		return roots;
	}

	// Fetch folders from REST API
	const fetchFolders = useCallback(async () => {
		try {
			const response = await apiFetch({
				path: '/wp/v2/media-folders?per_page=100&hierarchical=1',
			});

			// Store flat list for manager
			setFlatFolders(response);

			// Build tree structure
			const tree = buildTree(response);
			setFolders(tree);

			// Fetch total media count to calculate uncategorized
			const totalResponse = await apiFetch({ path: '/wp/v2/media?per_page=1', parse: false });
			const totalCount = parseInt(totalResponse.headers.get('X-WP-Total'), 10) || 0;

			// Calculate uncategorized as total minus sum of folder counts
			let categorizedCount = 0;
			response.forEach((folder) => {
				categorizedCount += folder.count || 0;
			});

			// Account for items in multiple folders (use max of 0)
			setUncategorizedCount(Math.max(0, totalCount - categorizedCount));
		} catch (error) {
			console.error('Error fetching folders:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		// Get initial folder from URL
		const params = new URLSearchParams(window.location.search);
		const urlFolder = params.get('mm_folder');
		if (urlFolder) {
			setSelectedId(urlFolder === 'uncategorized' ? 'uncategorized' : parseInt(urlFolder, 10));
		}

		fetchFolders();
		
		// Expose refresh function globally
		window.mediaManagerRefreshFolders = fetchFolders;
		
		// Expose folder selection function globally (for drop-to-folder navigation)
		window.mediaManagerSelectFolder = (folderId) => {
			setSelectedId(folderId);
			onFolderSelect?.(folderId);
		};
		
		return () => {
			delete window.mediaManagerRefreshFolders;
			delete window.mediaManagerSelectFolder;
		};
	}, [fetchFolders, onFolderSelect]);

	function handleSelect(folderId) {
		setSelectedId(folderId);
		onFolderSelect?.(folderId);
	}

	if (loading) {
		return (
			<div className="mm-folder-tree mm-folder-tree--loading">
				<p>{__('Loading folders…', 'mediamanager')}</p>
			</div>
		);
	}

	return (
		<div className="mm-folder-tree">
			<FolderManager
				folders={flatFolders}
				selectedId={selectedId}
				onRefresh={fetchFolders}
			/>
			<BulkFolderAction onComplete={fetchFolders} />
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

				{/* Uncategorized (virtual) - droppable to remove from folders */}
				<li className="mm-folder-item">
					<DroppableFolder folderId="uncategorized">
						<button
							type="button"
							className={`mm-folder-button ${selectedId === 'uncategorized' ? 'is-selected' : ''}`}
							onClick={() => handleSelect('uncategorized')}
							aria-current={selectedId === 'uncategorized' ? 'true' : undefined}
						>
							<span className="mm-folder-name">{__('Uncategorized', 'mediamanager')}</span>
							<span className="mm-folder-count">({uncategorizedCount})</span>
						</button>
					</DroppableFolder>
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
