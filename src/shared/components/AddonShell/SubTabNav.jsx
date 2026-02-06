/**
 * Sub Tab Navigation Component.
 *
 * Renders the standard 5 sub-tabs: Overview | Dashboard | Configure | Actions | Logs.
 *
 * @package VirtualMediaFolders
 */

import { __ } from '@wordpress/i18n';

/**
 * Standard sub-tab definitions with consistent order.
 */
export const SUB_TABS = [
	{ id: 'overview', label: __( 'Overview', 'virtual-media-folders' ) },
	{ id: 'dashboard', label: __( 'Dashboard', 'virtual-media-folders' ) },
	{ id: 'configure', label: __( 'Configure', 'virtual-media-folders' ) },
	{ id: 'actions', label: __( 'Actions', 'virtual-media-folders' ) },
];

/**
 * Sub Tab Navigation component.
 *
 * @param {Object}   props              Component props.
 * @param {string}   props.activeTab    Currently active sub-tab ID.
 * @param {Function} props.onTabChange  Callback when tab is clicked.
 * @param {Object}   props.disabledTabs Object mapping tab IDs to disabled state.
 * @param {string}   props.baseUrl      Base URL for tab links (optional, for SEO-friendly links).
 * @param {string}   props.className    Additional CSS class.
 * @return {JSX.Element} The sub-tab navigation component.
 */
export function SubTabNav( {
	activeTab = 'overview',
	onTabChange,
	disabledTabs = {},
	baseUrl = '',
	className = '',
} ) {
	const handleClick = ( event, tabId ) => {
		if ( disabledTabs[ tabId ] ) {
			event.preventDefault();
			return;
		}

		if ( onTabChange ) {
			event.preventDefault();
			onTabChange( tabId );
		}
		// If no onTabChange handler, let the link navigate naturally.
	};

	return (
		<nav
			className={ `vmfo-subtab-nav ${ className }`.trim() }
			role="tablist"
			aria-label={ __( 'Add-on sections', 'virtual-media-folders' ) }
		>
			{ SUB_TABS.map( ( tab ) => {
				const isActive = activeTab === tab.id;
				const isDisabled = disabledTabs[ tab.id ];
				const href = baseUrl ? `${ baseUrl }&subtab=${ tab.id }` : `#${ tab.id }`;

				return (
					<a
						key={ tab.id }
						href={ href }
						role="tab"
						aria-selected={ isActive }
						aria-disabled={ isDisabled || undefined }
						aria-current={ isActive ? 'page' : undefined }
						className={ `vmfo-subtab-nav__tab ${
							isActive ? 'vmfo-subtab-nav__tab--active' : ''
						} ${
							isDisabled ? 'vmfo-subtab-nav__tab--disabled' : ''
						}`.trim() }
						onClick={ ( e ) => handleClick( e, tab.id ) }
						tabIndex={ isDisabled ? -1 : 0 }
					>
						{ tab.label }
					</a>
				);
			} ) }
		</nav>
	);
}

export default SubTabNav;
