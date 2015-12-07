var Reader = require("./reader.js"),
	SourceMap = require("./sourcemap.js"),
	Beautify = require("./beautify.js");
exports.read = function(ast, ctx){
	if (!ctx) ctx = ast.context;
	var write = Reader(ctx).read(ast);
	return write;
};
exports.sourceMap = function(){
	return new SourceMap();
};