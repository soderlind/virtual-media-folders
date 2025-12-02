/**
 * BaseFolderItem component.
 *
 * Shared folder item component used by both Media Library and Gutenberg modal.
 * Accepts render props for customization (e.g., wrapping with DroppableFolder).
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Chevron icon for expand/collapse.
 *
 * @param {Object} props
 * @param {boolean} props.expanded Whether the folder is expanded.
 */
function ChevronIcon({ expanded }) {
	return (
		<svg 
			width="16" 
			height="16" 
			viewBox="0 0 24 24" 
			fill="none" 
			stroke="currentColor" 
			strokeWidth="2.5" 
			strokeLinecap="round" 
			strokeLinejoin="round"
		>
			{expanded 
				? <polyline points="6 9 12 15 18 9" />
				: <polyline points="9 6 15 12 9 18" />
			}
		</svg>
	);
}

/**
 * BaseFolderItem component.
 *
 * @param {Object}   props
 * @param {Object}   props.folder The folder object.
 * @param {number|string|null} props.selectedId Currently selected folder ID.
 * @param {Function} props.onSelect Called when folder is selected.
 * @param {number}   props.level Nesting level (0 = root).
 * @param {number|null} props.parentId Parent folder ID (null for root folders).
 * @param {Function} props.renderWrapper Optional wrapper for the button (e.g., DroppableFolder).
 * @param {boolean}  props.enableKeyboardNav Enable keyboard navigation (arrow keys).
 * @param {boolean}  props.enableAutoExpand Auto-expand when child is selected.
 * @param {boolean}  props.enableAria Enable full ARIA attributes.
 */
export default function BaseFolderItem({
	folder,
	selectedId,
	onSelect,
	level = 0,
	parentId = null,
	renderWrapper,
	enableKeyboardNav = false,
	enableAutoExpand = false,
	enableAria = false,
}) {
	// Check if any child (recursively) is selected
	const isChildSelected = (f) => {
		if (!f.children || f.children.length === 0) return false;
		return f.children.some(child => 
			child.id === selectedId || isChildSelected(child)
		);
	};
	
	// Auto-expand if a child is selected
	const shouldAutoExpand = enableAutoExpand && isChildSelected(folder);
	const [manualExpanded, setManualExpanded] = useState(shouldAutoExpand);
	const expanded = manualExpanded || shouldAutoExpand;
	
	const hasChildren = folder.children && folder.children.length > 0;
	const isSelected = selectedId === folder.id;
	
	// Keep expanded state in sync when child gets selected
	useEffect(() => {
		if (shouldAutoExpand && !manualExpanded) {
			setManualExpanded(true);
		}
	}, [shouldAutoExpand, manualExpanded]);

	// Handle keyboard navigation
	const handleKeyDown = (e) => {
		if (!enableKeyboardNav) return;
		
		if (e.key === 'ArrowRight' && hasChildren && !expanded) {
			e.preventDefault();
			setManualExpanded(true);
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			if (hasChildren && expanded) {
				// If expanded, collapse first
				setManualExpanded(false);
			} else if (parentId !== null) {
				// If collapsed or no children, move to parent folder
				onSelect(parentId);
			}
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onSelect(folder.id);
		}
	};

	const handleToggleClick = (e) => {
		e.stopPropagation();
		// If collapsing and a child is currently selected, move selection to this folder
		if (expanded && isChildSelected(folder)) {
			onSelect(folder.id);
		}
		setManualExpanded(!expanded);
	};

	const handleToggleKeyDown = (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			// If collapsing and a child is currently selected, move selection to this folder
			if (expanded && isChildSelected(folder)) {
				onSelect(folder.id);
			}
			setManualExpanded(!expanded);
		}
	};

	// The button content
	const buttonContent = (
		<button
			type="button"
			className={`mm-folder-button ${isSelected ? 'is-selected' : ''}`}
			style={{ paddingLeft: `${level * 16 + 8}px` }}
			onClick={() => onSelect(folder.id)}
			onKeyDown={enableKeyboardNav ? handleKeyDown : undefined}
			aria-current={isSelected ? 'true' : undefined}
			title={folder.name}
		>
			{hasChildren && (
				<span
					className="mm-folder-toggle"
					onClick={handleToggleClick}
					onKeyDown={enableKeyboardNav ? handleToggleKeyDown : undefined}
					role={enableKeyboardNav ? 'button' : undefined}
					tabIndex={enableKeyboardNav ? 0 : undefined}
					aria-label={expanded ? __('Collapse', 'mediamanager') : __('Expand', 'mediamanager')}
				>
					<ChevronIcon expanded={expanded} />
				</span>
			)}
			<span className="mm-folder-name">{folder.name}</span>
			{typeof folder.count === 'number' && (
				<span 
					className="mm-folder-count" 
					aria-label={enableAria ? `${folder.count} ${__('items', 'mediamanager')}` : undefined}
				>
					({folder.count})
				</span>
			)}
		</button>
	);

	// Wrap with custom wrapper if provided (e.g., DroppableFolder)
	const wrappedButton = renderWrapper 
		? renderWrapper({ folderId: folder.id, children: buttonContent })
		: buttonContent;

	// ARIA attributes for accessibility
	const listItemProps = enableAria 
		? {
			role: 'treeitem',
			'aria-expanded': hasChildren ? expanded : undefined,
			'aria-selected': isSelected,
		}
		: {};

	return (
		<li className="mm-folder-item" {...listItemProps}>
			{wrappedButton}
			{hasChildren && expanded && (
				<ul className="mm-folder-children" role={enableAria ? 'group' : undefined}>
					{folder.children.map((child) => (
						<BaseFolderItem
							key={child.id}
							folder={child}
							selectedId={selectedId}
							onSelect={onSelect}
							level={level + 1}
							parentId={folder.id}
							renderWrapper={renderWrapper}
							enableKeyboardNav={enableKeyboardNav}
							enableAutoExpand={enableAutoExpand}
							enableAria={enableAria}
						/>
					))}
				</ul>
			)}
		</li>
	);
}
