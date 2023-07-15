define(['knockout', 'text!./column-search.html','session'], function(ko, templateMarkup, session) {

  function ColumnCharSearch(params) {
  	var self = this;
  	self.display_name = params.display_name;
	self.column = params.column;
	self.category = (params.category || route.category).charAt(0).toUpperCase() + (params.category || route.category).slice(1).toLowerCase();
	self.top = ko.observable('0px');
	self.left = ko.observable('0px');
	self.search = ko.observable('');
	self.open = ko.observable(false);
	self.type = params.type;
	self.oper = ko.observable('=');
	self.oper_options = [
		{v:'=',d:'Equal To'},
		{v:'!=',d:'Not Equal To'},
		{v:'<=',d:'Less Than or Equal To'},
		{v:'>=',d:'Greater Than or Equal To'},
		{v:'<',d:'Less Than'},
		{v:'>',d:'Greater Than'},
		{v:'contains',d:'Contains Number'}
	];
	self.checkExit = function(obj, event) {
		if(event.keyCode == 27)
			self.close(event.currentTarget, obj, event);
		if(event.keyCode == 13)
			self.makeSearch(obj, event)
	};

	self.close = function(element, obj, event) {
		self.search('');
		$(element).remove();
	}
	self.toggleSearchBox = function(element) {
		$('.search-box').remove();
		if(self.open()) {
			self.open(false);
			return;
		}
		self.open(true)
		var ele = $(templateMarkup)[2].innerHTML;
		var ele =  $(ele).prependTo($(element).closest('.dataTables_scroll'));
		self.top(
			$(element).closest('th').position().top+
			$(element).closest('th').outerHeight()+
			'px'
		);
		//check to make sure that the dropdown is not off the screen, if it is change it to be left positioned off the other side of the th
		var left = Math.max($(element).closest('th').position().left+($(element).closest('th').outerWidth() - ele.outerWidth()), 0);
		if(left == 0)
			left = $(element).closest('th').position().left;

		self.left(left+'px');
		ele.hide();
		ko.applyBindings(self, $(ele)[0]);
		ele.slideDown(function(){
			ele.find(':input').focus();
		});

	}
	self.makeSearch = function(obj,event) {
		window.ajaxWait();
		//use timeout so that display has time to show loading icon
		setTimeout(function() {
			var value = self.search();
			var display = self.display_name+'';
			var column = "`"+self.column+"`";
			var oper = self.oper();
			
			//convert the value
			if(self.type == 'num' && self.oper() != 'contains') {
				value = parseFloat(value);
				value = value.toFixed(precision);
				column = 'ROUND('+column+', '+precision+')';
			}
			//if we are searching for a number in the value, change column to convert to displayed units, run like
			else if(self.type == 'num' && self.oper() == 'contains') {
				//use rounding percision of 4, because that is what is displayed
				column = 'ROUND('+column+',4)';
				value = '%'+value+'%';
				oper = 'LIKE';
			} else {
				value = '%'+value+'%';
				oper = 'LIKE'
			}

			arr = {'TYPE':self.type, 'Display':display,'ColName':column, 'Oper':oper, 'Value':value};
			var record = session.getORM(self.category.slice(0,-1)+'Record')(); //replace this with your own session 
			record.DataArray('Query')().push(arr);
			self.close($(event.currentTarget).closest('.search-box').remove());
			self.open(false);
		}, 100);

	}
  }

  // This runs when the component is torn down. Put here any logic necessary to clean up,
  // for example cancelling setTimeouts or disposing Knockout subscriptions/computeds.
  ColumnCharSearch.prototype.dispose = function() { };

  return { viewModel: ColumnCharSearch, template: templateMarkup };

});
