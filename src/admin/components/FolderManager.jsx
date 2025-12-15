/**
 * FolderManager component.
 *
 * Provides create, rename, and delete functionality for folders.
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Button, Modal, TextControl, SelectControl } from '@wordpress/components';
import { plus, pencil, trash } from '@wordpress/icons';

/**
 * FolderManager component.
 *
 * @param {Object}   props
 * @param {Array}    props.folders      Current folder list.
 * @param {number}   props.selectedId   Currently selected folder ID.
 * @param {Function} props.onRefresh    Called after folder changes.
 * @param {Function} props.onDelete     Called after folder deletion (receives new folder to select).
 */
export default function FolderManager({ folders = [], selectedId, onRefresh, onDelete }) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [newFolderParent, setNewFolderParent] = useState(0);
	const [renameFolderName, setRenameFolderName] = useState('');
	const [renameFolderParent, setRenameFolderParent] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState('');

	// Get current folder for rename/delete operations
	const currentFolder = folders.find(f => f.id === selectedId);

	/**
	 * Build hierarchical folder options with indentation.
	 *
	 * @param {Array}   folderList  All folders.
	 * @param {number}  parentId    Parent folder ID to start from.
	 * @param {number}  depth       Current nesting depth.
	 * @param {number}  excludeId   Folder ID to exclude (and its descendants).
	 * @return {Array} Flattened array of options with visual hierarchy.
	 */
	function buildHierarchicalOptions(folderList, parentId = 0, depth = 0, excludeId = null) {
		let options = [];
		const children = folderList.filter(f => f.parent === parentId);

		for (const folder of children) {
			// Skip excluded folder and its descendants (for move operations)
			if (excludeId !== null && folder.id === excludeId) {
				continue;
			}
			const indent = depth > 0 ? '— '.repeat(depth) : '';
			options.push({
				label: indent + folder.name,
				value: String(folder.id),
			});
			options = options.concat(
				buildHierarchicalOptions(folderList, folder.id, depth + 1, excludeId)
			);
		}

		return options;
	}

	/**
	 * Build parent folder options for creating a new folder.
	 * Includes all folders since we're creating a new one.
	 * Note: SelectControl requires string values.
	 */
	function getParentOptions() {
		return [
			{ label: __('None (top level)', 'virtual-media-folders'), value: '0' },
			...buildHierarchicalOptions(folders),
		];
	}

	/**
	 * Build parent folder options for renaming/moving a folder.
	 * Excludes the current folder and its descendants to prevent circular references.
	 * Note: SelectControl requires string values.
	 */
	function getRenameParentOptions() {
		return [
			{ label: __('None (top level)', 'virtual-media-folders'), value: '0' },
			...buildHierarchicalOptions(folders, 0, 0, selectedId),
		];
	}

	/**
	 * Create a new folder.
	 */
	async function handleCreate() {
		if (!newFolderName.trim()) {
			setError(__('Please enter a folder name.', 'virtual-media-folders'));
			return;
		}

		setIsProcessing(true);
		setError('');

		try {
			await apiFetch({
				path: '/vmfo/v1/folders',
				method: 'POST',
				data: {
					name: newFolderName.trim(),
					parent: newFolderParent,
				},
			});

			setNewFolderName('');
			setNewFolderParent(0);
			setIsCreateOpen(false);
			showNotice(__('Folder created.', 'virtual-media-folders'), 'success');
			onRefresh?.();
		} catch (err) {
			setError(err.message || __('Failed to create folder.', 'virtual-media-folders'));
		} finally {
			setIsProcessing(false);
		}
	}

	/**
	 * Rename the selected folder.
	 */
	async function handleRename() {
		if (!renameFolderName.trim()) {
			setError(__('Please enter a folder name.', 'virtual-media-folders'));
			return;
		}

		if (!selectedId || typeof selectedId !== 'number') {
			return;
		}

		setIsProcessing(true);
		setError('');

		try {
			await apiFetch({
				path: `/vmfo/v1/folders/${selectedId}`,
				method: 'PUT',
				data: {
					name: renameFolderName.trim(),
					parent: renameFolderParent,
				},
			});

			setRenameFolderName('');
			setRenameFolderParent(0);
			setIsRenameOpen(false);
			showNotice(__('Folder updated.', 'virtual-media-folders'), 'success');
			onRefresh?.();
		} catch (err) {
			setError(err.message || __('Failed to update folder.', 'virtual-media-folders'));
		} finally {
			setIsProcessing(false);
		}
	}

	/**
	 * Delete the selected folder.
	 */
	async function handleDelete() {
		if (!selectedId || typeof selectedId !== 'number') {
			return;
		}

		// Store folder name before deletion for announcement
		const deletedFolderName = currentFolder?.name;

		setIsProcessing(true);
		setError('');

		try {
			await apiFetch({
				path: `/vmfo/v1/folders/${selectedId}`,
				method: 'DELETE',
			});

			setIsDeleteOpen(false);
			showNotice(__('Folder deleted.', 'virtual-media-folders'), 'success');
			
			// Move focus to Uncategorized if it has items, otherwise All Media
			// Pass deleted folder name for screen reader announcement
			onDelete?.(deletedFolderName);
			onRefresh?.();
		} catch (err) {
			setError(err.message || __('Failed to delete folder.', 'virtual-media-folders'));
		} finally {
			setIsProcessing(false);
		}
	}

	/**
	 * Open rename modal with current name and parent.
	 */
	function openRenameModal() {
		if (currentFolder) {
			setRenameFolderName(currentFolder.name);
			setRenameFolderParent(currentFolder.parent || 0);
			setError('');
			setIsRenameOpen(true);
		}
	}

	/**
	 * Show a temporary notice.
	 */
	function showNotice(message, type = 'success') {
		const notice = document.createElement('div');
		notice.className = `notice notice-${type} vmf-notice is-dismissible`;
		const p = document.createElement('p');
		p.textContent = String(message ?? '');
		notice.appendChild(p);
		notice.style.cssText = 'position: fixed; top: 40px; right: 20px; z-index: 100000; max-width: 300px;';
		document.body.appendChild(notice);
		setTimeout(() => notice.remove(), 3000);
	}

	const canModifyFolder = selectedId && typeof selectedId === 'number';

	return (
		<div className="vmf-folder-manager" onClick={(e) => e.stopPropagation()}>
			<div className="vmf-folder-manager-buttons">
				<Button
					icon={plus}
					aria-label={__('Create Folder', 'virtual-media-folders')}
					onClick={(e) => {
						e.stopPropagation();
						setError('');
						// Pre-select the currently selected folder as parent if it's a valid folder
						const isValidFolder = folders.some(f => f.id === selectedId);
						setNewFolderParent(isValidFolder ? selectedId : 0);
						setIsCreateOpen(true);
					}}
					className="vmf-folder-manager-button"
					size="small"
					showTooltip={false}
				/>
				<Button
					icon={pencil}
					aria-label={__('Rename Folder', 'virtual-media-folders')}
					onClick={(e) => {
						e.stopPropagation();
						openRenameModal();
					}}
					disabled={!canModifyFolder}
					className="vmf-folder-manager-button"
					size="small"
					showTooltip={false}
				/>
				<Button
					icon={trash}
					aria-label={__('Delete Folder', 'virtual-media-folders')}
					onClick={(e) => {
						e.stopPropagation();
						setError('');
						setIsDeleteOpen(true);
					}}
					disabled={!canModifyFolder}
					className="vmf-folder-manager-button"
					isDestructive
					size="small"
					showTooltip={false}
				/>
			</div>

			{/* Create Modal */}
			{isCreateOpen && (
				<Modal
					title={__('Create Folder', 'virtual-media-folders')}
					onRequestClose={() => setIsCreateOpen(false)}
					className="vmf-folder-modal"
				>
					<TextControl
						label={__('Folder Name', 'virtual-media-folders')}
						value={newFolderName}
						onChange={setNewFolderName}
						placeholder={__('Enter folder name', 'virtual-media-folders')}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={__('Parent Folder', 'virtual-media-folders')}
						value={String(newFolderParent)}
						options={getParentOptions()}
						onChange={(value) => setNewFolderParent(parseInt(value, 10))}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					{error && <p className="vmf-folder-modal-error">{error}</p>}
					<div className="vmf-folder-modal-actions">
						<Button
							variant="secondary"
							onClick={() => setIsCreateOpen(false)}
							disabled={isProcessing}
						>
							{__('Cancel', 'virtual-media-folders')}
						</Button>
						<Button
							variant="primary"
							onClick={handleCreate}
							disabled={isProcessing}
						>
							{isProcessing ? __('Creating…', 'virtual-media-folders') : __('Create', 'virtual-media-folders')}
						</Button>
					</div>
				</Modal>
			)}

			{/* Rename Modal */}
			{isRenameOpen && (
				<Modal
					title={__('Edit Folder', 'virtual-media-folders')}
					onRequestClose={() => setIsRenameOpen(false)}
					className="vmf-folder-modal"
				>
					<TextControl
						label={__('Folder Name', 'virtual-media-folders')}
						value={renameFolderName}
						onChange={setRenameFolderName}
						placeholder={__('Enter folder name', 'virtual-media-folders')}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={__('Parent Folder', 'virtual-media-folders')}
						value={String(renameFolderParent)}
						options={getRenameParentOptions()}
						onChange={(value) => setRenameFolderParent(parseInt(value, 10))}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					{error && <p className="vmf-folder-modal-error">{error}</p>}
					<div className="vmf-folder-modal-actions">
						<Button
							variant="secondary"
							onClick={() => setIsRenameOpen(false)}
							disabled={isProcessing}
						>
							{__('Cancel', 'virtual-media-folders')}
						</Button>
						<Button
							variant="primary"
							onClick={handleRename}
							disabled={isProcessing}
						>
							{isProcessing ? __('Saving…', 'virtual-media-folders') : __('Save', 'virtual-media-folders')}
						</Button>
					</div>
				</Modal>
			)}

			{/* Delete Confirmation Modal */}
			{isDeleteOpen && (
				<Modal
					title={__('Delete Folder', 'virtual-media-folders')}
					onRequestClose={() => setIsDeleteOpen(false)}
					className="vmf-folder-modal"
				>
					<p>
						{sprintf(
							/* translators: %s: folder name */
							__('Are you sure you want to delete the folder "%s"?', 'virtual-media-folders'),
							currentFolder?.name || ''
						)}
					</p>
					<p className="vmf-folder-modal-warning">
						{__('Media items in this folder will not be deleted, only the folder organization.', 'virtual-media-folders')}
					</p>
					{error && <p className="vmf-folder-modal-error">{error}</p>}
					<div className="vmf-folder-modal-actions">
						<Button
							variant="secondary"
							onClick={() => setIsDeleteOpen(false)}
							disabled={isProcessing}
						>
							{__('Cancel', 'virtual-media-folders')}
						</Button>
						<Button
							variant="primary"
							isDestructive
							onClick={handleDelete}
							disabled={isProcessing}
						>
							{isProcessing ? __('Deleting…', 'virtual-media-folders') : __('Delete', 'virtual-media-folders')}
						</Button>
					</div>
				</Modal>
			)}
		</div>
	);
}
