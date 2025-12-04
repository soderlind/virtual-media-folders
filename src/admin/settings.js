/**
 * Settings page JavaScript.
 *
 * Handles checkbox interdependency between "Show All Media" and "Show Uncategorized".
 *
 * @package VirtualMediaFolders
 */

( function () {
	'use strict';

	document.addEventListener( 'DOMContentLoaded', function () {
		const showAll = document.getElementById( 'show_all_media' );
		const showUncategorized = document.getElementById( 'show_uncategorized' );

		if ( ! showAll || ! showUncategorized ) {
			return;
		}

		/**
		 * Ensure a hidden field exists for a disabled checkbox.
		 * Disabled checkboxes don't submit their value, so we need a hidden field.
		 *
		 * @param {HTMLInputElement} checkbox - The checkbox element.
		 * @param {boolean} needsHidden - Whether the hidden field is needed.
		 */
		function ensureHiddenField( checkbox, needsHidden ) {
			const hiddenId = checkbox.id + '_hidden';
			let hidden = document.getElementById( hiddenId );

			if ( needsHidden && ! hidden ) {
				hidden = document.createElement( 'input' );
				hidden.type = 'hidden';
				hidden.id = hiddenId;
				hidden.name = checkbox.name;
				hidden.value = '1';
				checkbox.parentNode.insertBefore( hidden, checkbox );
			} else if ( ! needsHidden && hidden ) {
				hidden.remove();
			}
		}

		/**
		 * Update checkbox states based on interdependency.
		 *
		 * At least one of Show All Media or Show Uncategorized must be checked.
		 */
		function updateCheckboxes() {
			// If Show All Media is unchecked, force Show Uncategorized checked and disabled.
			if ( ! showAll.checked ) {
				showUncategorized.checked = true;
				showUncategorized.disabled = true;
				ensureHiddenField( showUncategorized, true );
			} else {
				showUncategorized.disabled = false;
				ensureHiddenField( showUncategorized, false );
			}

			// If Show Uncategorized is unchecked, force Show All Media checked and disabled.
			if ( ! showUncategorized.checked ) {
				showAll.checked = true;
				showAll.disabled = true;
				ensureHiddenField( showAll, true );
			} else {
				showAll.disabled = false;
				ensureHiddenField( showAll, false );
			}
		}

		showAll.addEventListener( 'change', updateCheckboxes );
		showUncategorized.addEventListener( 'change', updateCheckboxes );

		// Run on page load to set initial state.
		updateCheckboxes();
	} );
} )();
