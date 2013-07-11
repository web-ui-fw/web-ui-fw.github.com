( function( $, undefined ) {

$.widget( "mobile.testwidget", function() {
	options: {
		repository: null,
	},

	_setOptions: function( options ) {
		var promise = options.repository;
		if ( promise != null ) {
			if ( $.type( promise ) === "string" ) {
				promise = $.ajax({ url: options.repository });
			}
			promise.done( $.proxy( this, "_requestDone" ) );
		}
	},

	_requestDone: function() {
		alert( "request done!" );
	}
});

})( jQuery );
