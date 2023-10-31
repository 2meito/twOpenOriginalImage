( ( chrome ) => {
'use strict';

Object.assign( window, ( () => {
    const
        reg_is_absolute_url = /^(https?:)?\/\//,
        
        injected_script_infos = [],
        
        create_script = ( user_specified_nonce ) => {
            const
                script = document.createElement( 'script' ),
                script_nonce = document.querySelector( 'script[nonce]' ),
                nonce = ( user_specified_nonce ) ? user_specified_nonce : ( ( script_nonce ) ? script_nonce.getAttribute( 'nonce' ) : '' );
            
            if ( nonce ) {
                script.setAttribute( 'nonce', nonce );
            }
            return script;
        },
        
        inject_script = ( script_url ) => {
            if ( ! reg_is_absolute_url.test( script_url ) ) {
                try {
                    script_url = chrome.runtime.getURL( script_url );
                }
                catch ( error ) {
                    script_url = new URL( script_url, location.href ).href;
                }
            }
            const
                injected_script_info = {
                    url : script_url,
                    error : false,
                },
                
                script_promise = new Promise( ( resolve, reject ) => {
                    const
                        script = create_script();
                    
                    script.async = true;
                    script.src = script_url;
                    script.addEventListener( 'load', ( event ) => {
                        script.remove();
                        resolve( injected_script_info );
                    } );
                    
                    script.addEventListener( 'error', ( event ) => {
                        script.remove();
                        injected_script_info.error = true;
                        injected_script_info.event = event;
                        reject( injected_script_info );
                    } );
                    
                    document.documentElement.appendChild( script );
                } );
            
            injected_script_info.promise = script_promise;
            injected_script_infos.push( injected_script_info );
            return script_promise;
        };
    
    return {
        inject_script,
        
        inject_script_all : async ( script_urls ) => {
            await Promise.all(
                script_urls.map( ( script_url ) => {
                    return inject_script( script_url )
                        .catch( injected_script_info => injected_script_info );
                } )
            );
            return injected_script_infos;
        },
        
        inject_script_sync : ( script_url, nonce ) => {
            if ( ! reg_is_absolute_url.test( script_url ) ) {
                try {
                    script_url = chrome.runtime.getURL( script_url );
                }
                catch ( error ) {
                    script_url = new URL( script_url, location.href ).href;
                }
            }
            const
                script = create_script( nonce );
            
            script.async = false;
            script.src = script_url;
            document.documentElement.insertBefore( script, document.documentElement.firstChild );
            script.remove();
        },
        
        external_script_injection_ready : async () => {
            await Promise.all(
                injected_script_infos.map( ( info ) => {
                    return info.promise
                        .catch( injected_script_info => injected_script_info );
                } )
            );
            
            return injected_script_infos;
        },
        
        inject_code_sync : ( code, nonce ) => {
            let script = create_script( nonce );
            
            script.async = false;
            script.textContent = code;
            
            document.documentElement.appendChild( script );
            
            script.remove();
        },
        
        inject_code : async ( code ) => {
            window.inject_code_sync( code );
        },
    };
} )() );

} )( ( ( typeof browser != 'undefined' ) && browser.runtime ) ? browser : chrome );
