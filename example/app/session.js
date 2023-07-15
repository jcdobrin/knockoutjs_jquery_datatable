define(['jquery', 'knockout', 'knockout-projections'], function($, ko) {

	//allowe ratelimit observables to immediately notify subscribers
	ko.extenders.rateLimit = (function (originalFunc) {
		return function (target, options) {
			var value = ko.utils.unwrapObservable(target());
			target.notifyImmediately = target.notifySubscribers;
			target.old_value = typeof value == 'object' ? ko.toJSON(value): value;
			target.notifySubscribers = function() {
				var value =  ko.utils.unwrapObservable(target());
				var compare_value = typeof value == 'object' ? ko.toJSON(value): value;
				if(target.disableRateLimit || (target.old_value != compare_value &&  value != undefined)) {
					target.notifyImmediately( value );
					target.old_value = typeof value == 'object' ? ko.toJSON(value): value;
				}
			}

			target.force = function() {
				var value =  ko.utils.unwrapObservable(target());
				target.clear();
				if(target.old_value != value &&  value != undefined) {
					target.notifyImmediately( value );
					target.old_value = typeof value == 'object' ? ko.toJSON(value) : value;
				}
			}

			target.forceValue = function(val) {
				target(val);
				target.clear();
				target.notifyImmediately( val );
				target.old_value = typeof val == 'object' ? ko.toJSON(val) : val;
			}

			return originalFunc(target, options);
		}
	})(ko.extenders.rateLimit);

	function session() {
		var self = this;
		self.orm = {};
		self.orm_list = ko.observableArray();
		
		self.getORM = function(orm, json) {
			return ko.computed({
				read: function () {
					if( self.orm_list.indexOf(orm)  == -1 ) {
						if(typeof self.orm[orm] == 'undefined')
							self.orm[orm] = new SessionOrm(orm, json);
						else
							self.orm[orm].init();
						self.orm_list.push(orm);
					}
					return self.orm[orm];
				}
			}, this);
		}
	}

	function SessionOrm(record, json) {
		var self = this;
		self.record = record;
		self.reset = ko.observable(false);
		self.columns = {};
		self.data = {};
		self.helper = {data: {}, columns:{}};
		self.reset = ko.observable(false);

		self.set = function(prop, value, type) {
			if(typeof value == 'undefined' || value == null)
					value = '';
			var g = self.get(prop, type);
			g(value);
			return g;

		}

		self.get = function(prop, type) {
			if(typeof self.helper[type][prop] == 'undefined') {
				self.helper[type][prop] = ko.pureComputed({
					read:function() {
						self.reset();
						if(typeof self[type][prop] == 'undefined') {
							self[type][prop] = ko.observable('');
							if(typeof self.helper[type][prop] != 'undefined') {
								self.helper[type][prop].notifyImmediately(undefined);
							}
						}
						//if the value is a object, return the ko observable wrapper
						if(typeof self[type][prop]() == 'object') {
							return self[type][prop];
						}
						return self[type][prop]();
					},
					write:function(value) {
						self.reset();
						if(typeof self[type][prop] == 'undefined') {
							self[type][prop] = ko.observable('');
							if(typeof self.helper[type][prop] != 'undefined') {
								self.helper[type][prop].notifyImmediately(undefined);
							}
						}
						self[type][prop](value);

						//if the value is a object, return the ko observable wrapper
						if(typeof self[type][prop]() == 'object') {
							return self[type][prop];
						}
						return self[type][prop]();
					}
				}).extend({
						sessionORM: [self.record, type, prop],
						rateLimit:{timeout:5000, method:'notifyWhenChangesStop'},
						notify:'always'
				});
			}

			return self.helper[type][prop];
		}

		self.Data = function() {
			if(arguments.length == 2)
				return self.set(arguments[0], arguments[1], 'data');
			else
				return self.get(arguments[0], 'data');
		}

		self.DataArray = function() {
			var prop = arguments[0];
			if(typeof self['data'][prop] == "undefined" ||
				typeof ko.utils.unwrapObservable(self['data'][prop]) != 'object'
			) {
				self['data'][prop] = ko.observableArray(arguments[1] || []);
				self['data'][prop].subscribe(function(value) {
					self.DataArray(prop).force();
				});
			} else if(typeof arguments[1] != "undefined" && typeof arguments[1] == "object") {
				self['data'][prop](arguments[1]);
			}
			return self.Data(prop);
		}

		self.Column = function() {
			if(arguments.length == 2)
				return self.set(arguments[0], arguments[1], 'columns');
			else
				return self.get(arguments[0], 'columns');
		}

		self.load = function(json) {
			for(i in json) {
				if(i == 'columns') {
					for(j in json.columns) {
						self.Column(j, json.columns[j]).old_value=json.columns[j];
						self.Column(j).clear();

					}
				} else if(i == 'data') {
					for(j in json.data) {
						if(typeof json.data[j] == 'object') {
							self.DataArray(j, json.data[j]).old_value=ko.toJSON(json.data[j]);
							self.DataArray(j).clear();
						}
						else
							self.Data(j, json.data[j]).old_value=json.data[j];
							self.Data(j).clear();
					}
				} else {
					self[i] = json[i];
				}
			}
		}
	}
	window.session = new session();
	window.ajaxWait = function(){};
	return window.session;

});