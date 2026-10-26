#!/usr/bin/env node
/**
 * Verify WPDS token usage against the fallback file, the package and core.
 *
 * 1. Every `--wpds-*` token used in src/ must be defined in
 *    src/css/wpds-tokens-fallback.css, so WP < 7 renders correctly.
 * 2. Every fallback token must exist in `@wordpress/theme` (canonical names).
 * 3. If a core token stylesheet is found (local install, or WP_THEME_CSS),
 *    fallback tokens core does not ship yet are reported as warnings.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve( dirname( fileURLToPath( import.meta.url ) ), '..' );
const require = createRequire( import.meta.url );
const fallbackPath = join( root, 'src/css/wpds-tokens-fallback.css' );
const packagePath = join(
	dirname( require.resolve( '@wordpress/theme/package.json' ) ),
	'src/prebuilt/css/design-tokens.css'
);
const corePath = [
	process.env.WP_THEME_CSS,
	resolve( root, '../../../wp-includes/css/dist/theme/design-tokens.css' ),
]
	.filter( Boolean )
	.find( ( p ) => existsSync( p ) );

const TOKEN_USE = /var\(\s*(--wpds-[a-z0-9-]+)/g;
const TOKEN_DEF = /(--wpds-[a-z0-9-]+)\s*:/g;
const EXTENSIONS = /\.(css|scss|js|jsx|ts|tsx|php)$/;

const walk = ( dir ) =>
	readdirSync( dir ).flatMap( ( name ) => {
		const path = join( dir, name );
		return statSync( path ).isDirectory() ? walk( path ) : [ path ];
	} );

const collect = ( text, regex ) =>
	new Set( [ ...text.matchAll( regex ) ].map( ( m ) => m[ 1 ] ) );
const read = ( path ) => readFileSync( path, 'utf8' );

const fallback = collect( read( fallbackPath ), TOKEN_DEF );
const canonical = collect( read( packagePath ), TOKEN_DEF );
const errors = [];
const warnings = [];

for ( const file of walk( join( root, 'src' ) ) ) {
	if ( ! EXTENSIONS.test( file ) || file === fallbackPath ) {
		continue;
	}
	for ( const token of collect( read( file ), TOKEN_USE ) ) {
		if ( ! fallback.has( token ) ) {
			errors.push( `${ relative( root, file ) }: ${ token } is not defined in the fallback file.` );
		}
	}
}

for ( const token of fallback ) {
	if ( ! canonical.has( token ) ) {
		errors.push( `wpds-tokens-fallback.css: ${ token } is not a @wordpress/theme token.` );
	}
}

if ( corePath ) {
	const core = collect( read( corePath ), TOKEN_DEF );
	for ( const token of fallback ) {
		if ( ! core.has( token ) ) {
			warnings.push( `${ token } is not shipped by this WordPress core yet; the fallback value is always used.` );
		}
	}
} else {
	warnings.push( 'Core token stylesheet not found; skipped core check (set WP_THEME_CSS to enable).' );
}

warnings.forEach( ( w ) => console.warn( `warning: ${ w }` ) );
if ( errors.length ) {
	console.error( errors.join( '\n' ) );
	process.exit( 1 );
}
console.log( `WPDS tokens OK (${ fallback.size } fallback tokens${ corePath ? ', compared with core' : '' }).` );
