/**
 * MoveModeBanner component.
 *
 * Displays a sticky banner when keyboard move mode is active,
 * showing the number of items picked up and a cancel button.
 */

import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { sprintf } from '@wordpress/i18n';

/**
 * MoveModeBanner component.
 *
 * @param {Object}   props
 * @param {number}   props.itemCount Number of items picked up.
 * @param {Function} props.onCancel  Called when cancel is clicked.
 */
export default function MoveModeBanner({ itemCount, onCancel }) {
	const message = itemCount === 1
		? __('1 item ready to move', 'virtual-media-folders')
		: sprintf(
			/* translators: %d: number of items */
			__('%d items ready to move', 'virtual-media-folders'),
			itemCount
		);

	return (
		<div 
			className="vmf-move-mode-banner" 
			role="status"
			aria-live="polite"
		>
			<span className="vmf-move-mode-banner__message">
				{message}
			</span>
			<span className="vmf-move-mode-banner__instructions">
				{__('Navigate to a folder and press Enter to drop', 'virtual-media-folders')}
			</span>
			<Button
				variant="secondary"
				size="small"
				onClick={onCancel}
				className="vmf-move-mode-banner__cancel"
			>
				{__('Cancel', 'virtual-media-folders')}
			</Button>
		</div>
	);
}
