import { __, sprintf } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/components';

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
