/**
 * SuggestionNotice component.
 *
 * Displays AI-generated folder suggestions for a media attachment.
 * Allows users to apply suggestions or dismiss them.
 */

import { __, sprintf } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/components';

/**
 * SuggestionNotice component.
 *
 * @param {Object}   props
 * @param {number}   props.attachmentId The attachment ID.
 * @param {Array}    props.suggestions  Array of suggested folder names.
 * @param {Function} props.onApply      Called when user accepts suggestions.
 * @param {Function} props.onDismiss    Called when user dismisses suggestions.
 */
export function SuggestionNotice({ attachmentId, suggestions, onApply, onDismiss }) {
	if (!suggestions || suggestions.length === 0) {
		return null;
	}

	const message = sprintf(
		/* translators: %s: list of suggested folders */
		__('Suggested folders: %s', 'mediamanager'),
		suggestions.join(', ')
	);

	return (
		<Notice status="info" isDismissible={false} className="mm-suggestion-notice">
			<p>{message}</p>
			<div className="mm-suggestion-notice__actions">
				<Button
					variant="primary"
					onClick={() => onApply?.(attachmentId, suggestions)}
				>
					{__('Apply', 'mediamanager')}
				</Button>
				<Button
					variant="tertiary"
					onClick={() => onDismiss?.(attachmentId)}
				>
					{__('Dismiss', 'mediamanager')}
				</Button>
			</div>
		</Notice>
	);
}

export default SuggestionNotice;
