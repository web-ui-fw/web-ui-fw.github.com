( function( $, undefined ) {

$.widget( "mobile.testwidget", $.mobile.widget, {
	options: {
		repository: null,
		initSelector: ":jqmData(role='testwidget')"
	},

	_create: function() {
		this.element.text( "This is a test widget" );
	},

	_setOptions: function( options ) {
		var promise = options.repository;
		if ( promise != null ) {
			if ( $.type( promise ) === "string" ) {
				promise = $.ajax({ url: options.repository });
			}
			promise.always( $.proxy( this, "_requestDone" ) );
		}
	},

	_requestDone: function( data, textStatus, jqHXR ) {
		console.log( "request done with status " + textStatus + " and data:" );
		console.log( data );
		this._trigger( "done" );
	}
});

$( document ).bind( "pagecreate", function( e ) {
	$.mobile.testwidget.prototype.enhanceWithin( $( e.target ) );
});

})( jQuery );
