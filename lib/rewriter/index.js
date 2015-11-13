var Reader = require("./reader.js");
exports.read = function(ast, preprocessor){
	if (!preprocessor) preprocessor = ast.preProcessor;
	return Reader(preprocessor).read(ast);
};