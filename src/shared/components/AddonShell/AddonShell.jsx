/**
 * Add-on Shell Component.
 *
 * Main wrapper component that provides consistent UI structure for all add-ons.
 * Includes: header with status, sub-tab navigation, and content area.
 *
 * @package VirtualMediaFolders
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { SubTabNav, SUB_TABS } from './SubTabNav';
import { StatusIndicator } from './StatusIndicator';
import { StatsCard } from './StatsCard';

/**
 * Get the active subtab from URL query string.
 *
 * @return {string} The active subtab ID or 'overview' as default.
 */
function getSubtabFromUrl() {
	const params = new URLSearchParams( window.location.search );
	const subtab = params.get( 'subtab' );
	const validTabs = SUB_TABS.map( ( t ) => t.id );
	return validTabs.includes( subtab ) ? subtab : 'overview';
}

/**
 * Update URL with new subtab.
 *
 * @param {string} subtab The subtab ID to set.
 */
function updateUrlSubtab( subtab ) {
	const url = new URL( window.location.href );
	url.searchParams.set( 'subtab', subtab );
	window.history.pushState( {}, '', url.toString() );
}

/**
 * Add-on Shell component.
 *
 * @param {Object}      props                    Component props.
 * @param {string}      props.addonKey           Add-on slug/key (e.g., 'ai-organizer').
 * @param {string}      props.addonLabel         Add-on display name (e.g., 'AI Organizer').
 * @param {boolean}     props.enabled            Whether the add-on is enabled.
 * @param {string}      props.description        Add-on description text.
 * @param {Array}       props.stats              Stats array for StatsCard: [{ label, value, isLoading }].
 * @param {Object}      props.disabledTabs       Object mapping tab IDs to disabled state.
 * @param {JSX.Element} props.overviewContent    Content for Overview tab.
 * @param {JSX.Element} props.dashboardContent   Content for Dashboard tab.
 * @param {JSX.Element} props.configureContent   Content for Configure tab.
 * @param {JSX.Element} props.actionsContent     Content for Actions tab.
 * @param {JSX.Element} props.logsContent        Content for Logs tab.
 * @param {string}      props.className          Additional CSS class.
 * @return {JSX.Element} The add-on shell component.
 */
export function AddonShell( {
	addonKey,
	addonLabel,
	enabled = true,
	description = '',
	stats = [],
	disabledTabs = {},
	overviewContent,
	dashboardContent,
	configureContent,
	actionsContent,
	logsContent,
	className = '',
} ) {
	const [ activeTab, setActiveTab ] = useState( getSubtabFromUrl );

	// Handle browser back/forward navigation.
	useEffect( () => {
		const handlePopState = () => {
			setActiveTab( getSubtabFromUrl() );
		};

		window.addEventListener( 'popstate', handlePopState );
		return () => window.removeEventListener( 'popstate', handlePopState );
	}, [] );

	// Handle tab change.
	const handleTabChange = useCallback( ( tabId ) => {
		setActiveTab( tabId );
		updateUrlSubtab( tabId );

		// Dispatch custom event for add-ons to hook into.
		window.dispatchEvent(
			new CustomEvent( 'vmfo-subtab-change', {
				detail: { addonKey, tabId },
			} )
		);
	}, [ addonKey ] );

	// Build the base URL for tab links.
	const baseUrl = window.location.href.split( '&subtab=' )[ 0 ].split( '#' )[ 0 ];

	// Render content for active tab.
	const renderContent = () => {
		switch ( activeTab ) {
			case 'overview':
				return overviewContent || <EmptyState tabId="overview" />;
			case 'dashboard':
				return dashboardContent || <EmptyState tabId="dashboard" />;
			case 'configure':
				return configureContent || <EmptyState tabId="configure" />;
			case 'actions':
				return actionsContent || <EmptyState tabId="actions" />;
			case 'logs':
				return logsContent || <EmptyState tabId="logs" />;
			default:
				return overviewContent || <EmptyState tabId="overview" />;
		}
	};

	return (
		<div className={ `vmfo-addon-shell vmfo-addon-shell--${ addonKey } ${ className }`.trim() }>
			{ /* Header row with addon label and status */ }
			<div className="vmfo-addon-shell__header">
				<h2 className="vmfo-addon-shell__title">{ addonLabel }</h2>
				<StatusIndicator enabled={ enabled } />
			</div>

			{ /* Sub-tab navigation */ }
			<SubTabNav
				activeTab={ activeTab }
				onTabChange={ handleTabChange }
				disabledTabs={ disabledTabs }
				baseUrl={ baseUrl }
			/>

			{ /* Content area */ }
			<div
				className="vmfo-addon-shell__content"
				role="tabpanel"
				aria-labelledby={ `tab-${ activeTab }` }
			>
				{ renderContent() }
			</div>
		</div>
	);
}

/**
 * Empty State component for tabs without content.
 *
 * @param {Object} props       Component props.
 * @param {string} props.tabId The tab ID.
 * @return {JSX.Element} Empty state UI.
 */
function EmptyState( { tabId } ) {
	const messages = {
		overview: __( 'Overview content not configured.', 'virtual-media-folders' ),
		dashboard: __( 'Dashboard content not configured.', 'virtual-media-folders' ),
		configure: __( 'No settings available for this add-on.', 'virtual-media-folders' ),
		actions: __( 'No actions available for this add-on.', 'virtual-media-folders' ),
		logs: __( 'Logs feature coming soon.', 'virtual-media-folders' ),
	};

	return (
		<div className="vmfo-addon-shell__empty-state">
			<p>{ messages[ tabId ] || messages.overview }</p>
		</div>
	);
}

export default AddonShell;
