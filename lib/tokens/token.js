var Node = require("../syntax/node.js"), NodeBase = Node.NodeBase;
var Token = (function(){
	function Token(text, types, indent, location){
		this.text = text;
		if (types){
			this.types = Hash.slice(types);
		}
		if (indent != null){
			this.indent = indent;
		}
		this.location = location || null;
		this.istoken = true;
	}
	Token.prototype = new NodeBase();
	Token.prototype.constructor = Token;
	Token.prototype.__super__ = NodeBase.prototype;
	var isNode = Node.isNode;
	Token.prototype.__defineGetter__("types", function(){
		return this._types;
	});
	Token.prototype.__defineSetter__("types", function(types){
		this.type = types[0];
		this._types = types;
		return this._types;
	});
	Token.prototype.__defineSetter__("indent", function(num){
		this._indent = (num != null ? num : -1);
		var i = this.types.indexOf('LineHead');
		if (this._indent >= 0){
			if (i == -1) this.types.push('LineHead');
		}else if (i >= 0){
			this.types.splice(i, 1);
		}
	});
	Token.prototype.__defineGetter__("indent", function(){
		return this._indent;
	});
	Token.prototype.__defineGetter__("start", function(){
		return this.location.start;
	});
	Token.prototype.__defineGetter__("end", function(){
		return this.location.end;
	});
	Token.prototype.is = function (){
		var list = arguments.length > 1 ? arguments : arguments[0].split(' '),
			types = this.types;
		for (var i=0; i < list.length; i++){
			if (types.indexOf(list[i]) != -1){
				return list[i];
			}else if (isNode(types[0], list[i])){
				return list[i];
			}
		}
		return false;
	}
	Token.prototype.eq = function (){
		var list = arguments.length > 1 ? arguments : arguments[0].split(' '),
			text = this.text;
		for (var i=0; i < list.length; i++){
			if (list[i] == text){
				return text;
			}
		}
		return false;
	}
	Token.prototype.clone = function (text){
		var token = new Token(text || this.text, this.types, this.indent, this.location);
		token.parent = this.parent;
		return token;
	}
	return Token;
})();
module.exports = Token;