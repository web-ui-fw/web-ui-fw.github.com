( function( $, undefined ) {

$.widget( "mobile.testwidget", $.mobile.widget, {
	options: {
		repository: null,
		initSelector: ":jqmData(role='testwidget')"
	},

	_create: function() {
		this.element.text( "This is a test widget" );
	},

	_setOption: function( key, value ) {
		var promise = value;

		if ( key === "repository" && promise != null ) {
			if ( $.type( promise ) === "string" ) {
				promise = $.ajax({ url: promise });
			}
			promise.always( $.proxy( this, "_requestDone" ) );
		}
		return this._super( key, value );
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
