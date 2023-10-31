( function () {

'use strict';

window.chrome = ( ( typeof browser != 'undefined' ) && browser.runtime ) ? browser : chrome;


var is_firefox = ( function () {
    var flag = ( 0 <= window.navigator.userAgent.toLowerCase().indexOf( 'firefox' ) );
    
    return function () {
        return flag;
    };
} )(); // end of is_firefox()


var is_edge = ( function () {
    var flag = ( 0 <= window.navigator.userAgent.toLowerCase().indexOf( 'edge' ) );
    
    return function () {
        return flag;
    };
} )(); // end of is_edge()


var is_vivaldi = ( function () {
    var flag = ( 0 <= window.navigator.userAgent.toLowerCase().indexOf( 'vivaldi' ) );
    
    return function () {
        return flag;
    };
} )(); // end of is_vivaldi()


function get_url_info( url ) {
    var url_parts = url.split( '?' ),
        query_map = {},
        url_info = { base_url : url_parts[ 0 ], query_map : query_map };
    
    if ( url_parts.length < 2 ) {
        return url_info;
    }
    
    url_parts[ 1 ].split( '&' ).forEach( function ( query_part ) {
        var parts = query_part.split( '=' );
        
        query_map[ parts[ 0 ] ] = ( parts.length < 2 ) ? '' : decodeURIComponent( parts[ 1 ] );
    } );
    
    return url_info;
} // end of get_url_info()

var url_info = get_url_info( window.location.href ),
    query_map = url_info.query_map;

//console.log( url_info );

if ( ( ! query_map.url ) || ( ! query_map.filename ) ) {
    return;
}

document.addEventListener( 'DOMContentLoaded', function () {
    if ( is_vivaldi() ) {
        chrome.downloads.download( {
            url : query_map.url,
            filename : query_map.filename
        } );
    }
    else {
        var download_link = document.createElement( 'a' );
        
        download_link.href = query_map.url;
        download_link.download = query_map.filename;
        
        ( document.body || document.documentElement ).appendChild( download_link );
        
        download_link.click();
        // TODO: Vivaldi だと、ページ遷移してしまう（1.15.1147.36 (Stable channel) (32-bit)・V8 6.5.254.41）
        
        download_link.parentNode.removeChild( download_link );
        
        //window.close(); // エラー発生: 「スクリプトはスクリプトによって開かれたウィンドウ以外を閉じることができません。」
    }
    
    setTimeout( function () {
        chrome.runtime.sendMessage( {
            type : 'CLOSE_TAB_REQUEST'
        }, function ( response ) {
            console.log( response );
        } );
    }, 1 ); // TODO: Chrome の場合、ディレイさせないとうまくダウンロードされない（※Firefoxだとディレイ無しでも可）
}, false );

} )();
