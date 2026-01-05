/**
 * FolderSearch component.
 *
 * Provides a search/filter input for folders in the sidebar header.
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import { createPortal } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { search, closeSmall } from '@wordpress/icons';

/**
 * FolderSearch component.
 *
 * @param {Object}   props
 * @param {string}   props.searchQuery Current search query.
 * @param {Function} props.onSearchChange Called when search query changes.
 */
export default function FolderSearch({ searchQuery, onSearchChange }) {
	const [isOpen, setIsOpen] = useState(false);
	const inputRef = useRef(null);
	const containerRef = useRef(null);

	// Focus input when opening
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	// Close search when pressing Escape
	const handleKeyDown = (e) => {
		if (e.key === 'Escape') {
			handleClose();
		}
	};

	const handleOpen = () => {
		setIsOpen(true);
	};

	const handleClose = () => {
		setIsOpen(false);
		onSearchChange('');
	};

	const handleChange = (e) => {
		onSearchChange(e.target.value);
	};

	const handleClear = () => {
		onSearchChange('');
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	// Find the folder manager container to render the overlay
	const getOverlayContainer = () => {
		return document.querySelector('.vmf-folder-manager');
	};

	const searchButton = (
		<Button
			ref={containerRef}
			icon={search}
			label={__('Search folders', 'virtual-media-folders')}
			onClick={handleOpen}
			className="vmf-folder-manager-button vmf-folder-search-button"
			size="small"
			showTooltip={false}
		/>
	);

	const searchField = isOpen && getOverlayContainer() ? createPortal(
		<div className="vmf-folder-search">
			<div className="vmf-folder-search__input-wrapper">
				<input
					ref={inputRef}
					type="text"
					className="vmf-folder-search__input"
					placeholder={__('Search folders…', 'virtual-media-folders')}
					value={searchQuery}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					aria-label={__('Search folders', 'virtual-media-folders')}
				/>
				{searchQuery && (
					<Button
						icon={closeSmall}
						label={__('Clear search', 'virtual-media-folders')}
						onClick={handleClear}
						className="vmf-folder-search__clear"
						size="small"
						showTooltip={false}
					/>
				)}
			</div>
			<Button
				icon={closeSmall}
				label={__('Close search', 'virtual-media-folders')}
				onClick={handleClose}
				className="vmf-folder-manager-button vmf-folder-search__close"
				size="small"
				showTooltip={false}
			/>
		</div>,
		getOverlayContainer()
	) : null;

	return (
		<>
			{searchButton}
			{searchField}
		</>
	);
}
