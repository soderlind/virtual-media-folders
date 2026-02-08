/**
 * Status Indicator Component.
 *
 * Displays the add-on's enabled/disabled status.
 *
 * @package VirtualMediaFolders
 */

import { __ } from '@wordpress/i18n';

/**
 * Status Indicator component.
 *
 * @param {Object}  props           Component props.
 * @param {boolean} props.enabled   Whether the add-on is enabled.
 * @param {string}  props.className Additional CSS class.
 * @return {JSX.Element} The status indicator component.
 */
export function StatusIndicator( { enabled = true, className = '' } ) {
	const statusText = enabled
		? __( 'Enabled', 'virtual-media-folders' )
		: __( 'Disabled', 'virtual-media-folders' );

	return (
		<span
			className={ `vmfo-status-indicator ${ className }`.trim() }
			aria-label={
				enabled
					? __( 'Add-on is enabled', 'virtual-media-folders' )
					: __( 'Add-on is disabled', 'virtual-media-folders' )
			}
		>
			<span className="vmfo-status-indicator__text">
				{ __( 'Status:', 'virtual-media-folders' ) }
			</span>
			<span
				className={ `vmfo-status-indicator__value ${
					enabled
						? 'vmfo-status-indicator__value--enabled'
						: 'vmfo-status-indicator__value--disabled'
				}` }
			>
				{ statusText }
			</span>
			<span
				className={ `vmfo-status-indicator__dot ${
					enabled
						? 'vmfo-status-indicator__dot--enabled'
						: 'vmfo-status-indicator__dot--disabled'
				}` }
				aria-hidden="true"
			/>
		</span>
	);
}

export default StatusIndicator;
