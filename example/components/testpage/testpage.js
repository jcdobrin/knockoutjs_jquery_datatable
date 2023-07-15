define(['knockout', 'session', 'text!./testpage.html',], function(ko,session, extraTemplate) {
	function ExtraViewModel() {
		var self = this;
		self.box_title = 'Recent Configurations';

		self.session = session;
		self.user = session.getORM('UserRecord')();
		self.QueryParams = self.user.DataArray('Query')();
		self.QueryParamsSubscribe = self.QueryParams.subscribe(function() {
			self.redrawTable();
		});

		self.category = 'Users';
		
		self.redrawTable = function() {
			var dt = ko.dataFor($('#example_wrapper').children()[0]).dt;
			dt.api().clearPipeline();
			dt.api().draw();
		}

		self.removeQuery = function(obj,event) {
			window.ajaxWait();
			setTimeout(function(){
				self.QueryParams.remove(obj);
			}, 100);
		}

		self.makeColumnSearch = function(display, column, type) {
			return {title : `<column-search params="category:'users', type:'${type}', display_name:'${display}',  column:'${column}'"></column-search>`, data: column};
		}
		
		self.columns = [
			self.makeColumnSearch('Username', 'username', 'char'),
			self.makeColumnSearch('Name', 'name', 'char'),
			self.makeColumnSearch('Email', 'email', 'char'),
			self.makeColumnSearch('Address', 'address', 'char'),
			self.makeColumnSearch('Sex', 'sex', 'char'),
			self.makeColumnSearch('Birthday', 'birthday', 'char'),
		];
	}

	ExtraViewModel.prototype.dispose = function() {
		this.QueryParamsSubscribe.dispose();
		$('body').off('click','td.machine_name');
		$('body').off('click','td.holder_name');
		$('body').off('click','td.tool_name');
		$('body').off('click','td.material_name');
		$('body').off('click', '.compareDash');
	}
	return { viewModel: ExtraViewModel , template: extraTemplate };
});