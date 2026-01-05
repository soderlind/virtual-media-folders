/**
 * FolderSearch component for Gutenberg media modal.
 *
 * Provides a search/filter input for folders in the sidebar.
 * Simpler version than admin - always visible inline search.
 */

import { useRef, useEffect, useState } from '@wordpress/element';
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

	if (!isOpen) {
		return (
			<Button
				icon={search}
				label={__('Search folders', 'virtual-media-folders')}
				onClick={handleOpen}
				className="vmf-editor-search-button"
				size="small"
				showTooltip={false}
			/>
		);
	}

	return (
		<div className="vmf-editor-search">
			<div className="vmf-editor-search__input-wrapper">
				<input
					ref={inputRef}
					type="text"
					className="vmf-editor-search__input"
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
						className="vmf-editor-search__clear"
						size="small"
						showTooltip={false}
					/>
				)}
			</div>
			<Button
				icon={closeSmall}
				label={__('Close search', 'virtual-media-folders')}
				onClick={handleClose}
				className="vmf-editor-search__close"
				size="small"
				showTooltip={false}
			/>
		</div>
	);
}
