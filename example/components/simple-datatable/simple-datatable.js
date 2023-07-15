define(['knockout','knockout-mapping', 'jquery','text!./simple-datatable.html', 'datatables', 'fixedheader', 'fixedcolumns'], function(ko, ko_mapping, $, templateMarkup) {
	function SimpleDatatable(params, componentInfo) {
		var self = this;
		var defaults = {
			scrollX : '100%',
			scrollY : 'page-height',
			order: [],
			extrapadding:0,
			bFilter : false,
			aLengthMenu: [
				[15, 25, 50, 75, 100, 200],
				[15+' Items per page',
				 25+' Items per page',
				 50+' Items per page',
				 75+' Items per page',
				 100+' Items per page',
				 200+' Items per page']
			],
			oLanguage : {
				sInfo : 'Showing _START_ to _END_ of _TOTAL_',
				sLengthMenu:'_MENU_'
			},
			autoWidth:true,
		};
		self.parentModel = ko.contextFor(componentInfo.element);
		//converts aLengthMenu into a list knockout can use for select boxes
		self.mapALengthMenu = function() {
			var values = self.dt.aLengthMenu[0];
			var displays = self.dt.aLengthMenu[1];
			var options = [];
			for(i in values) {
				options.push({name:i, display:displays[i]});
			}
		}

		var dt_settings = $.extend( defaults, params);
		if(typeof dt_settings.ajax != 'undefined') {
			dt_settings.processing = true;
			if(dt_settings.serverSide == true && typeof dt_settings.ajax != 'string')
				dt_settings.ajax = $.fn.dataTable.pipeline(dt_settings.ajax);
		}
		if(typeof dt_settings.columnFilter != 'undefined') {
			dt_settings.bFilter = true;
		}

		dt_settings.bAutoWidth = false;
		var initComplete = function(settings){};
		if(dt_settings.initComplete != undefined)
			initComplete = dt_settings.initComplete;
		dt_settings.initComplete = function(settings){
			initComplete(settings);
			setTimeout(function() {
				//make a very small change to the height to trigger resize
				ko.window.height(ko.window.height()-.0000001);
				self.dt.find('tbody').css('visibility', 'visible');
			} , 150);
		};

		var fnDrawCallback = function(settings){};
		if(dt_settings.fnDrawCallback != undefined)
			fnDrawCallback = dt_settings.fnDrawCallback;
		dt_settings.fnDrawCallback = function(settings, json){
			fnDrawCallback(settings);
			 if(this.old_start == undefined)
			 	this.old_start = 0;
			 if ( settings._iDisplayStart != this.old_start ) {
                $(settings.nScrollBody).animate({scrollTop: 0}, 200);
                this.old_start = settings._iDisplayStart;
            }
		};
		self.resizeHandler = function(){self.dt.api().draw();};

		if(dt_settings.scrollY == 'page-height') {
			dt_settings.scrollY = $('body').height() / 2;
			dt_settings.scrollCollapse = true;
			self.resizeHandler = function(){
				self.dt.fnSettings().oScroll.sY =
				$('body').height() -
				$(componentInfo.element).find('.dataTables_scrollBody').offset().top -
				56 -
				dt_settings.extrapadding;
				var width = $(componentInfo.element).find('.dataTables_scrollBody:first').prop('clientWidth');

				if( self.dt.fnSettings().oScroll.sX == '100%') {
					$(componentInfo.element).find('.dataTables_scrollBody:first').find('table').css({width:(width)});
					self.dt.fnAdjustColumnSizing();
				}
				self.dt.api().draw();
			};
		} else if(dt_settings.scrollY == 'parent-height') {
			dt_settings.scrollY =
			$(componentInfo.element).parent().parent().parent().height() -
			($(componentInfo.element).find('.dataTable').offset().top - $(componentInfo.element).parent().parent().parent().offset().top ) -
			57 -
			dt_settings.extrapadding;
			dt_settings.scrollCollapse = true;
			self.resizeHandler = function() {
				self.dt.fnSettings().oScroll.sY =
				$(componentInfo.element).parent().parent().parent().height() -
				($(componentInfo.element).find('.dataTable').offset().top - $(componentInfo.element).parent().parent().parent().offset().top ) -
				57 -
				dt_settings.extrapadding;
				self.dt.api().draw();
			};
		}

		//row highlighting
		$('#example')
				.on( 'mouseover', 'tbody tr', function () {
					var index = this.sectionRowIndex+1;;
					$(this).closest('#example_wrapper').find('.DTFC_LeftBodyLiner:first').find('tr').eq(index).addClass('hover');
					$(this).closest('#example_wrapper').find('.dataTables_scrollBody:first').find('tr').eq(index).addClass('hover');
				} )
				.on( 'mouseleave', 'tbody tr',function () {
					var index = this.sectionRowIndex+1;;
					$(this).closest('#example_wrapper').find('.DTFC_LeftBodyLiner:first').find('tr').eq(index).removeClass('hover');
					$(this).closest('#example_wrapper').find('.dataTables_scrollBody:first').find('tr').eq(index).removeClass('hover');
				} );

		var dt_rows = ko_mapping.fromJS( [] );

		self.columns = {};
		self.column_filters = {};
		var $tr2 = false;
 		if(dt_settings.columnFilter) {
			dt_settings.dom = '<\'top\'l>rt<\'bottom\'ip><\'clear\'>';
			$tr2 = $('<tr />');
		}

		for(i in dt_settings.columns) {
			if(dt_settings.columnFilter) {
				if(dt_settings.columns[i].filterable!== false) {
					if(dt_settings.columns[i].filterChoices) {
						var html = '<select style="min-width:50px;width:100%;height:20px;" onClick="event.stopPropagation()"><option value="">Filter';
						for(var j in dt_settings.columns[i].filterChoices) {
							html += '<option value="'+j+'">'+dt_settings.columns[i].filterChoices[j];
						}
						$tr2.append('<TH style="padding:1px 18px">'+html);
					}
					else {
						$tr2.append('<TH style="padding:1px 18px">'+'<input placeholder="Filter" type=search onClick="event.stopPropagation()" size=4 style="min-width:50px;width:100%;height:20px;">');
					}
				}
				else {
					$tr2.append('<TH style="padding:1px 18px" />');
				}
			}
			self.columns[ dt_settings.columns[i].name ] = dt_settings.columns[i];
		}
		dt_settings.responsive = true;
		self.dt = $(componentInfo.element).find('.dataTable:first').dataTable(dt_settings);
		if($tr2) {
			$(componentInfo.element).find('thead').append($tr2);
		}
		self.dt.api().columns().every(function() {
			 var that = this;
			 that.ko_search = ko.observable('').extend({rateLimit:{timeout:750, method:'notifyWhenChangesStop'}});
			 that.ko_search.subscribe(function(value){
			 	that.search( value ).draw();
			 });
			 $( 'input, select', $(that.header()).closest('thead').find('tr:last').find('th').eq(this.index()) ).on( 'input keyup change', function () {
				that.ko_search($(this).val());
			 });
		});

		// Update the table when the array has been added
		dt_rows.subscribeArrayChanged(
			function ( addedItem ) {
				self.dt.api().row.add( addedItem ).draw();
			},
			function ( deletedItem ) {
				var rowIdx = self.dt.api().column( 0 ).data().indexOf( deletedItem.id );
				self.dt.api().row( rowIdx ).remove().draw();
			}
		);

		$('.dataTables_length label').appendTo('.box_dataTables_length');
		if(dt_settings.FixedColumns) {
				self.dt_fc = new $.fn.dataTable.FixedColumns( self.dt, {leftColumns:1} );
		}
		else
			self.dt_fc = new $.fn.dataTable.FixedHeader( self.dt );

		var start_height = ko.window.height();
		var start_width = ko.window.width();
		self.resize = ko.computed(function(){
			var height = ko.window.height();
			var width = ko.window.width();
			if(height != start_height ||width != start_width) {
				start_height=height;
				start_width=width;
				self.resizeHandler();
			}
		})
	}

	// This runs when the component is torn down. Put here any logic necessary to clean up,
	// for example cancelling setTimeouts or disposing Knockout subscriptions/computeds.
	SimpleDatatable.prototype.dispose = function() {
		this.resize.dispose();
		$('#example').off( 'mouseover' ).off( 'mouseleave' );
	};

	//run viewModel through createViewModel factory so we can pass the componentInfo which contents the dom element
	return { viewModel: {createViewModel:function(params, componentInfo) {
			return new SimpleDatatable(params, componentInfo)
	}}, template: templateMarkup };
});
