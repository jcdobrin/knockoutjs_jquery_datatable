define(['jquery', 'knockout','knockout-mapping','jqueryui', 'knockout-jqueryui', 'datatables', 'knockout-projections'], function($, ko, ko_mapping) {
  // Components can be packaged as AMD modules, such as the following:
  
  ko.components.register('simple-datatable', { require: 'components/simple-datatable/simple-datatable' });

  ko.components.register('column-search', { require: 'components/column-search/column-search' });

  ko.components.register('testpage', { require: 'components/testpage/testpage' });

  // [Scaffolded component registrations will be inserted here. To retain this feature, don't remove this comment.]

	// Helper function so we know what has changed
	// http://stackoverflow.com/questions/12166982
	ko.observableArray.fn.subscribeArrayChanged = function(addCallback, deleteCallback) {
		var previousValue = undefined;
		this.subscribe(function(_previousValue) {
			previousValue = _previousValue.slice(0);
		}, undefined, 'beforeChange');
		this.subscribe(function(latestValue) {
			var editScript = ko.utils.compareArrays(previousValue, latestValue);
			for (var i = 0, j = editScript.length; i < j; i++) {
				switch (editScript[i].status) {
					case "retained":
						break;
					case "deleted":
						if (deleteCallback)
							deleteCallback(editScript[i].value);
						break;
					case "added":
						if (addCallback)
							addCallback(editScript[i].value);
						break;
				}
			}
			previousValue = undefined;
		});
	};

	ko.bindingHandlers.eachProp = {
		transformObject: function (obj) {
			var properties = [];
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					properties.push({ key: key, value: obj[key] });
				}
			}
			return ko.observableArray(properties);
		},
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var value = ko.utils.unwrapObservable(valueAccessor()),
				properties = ko.bindingHandlers.eachProp.transformObject(value);

			ko.bindingHandlers['foreach'].init(element, properties, allBindingsAccessor, viewModel, bindingContext)
			return { controlsDescendantBindings: true };
		},
		update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var value = ko.utils.unwrapObservable(valueAccessor()),
				properties = ko.bindingHandlers.eachProp.transformObject(value);

			ko.bindingHandlers['foreach'].update(element, properties, allBindingsAccessor, viewModel, bindingContext)
			return { controlsDescendantBindings: true };
		}
	};

	ko.extenders.numeric = function(target, options){
		target.hasError = ko.observable();
    	target.validationMessage = ko.observable();

			//define a function to do validation
		function validate(newValue) {
		   target.hasError( isNaN(newValue));
		   target.validationMessage("Field must be numeric");
		}

		//initial validation
		validate(target());

		//validate whenever the value changes
		target.subscribe(validate);

		//return the original observable
		return target;
	}
 // Start the application

 	ko.window ={
 	  height : ko.observable($(window).height()),
      width : ko.observable($(window).width())
    };

 	$(window).on('resize', function() {
 		clearTimeout(this.timeout);
		this.timeout = setTimeout(function(){throttleResize()}, 500);
 	});
 	function throttleResize() {
 		ko.window.height($(window).height());
		ko.window.width($(window).width());
 	}

	ko.checkedDB = function(accessor, dbValues, key) {
		if(!dbValues)
			dbValues = [1,0];
		for(var i in dbValues) {
			dbValues[i] += '';
		}

		var func = ko.computed({
			read:  function() {
				return ko.utils.unwrapObservable( key ? accessor[key] : accessor) == dbValues[0];
			},
			write: function(value) {
				var write_value = ko.utils.unwrapObservable(value) ? dbValues[0] : dbValues[1];
				if(key) {
					if(ko.isObservable(accessor[key]))
						accessor[key]( write_value );
					else {
						accessor[key] = write_value ;
					}
				} else {
					if(ko.isObservable(accessor))
						accessor( write_value );
					else {
						accessor = write_value;
					}
				}
			}
		});
		if(
			dbValues.indexOf(
				ko.utils.unwrapObservable( key ? accessor[key] : accessor)
			) == -1
		)
			func( key ? accessor[key] : accessor);
		return func;
	}

	ko.when = function(observable) {
		var deferred = $.Deferred(), value = observable.peek(), subs;
		if (value) {
			deferred.resolve(value);
		} else {
			subs = observable.subscribe(function(newValue) {
				if (newValue) {
					subs.dispose();
					deferred.resolve(newValue);
				}
			});
		}
		return deferred;
	};

	ko.handleDefault = function(v, d) {
		if(v == undefined && d != undefined) {
			return ko.isObservable(d) ? d : ko.observable(d);
		} else if(v == undefined) {
			return ko.observable();
		} else {
			return ko.isObservable(v) ? v : ko.observable(v);
		}
	}

	ko.precision = function(v, p) {
		return ko.computed(function(){
			var t = ko.unwrap(v);
			if(isNaN(t)) return t;
				return t.toFixed(p);
		});
	}

	ko.ConverterWrapper = function(val, unit, dbUnit, precision, precisionDB) {
		if(precision == undefined)
			precision = 4;
		if( precisionDB == undefined)
			 precisionDB = precision;

		if(ko.isObservable(val))
			val.extend({rateLimit:{timeout:5000, method:'notifyWhenChangesStop'}});
		return  ko.computed({
				read:function() {
					return convert(ko.unwrap(val), dbUnit, ko.unwrap(unit), precision);
				},
				write:function(value) {
					val(convert(ko.unwrap(value), ko.unwrap(unit), dbUnit, precisionDB));
				}
			});
	}

	ko.isObservableArray = function(a) {
		 return ko.isObservable(a) && !(a.destroyAll === undefined);
	}
	
	ko.handleDefaultArray = function(v, d) {
		var a = ko.observableArray();
		if(v == undefined && d != undefined) {
			if( ko.isObservableArray(d))
				return d
			ko.utils.arrayPushAll(a, d);
		} else if(v != undefined) {
			if(ko.isObservableArray(v)) {
				return v;
			}
			ko.utils.arrayPushAll(a, v);
		}
		return a;
	}

	ko.dirtyFlag = function(root, isInitiallyDirty, returnDirty) {
		var result = function() {},
			_initialState = ko.observable(ko.toJSON(root)),
			_isInitiallyDirty = ko.observable(isInitiallyDirty);
			_returnDirty = ko.observable(returnDirty);

		result.isDirty = ko.computed(function() {
			var dirty = ko.toJSON(root);

			if(_returnDirty()) {
				return dirty;
			}
			return _isInitiallyDirty() || _initialState() !== dirty;
		});

		result.reset = function() {
			_initialState(ko.toJSON(root));
			_isInitiallyDirty(false);
		};

		return result;
	};

	ko.delimiter = function(data, d, j) {
		var d = d || ',';
		var j = j || "\n"

		if(typeof ko.unwrap(data) != 'string')
			if(ko.isObservable(data))
					data('');
				else
					data = '';

		return ko.computed({
			read:function(){
				return ko.unwrap(data).split(d).join(j);
			},
			write:function(value) {
				if(ko.isObservable(data))
					data(value.split(j).join(d));
				else
					data = value.split(j).join(d);
			}
		});
	}

	//
	// Pipelining function for DataTables. To be used to the `ajax` option of DataTables
	// https://datatables.net/dev/accessibility/DataTables_1_10/examples/server_side/pipeline.html
	//
	$.fn.dataTable.pipeline = function ( opts ) {
		// Configuration options
		var conf = $.extend( {
			pages: 5,     // number of pages to cache
			url: '',      // script url
			data: null,   // function or object with parameters to send to the server
						  // matching how `ajax.data` works in DataTables
			type: 'POST', // Ajax HTTP method
			error:function(response, type, error) {
				$('.dataTables_processing').hide();
				if ( type === 'timeout' )
					alert( 'The server took too long to send the data.' );
				else if(typeof response.responseJSON != 'undefined')
					alert(response.responseJSON.message);
				else
					alert(response.responseText);
			}
		}, opts );

		// Private variables for storing the cache
		var cacheLower = -1;
		var cacheUpper = null;
		var cacheLastRequest = null;
		var cacheLastJson = null;

		return function ( request, drawCallback, settings ) {
			var ajax          = false;
			var requestStart  = request.start;
			var drawStart     = request.start;
			var requestLength = request.length;
			var requestEnd    = requestStart + requestLength;

			if ( settings.clearCache ) {
				// API requested that the cache be cleared
				ajax = true;
				settings.clearCache = false;
			}
			else if (!cacheLastJson || cacheLower < 0 || requestStart < cacheLower || requestEnd > cacheUpper ) {
				// outside cached data - need to make a request
				ajax = true;
			}
			else if ( JSON.stringify( request.order )   !== JSON.stringify( cacheLastRequest.order ) ||
					  JSON.stringify( request.columns ) !== JSON.stringify( cacheLastRequest.columns ) ||
					  JSON.stringify( request.search )  !== JSON.stringify( cacheLastRequest.search )
			) {
				// properties changed (ordering, columns, searching)
				ajax = true;
			}

			// Store the request for checking next time around
			cacheLastRequest = $.extend( true, {}, request );

			if ( ajax ) {
				// Need data from the server
				if ( requestStart < cacheLower ) {
					requestStart = requestStart - (requestLength*(conf.pages-1));

					if ( requestStart < 0 ) {
						requestStart = 0;
					}
				}

				cacheLower = requestStart;
				cacheUpper = requestStart + (requestLength * conf.pages);

				request.start = requestStart;
				request.length = requestLength*conf.pages;

				// Provide the same `data` options as DataTables.
				if ( $.isFunction ( conf.data ) ) {
					// As a function it is executed with the data object as an arg
					// for manipulation. If an object is returned, it is used as the
					// data object to submit
					var d = conf.data( request );
					if ( d ) {
						$.extend( request, d );
					}
				}
				else if ( $.isPlainObject( conf.data ) ) {
					// As an object, the data given extends the default
					$.extend( request, conf.data );
				}

				var url = ko.utils.unwrapObservable(conf.url);
				settings.jqXHR = $.ajax( {
					"type":     conf.type,
					"url":      url+(url.indexOf('?')!=-1?'&':'?')+'_='+(new Date()).getTime(),
					"data":     request,
					"dataType": "json",
					'async':(request.draw==1), //only allow async on the first draw
					"cache":    false,
					"success":  function ( json ) {
						cacheLastJson = $.extend(true, {}, json);

						if ( cacheLower != drawStart ) {
							json.data.splice( 0, drawStart-cacheLower );
						}
						json.data.splice( requestLength, json.data.length );;
						if(conf.dataSrc) {
							json.data = conf.dataSrc(json);
						}
						drawCallback( json);
					},
					"error":conf.error
				} );
			}
			else {
				json = $.extend( true, {}, cacheLastJson );
				json.draw = request.draw; // Update the echo for each response
				json.data.splice( 0, requestStart-cacheLower );
				json.data.splice( requestLength, json.data.length );
				if(conf.dataSrc) {
					json.data = conf.dataSrc(json);
				}
				drawCallback(json);
			}
		}
	};

	// Register an API method that will empty the pipelined data, forcing an Ajax
	// fetch on the next draw (i.e. `table.clearPipeline().draw()`)
	$.fn.dataTable.Api.register( 'clearPipeline()', function () {
		return this.iterator( 'table', function ( settings ) {
			settings.clearCache = true;
		} );
	} );

	//override default autocomplete filter with swiftsearch
	/*$.ui.autocomplete.filter = function (haystacks, needle) {
		var results = swiftsearch($.ui.autocomplete.escapeRegex(needle), haystacks, false, 15);
		var returning = [];

		for(var i in results) {
			returning.push({
				label:results[i]['highlight_text'].replace(/mark/g, 'strong'),
				value:results[i]['text']
			});
		}
		return returning;
	}*/

	window.makeDate = function(date) { return date; }
	window.makeCheckbox = function(a) { return a; }
	window.showName = function(a) { return a; }
	ko.applyBindings({  });
});

