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
 */
export default function FolderManager({ folders = [], selectedId, onRefresh }) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [newFolderParent, setNewFolderParent] = useState(0);
	const [renameFolderName, setRenameFolderName] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState('');

	// Get current folder for rename/delete operations
	const currentFolder = folders.find(f => f.id === selectedId);

	/**
	 * Build parent folder options.
	 */
	function getParentOptions() {
		const options = [{ label: __('None (top level)', 'mediamanager'), value: 0 }];
		folders.forEach(folder => {
			// Don't allow selecting current folder or its children as parent
			if (folder.id !== selectedId) {
				options.push({ label: folder.name, value: folder.id });
			}
		});
		return options;
	}

	/**
	 * Create a new folder.
	 */
	async function handleCreate() {
		if (!newFolderName.trim()) {
			setError(__('Please enter a folder name.', 'mediamanager'));
			return;
		}

		setIsProcessing(true);
		setError('');

		try {
			await apiFetch({
				path: '/mediamanager/v1/folders',
				method: 'POST',
				data: {
					name: newFolderName.trim(),
					parent: newFolderParent,
				},
			});

			setNewFolderName('');
			setNewFolderParent(0);
			setIsCreateOpen(false);
			showNotice(__('Folder created.', 'mediamanager'), 'success');
			onRefresh?.();
		} catch (err) {
			setError(err.message || __('Failed to create folder.', 'mediamanager'));
		} finally {
			setIsProcessing(false);
		}
	}

	/**
	 * Rename the selected folder.
	 */
	async function handleRename() {
		if (!renameFolderName.trim()) {
			setError(__('Please enter a folder name.', 'mediamanager'));
			return;
		}

		if (!selectedId || typeof selectedId !== 'number') {
			return;
		}

		setIsProcessing(true);
		setError('');

		try {
			await apiFetch({
				path: `/mediamanager/v1/folders/${selectedId}`,
				method: 'PUT',
				data: {
					name: renameFolderName.trim(),
				},
			});

			setRenameFolderName('');
			setIsRenameOpen(false);
			showNotice(__('Folder renamed.', 'mediamanager'), 'success');
			onRefresh?.();
		} catch (err) {
			setError(err.message || __('Failed to rename folder.', 'mediamanager'));
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

		setIsProcessing(true);
		setError('');

		try {
			await apiFetch({
				path: `/mediamanager/v1/folders/${selectedId}`,
				method: 'DELETE',
			});

			setIsDeleteOpen(false);
			showNotice(__('Folder deleted.', 'mediamanager'), 'success');
			onRefresh?.();
		} catch (err) {
			setError(err.message || __('Failed to delete folder.', 'mediamanager'));
		} finally {
			setIsProcessing(false);
		}
	}

	/**
	 * Open rename modal with current name.
	 */
	function openRenameModal() {
		if (currentFolder) {
			setRenameFolderName(currentFolder.name);
			setError('');
			setIsRenameOpen(true);
		}
	}

	/**
	 * Show a temporary notice.
	 */
	function showNotice(message, type = 'success') {
		const notice = document.createElement('div');
		notice.className = `notice notice-${type} mm-notice is-dismissible`;
		notice.innerHTML = `<p>${message}</p>`;
		notice.style.cssText = 'position: fixed; top: 40px; right: 20px; z-index: 100000; max-width: 300px;';
		document.body.appendChild(notice);
		setTimeout(() => notice.remove(), 3000);
	}

	const canModifyFolder = selectedId && typeof selectedId === 'number';

	return (
		<div className="mm-folder-manager" onClick={(e) => e.stopPropagation()}>
			<div className="mm-folder-manager-buttons">
				<Button
					icon={plus}
					aria-label={__('Create Folder', 'mediamanager')}
					onClick={(e) => {
						e.stopPropagation();
						setError('');
						setIsCreateOpen(true);
					}}
					className="mm-folder-manager-button"
					size="small"
					showTooltip={false}
				/>
				<Button
					icon={pencil}
					aria-label={__('Rename Folder', 'mediamanager')}
					onClick={(e) => {
						e.stopPropagation();
						openRenameModal();
					}}
					disabled={!canModifyFolder}
					className="mm-folder-manager-button"
					size="small"
					showTooltip={false}
				/>
				<Button
					icon={trash}
					aria-label={__('Delete Folder', 'mediamanager')}
					onClick={(e) => {
						e.stopPropagation();
						setError('');
						setIsDeleteOpen(true);
					}}
					disabled={!canModifyFolder}
					className="mm-folder-manager-button"
					isDestructive
					size="small"
					showTooltip={false}
				/>
			</div>

			{/* Create Modal */}
			{isCreateOpen && (
				<Modal
					title={__('Create Folder', 'mediamanager')}
					onRequestClose={() => setIsCreateOpen(false)}
					className="mm-folder-modal"
				>
					<TextControl
						label={__('Folder Name', 'mediamanager')}
						value={newFolderName}
						onChange={setNewFolderName}
						placeholder={__('Enter folder name', 'mediamanager')}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={__('Parent Folder', 'mediamanager')}
						value={newFolderParent}
						options={getParentOptions()}
						onChange={(value) => setNewFolderParent(parseInt(value, 10))}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					{error && <p className="mm-folder-modal-error">{error}</p>}
					<div className="mm-folder-modal-actions">
						<Button
							variant="secondary"
							onClick={() => setIsCreateOpen(false)}
							disabled={isProcessing}
						>
							{__('Cancel', 'mediamanager')}
						</Button>
						<Button
							variant="primary"
							onClick={handleCreate}
							disabled={isProcessing}
						>
							{isProcessing ? __('Creating…', 'mediamanager') : __('Create', 'mediamanager')}
						</Button>
					</div>
				</Modal>
			)}

			{/* Rename Modal */}
			{isRenameOpen && (
				<Modal
					title={__('Rename Folder', 'mediamanager')}
					onRequestClose={() => setIsRenameOpen(false)}
					className="mm-folder-modal"
				>
					<TextControl
						label={__('New Name', 'mediamanager')}
						value={renameFolderName}
						onChange={setRenameFolderName}
						placeholder={__('Enter new name', 'mediamanager')}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					{error && <p className="mm-folder-modal-error">{error}</p>}
					<div className="mm-folder-modal-actions">
						<Button
							variant="secondary"
							onClick={() => setIsRenameOpen(false)}
							disabled={isProcessing}
						>
							{__('Cancel', 'mediamanager')}
						</Button>
						<Button
							variant="primary"
							onClick={handleRename}
							disabled={isProcessing}
						>
							{isProcessing ? __('Renaming…', 'mediamanager') : __('Rename', 'mediamanager')}
						</Button>
					</div>
				</Modal>
			)}

			{/* Delete Confirmation Modal */}
			{isDeleteOpen && (
				<Modal
					title={__('Delete Folder', 'mediamanager')}
					onRequestClose={() => setIsDeleteOpen(false)}
					className="mm-folder-modal"
				>
					<p>
						{sprintf(
							/* translators: %s: folder name */
							__('Are you sure you want to delete the folder "%s"?', 'mediamanager'),
							currentFolder?.name || ''
						)}
					</p>
					<p className="mm-folder-modal-warning">
						{__('Media items in this folder will not be deleted, only the folder organization.', 'mediamanager')}
					</p>
					{error && <p className="mm-folder-modal-error">{error}</p>}
					<div className="mm-folder-modal-actions">
						<Button
							variant="secondary"
							onClick={() => setIsDeleteOpen(false)}
							disabled={isProcessing}
						>
							{__('Cancel', 'mediamanager')}
						</Button>
						<Button
							variant="primary"
							isDestructive
							onClick={handleDelete}
							disabled={isProcessing}
						>
							{isProcessing ? __('Deleting…', 'mediamanager') : __('Delete', 'mediamanager')}
						</Button>
					</div>
				</Modal>
			)}
		</div>
	);
}
