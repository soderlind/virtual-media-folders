/**
 * Stats Card Component.
 *
 * Displays 4 KPI metrics in a horizontal grid.
 *
 * @package VirtualMediaFolders
 */

import { Spinner } from '@wordpress/components';

/**
 * Stats Card component for displaying KPI metrics.
 *
 * @param {Object}   props           Component props.
 * @param {Array}    props.stats     Array of stat objects: { label, value, isLoading }.
 * @param {string}   props.className Additional CSS class.
 * @return {JSX.Element} The stats card component.
 */
export function StatsCard( { stats = [], className = '' } ) {
	// Ensure we always have exactly 4 items (pad with empty if needed).
	const normalizedStats = [
		...stats.slice( 0, 4 ),
		...Array( Math.max( 0, 4 - stats.length ) ).fill( { label: '', value: '' } ),
	].slice( 0, 4 );

	return (
		<div className={ `vmfo-stats-card ${ className }`.trim() }>
			{ normalizedStats.map( ( stat, index ) => (
				<div
					key={ stat.label || index }
					className="vmfo-stats-card__item"
				>
					<div className="vmfo-stats-card__value">
						{ stat.isLoading ? (
							<Spinner />
						) : (
							stat.value ?? '—'
						) }
					</div>
					<div className="vmfo-stats-card__label">
						{ stat.label || '\u00A0' }
					</div>
				</div>
			) ) }
		</div>
	);
}

export default StatsCard;
