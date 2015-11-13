var Syntax = module.exports,
	Node = require("./node.js"),
	Scope = require("./scope.js"),
	Parser = require("./parser.js"),
	SyntaxReg = require("./regexp.js");
Syntax.parse = function(src, preprocessor){
	var ast = new Node('Root');
	ast.preProcessor = null;
	ast.fileName = src.fileName;
	ast.filePath = Path.dirname(ast.fileName);
	src.index = 0;
	src.refresh();
	var old_preprocessor = src.preProcessor;
	if (preprocessor){
		src.preProcessor = preprocessor;
	}
	ast.add(Parser.Node(src));
	Scope.parse(ast);
	ast.preProcessor = src.preProcessor;
	src.preProcessor = old_preprocessor;
	return ast;
};
Syntax.regexp = SyntaxReg.compile;
Syntax.match = function(stx_re, src, opt){
	if (typeof stx_re == 'string'){
		if (Parser.hasOwnProperty(stx_re)){
			return Parser[stx_re](src, opt);
		}
		stx_re = Syntax.regexp(stx_re);
	}
	return SyntaxReg.match(stx_re, src);
};
Syntax.matchNode = SyntaxReg.matchNode;
Syntax.isNode = Node.isNode;