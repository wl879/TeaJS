var NodeBase = require("./base.js");
var Token = (function(){
	function Token(text, types, indent, location){
		if (this.constructor != Token){
			if (arguments.length == 1 || typeof types == 'number'){
				return Token.parse(text, types);
			}
			return new Token(text, types, indent, location);
		}
		if (!types){
			if (text == '\4'){
				types = ['EOT', 'BlockBreakTokn', 'BlockBreak', 'EndTokn'];
			}else if (token_literals.hasOwnProperty(text)){
				types = token_literals[text];
			}else if (text){
				types = ['Character'];
			}else {
				types = ['EMPTY'];
			}
		}
		this.text = text;
		this.types = Hash.slice(types);
		if (indent != null) this.indent = indent;
		this.location = location || null;
		this.istoken = true;
	}
	Token.prototype = new NodeBase();
	Token.prototype.constructor = Token;
	Token.prototype.__super__ = NodeBase.prototype;
	var tokenmap, token_literals, token_symbol, token_complex_re;
	tokenmap = require("./map.js").token;
	token_literals = tokenmap.literals;
	token_symbol = tokenmap.types.SymbolTokn;
	token_complex_re = tokenmap.complexre;
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
	Token.prototype.__defineGetter__("fileName", function(){
		return this.location && this.location.fileName;
	});
	Token.prototype.__defineGetter__("start", function(){
		return this.location && this.location.start;
	});
	Token.prototype.__defineGetter__("end", function(){
		return this.location && this.location.end;
	});
	Token.prototype.clone = function (text, types){
		var token = new Token(text || this.text, types || this.types, this.indent, this.location);
		token.parent = this.parent;
		return token;
	}
	Token.types = tokenmap.types;
	Token.define = function(types, literals){
		return tokenmap.define(types, literals);
	};
	Token.parse = function(text, index){
		if (index == null) index = 0;
		var match, code;
		if (!(text = text.substr(index))){
			return;
		}
		if (token_complex_re && (match = text.match(token_complex_re))){
			if (token_literals.hasOwnProperty(match[0])){
				return new Token(match[0], token_literals[match[0]]);
			}
		}
		if (match = text.match(/^\n/)){
			return new Token(match[0], token_literals[match[0]]);
		}
		if (match = text.match(/^[\r\t\f\ ]+/)){
			return new Token(match[0], ['BlankTokn']);
		}
		if (match = text.match(/^(0[xX][0-9a-fA-F]+|(?:\.\d+|\d+(?:\.\d+)?)(?:e\-?\d+)?)/)){
			return new Token(match[0], ['NumTokn', 'ConstTokn']);
		}
		if (match = text.match(/^([\$a-zA-Z_][\w\$]*)/)){
			if (token_literals.hasOwnProperty(match[0])){
				return new Token(match[0], token_literals[match[0]]);
			}
			return new Token(match[0], ['IdentifierTokn']);
		}
		if (!(match = text.match(/^[^\w\_\s]+/))){
			return {"error": 'tokenize parse error! unexpected token like as "'+text.slice(0, 5)+'"'};
		}
		code = match[0];
		while (code && token_symbol.indexOf(code) == -1){
			code = code.slice(0, -1);
		}
		if (!code){
			return new Token(match[0]);
		}
		if (token_literals.hasOwnProperty(code)){
			return new Token(code, token_literals[code]);
		}
		return {"error": 'tokenize parse error! undefined token "'+code+'"'};
	};
	Token.tokenize = function(text, index, opt){
		if (index == null) index = 0;
		var list, tk;
		list = [];
		while (tk = Token.parse(text, index)){
			list.push(opt == 'code list' ? tk.text : tk);
			index += tk.text.length;
		}
		return list;
	};
	return Token;
})();
module.exports = Token;