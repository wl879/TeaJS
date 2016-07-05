var Source = require("./source.js");
var Lexer = require("./lexer.js");
function create(text, file){
	return new Source(text, file);
};
module.exports.create = create;
function lexer(text, file, sugar_box){
	return Lexer(text, file, sugar_box);
};
module.exports.lexer = lexer;