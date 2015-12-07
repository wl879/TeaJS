var token,
	location,
	source,
	regexp,
	match,
	matchNode,
	Node = require("./node.js"),
	Scope = require("./scope.js"),
	Parser = require("./parser.js"),
	SyntaxReg = require("./regexp.js");
token = require("./token.js");
location = require("./location.js");
source = require("./source.js");
function parse(src, ctx){
	var ast = new Node('Root');
	ast.context = null;
	ast.source = src;
	ast.fileName = src.fileName;
	ast.filePath = Path.dirname(ast.fileName);
	src.index = 0;
	src.refresh();
	var old_por = src.context;
	if (ctx){
		src.context = ctx;
	}
	ast.add(Parser.Node(src));
	Scope.parse(ast);
	ast.context = src.context;
	src.context = old_por;
	return ast;
};
regexp = SyntaxReg.compile;
match = function(stx_re, src, opt){
	if (typeof stx_re == 'string'){
		if (Parser.hasOwnProperty(stx_re)){
			return Parser[stx_re](src, opt);
		}
		stx_re = Syntax.regexp(stx_re);
	}
	return SyntaxReg.match(stx_re, src);
};
matchNode = SyntaxReg.matchNode;
module.exports.token = token;
module.exports.location = location;
module.exports.source = source;
module.exports.parse = parse;
module.exports.regexp = regexp;
module.exports.match = match;
module.exports.matchNode = matchNode;