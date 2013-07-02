
/*!
 * jQuery Color Animations v@VERSION
 * https://github.com/jquery/jquery-color
 *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: @DATE
 */
(function( jQuery, undefined ) {

	var stepHooks = "backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor",

	// plusequals test for += 100 -= 100
	rplusequals = /^([\-+])=\s*(\d+\.?\d*)/,
	// a set of RE's that can match strings and generate color tuples.
	stringParsers = [{
			re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ],
					execResult[ 3 ],
					execResult[ 4 ]
				];
			}
		}, {
			re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ] * 2.55,
					execResult[ 2 ] * 2.55,
					execResult[ 3 ] * 2.55,
					execResult[ 4 ]
				];
			}
		}, {
			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ], 16 )
				];
			}
		}, {
			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9])([a-f0-9])([a-f0-9])/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ] + execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ] + execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ] + execResult[ 3 ], 16 )
				];
			}
		}, {
			re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			space: "hsla",
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ] / 100,
					execResult[ 3 ] / 100,
					execResult[ 4 ]
				];
			}
		}],

	// jQuery.Color( )
	color = jQuery.Color = function( color, green, blue, alpha ) {
		return new jQuery.Color.fn.parse( color, green, blue, alpha );
	},
	spaces = {
		rgba: {
			props: {
				red: {
					idx: 0,
					type: "byte"
				},
				green: {
					idx: 1,
					type: "byte"
				},
				blue: {
					idx: 2,
					type: "byte"
				}
			}
		},

		hsla: {
			props: {
				hue: {
					idx: 0,
					type: "degrees"
				},
				saturation: {
					idx: 1,
					type: "percent"
				},
				lightness: {
					idx: 2,
					type: "percent"
				}
			}
		}
	},
	propTypes = {
		"byte": {
			floor: true,
			max: 255
		},
		"percent": {
			max: 1
		},
		"degrees": {
			mod: 360,
			floor: true
		}
	},
	support = color.support = {},

	// element for support tests
	supportElem = jQuery( "<p>" )[ 0 ],

	// colors = jQuery.Color.names
	colors,

	// local aliases of functions called often
	each = jQuery.each;

// determine rgba support immediately
supportElem.style.cssText = "background-color:rgba(1,1,1,.5)";
support.rgba = supportElem.style.backgroundColor.indexOf( "rgba" ) > -1;

// define cache name and alpha properties
// for rgba and hsla spaces
each( spaces, function( spaceName, space ) {
	space.cache = "_" + spaceName;
	space.props.alpha = {
		idx: 3,
		type: "percent",
		def: 1
	};
});

function clamp( value, prop, allowEmpty ) {
	var type = propTypes[ prop.type ] || {};

	if ( value == null ) {
		return (allowEmpty || !prop.def) ? null : prop.def;
	}

	// ~~ is an short way of doing floor for positive numbers
	value = type.floor ? ~~value : parseFloat( value );

	// IE will pass in empty strings as value for alpha,
	// which will hit this case
	if ( isNaN( value ) ) {
		return prop.def;
	}

	if ( type.mod ) {
		// we add mod before modding to make sure that negatives values
		// get converted properly: -10 -> 350
		return (value + type.mod) % type.mod;
	}

	// for now all property types without mod have min and max
	return 0 > value ? 0 : type.max < value ? type.max : value;
}

function stringParse( string ) {
	var inst = color(),
		rgba = inst._rgba = [];

	string = string.toLowerCase();

	each( stringParsers, function( i, parser ) {
		var parsed,
			match = parser.re.exec( string ),
			values = match && parser.parse( match ),
			spaceName = parser.space || "rgba";

		if ( values ) {
			parsed = inst[ spaceName ]( values );

			// if this was an rgba parse the assignment might happen twice
			// oh well....
			inst[ spaces[ spaceName ].cache ] = parsed[ spaces[ spaceName ].cache ];
			rgba = inst._rgba = parsed._rgba;

			// exit each( stringParsers ) here because we matched
			return false;
		}
	});

	// Found a stringParser that handled it
	if ( rgba.length ) {

		// if this came from a parsed string, force "transparent" when alpha is 0
		// chrome, (and maybe others) return "transparent" as rgba(0,0,0,0)
		if ( rgba.join() === "0,0,0,0" ) {
			jQuery.extend( rgba, colors.transparent );
		}
		return inst;
	}

	// named colors
	return colors[ string ];
}

color.fn = jQuery.extend( color.prototype, {
	parse: function( red, green, blue, alpha ) {
		if ( red === undefined ) {
			this._rgba = [ null, null, null, null ];
			return this;
		}
		if ( red.jquery || red.nodeType ) {
			red = jQuery( red ).css( green );
			green = undefined;
		}

		var inst = this,
			type = jQuery.type( red ),
			rgba = this._rgba = [];

		// more than 1 argument specified - assume ( red, green, blue, alpha )
		if ( green !== undefined ) {
			red = [ red, green, blue, alpha ];
			type = "array";
		}

		if ( type === "string" ) {
			return this.parse( stringParse( red ) || colors._default );
		}

		if ( type === "array" ) {
			each( spaces.rgba.props, function( key, prop ) {
				rgba[ prop.idx ] = clamp( red[ prop.idx ], prop );
			});
			return this;
		}

		if ( type === "object" ) {
			if ( red instanceof color ) {
				each( spaces, function( spaceName, space ) {
					if ( red[ space.cache ] ) {
						inst[ space.cache ] = red[ space.cache ].slice();
					}
				});
			} else {
				each( spaces, function( spaceName, space ) {
					var cache = space.cache;
					each( space.props, function( key, prop ) {

						// if the cache doesn't exist, and we know how to convert
						if ( !inst[ cache ] && space.to ) {

							// if the value was null, we don't need to copy it
							// if the key was alpha, we don't need to copy it either
							if ( key === "alpha" || red[ key ] == null ) {
								return;
							}
							inst[ cache ] = space.to( inst._rgba );
						}

						// this is the only case where we allow nulls for ALL properties.
						// call clamp with alwaysAllowEmpty
						inst[ cache ][ prop.idx ] = clamp( red[ key ], prop, true );
					});

					// everything defined but alpha?
					if ( inst[ cache ] && jQuery.inArray( null, inst[ cache ].slice( 0, 3 ) ) < 0 ) {
						// use the default of 1
						inst[ cache ][ 3 ] = 1;
						if ( space.from ) {
							inst._rgba = space.from( inst[ cache ] );
						}
					}
				});
			}
			return this;
		}
	},
	is: function( compare ) {
		var is = color( compare ),
			same = true,
			inst = this;

		each( spaces, function( _, space ) {
			var localCache,
				isCache = is[ space.cache ];
			if (isCache) {
				localCache = inst[ space.cache ] || space.to && space.to( inst._rgba ) || [];
				each( space.props, function( _, prop ) {
					if ( isCache[ prop.idx ] != null ) {
						same = ( isCache[ prop.idx ] === localCache[ prop.idx ] );
						return same;
					}
				});
			}
			return same;
		});
		return same;
	},
	_space: function() {
		var used = [],
			inst = this;
		each( spaces, function( spaceName, space ) {
			if ( inst[ space.cache ] ) {
				used.push( spaceName );
			}
		});
		return used.pop();
	},
	transition: function( other, distance ) {
		var end = color( other ),
			spaceName = end._space(),
			space = spaces[ spaceName ],
			startColor = this.alpha() === 0 ? color( "transparent" ) : this,
			start = startColor[ space.cache ] || space.to( startColor._rgba ),
			result = start.slice();

		end = end[ space.cache ];
		each( space.props, function( key, prop ) {
			var index = prop.idx,
				startValue = start[ index ],
				endValue = end[ index ],
				type = propTypes[ prop.type ] || {};

			// if null, don't override start value
			if ( endValue === null ) {
				return;
			}
			// if null - use end
			if ( startValue === null ) {
				result[ index ] = endValue;
			} else {
				if ( type.mod ) {
					if ( endValue - startValue > type.mod / 2 ) {
						startValue += type.mod;
					} else if ( startValue - endValue > type.mod / 2 ) {
						startValue -= type.mod;
					}
				}
				result[ index ] = clamp( ( endValue - startValue ) * distance + startValue, prop );
			}
		});
		return this[ spaceName ]( result );
	},
	blend: function( opaque ) {
		// if we are already opaque - return ourself
		if ( this._rgba[ 3 ] === 1 ) {
			return this;
		}

		var rgb = this._rgba.slice(),
			a = rgb.pop(),
			blend = color( opaque )._rgba;

		return color( jQuery.map( rgb, function( v, i ) {
			return ( 1 - a ) * blend[ i ] + a * v;
		}));
	},
	toRgbaString: function() {
		var prefix = "rgba(",
			rgba = jQuery.map( this._rgba, function( v, i ) {
				return v == null ? ( i > 2 ? 1 : 0 ) : v;
			});

		if ( rgba[ 3 ] === 1 ) {
			rgba.pop();
			prefix = "rgb(";
		}

		return prefix + rgba.join() + ")";
	},
	toHslaString: function() {
		var prefix = "hsla(",
			hsla = jQuery.map( this.hsla(), function( v, i ) {
				if ( v == null ) {
					v = i > 2 ? 1 : 0;
				}

				// catch 1 and 2
				if ( i && i < 3 ) {
					v = Math.round( v * 100 ) + "%";
				}
				return v;
			});

		if ( hsla[ 3 ] === 1 ) {
			hsla.pop();
			prefix = "hsl(";
		}
		return prefix + hsla.join() + ")";
	},
	toHexString: function( includeAlpha ) {
		var rgba = this._rgba.slice(),
			alpha = rgba.pop();

		if ( includeAlpha ) {
			rgba.push( ~~( alpha * 255 ) );
		}

		return "#" + jQuery.map( rgba, function( v ) {

			// default to 0 when nulls exist
			v = ( v || 0 ).toString( 16 );
			return v.length === 1 ? "0" + v : v;
		}).join("");
	},
	toString: function() {
		return this._rgba[ 3 ] === 0 ? "transparent" : this.toRgbaString();
	}
});
color.fn.parse.prototype = color.fn;

// hsla conversions adapted from:
// https://code.google.com/p/maashaack/source/browse/packages/graphics/trunk/src/graphics/colors/HUE2RGB.as?r=5021

function hue2rgb( p, q, h ) {
	h = ( h + 1 ) % 1;
	if ( h * 6 < 1 ) {
		return p + (q - p) * h * 6;
	}
	if ( h * 2 < 1) {
		return q;
	}
	if ( h * 3 < 2 ) {
		return p + (q - p) * ((2/3) - h) * 6;
	}
	return p;
}

spaces.hsla.to = function ( rgba ) {
	if ( rgba[ 0 ] == null || rgba[ 1 ] == null || rgba[ 2 ] == null ) {
		return [ null, null, null, rgba[ 3 ] ];
	}
	var r = rgba[ 0 ] / 255,
		g = rgba[ 1 ] / 255,
		b = rgba[ 2 ] / 255,
		a = rgba[ 3 ],
		max = Math.max( r, g, b ),
		min = Math.min( r, g, b ),
		diff = max - min,
		add = max + min,
		l = add * 0.5,
		h, s;

	if ( min === max ) {
		h = 0;
	} else if ( r === max ) {
		h = ( 60 * ( g - b ) / diff ) + 360;
	} else if ( g === max ) {
		h = ( 60 * ( b - r ) / diff ) + 120;
	} else {
		h = ( 60 * ( r - g ) / diff ) + 240;
	}

	// chroma (diff) == 0 means greyscale which, by definition, saturation = 0%
	// otherwise, saturation is based on the ratio of chroma (diff) to lightness (add)
	if ( diff === 0 ) {
		s = 0;
	} else if ( l <= 0.5 ) {
		s = diff / add;
	} else {
		s = diff / ( 2 - add );
	}
	return [ Math.round(h) % 360, s, l, a == null ? 1 : a ];
};

spaces.hsla.from = function ( hsla ) {
	if ( hsla[ 0 ] == null || hsla[ 1 ] == null || hsla[ 2 ] == null ) {
		return [ null, null, null, hsla[ 3 ] ];
	}
	var h = hsla[ 0 ] / 360,
		s = hsla[ 1 ],
		l = hsla[ 2 ],
		a = hsla[ 3 ],
		q = l <= 0.5 ? l * ( 1 + s ) : l + s - l * s,
		p = 2 * l - q;

	return [
		Math.round( hue2rgb( p, q, h + ( 1 / 3 ) ) * 255 ),
		Math.round( hue2rgb( p, q, h ) * 255 ),
		Math.round( hue2rgb( p, q, h - ( 1 / 3 ) ) * 255 ),
		a
	];
};


each( spaces, function( spaceName, space ) {
	var props = space.props,
		cache = space.cache,
		to = space.to,
		from = space.from;

	// makes rgba() and hsla()
	color.fn[ spaceName ] = function( value ) {

		// generate a cache for this space if it doesn't exist
		if ( to && !this[ cache ] ) {
			this[ cache ] = to( this._rgba );
		}
		if ( value === undefined ) {
			return this[ cache ].slice();
		}

		var ret,
			type = jQuery.type( value ),
			arr = ( type === "array" || type === "object" ) ? value : arguments,
			local = this[ cache ].slice();

		each( props, function( key, prop ) {
			var val = arr[ type === "object" ? key : prop.idx ];
			if ( val == null ) {
				val = local[ prop.idx ];
			}
			local[ prop.idx ] = clamp( val, prop );
		});

		if ( from ) {
			ret = color( from( local ) );
			ret[ cache ] = local;
			return ret;
		} else {
			return color( local );
		}
	};

	// makes red() green() blue() alpha() hue() saturation() lightness()
	each( props, function( key, prop ) {
		// alpha is included in more than one space
		if ( color.fn[ key ] ) {
			return;
		}
		color.fn[ key ] = function( value ) {
			var vtype = jQuery.type( value ),
				fn = ( key === "alpha" ? ( this._hsla ? "hsla" : "rgba" ) : spaceName ),
				local = this[ fn ](),
				cur = local[ prop.idx ],
				match;

			if ( vtype === "undefined" ) {
				return cur;
			}

			if ( vtype === "function" ) {
				value = value.call( this, cur );
				vtype = jQuery.type( value );
			}
			if ( value == null && prop.empty ) {
				return this;
			}
			if ( vtype === "string" ) {
				match = rplusequals.exec( value );
				if ( match ) {
					value = cur + parseFloat( match[ 2 ] ) * ( match[ 1 ] === "+" ? 1 : -1 );
				}
			}
			local[ prop.idx ] = value;
			return this[ fn ]( local );
		};
	});
});

// add cssHook and .fx.step function for each named hook.
// accept a space separated string of properties
color.hook = function( hook ) {
	var hooks = hook.split( " " );
	each( hooks, function( i, hook ) {
		jQuery.cssHooks[ hook ] = {
			set: function( elem, value ) {
				var parsed, curElem,
					backgroundColor = "";

				if ( jQuery.type( value ) !== "string" || ( parsed = stringParse( value ) ) ) {
					value = color( parsed || value );
					if ( !support.rgba && value._rgba[ 3 ] !== 1 ) {
						curElem = hook === "backgroundColor" ? elem.parentNode : elem;
						while (
							(backgroundColor === "" || backgroundColor === "transparent") &&
							curElem && curElem.style
						) {
							try {
								backgroundColor = jQuery.css( curElem, "backgroundColor" );
								curElem = curElem.parentNode;
							} catch ( e ) {
							}
						}

						value = value.blend( backgroundColor && backgroundColor !== "transparent" ?
							backgroundColor :
							"_default" );
					}

					value = value.toRgbaString();
				}
				try {
					elem.style[ hook ] = value;
				} catch( e ) {
					// wrapped to prevent IE from throwing errors on "invalid" values like 'auto' or 'inherit'
				}
			}
		};
		jQuery.fx.step[ hook ] = function( fx ) {
			if ( !fx.colorInit ) {
				fx.start = color( fx.elem, hook );
				fx.end = color( fx.end );
				fx.colorInit = true;
			}
			jQuery.cssHooks[ hook ].set( fx.elem, fx.start.transition( fx.end, fx.pos ) );
		};
	});

};

color.hook( stepHooks );

jQuery.cssHooks.borderColor = {
	expand: function( value ) {
		var expanded = {};

		each( [ "Top", "Right", "Bottom", "Left" ], function( i, part ) {
			expanded[ "border" + part + "Color" ] = value;
		});
		return expanded;
	}
};

// Basic color names only.
// Usage of any of the other color names requires adding yourself or including
// jquery.color.svg-names.js.
colors = jQuery.Color.names = {
	// 4.1. Basic color keywords
	aqua: "#00ffff",
	black: "#000000",
	blue: "#0000ff",
	fuchsia: "#ff00ff",
	gray: "#808080",
	green: "#008000",
	lime: "#00ff00",
	maroon: "#800000",
	navy: "#000080",
	olive: "#808000",
	purple: "#800080",
	red: "#ff0000",
	silver: "#c0c0c0",
	teal: "#008080",
	white: "#ffffff",
	yellow: "#ffff00",

	// 4.2.3. "transparent" color keyword
	transparent: [ null, null, null, 0 ],

	_default: "#ffffff"
};

})( jQuery );

( function( $, undefined ) {
	$.Color.fn.grayscale = function() {
		var hsl = [ this.hue(), this.saturation(), this.lightness() ],
			// Magic full-sat grayscale values taken from the GIMP
			intrinsic_vals = [ 0.211764706, 0.929411765, 0.71372549, 0.788235294, 0.070588235, 0.28627451, 0.211764706 ],
			idx = Math.floor( hsl[ 0 ] / 60 ),
			begVal, endVal, val, lowerHalfPercent, upperHalfPercent;

		// Find hue interval
		begVal = intrinsic_vals[ idx ];
		endVal = intrinsic_vals[ idx + 1 ];

		// Adjust for lum
		if (hsl[ 2 ] < 0.5) {
			lowerHalfPercent = hsl[ 2 ] * 2;
			begVal *= lowerHalfPercent;
			endVal *= lowerHalfPercent;
		}
		else {
			upperHalfPercent = ( hsl[ 2 ] - 0.5 ) * 2;
			begVal += ( 1.0 - begVal ) * upperHalfPercent;
			endVal += ( 1.0 - endVal ) * upperHalfPercent;
		}

		// This is the gray value at full sat, whereas hsl[2] is the gray value at 0 sat.
		val = begVal + ( ( endVal - begVal ) * ( hsl[ 0 ] - ( idx * 60 ) ) ) / 60;

		// Get value at hsl[1]
		val = ( val + ( hsl[ 2 ] - val ) * ( 1.0 - hsl[ 1 ] ) ) * 255;

		return $.Color( { red: val, green: val, blue: val } );
	};
})( jQuery );

( function( $, undefined ) {

$.mobile.behaviors.setValue = $.extend( {
	// The widget factory automagically merges data-<option> attributes with the
	// widget instance's options, but it does not merge the input's value with the
	// widget's corresponding option if this widget is based on an input
	_create: function() {
		if ( this._value !== undefined && this.element.is( "input" ) ) {
			this.options[ this._value.option ] = this._getInputValue();
			this._handleFormReset();
		}

		this._super();
	},

	_getInputValue: function() {
		var inputType, ret;

		if ( this.element.is( "input" ) ) {
			inputType = this.element.attr( "type" );
			// Special handling for checkboxes and radio buttons, where the presence
			// of the "checked" attribute is really the value
			if ( inputType === "checkbox" || inputType === "radio" ) {
				ret = this.element.prop( "checked" );
			} else {
				ret = this.element.val();
			}
		}

		return ret;
	},

	_reset: function() {
		this._setOption( this._value.option, this._getInputValue() );
	},

	_setValue: function( newValue ) {
		var valueString, valueStringIsSet, inputType;

		if ( this._value !== undefined ) {
			valueString = this._value.makeString ? this._value.makeString( newValue ) : newValue;
			valueStringIsSet = true;

			this.element.attr( "data-" + $.mobile.ns + this._value.option, valueString );

			if ( this._value.signal !== undefined ) {
				this.element.trigger( this._value.signal, newValue );
			}
		}

		if ( this.element.is( "input" ) ) {
			inputType = this.element.attr( "type" );

			// Special handling for checkboxes and radio buttons, where the presence
			// of the "checked" attribute is really the value
			if ( inputType === "checkbox" || inputType === "radio" ) {
				this.element.prop( "checked", !!newValue );
			}
			else {
				this.element.val( ( valueStringIsSet ? valueString : newValue ) );
			}

			this.element.trigger( "change" );
		}
	}
}, $.mobile.behaviors.formReset );

})( jQuery );

( function( $, undefined ) {

$.mobile.behaviors.setDisabled = {
	_setOption: function( key, value ) {
		this._super( key, value );
		if ( key === "disabled" && this.element.is( "input" ) ) {
			this.element.prop( "disabled", !!value );
		}
	}
};

})( jQuery );

( function( $, undefined ) {

var dataKey = "_setElementColor_data";

$.mobile.behaviors.colorWidget = $.extend( {}, $.mobile.behaviors.setValue, $.mobile.behaviors.setDisabled, {
	options: {
		color: null
	},

	_value: {
		option: "color",
		signal: "colorchanged"
	},

	// Look for all elements in this widget that have the "_setElementColor" data
	// and assign a desaturated version of the color to the css property
	// previously set via _setElementColor
	_setDisabled: function( value ) {
		var widget = this.widget();

		widget.add( widget.find( "*" ) ).each( function() {
			var $el = $( this ),
				data = $el.jqmData( dataKey ),
				clr;

			if ( data ) {
				clr = data.clr;
				if ( value ) {
					clr = clr.grayscale();
				}

				$el.css( data.cssProp, clr.toRgbaString() );
			}
		});
		this._super( value );
	},

	_getElementColor: function( el ) {
		var data = el.jqmData( dataKey );

		return ( data ? data.clr : undefined );
	},

	_setElementColor: function( el, clr, cssProp ) {
		if ( clr ) {
			if ( $.type( clr ) === "string" ) {
				clr = $.Color( clr );
			}

			el.jqmData( dataKey, { clr: clr, cssProp: cssProp } );

			if ( this.options.disabled ) {
				clr = clr.grayscale();
			}

			el.css( cssProp, clr.toRgbaString() );
		} else {
			el.jqmData( dataKey, undefined );
			el.css( cssProp, "" );
		}
	},

	_setColor: function( value ) {
		var curClr = null, newClr = null;

		if ( this.options.color ) {
			curClr = $.Color( this.options.color );
		}

		if ( value ) {
			newClr = $.Color( value );
		}

		if ( ( curClr === null && newClr !== null ) ||
			( curClr !== null && newClr === null ) ||
			( curClr !== null && newClr !== null && !curClr.is( newClr ) ) ) {
			this.options.color = value;
			this._setValue( value );
		}
		this._super( value );
	},

	_huegradient: function( el ) {
		var idx;
		el.addClass( "ui-huegradient" );
		if ( $.mobile.browser.oldIE ) {
			el.addClass( "ie" );
			for ( idx = 0 ; idx < 6 ; idx++ ) {
				$( "<div></div>" )
					.addClass( "ie-grad g" + idx )
					.appendTo( el );
			}
		}

		return el;
	}
});

})( jQuery );

( function( $, undefined ) {

$.mobile.behaviors.createOuter = {
	_createOuter: function() {
		var ret;

		$.extend( this, {
			_isInput: this.element.is( "input" )
		});

		// Establish the outer element
		if ( this._isInput ) {
			ret = $( "<div></div>" )
				.insertAfter( this.element )
				.append( this.element );
			this.element.addClass( "ui-hidden-input" );
		} else {
			ret = this.element;
		}

		return ret;
	},

	_destroyOuter: function() {
		if ( this._isInput ) {
			this.element.parent().after( this.element ).remove();
			this.element.removeClass( "ui-hidden-input" );
		}
	}
};

})( jQuery );


( function( $, undefined ) {

$.mobile.behaviors.optionDemultiplexer = {
	_setOption: function( key, value ) {
		var setter = "_set" + key.charAt( 0 ).toUpperCase() + key.slice( 1 );

		if ( this[ setter ] !== undefined ) {
			this[ setter ]( value );
		}

		this._super( key, value );

		if ( key !== "initSelector" ) {
			this.element.attr( "data-" + ( $.mobile.ns || "" ) + ( key.replace( /([A-Z])/, "-$1" ).toLowerCase() ), value );
		}
	}
};

})( jQuery );

( function( $, undefined ) {

var scopeReduction = {},
	reduceScope = function( targets, useKeepNative ) {
		var idx,
			ns = this.namespace,
			name = this.widgetName,
			nsList = scopeReduction[ ns ],
			scope = nsList ? nsList[ name ] : undefined;

		if ( scope ) {
			for ( idx = 0 ; targets.length > 0 && idx < scope.ls.length ; idx++ ) {
				targets = targets.not( scope.ls[ idx ] );
			}

			scope.orig.call( this, targets, useKeepNative );
		}
	},
	overwriteEnhance = function( ns, widget ) {
		function overwrite() {
			if ( $[ ns ][ widget ] ) {
				// Overwrite the enhance() function for this widget class with our scope-
				// restricting version if it's not already overwritten
				if ( $[ ns ][ widget ].prototype.enhance !== reduceScope ) {
					scopeReduction[ ns ][ widget ].orig = $[ ns ][ widget ].prototype.enhance;
					$[ ns ][ widget ].prototype.enhance = reduceScope;
				}
			}
		}

		if ( $[ ns ] ) {
			overwrite();
		} else {
			( ( $.mobile && $.mobile.document ) || $( document ) ).one( "mobileinit", function() {
				overwrite();
			});
		}
	};

$.mobile.reduceEnhancementScope = function( ns, widget, filter ) {
	var nsList = scopeReduction[ ns ] || {},
		scope = nsList[ widget ] || { ls: [] };

		// Add the scope restriction
		scope.ls.push( filter );
		nsList[ widget ] = scope;
		scopeReduction[ ns ] = nsList;

		// Overwrite the enhance function for the given widget class
		overwriteEnhance( ns, widget );
};

})( jQuery );


( function( $, undefined ) {

var mask = $( "<div></div>", { "class": "ui-hsvpicker-mask" } );

$.widget( "mobile.hsvpicker", $.mobile.widget, $.extend( {
	options: {
		initSelector: ":jqmData(role='hsvpicker')"
	},

	_create: function() {
		var ui = {
				outer: this._createOuter().addClass( "ui-hsvpicker" ),
				chan: {
					h: {
						hue: this._huegradient( mask.clone() ),
						sat: mask.clone().css( { background: "#ffffff" } ),
						val: mask.clone().css( { background: "#000000" } )
					},
					s: {
						// hue
						sat: mask.clone().addClass( "ui-hsvpicker-sat-gradient" ),
						val: mask.clone().css( { background: "#000000" } )
					},
					v: {
						// white
						hue: mask.clone(),
						val: mask.clone().addClass( "ui-hsvpicker-val-gradient" )
					}
				}
			};

		// Apply the proto
		// Background of hue slider is white
		this._makeSlider( ui, "h", 360 )
			.append( ui.chan.h.hue )
			.append( ui.chan.h.sat )
			.append( ui.chan.h.val );

		if ( $.mobile.browser.oldIE ) {
			ui.chan.h.hue = ui.chan.h.hue.add( ui.chan.h.hue.children() );
		}

		// Background of sat slider is the current hue
		ui.chan.s.hue = this._makeSlider( ui, "s", 255 )
			.append( ui.chan.s.sat )
			.append( ui.chan.s.val );

		// Background of val slider is white
		this._makeSlider( ui, "v", 255 ).css( "background", "#ffffff" )
			.append( ui.chan.v.hue )
			.append( ui.chan.v.val );

		$.extend( this, {
			_ui: ui,
			_clr: null,
			_ignoreHandle: false
		});

		this.refresh();
	},

	_makeSlider: function( ui, chan, max ) {
		var widget,
			slider = $( "<div></div>", { min: 0, max: max, step: 1 } )
				.appendTo( ui.outer )
				.slider()
				.val( 0 );

		ui.chan[ chan ].slider = slider;
		widget = slider.data( "mobile-slider" );
		ui.chan[ chan ].widget = widget;

		this._on( slider, { slidecontrolchange: "_handleSlideControlChange" } );

		return widget.slider;
	},

	_hsvFromSliders: function() {
		return {
			h: this._ui.chan.h.widget._value(),
			s: this._ui.chan.s.widget._value() / 255.0,
			v: this._ui.chan.v.widget._value() / 255.0
		};
	},

	_handleSlideControlChange: function(/* e */) {
		var hsv, clr;

		if ( this._ignoreHandle ) {
			return;
		}

		hsv = this._hsvFromSliders();
		clr = this._hsvToClr( hsv ).toHexString( false );

		this._clr = clr;
		this._setColor( clr );
		this._styleSliders( this._ui.chan, $.Color( clr ), hsv );
	},

	_setDisabled: function( value ) {
		// TODO remove this when working with jQM where
		// https://github.com/jquery/jquery-mobile/issues/5390 is fixed
		this._ui.outer.toggleClass( "ui-disabled", value );
	},

	refresh: function() {
		var inputValue = this._getInputValue();

		if ( inputValue !== undefined ) {
			this._setColor( inputValue );
		}
	},

	_destroy: function() {
		var idx, chans = [ "h", "s", "v" ];

		this._ui.outer.removeClass( "ui-hsvpicker" );
		this._destroyOuter();
		if ( !this._isInput ) {
			for ( idx in chans ) {
				this._ui.chan[ chans[ idx ] ].slider.parent().remove();
			}
		}
	},

	widget: function() {
		return this._ui.outer;
	},

	// Make the slider colours reflect a certain colour without setting the handle
	// position (which might cause an event loop)
	_styleSliders: function( chan, clr, hsv ) {
		var hclr = this._hsvToClr( { h: hsv.h, s: 1.0, v: 1.0 } ),
			vclr = this._hsvToClr( { h: hsv.h, s: hsv.s, v: 1.0 } );

		// hue
		this._setElementColor( chan.h.widget.handle, clr, "background" );
		chan.h.sat.css( "opacity", 1 - hsv.s );
		chan.h.val.css( "opacity", 1 - hsv.v );

		// sat
		this._setElementColor( chan.s.widget.handle, clr, "background" );
		this._setElementColor( chan.s.widget.slider, hclr, "background" );
		chan.s.val.css( "opacity", 1 - hsv.v );

		// val
		this._setElementColor( chan.v.widget.handle, clr, "background" );
		this._setElementColor( chan.v.hue, vclr, "background" );
	},

	// Input: jQuery Color object
	// Returns: [ h, s, v ], where
	// h is in [0, 360]
	// s is in [0,   1]
	// v is in [0,   1]
	_clrToHSV: function( clr ) {
		var min, max, delta, h, s, v,
			r = clr.red() / 255,
			g = clr.green() / 255,
			b = clr.blue() / 255;

		min = Math.min( r, Math.min( g, b ) );
		max = Math.max( r, Math.max( g, b ) );
		delta = max - min;

		h = 0;
		s = 0;
		v = max;

		if ( delta > 0.00001 ) {
			s = delta / max;

			if ( r === max ) {
				h = ( g - b ) / delta;
			}
			else if ( g === max ) {
				h = 2 + ( b - r ) / delta;
			} else {
				h = 4 + ( r - g ) / delta;
			}

			h *= 60;

			if ( h < 0 ) {
				h += 360;
			}
		}

		return { h: h, s: s, v: v };
	},

	// Input: { h, s, v }, where
	// h is in [0, 360]
	// s is in [0,   1]
	// v is in [0,   1]
	// Returns: jQuery Color object
	_hsvToClr: function( hsv ) {
		var max = hsv.v,
			delta = hsv.s * max,
			min = max - delta,
			sum = max + min,
			halfSum = sum / 2,
			sDivisor = ( ( halfSum < 0.5 ) ? sum : ( 2 - max - min ) );

		return $.Color( {
			hue: hsv.h,
			saturation: ( ( 0 === sDivisor ) ? 0 : ( delta / sDivisor ) ),
			lightness: halfSum
		});
	},

	_setColor: function( value ) {
		var comboIdx, idxidx, clr, hsv, chan, oldHSV, combos, tmpHSV, cpidx, combo, sliderVals;

		if ( value !== this._clr ) {
			chan = this._ui.chan;
			clr = $.Color( value );
			hsv = this._clrToHSV( clr );
			oldHSV = this._hsvFromSliders();
			// by default we set all three sliders ...
			combo = [ "h", "s", "v" ];
			// ... however, we try to minimize the changes we make to slider
			// positions in order to achieve the desired colour. This minimizes the
			// amount that synced widgets fidget when the transformation quality
			// degrades, like, when the saturation and/or value approaches 0.
			combos = [ [], [ "h" ], [ "s" ], [ "v" ], [ "h", "s" ], [ "h", "v" ], [ "s", "v" ] ];

			// For each combination ...
			for ( comboIdx in combos ) {
				tmpHSV = { h: oldHSV.h, s: oldHSV.s, v: oldHSV.v };
				// ... overwrite those parts of the existing hsv specified by the given
				// combination
				for ( idxidx = 0 ; idxidx < combos[ comboIdx ].length ; idxidx++ ) {
					cpidx = combos[ comboIdx ][ idxidx ];
					tmpHSV[ cpidx ] = hsv[ cpidx ];
				}
				// ... and check whether the result is the desired colour
				if ( this._hsvToClr( tmpHSV ).toHexString( false ) === value ) {
					combo = combos[ comboIdx ];
					hsv = tmpHSV;
					break;
				}
			}

			// We set values on the sliders identified above
			this._ignoreHandle = true;
			sliderVals = { h: hsv.h, s: hsv.s * 255, v: hsv.v * 255 };
			for ( idxidx = 0 ; idxidx < combo.length ; idxidx++ ) {
				chan[ combo[ idxidx ] ].widget.refresh( Math.round( sliderVals[ combo[ idxidx ] ] ) );
			}
			this._ignoreHandle = false;

			this._styleSliders( chan, clr, hsv );

			this._clr = value;
		}
	}
}, $.mobile.behaviors.createOuter, $.mobile.behaviors.optionDemultiplexer ) );

$.widget( "mobile.hsvpicker", $.mobile.hsvpicker, $.extend( {}, $.mobile.behaviors.colorWidget ) );

// Add a filter to prevent the textinput widget from enhancing color inputs 
// that our initSelector would match
$.mobile.reduceEnhancementScope( "mobile", "textinput", $.mobile.hsvpicker.prototype.options.initSelector );

$( document ).bind( "pagecreate create", function( e )  {
	$.mobile.hsvpicker.prototype.enhanceWithin( e.target, true );
});

})( jQuery );


( function( $, undefined ) {

$.widget( "mobile.colorpalette", $.mobile.widget, $.extend( {
	options: {
		showPreview: false,
		rows: 2,
		colors: "#ff0000,#ff8000,#ffff00,#80ff00,#00ff00,#00ff80,#00ffff,#0080ff,#0000ff,#8000ff,#ff00ff,#ff0080",
		initSelector: ":jqmData(role='colorpalette')"
	},

	_create: function() {
		var ui = {
				outer: this._createOuter().addClass( "ui-colorpalette" ),
				preview: {
					outer: $( "<div class='ui-colorpalette-preview-container ui-corner-all'></div>" ),
					inner: $( "<div class='ui-colorpalette-preview'></div>" )
				},
				table: $( "<div class='ui-colorpalette-table'></div>" ),
				row: $( "<div class='ui-colorpalette-row'></div>" ),
				entry: {
					outer: $( "<div class='ui-colorpalette-choice-container ui-corner-all'></div>" ),
					inner: $( "<div class='ui-colorpalette-choice'></div>" )
				}
			},
			clrs = this._getClrList( this.options.colors ), idx;

		// Apply the proto
		ui.outer.append( ui.preview.outer );
		ui.preview.outer.append( ui.preview.inner );
		ui.outer.append( ui.table );

		$.extend( this, {
			_ui: ui,
			_clrEls: []
		});

		this.refresh();

		if ( this.options.color ) {
			// Initially, the color may not be present in the palette, so let's make a
			// palette that's guaranteed to contain it
			for ( idx = 0 ; idx < clrs.length ; idx++ ) {
				if ( this.options.color === clrs[ idx ] ) {
					break;
				}
			}
			if ( idx === clrs.length ) {
				this.option( "colors", this._makePalette( $.Color( this.options.color ), this._clrEls.length ) );
			}
		}
	},

	widget: function() {
		return this._ui.outer;
	},

	_setShowPreview: function( value ) {
		this._ui.preview.outer[ value ? "show" : "hide" ]();
	},

	_setRows: function( value ) {
		this.options.rows = value;
		this.refresh();
	},

	_setColor: function( value ) {
		var clr, activeClr;

		if ( value ) {
			clr = $.Color( value );
			activeClr = this._getElementColor( this._ui.table.find( ".ui-colorpalette-choice-active" ) );

			if ( !activeClr || ( activeClr && !activeClr.is( clr ) ) ) {
				if ( !this._findAndActivateColor( clr ) ) {
					this._setOption( "colors", this._makePalette( clr, this._clrEls.length ) );
					this._findAndActivateColor( clr );
				}
			}
		}
	},

	_findAndActivateColor: function( clr ) {
		var idx, elClr, found = false;

		// Look for the color in the existing entries
		for ( idx = 0 ; idx < this._clrEls.length ; idx++ ) {
			elClr = this._getElementColor( this._clrEls[ idx ] );
			if ( elClr.is( clr ) ) {
				// If found set it as active and show it in the preview
				this._clrEls[ idx ].addClass( "ui-colorpalette-choice-active" );
				this._setElementColor( this._ui.preview.inner, clr, "background-color" );
				found = true;
				break;
			} else {
				this._clrEls[ idx ].removeClass( "ui-colorpalette-choice-active" );
			}
		}

		if ( found ) {
			// If the color was found, make sure the remaining entries are not active
			for ( idx++; idx < this._clrEls.length ; idx++ ) {
				this._clrEls[ idx ].removeClass( "ui-colorpalette-choice-active" );
			}
		}
	},

	_makePalette: function( clr, nClrs ) {
		var idx, hueIdx,
			hues = [],
			hue = clr.hue(),
			inc = 360 / nClrs,
			idxMin = 0,
			ls = [];

		for ( idx = 0 ; idx < nClrs ; idx++ ) {
			hues.push( Math.round( hue + inc * idx ) % 360 );
			if ( hues[ hues.length - 1 ] < hues[ idxMin ] ) {
				idxMin = hues.length - 1;
			}
		}

		for ( idx = 0 ; idx < nClrs ; idx++ ) {
			hueIdx = ( idxMin + idx ) % nClrs;
			// When the hueIdx is 0, we do not create a new colour, because setting
			// the hue on clr may produce a different hex colour even if you set the
			// hue to the value it already has - so, basically, for clr,
			//
			// clr.toHexString( false ) === clr.hue( clr.hue() ).toHexString( false )
			//
			// does not always hold. Thus, we append clr unmodified.
			ls.push( ( 0 === hueIdx ? clr : clr.hue( hues[ hueIdx ] ) ).toHexString( false ) );
		}

		return ls.join( "," );
	},

	_setDisabled: function( value ) {
		// TODO remove this when working with jQM where
		// https://github.com/jquery/jquery-mobile/issues/5390 is fixed
		this._ui.outer.toggleClass( "ui-disabled", value );
	},

	_setColors: function( value ) {
		if ( value !== this.options.colors ) {
			this._updateColors( value );
			if ( this.options.color ) {
				this._findAndActivateColor( $.Color( this.options.color ) );
			}
			this.options.colors = value;
			this.refresh();
		}
	},

	// Correct for the situation where splitting an empty string results in an
	// array containing a single element: an empty string
	_getClrList: function( clrs ) {
		var clrAr = ( clrs || "" ).split( "," );
		return clrAr.length > 0 ? ( clrAr[ 0 ] ? clrAr : [] ) : clrAr;
	},

	_updateColors: function( clrs ) {
		var idx;

		clrs = this._getClrList( clrs );
		for ( idx = 0 ; idx < this._clrEls.length ; idx++ ) {
			if ( idx < clrs.length ) {
				this._setElementColor( this._clrEls[ idx ], clrs[ idx ], "background-color" );
			} else {
				this._setElementColor( this._clrEls[ idx ], null, "background-color" );
			}
		}
	},

	_handleEntryVClick: function( e ) {
		var el = $( e.target ),
			clr = this._getElementColor( el ),
			idx = 0;

		if ( clr ) {
			for ( idx = 0 ; idx < this._clrEls.length ; idx++ ) {
				this._clrEls[ idx ].removeClass( "ui-colorpalette-choice-active" );
			}
			el.addClass( "ui-colorpalette-choice-active" );
			this._setElementColor( this._ui.preview.inner, clr, "background-color" );
			this._setColor( clr.toHexString( false ) );
		}
	},

	_destroy: function() {
		this._ui.outer.removeClass( "ui-colorpalette" );
		this._destroyOuter();
		if ( !this._isInput ) {
			this._ui.preview.outer.remove();
			this._ui.table.remove();
		}
	},

	refresh: function() {
		var o = this.options,
			clrs = this._getClrList( o.colors ),
			nCols = Math.ceil( clrs.length / o.rows ),
			idx, row, el, inner;

		this._ui.table.empty();
		this._clrEls = [];

		for ( idx = 0 ; idx < clrs.length ; idx++ ) {
			if ( idx % nCols === 0 ) {
				row = this._ui.row.clone();
				this._ui.table.append( row );
			}
			el = this._ui.entry.outer.clone();
			row.append( el );
			inner = this._ui.entry.inner.clone().appendTo( el );
			this._on( inner, { vclick: "_handleEntryVClick" } );
			this._clrEls.push( inner );
		}

		this._updateColors( o.colors );
		if ( o.color ) {
			this._findAndActivateColor( $.Color( o.color ) );
		}
	}

}, $.mobile.behaviors.createOuter, $.mobile.behaviors.optionDemultiplexer ) );

$.widget( "mobile.colorpalette", $.mobile.colorpalette, $.extend( {}, $.mobile.behaviors.colorWidget ) );

// Add a filter to prevent the textinput widget from enhancing color inputs 
// that our initSelector would match
$.mobile.reduceEnhancementScope( "mobile", "textinput", $.mobile.colorpalette.prototype.options.initSelector );

$( document ).bind( "pagecreate create", function( e )  {
	$.mobile.colorpalette.prototype.enhanceWithin( e.target, true );
});

})( jQuery );



( function ($, window, document, undefined) {

function scrollbarWidth()
{
	var parent, child, width;
	if(width === undefined) {
		parent = $( "<div style='width:50px;height:50px;overflow:auto'><div/></div>" ).appendTo( "body" );
		child=parent.children();
		width=child.innerWidth()-child.height( 99 ).innerWidth();
		parent.remove();
	}
	return width;
}

function MomentumTracker()
{
	this.easing = $.easing[ "easeOutQuad" ] || function ( x, t, b, c, d ) {
		return -c *(t/=d)*(t-2) + b;
	};
	this.reset();
}

var tstates = {
	scrolling:	0,
	overshot:	1,
	snapback:	2,
	done:		3
};

function getCurrentTime() { return ( new Date() ).getTime(); }

$.extend(MomentumTracker.prototype, {
	start: function( pos, speed, duration, minPos, maxPos )
	{
		this.state = (speed !== 0) ? ((pos > minPos && pos < maxPos) ? tstates.scrolling : tstates.snapback ) : tstates.done;
		this.pos = pos;
		this.speed = speed;
		this.duration = duration;
		this.minPos = minPos;
		this.maxPos = maxPos;

		this.fromPos = (this.state === tstates.snapback) ? 0 : this.pos;
		this.toPos = (this.state === tstates.snapback) ? ((this.pos < this.minPos) ? this.minPos : this.maxPos) : 0;

		this.startTime = getCurrentTime();
	},

	reset: function()
	{
		this.state = tstates.done;
		this.pos = 0;
		this.speed = 0;
		this.minPos = 0;
		this.maxPos = 0;
		this.duration = 0;
	},

	update: function()
	{
		var state = this.state,
			duration, elapsed, dx, x, didOverShoot;

		if (state === tstates.done) {
			return this.pos;
		}

		duration = this.duration;
		elapsed = getCurrentTime() - this.startTime;
		elapsed = elapsed > duration ? duration : elapsed;

		if (state === tstates.scrolling || state === tstates.overshot)
		{
			dx = this.speed * (1 - this.easing( elapsed/duration, elapsed, 0, 1, duration));
			x = this.pos + dx;

			didOverShoot = (state === tstates.scrolling) && (x < this.minPos || x > this.maxPos);
			if (didOverShoot) {
				x = (x < this.minPos) ? this.minPos : this.maxPos;
			}
			this.pos = x;
			if (state === tstates.overshot)
			{
				if (elapsed >= duration)
				{
					this.state = tstates.snapback;
					this.fromPos = this.pos;
					this.toPos = (x < this.minPos) ? this.minPos : this.maxPos;
					this.duration = this.options.snapbackDuration;
					this.startTime = getCurrentTime();
					elapsed = 0;
				}
			}
			else if (state === tstates.scrolling)
			{
				if ( didOverShoot || elapsed >= duration) {
					this.state = tstates.done;
				} else if ( this.pos <= this.minPos || this.pos > this.maxPos ) {
					this.state = tstates.done;
				}
			}
		}
		else if (state === tstates.snapback)
		{
			this.state = tstates.done;
		}

		return this.pos;
	},

	done: function() { return this.state === tstates.done; },
	getPosition: function(){ return this.pos; }
});


	jQuery.widget ( "mobile.virtualgrid", jQuery.mobile.widget, {
		// view
		_$view : null,
		_$clip : null,
		_$content : null,
		_$document : null,
		_$scrollBar : null,
		_template : null,

		_viewSize : 0,
		_itemCount : 1,
		_inheritedSize : null,

		_storedScrollPos : 0,

		_$clipSize : {
			width :0,
			height : 0
		},

		_$templateItemSize : {
			width :0,
			height : 0
		},

		// previous touch/mouse position in page..
		_prevPos : {
			x : 0,
			y : 0
		},

		// current touch/mouse position in page.
		_curPos : {
			x : 0,
			y : 0
		},

		// Data
		_itemData : null,
		_numItemData : 0,
		_cacheItemData : null,
		_totalRowCnt : 0,
		_maxSize : 0,
		_scrollBarWidth :0,
		_headItemIdx :0,
		_tailItemIdx :0,

		// axis - ( true : x , false : y )
		_direction : false,
		_keepGoing : true,

		//
		_posAttributeName : "top",
		_cssAttributeName : "width",

		// timer
		_timerInterval : 10,
		_timerCB : null,
		// draw widget
		_loadedData : false,
		_isPageShow : false,

		options : {
			// virtualgrid option
			template : "",
			direction : "y",
			repository: null,
			dataType : "json",
			replaceHelper : null,

			initSelector: ":jqmData(role='virtualgrid')"
		},
		_create : function ( ) {
			var self = this,
				_repository = self.options.repository,
				_replaceHelper = null,
				_dataType = self.options.dataType.toLowerCase(),
				successCB = function ( loadedJsonData ) {
					$.mobile.loading("hide");
					self._itemData =  function ( idx ) {
						return loadedJsonData [ idx ];
					};
					self._numItemData = loadedJsonData.length;
					self._getObjectNames( self._itemData( 0 ) );
					self._initWidget();
					self._loadedData = true;
					self.element.trigger("virtualgrid.firstdraw");
				},
				errorCB = function ( data ) {
					$.mobile.loading("hide");
				};

			if ( _repository === null ) {
				return ;
			}

			if (  !( _dataType === "json" ||  _dataType === 'xml')  ){
				return ;
			}

			_replaceHelper =  window[self.options.replaceHelper ];
			if (  _replaceHelper && $.isFunction( _replaceHelper) ) {
				self._replaceHelper = _replaceHelper;
			}
			self.element.bind( "virtualgrid.firstdraw", function ( event ) {
				if ( self._isPageShow && self._loadedData ) {
					self.element.unbind("virtualgrid.firstdraw");
					self.refresh();
				}
			});

			self._$document = $( document );
			$.mobile.loading( "show" , {
				text: "loading.",
				textVisible : true,
				theme : "z",
				html : ""
			});
			$.ajax( {
				url: _repository,
				dataType: _dataType,
				timeout : 2000,
				cache: true,
				async: false,
				success: successCB,
				error: errorCB
			} );

			( self.element.parents(".ui-page") || self._$document ).one( "pageshow  " , function( event ) {
				if ( $( self.options.initSelector,  event.target ).length !== 0  ){
					self._isPageShow = true;
					self.element.trigger("virtualgrid.firstdraw");
				}
			});
		},

		_initWidget : function () {
			var self = this,
				opts = self.options;
			// make a fragment.
			self._eventType = $.support.touch ? "touch" : "mouse";
			self._scrollBarWidth = scrollbarWidth();
			self._fragment = document.createDocumentFragment();
			self._createElement = function ( tag ) {
				var element = document.createElement( tag );
				self._fragment.appendChild( element );
				return element;
			};
			self._timerCB = function () {
				self._handleMomentumScroll();
			};
			// read defined properties(width and height) from dom element.
			self._inheritedSize = self._getinheritedSize( self.element );
			// set a scroll direction.
			self._direction = opts.direction === "x" ? true : false;
			// create trakcer
			self._tracker = new MomentumTracker();
			// make view layer
			self._$clip = $( self.element ).addClass( "ui-scrollview-clip" ).addClass( "ui-virtualgrid-view" );
			self._$clip.css( "overflow", "hidden" );
			self._$view = $( document.createElement( "div" ) ).addClass( "ui-virtualgrid-overthrow" );
			self._$view[ 0 ].style.overflow = "auto";
			if ( self._direction ) {
				self._$view[ 0 ].style[ "overflow-y" ] = "hidden";
				self._cssAttributeName = "width";
				self._posAttributeName = "left";
			} else {
				self._$view[ 0 ].style[ "overflow-x" ] = "hidden";
				self._cssAttributeName = "height";
				self._posAttributeName = "top";
			}
			self._$clip.append( self._$view);
			self._$content = $( "<div class='ui-virtualgrid-content' style='position:relative;' ></div>" );
			self._$view.append( self._$content );
			self._addEventListener();
			// optional functions
			self._setScrollBarPos = $.noop;
			self._hideScrollBar = $.noop;
			self._showScrollBar = $.noop;
		},

		refresh : function () {
			var self = this,
				opts = self.options,
				width = 0,
				height = 0;

			self._template = $( "#" + opts.template );
			if ( !self._template ) {
				return ;
			}

			width = self._calculateClipSize( "width" );
			height = self._calculateClipSize( "height" );
			self._$view.width( width ).height( height );
			self._$clip.width( width ).height( height );
			self._$clipSize.width = width;
			self._$clipSize.height = height;
			self._calculateTemplateItemSize();
			self._initPageProperty();

			self._createScrollBar();
			self._setScrollBarSize();
		},

		scrollTo: function ( x, y, duration ) {
			var self = this,
				start = getCurrentTime(),
				thisDuration = duration || 0,
				sx = self._$view[ 0 ].scrollLeft,
				sy = self._$view[ 0 ].scrollTop,
				dx = x - sx,
				dy = y - sy,
				tfunc;

			tfunc = function () {
				var elapsed = getCurrentTime() - start,
					ec;
				if ( elapsed >= thisDuration ) {
					self._timerID = 0;
					self._setScrollPosition( x, y );
				} else {
					ec = $.easing.easeOutQuad( elapsed / thisDuration, elapsed, 0, 1, thisDuration );
					self._setScrollPosition( sx + ( dx * ec ), sy + ( dy * ec ) );
					self._timerID = setTimeout( tfunc, self._timerInterval );
				}
			};
			this._timerID = setTimeout( tfunc, this._timerInterval );
		},

		_resize : function () {
			var self = this,
				width = 0,
				height = 0,
				rowCount = 0,
				totalRowCnt = 0,
				columnCount = 0,
				$orderedRows = null,
				isModified = false,
				cssPropertyName = self._direction ? "width" : "height";

			if ( !self._inheritedSize ) {
				return ;
			}

			width = self._calculateClipSize( "width" );
			height = self._calculateClipSize( "height" );

			columnCount = self._calculateColumnCount();

			if ( self._itemCount !== columnCount ) {
				self._itemCount = columnCount;
				totalRowCnt = parseInt( self._numItemData / columnCount, 10 );
				self._totalRowCnt = self._numItemData % columnCount === 0 ? totalRowCnt : totalRowCnt + 1;
				self._$content[ cssPropertyName ]( self._totalRowCnt * self._$templateItemSize[ cssPropertyName ] );
				self._replaceRows();
				isModified = true;
			}

			if ( self._direction ) {
				rowCount = self._calculateRowCount( width, self._$templateItemSize.width );
			} else {
				rowCount = self._calculateRowCount( height, self._$templateItemSize.height );
			}

			if ( rowCount > self._rowsPerView ) {
				self._increaseRow( rowCount - self._rowsPerView );
				isModified = true;
			} else if ( rowCount < self._rowsPerView ) {
				self._decreaseRow( self._rowsPerView - rowCount );
				isModified = true;
			}
			self._rowsPerView = rowCount;

			// post process
			self._$view.width( width ).height( height );
			self._$clip.width( width ).height( height );
			self._$clipSize.width = width;
			self._$clipSize.height = height;

			// Sort order
			if ( isModified ) {
				$orderedRows = self._$content.children( "[row-index]" ).sort( function ( a, b ) {
						return a.getAttribute( "row-index" ) - b.getAttribute( "row-index" );
				});
				self._headItemIdx = parseInt ( $orderedRows[ 0 ].getAttribute( "row-index" ) , 10 );
				self._tailItemIdx =  parseInt ( $orderedRows[ $orderedRows.length - 1 ].getAttribute( "row-index" ) , 10 );
			}

			self._setScrollBarSize();
			self._setScrollBarPos( self._$view[ 0 ].scrollLeft, self._$view[ 0 ].scrollTop );
		},

		_initPageProperty : function () {
			var self = this,
				$children,
				columnCount = 0,
				totalRowCnt = 0,
				attributeName = "height",
				clipSize = self._$clipSize.height,
				templateSize = self._$templateItemSize.height;

			if ( self._direction ) {
				attributeName = "width";
				clipSize = self._$clipSize.width;
				templateSize = self._$templateItemSize.width;
			}

			columnCount = self._calculateColumnCount();

			totalRowCnt = parseInt(self._numItemData / columnCount , 10 );
			self._totalRowCnt = self._numItemData % columnCount === 0 ? totalRowCnt : totalRowCnt + 1;
			self._itemCount = columnCount;

			if ( templateSize <= 0) {
				return ;
			}

			self._rowsPerView = self._calculateRowCount( clipSize, templateSize );

			$children = self._makeRows( self._rowsPerView + 2 );
			self._$content.append( $children );
			self._$content.children().css( attributeName, templateSize + "px" );

			self._$content[ attributeName ]( self._totalRowCnt * templateSize );
			self._tailItemIdx = self._rowsPerView + 1;
		},

		_addEventListener : function () {
			var self = this;

			if ( self._eventType === "mouse" ) { // mouse event.
				self._$content.delegate( "img", "dragstart", function ( event ) {
					event.preventDefault();
				});
				self._$view.bind( "scroll", function ( event ) {
					var viewElement = self._$view[ 0 ];
					self._setScrollPosition(  viewElement.scrollLeft,  viewElement.scrollTop );
					event.preventDefault();
				});

				this._dragStartEvt = "mousedown";
				this._dragStartCB = function ( event ) {
					return self._handleDragStart( event, event.clientX, event.clientY);
				};

				this._dragMoveEvt = "mousemove";
				this._dragMoveCB = function ( event ) {
					return self._handleDragMove( event, event.clientX, event.clientY );
				};

				this._dragStopEvt = "mouseup";
				this._dragStopCB = function ( event ) {
					return self._handleDragStop( event );
				};
			} else { // touch event.
				self._dragStartEvt = "touchstart";
				self._dragStartCB = function ( event ) {
					var t = event.originalEvent.targetTouches[ 0 ];
					event.preventDefault();
					event.stopPropagation();
					return self._handleDragStart( event, t.pageX, t.pageY );
				};

				self._dragMoveEvt = "touchmove";
				self._dragMoveCB = function ( event ) {
					var t = event.originalEvent.targetTouches[ 0 ];
					return self._handleDragMove( event, t.pageX, t.pageY );
				};

				self._dragStopEvt = "touchend";
				self._dragStopCB = function ( event ) {
					return self._handleDragStop( event );
				};
			}
			self._$view.bind( self._dragStartEvt, self._dragStartCB );
			$( window ).bind( "resize", function ( event ){
				if ( $( $.mobile.virtualgrid.prototype.options.initSelector, $( event.target ) ) ) {
					self._resize();
				}
			});
		},

		_getinheritedSize : function ( elem ) {
			var $target = $(elem),
				height,
				width,
				ret = {
					isDefinedWidth : false,
					isDefinedHeight : false,
					width : 0,
					height : 0
				};

			// Node.ELEMENT_NODE : 1
			while ( $target[ 0 ].nodeType === 1 && (ret.isDefinedWidth === false || ret.isHeightDefined === false )) {
				height = $target[ 0 ].style.height;
				width = $target[ 0 ].style.width;

				if (ret.isDefinedHeight === false && height !== "" ) {
					// Size was defined
					ret.isDefinedHeight = true;
					ret.height = parseInt(height, 10);
				}

				if ( ret.isDefinedWidth === false && width !== "" ) {
					// Size was defined
					ret.isDefinedWidth = true;
					ret.width = parseInt(width, 10);
				}
				$target = $target.parent();
			}
			return ret;
		},

		//----------------------------------------------------//
		//		scroll handler								//
		//----------------------------------------------------//
		_handleMomentumScroll : function ( ) {
			var self =  this,
				keepGoing = false,
				x = 0,	y = 0,
				tracker = self._tracker;

			if ( tracker ) {
				tracker.update();
				if ( self._direction ) {
					x = tracker.getPosition();
				} else {
					y = tracker.getPosition();
				}
				keepGoing = keepGoing || !tracker.done();
			}
			self._setScrollPosition( x, y );
			if ( keepGoing ) {
				self._timerID = setTimeout( self._timerCB, self._timerInterval );
			} else {
				self._stopMScroll();
			}
		},

		_handleDragStart : function ( event ) {
			var self = this;

			self._stopMScroll();
			self._enableTracking();
			self._curPos.x = 0;
			self._curPos.y = 0;
			self._prevPos.x = 0;
			self._prevPos.y = 0;
			// for my control.
			self._scrolling = false;
			self._startTime = ( new Date() ).getTime();
			event.stopPropagation();
		},

		_handleDragMove : function ( event, x, y ) {
			var self = this,
				newY = self._$view[ 0 ].scrollTop,
				newX = self._$view[ 0 ].scrollLeft,
				distanceY =0;

			self._lastPos2 = y;
			self._prevPos.x = self._curPos.x;
			self._prevPos.y = self._curPos.y;
			self._curPos.x = x;
			self._curPos.y = y;
			self._startTime = getCurrentTime();
			if ( self._scrolling ) {
				if ( self._direction ) {
					distanceY = self._curPos.x - self._prevPos.x;
					newX = newX - distanceY;
				} else {
					distanceY = self._curPos.y - self._prevPos.y;
					newY = self._$view[ 0 ].scrollTop - distanceY;
				}
				self._setScrollPosition( newX, newY );
			} else {
				self._scrolling = true;
			}
		},

		_handleDragStop : function ( ) {
			var self = this,
				distanceY = self._curPos.y - self._prevPos.y,
				distanceX = self._curPos.x - self._prevPos.x;

			self._startMScroll(-distanceX, -distanceY);
		},

		_stopMScroll: function () {
			if ( this._timerID ) {
				clearTimeout( this._timerID );
			}
			this._timerID = 0;
			this._tracker.reset();
			this._disableTracking();
			this._hideScrollBar();
		},

		_startMScroll: function ( speedX, speedY ) {
			var self = this,
				keepGoing = false,
				duration = 1500,
				tracker = this._tracker,
				c, startYPos, speed,
				v;

			self._stopMScroll();
			self._showScrollBar();

			if ( tracker ) {
				if ( self._direction ) {
					c = this._$clip.width();
					v = this._$content.width();
					startYPos = this._$view[ 0 ].scrollLeft;
					speed = speedX;
				} else {
					c = this._$clip.height();
					v = this._$content.height();
					startYPos = this._$view[ 0 ].scrollTop;
					speed = speedY;
				}

				if ( (( startYPos === 0 && speedY > 0 ) ||
					( startYPos === (v - c) && speedY < 0 )) &&
						v > c ) {
					return;
				}

				tracker.start( startYPos, speed,
					duration, 0, (v > c) ? (v - c) : 0 );
				keepGoing = keepGoing || !tracker.done();
			}

			if ( keepGoing ) {
				this._timerID = setTimeout( this._timerCB, this._timerInterval );
			} else {
				this._stopMScroll();
			}
		},

		_enableTracking: function () {
			var self = this;
			self._$document.bind( self._dragMoveEvt, self._dragMoveCB );
			self._$document.bind( self._dragStopEvt, self._dragStopCB );
		},

		_disableTracking: function () {
			var self = this;
			self._$document.unbind( self._dragMoveEvt, self._dragMoveCB );
			self._$document.unbind( self._dragStopEvt, self._dragStopCB );
		},

		//----------------------------------------------------//
		//		Calculate size about dom element.		//
		//----------------------------------------------------//
		_setScrollPosition: function ( x, y ) {
			var self = this,
				$content =  self._$content ,
				storedScrollPos = self._storedScrollPos,
				curPos = self._direction ? x : y,
				diffPos = 0,
				attrName = null,
				templateItemSize =0,
				di = 0,
				i = 0,
				$row = null;

			if ( self._direction ) {
				curPos = x;
				templateItemSize = self._$templateItemSize.width;
				attrName = "left";
			} else {
				curPos = y;
				templateItemSize = self._$templateItemSize.height;
				attrName = "top";
			}
			diffPos = curPos - storedScrollPos;
			di = parseInt( diffPos / templateItemSize, 10 );

			if ( di > 0 && self._tailItemIdx < self._totalRowCnt ) { // scroll down
				for ( ; i < di; i++ ) {
					$row = $content.children("[row-index='"+self._headItemIdx+"']");
					self._tailItemIdx++;
					self._headItemIdx++;
					self._replaceRow( $row, self._tailItemIdx );
					self._clearSelectedDom();
				}
				self._storedScrollPos += di * templateItemSize;
			} else if ( di < 0 ) { // scroll up
				for ( ; i > di && self._headItemIdx > 0; i-- ) {
					$row = $content.children( "[row-index='" + self._tailItemIdx + "']" );
					self._headItemIdx--;
					self._replaceRow( $row, self._headItemIdx );
					self._tailItemIdx--;
					self._clearSelectedDom();
				}
				self._storedScrollPos += di * templateItemSize;
			}
			if ( diffPos < 0 ) {
				$row =  $content.children( "[row-index='" + self._headItemIdx + "']");
				if ( $row.position()[attrName] > curPos ) {
					$row = $content.children( "[row-index='" + self._tailItemIdx + "']" );
					self._headItemIdx--;
					self._replaceRow( $row, self._headItemIdx );
					self._tailItemIdx--;
				}
			}

			self._setScrollBarPos( x, y );
			if ( self._direction ) {
				self._$view[ 0 ].scrollLeft = x;
			} else {
				self._$view[ 0 ].scrollTop = y;
			}
		},

		//----------------------------------------------------//
		//		Calculate size about dom element.		//
		//----------------------------------------------------//
		_calculateClipSize : function ( attr ) {
			var self = this,
				paddingValue = 0,
				axis = attr === "height" ? true : false,
				difinedAttrName = axis ? "isDefinedHeight"  : "isDefinedWidth",
				clipSize = 0,
				paddingName1, paddingName2, header, footer, $parent, $view;

			if ( self._inheritedSize[ difinedAttrName ] ) {
				return self._inheritedSize[ attr ];
			}

			$view = self._$clip;
			$parent = $view.parents( ".ui-content" );

			if ( axis ) {
				clipSize = $( window).innerHeight();
				header = $parent.siblings( ".ui-header" );
				footer = $parent.siblings( ".ui-footer" );
				clipSize = clipSize - ( header.outerHeight( true ) || 0);
				clipSize = clipSize - ( footer.outerHeight( true ) || 0);
				paddingName1 = "padding-top";
				paddingName2 = "padding-bottom";
			} else {
				// IE 8 does not support window.inner
				clipSize = $( window).innerWidth();
				paddingName1 = "padding-left";
				paddingName2 = "padding-right";
			}

			if ( $parent ) {
				paddingValue = parseInt( $parent.css( paddingName1 ), 10 );
				clipSize = clipSize - ( paddingValue || 0 );
				paddingValue = parseInt( $parent.css( paddingName2 ), 10 );
				clipSize = clipSize - ( paddingValue || 0 );
			} else {
				clipSize = $view[ attr ]();
			}

			return clipSize;
		},

		// This method will take a size of template-item.
		_calculateTemplateItemSize : function () {
			var self = this,
				$tempBlock,
				$tempItem;

			$tempBlock = $ ( self._makeRow( 0 ) );
			$tempItem = $tempBlock.children().eq( 0 );
			self._$content.append( $tempBlock );
			self._$templateItemSize.width = $tempItem.outerWidth( true );
			self._$templateItemSize.height = $tempItem.outerHeight( true );
			$tempBlock.remove();
		},

		_calculateColumnCount : function () {
			var self = this,
				$view = $( self.element ).parents( ".ui-content" ) || $( self.element ),
				viewSize = self._direction ? $view.innerHeight() : $view.innerWidth(),
				templateSize = self._direction ? self._$templateItemSize.height : self._$templateItemSize.width,
				isDefined = false,
				itemCount = 0;

			isDefined = self._direction ? this._inheritedSize.isDefinedHeight : this._inheritedSize.isDefinedWidth;

			if ( isDefined ) {
				viewSize =  self._direction ? this._inheritedSize.height : this._inheritedSize.width;
			} else {
				if ( self._direction ) {
					viewSize = viewSize - ( parseInt( $view.css( "padding-top" ), 10 ) + parseInt( $view.css( "padding-bottom" ), 10 ) );
				} else {
					viewSize = viewSize - ( parseInt( $view.css( "padding-left" ), 10 ) + parseInt( $view.css( "padding-right" ), 10 ) );
				}
				if ( viewSize < templateSize * self._numItemData ) {
					viewSize = viewSize - ( self._scrollBarWidth );
				}
			}

			itemCount = parseInt( ( viewSize / templateSize ), 10);
			return itemCount > 0 ? itemCount : 1 ;
		},

		_calculateRowCount : function( viewSize, itemSize ) {
			var ret = 0;

			ret = viewSize / itemSize;
			ret = Math.ceil( ret );
			return parseInt( ret, 10);
		},

		//----------------------------------------------------//
		//		Scrollbar		//
		//----------------------------------------------------//
		_createScrollBar : function () {
			var self = this,
				$scrollBar,
				prefix = "<div class=\"ui-scrollbar ui-scrollbar-",
				suffix = "\"><div class=\"ui-scrollbar-track\"><div class=\"ui-scrollbar-thumb\"></div></div></div>";

			if ( self._eventType !== "touch" ) {
				return ;
			}

			// add utility function.
			self._setScrollBarPos = function ( x, y ) {
				var self = this,
					pos = 0,
					$scrollBar = self._$scrollBar;

				if ( self._direction ) {
					pos = x + ( self._movePos * parseInt( x / self._$templateItemSize.width, 10 ) );
					$scrollBar[ 0 ].style.left =  pos  + "px";
				} else {
					pos = y + ( self._movePos * parseInt( y / self._$templateItemSize.height, 10 ) );
					pos = Math.floor( pos );
					$scrollBar[ 0 ].style.top =  pos  + "px";
				}
			};

			self._hideScrollBar = function ( ) {
				self._$scrollBar[ 0 ].style.opacity = 1;
			};

			self._showScrollBar = function ( ) {
				self._$scrollBar[ 0 ].style.opacity = 1;
			};

			// make DOM Element.
			if ( self._direction ) {
				$scrollBar = $( prefix + "x" + suffix );
				self._$view.css("overflow-y", "hidden");
				self._$content[ 0 ].style.height = ( self._$clipSize.height -  self._scrollBarWidth ) +"px";
			} else {
				$scrollBar = $( prefix + "y" + suffix );
			}
			self._$content.append( $scrollBar );
			self._$scrollBar = $scrollBar.find( ".ui-scrollbar-thumb" );
			self._hideScrollBar();
		},

		_setScrollBarSize : function () {
			var self = this,
				size = 0,
				$scrollBar = self._$scrollBar;

			if ( self._eventType !== "touch" ) {
				return ;
			}

			if (self._direction ) {
				self._$content[ 0 ].style.height = ( self._$clipSize.height -  self._scrollBarWidth ) +"px";
			}

			if ( self._direction ) {
				size = parseInt( ( self._$clipSize.width / self._$content.width() ) * 100 , 10 );
				size = size + 15;
				self._movePos = ( self._$clipSize.width - size ) / ( self._totalRowCnt - ( self._rowsPerView - 1 ) );
				$scrollBar.width( size );
			} else {
				size = parseInt ( ( self._$clipSize.height / self._$content.height() ) * 100 , 10 );
				size = size + 15;
				self._movePos = ( self._$clipSize.height - size ) / ( self._totalRowCnt - ( self._rowsPerView - 1 ) );
				$scrollBar.height( size );
			}
		},

		//----------------------------------------------------//
		//		DOM Element handle		//
		//----------------------------------------------------//
		_makeRows : function ( count ) {
			var self = this,
				index = 0,
				$row = null,
				children = [];

			for ( index = 0; index < count ; index += 1 ) {
				$row = $( self._makeRow( index ) );

				$row.children().detach().appendTo( $row ); // <-- layout
				if ( self._direction ) {
					$row[ 0 ].style.top = "0px";
					$row[ 0 ].style.left = ( index * self._$templateItemSize.width )+"px";
				}
				children[ index ] = $row;
			}
			return children;
		},

		// make a single row block
		_makeRow : function ( rowIndex ) {
			var self = this,
				index = rowIndex * self._itemCount,
				colIndex = 0,
				attrName = "left",
				blockClassName = "ui-virtualgrid-wrapblock-y ",
				wrapBlock = self._createElement( "div" ),
				strWrapInner = "";

			if ( self._direction ) {
				attrName = "top";
				blockClassName = "ui-virtualgrid-wrapblock-x ";
			}
			for ( colIndex = 0; colIndex < self._itemCount && index < self._numItemData ; colIndex++ ) {
				strWrapInner += self._makeHtmlData( index, index, attrName );
				index += 1;
			}
			wrapBlock.innerHTML = strWrapInner;
			wrapBlock.setAttribute( "class", blockClassName );
			wrapBlock.setAttribute( "row-index", String( rowIndex ) );
			wrapBlock.style.position = "absolute";
			if ( self._direction ) {
				wrapBlock.style.left = ( rowIndex * self._$templateItemSize.width ) + "px";
				wrapBlock.style.width = self._$templateItemSize.width + "px";
			} else {
				wrapBlock.style.top = ( rowIndex * self._$templateItemSize.height ) + "px";
			}
			return wrapBlock;
		},

		_makeHtmlData : function ( myTemplate, dataIndex, colIndex ) {
			var self = this,
				htmlStr = "",
				itemData = null,
				attrName = self._direction ? "top" : "left";

			itemData = self._itemData( dataIndex );
			if ( itemData ) {
				htmlStr = self._convertTmplToStr( itemData );
				htmlStr = self._insertPosToTmplStr( htmlStr, attrName, ( colIndex * self._cellOtherSize ) );
			}
			return htmlStr;
		},

		_insertPosToTmplStr : function ( tmplStr, attrName, posVal ) {
			var tagCloseIdx = tmplStr.indexOf( ">" ),
				classIdx = -1,
				firstPart,
				lastPart,
				result,
				found = false,
				targetIdx = 0,
				firstPartLen,
				i = 0;

			if ( tagCloseIdx === -1 ) {
				return;
			}

			firstPart = tmplStr.slice( 0, tagCloseIdx );
			lastPart = tmplStr.slice( tagCloseIdx, tmplStr.length );

			classIdx = firstPart.indexOf( "class" );

			if ( classIdx !== -1 ) {
				firstPartLen = firstPart.length;
				for ( i = classIdx + 6; i < firstPartLen; i++ ) {
					if ( firstPart.charAt( i ) === "\"" || firstPart.charAt( i ) === "\'" ) {
						if ( found === false ) {
							found = true;
						} else {
							targetIdx = i;
							break;
						}
					}
				}
				result = firstPart.slice( 0, targetIdx ) + " virtualgrid-item" + firstPart.slice( targetIdx, firstPartLen ) + lastPart;
			} else {
				result = firstPart + " class=\"virtualgrid-item\"" + lastPart;
			}

			if ( !isNaN( posVal ) ) {
				result = result.replace( ">", " style=\"" + attrName + ": " + String( posVal ) + "px\">");
			}
			return result;
		},

		// TODO : supprot x - axis.
		_getCriteriaRow : function () {
			var $row,
				index = this._headItemIdx,
				$content = this._$content,
				scrollPos = this._direction ? this._$view[ 0 ].scrollLeft : this._$view[ 0 ].scrollTop,
				filterCondition = 0;

			filterCondition = scrollPos - ( this._$templateItemSize[ this._cssAttributeName ] * 0.9 );
			do {
				$row = $content. children( "[row-index='" + index + "']" );
				if ( $row && $row.position()[ this._posAttributeName ] >= filterCondition ) {
					break;
				}
				index++;
			} while ( $row.length );
			return { target : $row, index : index };
		},

		_replaceRows : function () {
			var self = this,
				$rows = self._$content.children( "[row-index]" ),
				$row,
				rowIndex = 0,
				rowsLength = $rows.length,
				idx = 0,
				diff = 0,
				ret = self._getCriteriaRow(),
				dataIndex = ret.index * ret.target.children().length;

			dataIndex = dataIndex % self._itemCount === 0 ? dataIndex / self._itemCount : Math.floor( dataIndex / self._itemCount );
			diff = ret.index - dataIndex;

			for ( ; idx < rowsLength ; idx++ ) {
				$row = $( $rows[ idx ] );
				rowIndex = parseInt( $row.attr( "row-index" ), 10 );
				self._replaceRow( $row, rowIndex - diff );
			}

			if ( self._direction ) {
				self._$view[ 0 ].scrollLeft = ret.target.position().left + ( self._$view[ 0 ].scrollLeft % self._$templateItemSize.width );
				self._storedScrollPos = self._$view[ 0 ].scrollLeft;
			} else {
				self._$view[ 0 ].scrollTop = ret.target.position().top + ( self._$view[ 0 ].scrollTop % self._$templateItemSize.height );
				self._storedScrollPos = self._$view[ 0 ].scrollTop;
			}
			self._headItemIdx = self._headItemIdx - diff;
			self._tailItemIdx = self._tailItemIdx - diff;
		},

		_replaceRow : function ( block, index ) {
			var self = this,
				$block = block.hasChildNodes ? block : block[ 0 ],
				length = 0,
				idx = 0,
				dataIndex = 0, data = null, $children,
				tempBlocks = null;

			if ( !$block ) {
				return ;
			}

			$children = $block.children;
			if( self._replaceHelper &&  self._itemCount === $children.length ) {
				dataIndex = index * self._itemCount;
				length = self._itemCount;
				for ( ; idx < length ;  idx++) {
					data = self._itemData( dataIndex + idx );
					if (  $children[ idx ] && data ) {
						self._replaceHelper(  $children[ idx], data );
						$children[ idx ].style.display = "inline-block";
					} else if (  $children[ idx ] && !data ) {
						$children[ idx ].style.display = "none";
					}
				}
			} else {
				while ( $block.hasChildNodes() ) {
					$block.removeChild( $block.lastChild );
				}
				tempBlocks = self._makeRow( index );
				while ( tempBlocks.children.length ) {
					$block.appendChild( tempBlocks.children[ 0 ] );
				}
				tempBlocks.parentNode.removeChild( tempBlocks );
			}

			if ( self._direction ) {
				$block.style.left = ( index * self._$templateItemSize.width ) + "px";
			} else {
				$block.style.top = ( index * self._$templateItemSize.height ) + "px";
			}
			$block.setAttribute("row-index", index );
		},

		_increaseRow : function ( num ) {
			var self = this,
				$row = null,
				$children = null,
				idx = 0,
				itemSize =  this._direction ? this._$templateItemSize. width :  this._$templateItemSize. height,
				childCount = 0;


			for ( ; idx < num ; idx++ ) {
				if ( this._tailItemIdx + 1 >  this._totalRowCnt ) {
					this._headItemIdx -= 1;
					$row = $( this._makeRow( this._headItemIdx ) );
					this._storedScrollPos -= itemSize;
				} else {
					this._tailItemIdx += 1;
					$row = $( this._makeRow( this._tailItemIdx ) );
				}
				this._$content.append( $row );
			}
		},

		_decreaseRow : function ( num ) {
			var self = this,
				attrName = this._direction ? "left" : "top",
				$tailRow = null,
				$headRow = null,
				position,
				idx = 0;

			for ( ; idx < num ; idx++ ) {
				self._$content.children ( "[row-index = "+( self._tailItemIdx - idx )+"]" ).remove();
			}
			self._tailItemIdx -= num;
		},

		_getObjectNames : function ( obj ) {
			var properties = [],
				name = "";

			for ( name in obj ) {
				properties.push( name );
			}
			this._properties = properties;
		},

		_tmpl : function ( data ){
			var self = this,
				idx = 0,
				plainMsg,
				ret;
			if ( !data ) {
				return ;
			}

			plainMsg = self._template.text() || self._template.html();
			for ( idx = 0 ; idx < self._properties.length ; idx++ ) {
				plainMsg = self._strReplace( plainMsg, "${" + self._properties[idx] +"}" , data[ self._properties[ idx ] ] );
			}
			ret = $( plainMsg );
			return ret;
		},

		_convertTmplToStr : function ( data ) {
			var self = this,
				idx = 0,
				plainMsg;

			if ( !data ) {
				return ;
			}
			plainMsg = self._template.text() || self._template.html();
			for ( idx = 0 ; idx < self._properties.length ; idx++ ) {
				plainMsg = self._strReplace( plainMsg, "${" + self._properties[ idx ] + "}" , data[ self._properties[ idx ] ] );
			}
			return plainMsg;
		},

		_strReplace : function(plainMsg, stringToFind,stringToReplace){
			var temp = plainMsg,
				index = plainMsg.indexOf( stringToFind );
			while (index !== -1) {
				temp = temp.replace( stringToFind, stringToReplace );
				index = temp.indexOf( stringToFind );
			}
			return temp;
		},

		_clearSelectedDom : function ( ) {
			if ( window.getSelection ) { // Mozilla
				window.getSelection().removeAllRanges();
			} else { // IE
				document.selection.empty();
			}
		}
	} );

	$( document ).bind( "pagecreate create", function ( e ) {
		$.mobile.virtualgrid.prototype.enhanceWithin( e.target );
	} );

} (jQuery, window, document) );


( function( $, window, document, undefined ) {
	$.widget( "mobile.tokentextarea", $.mobile.widget, {
		_focusStatus : null,
		_items : null,
		_viewWidth : 0,
		_reservedWidth : 0,
		_currentWidth : 0,
		_fontSize : 0,
		_anchorWidth : 0,
		_labelWidth : 0,
		_marginWidth : 0,
		_$labeltag: null,
		_$inputbox: null,
		_$moreBlock: null,
		options : {
			label : "To : ",
			link : null,
			theme : null,
			description : "+ {0}"
		},

		_create: function() {
			var self = this,
				$view = this.element,
				role = $view.jqmData( "role" ),//TODO: performance improvement for jqmData after jQM-1.4.
				option = this.options,
				className = "ui-tokentextarea-link",
				labeltag = document.createElement( "label" ),
				inputbox = document.createElement( "input" ),
				$moreBlock = $( document.createElement( "a" ) );

			if ( !option.theme ) {
				option.theme = $.mobile.getInheritedTheme( $view, "a" );
			}

			$view.hide().empty().addClass( "ui-" + role );

			// create a label tag.
			labeltag.innerText = option.label;
			/* WORK::Reduced string concatenation.
			labeltag.className = "ui-tokentextarea-label " + " ui-tokentextarea-label-theme-" + option.theme;
			*/
			labeltag.className = "ui-tokentextarea-label ui-tokentextarea-label-theme-" + option.theme;
			//labeltag.tabIndex = 0;
			$view.append( labeltag );

			// create a input tag
			/* WORK::Reduced string concatenation.
			inputbox.className = "ui-tokentextarea-input ui-tokentextarea-input-visible" + " ui-tokentextarea-input-theme-" + option.theme;
			*/
			inputbox.className = "ui-tokentextarea-input ui-tokentextarea-input-visible ui-tokentextarea-input-theme-" + option.theme;
			$view.append( inputbox );

			// create a anchor tag.
			if ( option.link === null || $.trim( option.link ).length < 1 || $( option.link ).length === 0 ) {
				className += "-dim";
			}
			$moreBlock.attr( "data-role", "button" )
				.buttonMarkup( {
					icon: "plus",
					iconpos:"notext",
					inline: true
				})
				.attr( { "href" : $.trim( option.link ) } )
				.addClass( "ui-tokentextarea-link-base " + className )
				.find( "span.ui-btn-text" )
				.text( "Add recipient" );

			// append default htmlelements to main widget.
			$view.append( $moreBlock[0] );

			// assign global variables for performance improvement instead of using objects in below codes.
			self._$labeltag = $( labeltag );
			self._$inputbox = $( inputbox );
			self._$moreBlock = $moreBlock;

			// bind a event
			this._bindEvents();
			self._focusStatus = "init";
			// display widget
			$view.show();

			// assign global variables
			self._viewWidth = $view.innerWidth();
			self._reservedWidth += self._calcBlockWidth( $moreBlock[0] );
			self._reservedWidth += self._calcBlockWidth( labeltag );
			self._fontSize = parseInt( $moreBlock.css( "font-size" ), 10 );
			self._currentWidth = self._reservedWidth;
			self._modifyInputBoxWidth();
		},

		// bind events
		_bindEvents: function() {
			var self = this,
				$view = self.element,
				/* WORK::The value used only once doesn’t variable declaration and uses the value directly.
				option = self.options,
				*/
				theme = self.options.theme,
				$inputbox = self._$inputbox,
				$moreBlock = self._$moreBlock;

			// delegate a event to HTMLDivElement(each block).
			$view.delegate( "div", "click", function( event ) {
				var $this = $( this ),
					$lockBlock;

				if ( $this.hasClass( "ui-tokentextarea-sblock" ) ) {
					// if block is selected, it will be removed.
					self._removeTextBlock();
				}

				$lockBlock = $view.find( "div.ui-tokentextarea-sblock" );
				if ( typeof $lockBlock !== "undefined" ) {
					/* WORK::Modified due to seperating some CSS from ui-tokentextarea-sblock or from ui-tokentextarea-block to use as theme.
					$lockBlock.removeClass( "ui-tokentextarea-sblock" ).addClass( "ui-tokentextarea-block" );
					*/
					$lockBlock
						.removeClass( "ui-tokentextarea-sblock ui-tokentextarea-sblock-theme-" + theme )
						.addClass( "ui-tokentextarea-block ui-tokentextarea-block-theme-" + theme );
				}


				/* WORK::Modified due to seperating some CSS from ui-tokentextarea-sblock or from ui-tokentextarea-block to use as theme.
				$this.removeClass( "ui-tokentextarea-block" ).addClass( "ui-tokentextarea-sblock" );
				*/
				$this.removeClass( "ui-tokentextarea-block ui-tokentextarea-block-theme-" + theme )
					.addClass( "ui-tokentextarea-sblock ui-tokentextarea-sblock-theme-" + theme );
				$view.trigger( "select" );
			});

			$inputbox.bind( "keyup", function( event ) {
				// 8  : backspace
				// 13 : Enter
				// 186 : semi-colon
				// 188 : comma
				var keyValue = event.keyCode,
					valueString = $inputbox.val(),
					valueStrings = [],
					index,
					isSeparator = false;

				if ( keyValue === 8 ) {
					if ( valueString.length === 0 ) {
						self._validateTargetBlock();
					}
				} else if ( keyValue === 13 || keyValue === 186 || keyValue === 188 ) {
					if ( valueString.length !== 0 ) {
						// split content by separators(',', ';')
						valueStrings = valueString.split ( /[,;]/ );
						for ( index = 0; index < valueStrings.length; index++ ) {
							if ( valueStrings[index].length !== 0 && valueStrings[index].replace( /\s/g, "" ).length !== 0 ) {
								self._addTextBlock( valueStrings[index] );
							}
						}
					}
					$inputbox.val( "" );
					isSeparator = true;
				} else {
					self._unlockTextBlock();
				}

				return !isSeparator;
			});

			$moreBlock.click( function() {
				if ( $moreBlock.hasClass( "ui-tokentextarea-link-dim" ) ) {
					return;
				}

				$inputbox.removeClass( "ui-tokentextarea-input-visible" ).addClass( "ui-tokentextarea-input-invisible" );

				$.mobile.changePage( self.options.link, {
					transition: "slide",
					reverse: false,
					changeHash: false
				});
			});

			$.mobile.document.bind( "pagechange.tta", function( event ) {
				if ( $view.innerWidth() === 0 ) {
					return;
				}
				self.refresh();
				$inputbox.removeClass( "ui-tokentextarea-input-invisible" ).addClass( "ui-tokentextarea-input-visible" );
			});

			$view.bind( "click", function( event ) {
				if ( self._focusStatus === "focusOut" ) {
					self.focusIn();
				}
			});
		},

		// create a textbutton and append this button to parent layer.
		// @param arg1 : string
		// @param arg2 : index
		_addTextBlock: function( messages, blockIndex ) {
			if ( arguments.length === 0 ) {
				return;
			}

			if ( !messages ) {
				return;
			}

			var self = this,
				$view = self.element,
				index = blockIndex,
				textBlock = null,
				$blocks = null;

			if ( self._viewWidth === 0 ) {
				self._viewWidth = $view.innerWidth();
			}

			// create a new text HTMLDivElement.
			textBlock = document.createElement( "div" );
			textBlock.innerText = messages;
			/* WORK::Modified due to seperating some CSS from ui-tokentextarea-sblock or from ui-tokentextarea-block to use as theme.
			textBlock.className = "ui-tokentextarea-block";
			*/
			textBlock.className = "ui-tokentextarea-block ui-tokentextarea-block-theme-" + self.options.theme;
			textBlock.style.visibility = "hidden";

			$blocks = $view.find( "div" );
			if ( index !== null && index <= $blocks.length ) {
				$( $blocks[index] ).before( textBlock );
			} else {
				self._$inputbox.before( textBlock );
			}

			textBlock = self._ellipsisTextBlock( textBlock );
			textBlock.style.visibility = "visible";

			self._modifyInputBoxWidth();

			textBlock.style.display = "none";

			$( textBlock ).fadeIn( "fast", function() {
				self._currentWidth += self._calcBlockWidth( textBlock );
			});
		},

		_removeTextBlock: function() {
			var self = this,
				theme = self.options.theme,
				$view = this.element,
				$lockBlock = $view.find( "div.ui-tokentextarea-sblock" ),
				_temp = null,
				_dummy = function() {};

			if ( $lockBlock !== null && $lockBlock.length > 0 ) {
				self._currentWidth -= self._calcBlockWidth( $lockBlock );

				$lockBlock.fadeOut( "fast", function() {
					$lockBlock.remove();
					self._modifyInputBoxWidth();
				});
			} else {
				/* WORK::Modified due to seperating some CSS from ui-tokentextarea-sblock or from ui-tokentextarea-block to use as theme.
				$view.find( "div:last" ).removeClass( "ui-tokentextarea-block" ).addClass( "ui-tokentextarea-sblock" );
				*/
				$view.find( "div:last" )
					.removeClass( "ui-tokentextarea-block ui-tokentextarea-block-theme-" + theme )
					.addClass( "ui-tokentextarea-sblock ui-tokentextarea-sblock-theme-" + theme );
			}
		},

		_calcBlockWidth: function( block ) {
			return $( block ).outerWidth( true );
		},

		_unlockTextBlock: function() {
			var theme = this.options.theme,
				$view = this.element,
				$lockBlock = $view.find( "div.ui-tokentextarea-sblock" );

			if ( $lockBlock ) {
				/* WORK::Modified due to seperating some CSS from ui-tokentextarea-sblock or from ui-tokentextarea-block to use as theme.
				$lockBlock.removeClass( "ui-tokentextarea-sblock" ).addClass( "ui-tokentextarea-block" );
				*/
				$lockBlock
					.removeClass( "ui-tokentextarea-sblock ui-tokentextarea-sblock-theme-" + theme )
					.addClass( "ui-tokentextarea-block ui-tokentextarea-block-theme-" + theme );
			}
		},

		// call when remove text block by backspace key.
		_validateTargetBlock: function() {
			var self = this,
				theme = self.options.theme,
				$view = self.element,
				$lastBlock = $view.find( "div:last" ),
				$tmpBlock = null;

			if ( $lastBlock.hasClass( "ui-tokentextarea-sblock" ) ) {
				self._removeTextBlock();
			} else {
				$tmpBlock = $view.find( "div.ui-tokentextarea-sblock" );
				/* WORK::Modified due to seperating some CSS from ui-tokentextarea-sblock or from ui-tokentextarea-block to use as theme.
				$tmpBlock.removeClass( "ui-tokentextarea-sblock" ).addClass( "ui-tokentextarea-block" );
				$lastBlock.removeClass( "ui-tokentextarea-block" ).addClass( "ui-tokentextarea-sblock" );
				*/
				$tmpBlock
					.removeClass( "ui-tokentextarea-sblock ui-tokentextarea-sblock-theme-" + theme )
					.addClass( "ui-tokentextarea-block ui-tokentextarea-block-theme-" + theme );
				$lastBlock
					.removeClass( "ui-tokentextarea-block ui-tokentextarea-block-theme-" + theme )
					.addClass( "ui-tokentextarea-sblock ui-tokentextarea-sblock-theme-" + theme );
			}
		},

		_ellipsisTextBlock: function( textBlock ) {
			var self = this,
				$view = self.element,
				maxWidth = self._viewWidth / 2;

			if ( self._calcBlockWidth( textBlock ) > maxWidth ) {
				$( textBlock ).width( maxWidth - self._marginWidth );
			}

			return textBlock;
		},

		_modifyInputBoxWidth: function() {
			var self = this,
				$view = self.element,
				margin = 0,
				labelWidth = 0,
				anchorWidth = 0,
				inputBoxWidth = 0,
				$blocks = $view.find( "div" ),
				blockWidth = 0,
				index = 0,
				inputBoxMargin = 10,
				$inputBox = self._$inputbox;

			if ( $view.width() === 0 ) {
				return;
			}

			if ( self._labelWidth === 0 ) {
				self._labelWidth = self._$labeltag.outerWidth( true );
				self._anchorWidth = self._$moreBlock.outerWidth( true );
				self._marginWidth = parseInt( ( $inputBox.css( "margin-left" ) ), 10 );
				self._marginWidth += parseInt( ( $inputBox.css( "margin-right" ) ), 10 );
				self._viewWidth = $view.innerWidth();
			}

			margin = self._marginWidth;
			labelWidth = self._labelWidth;
			anchorWidth = self._anchorWidth;
			inputBoxWidth = self._viewWidth - labelWidth;

			for ( index = 0; index < $blocks.length; index += 1 ) {
				blockWidth = self._calcBlockWidth( $blocks[index] );

				if ( blockWidth >= inputBoxWidth + anchorWidth ) {
					if ( blockWidth >= inputBoxWidth ) {
						inputBoxWidth = self._viewWidth - blockWidth;
					} else {
						inputBoxWidth = self._viewWidth;
					}
				} else {
					if ( blockWidth > inputBoxWidth ) {
						inputBoxWidth = self._viewWidth - blockWidth;
					} else {
						inputBoxWidth -= blockWidth;
					}
				}
			}

			inputBoxWidth -= margin;
			if ( inputBoxWidth < anchorWidth * 2 ) {
				inputBoxWidth = self._viewWidth - margin;
			}
			$inputBox.width( inputBoxWidth - anchorWidth - inputBoxMargin );
		},

		_stringFormat: function( expression ) {
			var pattern = null,
				message = expression,
				i = 0;
			for ( i = 1; i < arguments.length; i += 1 ) {
				pattern = "{" + ( i - 1 ) + "}";
				message = message.replace( pattern, arguments[i] );
			}
			return message;
		},

		_resizeBlocks: function() {
			var self = this,
				$view = self.element,
				$blocks = $view.find( "div" ),
				index = 0;

			for ( index = 0 ; index < $blocks.length ; index += 1 ) {
				$( $blocks[index] ).css( "width", "auto" );
				$blocks[index] = self._ellipsisTextBlock( $blocks[index] );
			}
		},

		//----------------------------------------------------//
		// Public Method                                      //
		//----------------------------------------------------//
		focusIn: function() {
			if ( this._focusStatus === "focusIn" ) {
				return;
			}

			var theme = this.options.theme,
				$view = this.element;

			$view.find( ".ui-tokentextarea-desclabel" ).remove();
			/* WORK::Modified due to seperating some CSS from ui-tokentextarea-sblock or from ui-tokentextarea-block to use as theme.
			$view.find( "div.ui-tokentextarea-sblock" ).removeClass( "ui-tokentextarea-sblock" ).addClass( "ui-tokentextarea-block" );
			*/
			$view.find( "div.ui-tokentextarea-sblock" )
				.removeClass( "ui-tokentextarea-sblock ui-tokentextarea-sblock-theme-" + theme )
				.addClass( "ui-tokentextarea-block ui-tokentextarea-block-theme-" + theme );
			$view.find( "div" ).show();
			this._$inputbox.removeClass( "ui-tokentextarea-input-invisible" ).addClass( "ui-tokentextarea-input-visible" );
			$view.find( "a" ).show();

			// change focus state.
			this._modifyInputBoxWidth();
			this._focusStatus = "focusIn";
			$view.removeClass( "ui-tokentextarea-focusout" ).addClass( "ui-tokentextarea-focusin" );
			this._$inputbox.focus();
		},

		focusOut: function() {
			if ( this._focusStatus === "focusOut" ) {
				return;
			}

			var self = this,
				$view = self.element,
				tempBlock = null,
				stateBlock = null,
				numBlock = null,
				statement = "",
				index = 0,
				lastIndex = 10,
				label = self._$labeltag,
				more = $view.find( "span" ),
				$blocks = $view.find( "div" ),
				currentWidth = $view.outerWidth( true ) - more.outerWidth( true ) - label.outerWidth( true ),
				blockWidth = 0;

			self._$inputbox.removeClass( "ui-tokentextarea-input-visible" ).addClass( "ui-tokentextarea-input-invisible" );
			$blocks.hide();
			$view.find( "a" ).hide();

			currentWidth = currentWidth - self._reservedWidth;

			for ( index = 0; index < $blocks.length; index++ ) {
				blockWidth = $( $blocks[index] ).outerWidth( true );
				if ( currentWidth - blockWidth <= 0 ) {
					lastIndex = index - 1;
					break;
				}

				$( $blocks[index] ).show();
				currentWidth -= blockWidth;
			}

			if ( lastIndex !== $blocks.length ) {
				statement = self._stringFormat( self.options.description, $blocks.length - lastIndex - 1 );
				tempBlock = document.createElement( 'span' );
				/* WORK::Modified due to seperating some CSS from ui-tokentextarea-desclabel to use as theme.
				tempBlock.className = "ui-tokentextarea-desclabel";
				*/
				tempBlock.className = "ui-tokentextarea-desclabel ui-tokentextarea-desclabel-theme-" + self.options.theme;
				stateBlock = document.createElement( 'span' );
				stateBlock.innerText = statement;
				numBlock = document.createElement( 'span' );
				numBlock.innerText = $blocks.length - lastIndex - 1;
				numBlock.style.visibility = "hidden";
				tempBlock.appendChild( stateBlock );
				tempBlock.appendChild( numBlock );
				$( $blocks[lastIndex] ).after( tempBlock );
			}

			// update focus state
			this._focusStatus = "focusOut";
			$view.removeClass( "ui-tokentextarea-focusin" ).addClass( "ui-tokentextarea-focusout" );
		},

		inputText: function( message ) {
			if ( arguments.length === 0 ) {
				return this._$inputbox.val();
			}
			this._$inputbox.val( message );
			return message;
		},

		select: function( index ) {
			var theme = this.options.theme,
				$view = this.element,
				$lockBlock = null,
				$blocks = null;

			if ( this._focusStatus === "focusOut" ) {
				return;
			}

			if ( arguments.length === 0 ) {
				// return a selected block.
				$lockBlock = $view.find( "div.ui-tokentextarea-sblock" );
				if ( $lockBlock ) {
					return $lockBlock.text();
				}
				return null;
			}
			// 1. unlock all blocks.
			this._unlockTextBlock();
			// 2. select pointed block.
			$blocks = $view.find( "div" );
			if ( $blocks.length > index ) {
				/* WORK::Modified due to seperating some CSS from ui-tokentextarea-sblock or from ui-tokentextarea-block to use as theme.
				$( $blocks[index] ).removeClass( "ui-tokentextarea-block" ).addClass( "ui-tokentextarea-sblock" );
				*/
				$( $blocks[index] )
					.removeClass( "ui-tokentextarea-block ui-tokentextarea-block-theme-" + theme )
					.addClass( "ui-tokentextarea-sblock ui-tokentextarea-sblock-theme-" + theme );
				$view.trigger( "select" );
			}
			return null;
		},

		add: function( message, position ) {
			if ( this._focusStatus === "focusOut" ) {
				return;
			}

			this._addTextBlock( message, position );
		},

		remove: function( position ) {
			var self = this,
				$view = this.element,
				$blocks = $view.find( "div" ),
				index = 0,
				_temp = null,
				_dummy = function() {};

			if ( this._focusStatus === "focusOut" ) {
				return;
			}

			if ( arguments.length === 0 ) {
				$blocks.fadeOut( "fast", function() {
					$blocks.remove();
					self._modifyInputBoxWidth();
					self._trigger( "clear" );
				});
			} else if ( !isNaN( position ) ) {
				// remove selected button
				index = ( ( position < $blocks.length ) ? position : ( $blocks.length - 1 ) );

				$( $blocks[index] ).fadeOut( "fast", function() {
					$( $blocks[index] ).remove();
					self._modifyInputBoxWidth();
				});
			}
		},

		length: function() {
			return this.element.find( "div" ).length;
		},

		refresh: function() {
			var self = this,
				viewWidth = this.element.innerWidth();

			if ( viewWidth && self._viewWidth !== viewWidth ) {
				self._viewWidth = viewWidth;
			}
			self._resizeBlocks();
			self._modifyInputBoxWidth();
		},

		destroy: function() {
			var $view = this.element,
				_temp = null,
				_dummy = function() {};

			if ( this._eventRemoveCall ) {
				return;
			}

			this._$labeltag.remove();
			$view.find( "div" ).undelegate( "click" ).remove();
			$view.find( "a" ).remove();
			this._$inputbox.unbind( "keyup" ).remove();

			this._eventRemoveCall = true;
			if ( $view[0].remove ) {
				_temp = $view[0].remove;
				$view[0].remove = _dummy;
			}
			$view.remove();
			if ( _temp) {
				$view[0].remove = _temp;
			}
			this._eventRemoveCall = false;

			this._trigger( "destroy" );
		}
	});

	$.mobile.document.bind( "pagecreate create", function() {
		$( ":jqmData(role='tokentextarea')" ).tokentextarea();
	});

	$.mobile.window.bind( "resize", function() {
		$( ":jqmData(role='tokentextarea')" ).tokentextarea( "refresh" );
	});
} ( jQuery, window, document ) );


