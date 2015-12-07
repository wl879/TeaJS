var Sugar = (function(){
	function Sugar(type, name, pattern, writer, parser){
		this.type = type;
		this.name = name;
		this.stxre = Syntax.regexp(pattern);
		this.parser = parser;
		this.writer = writer;
	}
	var Syntax = require("../syntax");
	Sugar.prototype.parse = function (src, opt){
		var node = Syntax.matchNode(this.name, this.stxre, src, 'ret node');
		if (node && this.parser){
			return this.parser.call(this, node, src, opt);
		}
		return node;
	}
	Sugar.prototype.read = function (reader, node){
		var write = reader.new(this.name);
		if (typeof this.writer == 'string'){
			write.read(this.writer, node);
		}else {
			write = this.writer(node, write) || write;
		}
		return write;
	}
	module.exports = Sugar;
	return Sugar;
})();