/**
 * LiveRegion component.
 *
 * Provides an ARIA live region for screen reader announcements.
 * Use with useAnnounce hook for accessible drag-drop and folder operations.
 */

import { __ } from '@wordpress/i18n';

/**
 * LiveRegion component.
 *
 * @param {Object} props
 * @param {string} props.announcement The message to announce to screen readers.
 * @return {JSX.Element} The live region element.
 */
export function LiveRegion({ announcement }) {
	return (
		<>
			{/* Live region for polite announcements (most operations) */}
			<div 
				aria-live="polite" 
				aria-atomic="true" 
				className="vmf-sr-only"
				role="status"
			>
				{announcement}
			</div>
			
			{/* Hidden instructions for screen readers */}
			<div id="vmf-drag-instructions" className="vmf-sr-only">
				{__('Press Space or Enter to start dragging. Use arrow keys to move. Press Space or Enter again to drop, or Escape to cancel.', 'virtual-media-folders')}
			</div>
		</>
	);
}

export default LiveRegion;
