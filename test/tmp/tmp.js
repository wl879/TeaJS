// #:string template test
`
	function(${args.join(',')}){
		//head
		__write  = '';
		_write   = function(){for(i => arguments){__write += arguments[i]}};
		_context = this.context;
		_argv    = _context && _context.argv;
		self     = this.self;
		${script};
		return __write;
	}`


// #:regexp template test


// #:json template test


// #:array template test


// #:jxml template test 