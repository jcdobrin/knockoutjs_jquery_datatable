// require.js looks for the following global when initializing
var require = {
    baseUrl: '.',
    debug:true,
    urlArgs: 'version=' + (new Date()).getTime(),
    paths: {
        'jquery':            'bower_modules/jquery/dist/jquery.min', //2.1.1
        'jqueryui':         'bower_modules/jquery-ui/jquery-ui.min', //1.11.1
        'knockout-jqueryui': 'bower_modules/knockout-jqueryui/dist/knockout-jqueryui.min', //1.0.0
        'datatables':        'bower_modules/datatables/media/js/jquery.dataTables', //1.10.7
        'fixedheader':       'bower_modules/datatables-fixedheader/js/dataTables.fixedHeader', //2.1.2,
        'fixedcolumns':      'bower_modules/datatables-fixedcolumns/js/dataTables.fixedColumns', //3.0.2,

		"knockout":             "bower_modules/knockout/dist/knockout.debug",
        "knockout-projections": "bower_modules/knockout-projections/dist/knockout-projections.min",
        "knockout-mapping":     "bower_modules/knockout-mapping/knockout.mapping",

		"text":                 "bower_modules/requirejs-text/text",
		"session"       :"app/session",
    },
    shim: {
		jquery:{
            exports: '$'
        },
        'knockout':{exports:'ko'},
    }
};