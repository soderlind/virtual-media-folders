/**
 * BaseFolderTree component.
 *
 * Shared folder tree component used by both Media Library and Gutenberg modal.
 * Renders the folder list with "All Media" and "Uncategorized" items.
 */

import { __ } from '@wordpress/i18n';
import BaseFolderItem from './BaseFolderItem';

/**
 * BaseFolderTree component.
 *
 * @param {Object}   props
 * @param {Array}    props.folders Hierarchical folder tree.
 * @param {number|string|null} props.selectedId Currently selected folder ID.
 * @param {Function} props.onSelect Called when folder is selected.
 * @param {number}   props.uncategorizedCount Count of uncategorized media.
 * @param {boolean}  props.showAllMedia Whether to show All Media option.
 * @param {boolean}  props.showUncategorized Whether to show Uncategorized folder.
 * @param {boolean}  props.loading Whether folders are loading.
 * @param {Function} props.renderWrapper Optional wrapper for folder buttons.
 * @param {Function} props.renderUncategorizedWrapper Optional wrapper for Uncategorized item.
 * @param {Function} props.renderHeader Optional header content (e.g., FolderManager).
 * @param {boolean}  props.enableKeyboardNav Enable keyboard navigation.
 * @param {boolean}  props.enableAutoExpand Auto-expand when child is selected.
 * @param {boolean}  props.enableAria Enable full ARIA attributes.
 * @param {boolean}  props.isMoveModeActive Whether keyboard move mode is active.
 * @param {string}   props.className Additional CSS class.
 * @param {string}   props.loadingText Custom loading text.
 */
export default function BaseFolderTree({
	folders,
	selectedId,
	onSelect,
	uncategorizedCount,
	showAllMedia = true,
	showUncategorized = true,
	loading,
	renderWrapper,
	renderUncategorizedWrapper,
	renderHeader,
	enableKeyboardNav = false,
	enableAutoExpand = false,
	enableAria = false,
	isMoveModeActive = false,
	className = '',
	loadingText,
}) {
	if (loading) {
		const baseClass = enableAria ? 'vmf-folder-tree' : 'vmf-folder-sidebar';
		return (
			<div 
				className={`${baseClass} ${baseClass}--loading ${className}`}
				aria-label={enableAria ? __('Media folders', 'virtual-media-folders') : undefined}
			>
				<p aria-live={enableAria ? 'polite' : undefined}>
					{loadingText || __('Loading…', 'virtual-media-folders')}
				</p>
			</div>
		);
	}

	// All Media button
	const allMediaButton = (
		<button
			type="button"
			className={`vmf-folder-button ${selectedId === null ? 'is-selected' : ''}`}
			onClick={() => onSelect(null)}
			aria-current={selectedId === null ? 'true' : undefined}
		>
			<span className="vmf-folder-name">{__('All Media', 'virtual-media-folders')}</span>
		</button>
	);

	// Uncategorized button
	const uncategorizedButton = (
		<button
			type="button"
			className={`vmf-folder-button ${selectedId === 'uncategorized' ? 'is-selected' : ''}`}
			onClick={() => onSelect('uncategorized')}
			aria-current={selectedId === 'uncategorized' ? 'true' : undefined}
		>
			<span className="vmf-folder-name">{__('Uncategorized', 'virtual-media-folders')}</span>
			<span 
				className="vmf-folder-count"
				aria-label={enableAria ? `${uncategorizedCount} ${__('items', 'virtual-media-folders')}` : undefined}
			>
				({uncategorizedCount})
			</span>
		</button>
	);

	// Wrap uncategorized if wrapper provided
	const wrappedUncategorized = renderUncategorizedWrapper
		? renderUncategorizedWrapper({ children: uncategorizedButton })
		: uncategorizedButton;

	const containerTag = enableAria ? 'nav' : 'div';
	const ContainerTag = containerTag;
	const baseClass = enableAria ? 'vmf-folder-tree' : 'vmf-folder-sidebar';

	return (
		<ContainerTag 
			className={`${baseClass} ${className}`}
			aria-label={enableAria ? __('Media folders', 'virtual-media-folders') : undefined}
		>
			{renderHeader && renderHeader()}
			<ul 
				className="vmf-folder-list" 
				role={enableAria ? 'tree' : undefined}
				aria-label={enableAria ? __('Folder tree', 'virtual-media-folders') : undefined}
			>
				{/* All Media - only shown if showAllMedia is true */}
				{showAllMedia && (
					<li 
						className="vmf-folder-item" 
						role={enableAria ? 'treeitem' : undefined}
						aria-selected={enableAria ? selectedId === null : undefined}
					>
						{allMediaButton}
					</li>
				)}

				{/* Uncategorized - only shown if showUncategorized is true */}
				{showUncategorized && (
					<li 
						className="vmf-folder-item" 
						role={enableAria ? 'treeitem' : undefined}
						aria-selected={enableAria ? selectedId === 'uncategorized' : undefined}
					>
						{wrappedUncategorized}
					</li>
				)}

				{/* Folder tree */}
				{folders.map((folder) => (
					<BaseFolderItem
						key={folder.id}
						folder={folder}
						selectedId={selectedId}
						onSelect={onSelect}
						renderWrapper={renderWrapper}
						enableKeyboardNav={enableKeyboardNav}
						enableAutoExpand={enableAutoExpand}
						enableAria={enableAria}
						isMoveModeActive={isMoveModeActive}
					/>
				))}
			</ul>
		</ContainerTag>
	);
}
