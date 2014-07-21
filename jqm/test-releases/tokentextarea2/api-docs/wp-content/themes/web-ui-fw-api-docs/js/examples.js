( function( $, undefined ) {

// Generate an iframe containing the demo defined in the example text
// Copied from https://github.com/jquery/jquery-wp-content/blob/master/themes/jquery/js/main.js
$(function() {
	$( ".entry-example" ).each(function() {
		var iframeSrc,
			src = $( this ).find( ".syntaxhighlighter" ),
			output = $( this ).find( ".code-demo" );

		if ( !src.length || !output.length ) {
			return;
		}

		// Get the original source
		iframeSrc = src.find( "td.code .line" ).map(function() {
			// Convert non-breaking spaces from highlighted code to normal spaces
			return $( this ).text().replace( /\xa0/g, " " );
		// Restore new lines from original source
		}).get().join( "\n" );

		iframeSrc = iframeSrc

			// Replace path for the web-ui-fw style sheet to reflect deployed directory structure
			.replace( /href="([^"]*)web-ui-fw\.css/,
				'href="../../web-ui-fw.css' )

			// Replace path for the web-ui-fw script to reflect deployed directory structure
			.replace( /src="([^"]*)web-ui-fw\.js/,
				'src="../../web-ui-fw.js' )

			// Insert styling for the live demo that we don't want in the
			// highlighted code
			.replace( "</head>",
				"<style>" +
					"html, body { border:0; margin:0; padding:0; }" +
					"body { font-family: 'Helvetica', 'Arial',  'Verdana', 'sans-serif'; }" +
				"</style>" +
				"</head>" )
			// IE <10 executes scripts in the order in which they're loaded,
			// not the order in which they're written. So we need to defer inline
			// scripts so that scripts which need to be fetched are executed first.
			.replace( /<script>([\s\S]+)<\/script>/,
				"<script>" +
				"window.onload = function() {" +
					"$1" +
				"};" +
				"</script>" );

		var iframe = document.createElement( "iframe" );
		iframe.width = "100%";
		iframe.height = output.attr( "data-height" ) || 250;
		output.append( iframe );

		var doc = (iframe.contentWindow || iframe.contentDocument).document;
		doc.write( iframeSrc );
		doc.close();
	});
});

})( jQuery );
