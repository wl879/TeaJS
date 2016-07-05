var Node;
Node = require("./node.js");
var Token = (function(){
	function Token(text, types, location){
		var instance;
		if (!types || typeof types == 'number'){
			instance = Token.create(text, types, location);
			text = instance.text;
			types = instance.types;
			location = instance.location;
			if (instance.error){
				this.error = instance.error;
			}
		}
		this.text = text;
		this.types = types;
		this.indent = -1;
		this.location = location || null;
	};
	Token.prototype = Object.create(Node.NodeObj.prototype);
	Token.prototype.__super__ = Node.NodeObj.prototype;
	Token.prototype.constructor = Token;
	Token.map = {"types": {}, "literals": {}, "complexs": [], "complexre": null};
	Token.prototype.__defineGetter__("types", function(){
		return this._types;
	});
	Token.prototype.__defineSetter__("types", function(types){
		if (types){
			this._types = Jsop.toArray(types);
			this.type = this._types[0];
		}
		return this._types;
	});
	Token.prototype.clone = function (text, types){
		var token = new Token(text || this.text, types || this.types, this.location);
		token.parent = this.parent;
		token.indent = this.indent;
		token.scope = this.scope;
		return token;
	};
	Token.prototype.isToken = true;
	Token.define = function(types, literals){
		var map, literal_re, tmp;
		map = Token.map;
		if (!literals || !literals.length){
			for (var type, i = 0; i < types.length; i++){
				type = types[i];
				!map.types[type] && (map.types[type] = []);
			}
		}
		for (var literal, i = 0; i < literals.length; i++){
			literal = literals[i];
			if (map.types.hasOwnProperty(literal) && /^[A-Z]\w+$/.test(literal)){
				Token.define(types, map.types[literal]);
				continue;
			}
			if (/\w\W|\W\w/.test(literal)){
				literal_re = literal.replace(/(\W)/g, '\\$1');
				if (map.complexs.indexOf(literal_re) == -1){
					map.complexs.push(literal_re);
				}
			}
			for (var type, j = 0; j < types.length; j++){
				type = types[j];
				!map.types[type] && (map.types[type] = []);
				if (map.types[type].indexOf(literal) == -1){
					map.types[type].push(literal);
				}
			}
			if (tmp = map.literals[literal]){
				for (var type, j = 0; j < types.length; j++){
					type = types[j];
					if (tmp.indexOf(type) == -1){
						tmp.push(type);
					}
				}
			}else {
				map.literals[literal] = types.slice();
			}
		}
		if (map.complexs.length){
			map.complexs.sort(function(a, b){return b.length-a.length});
			map.complexre = new RegExp('^(?:'+map.complexs.join('|')+')(?!\\w)', 'g');
		}
	};
	Token.create = function(text, index, location){
		var token_literals, code, token_complex_re, match, types;
		if (index == null) index = 0;
		if (!(text = text.substr(index))){
			Tea.error('create token object of param is empty!');
		}
		token_literals = Token.map.literals;
		do {
			if (token_literals.hasOwnProperty(text)){
				code = text;
				break;
			}
			token_complex_re = Token.map.complexre;
			if (token_complex_re && (match = text.match(token_complex_re))){
				if (token_literals.hasOwnProperty(match[0])){
					code = match[0];
					break;
				}
			}
			if (match = text.match(/^\n/)){
				code = match[0];
				break;
			}
			if (match = text.match(/^[\r\t\f\ ]+/)){
				code = match[0], types = ['BLANK'];
				break;
			}
			if (match = text.match(/^\#+\w+/)){
				code = match[0], types = ['TAG'];
				break;
			}
			if (match = text.match(/^(0[xX][0-9a-fA-F]+|(?:\.\d+|\d+(?:\.\d+)?)(?:e\-?\d+)?)/)){
				code = match[0], types = ['NUMBER', 'CONST'];
				break;
			}
			if (match = text.match(/^([\$a-zA-Z_][\w\$]*)/)){
				code = match[0];
				if (!(token_literals.hasOwnProperty(match[0]))){
					types = ['IDENTIFIER'];
				}
				break;
			}
			if (!(match = text.match(/^[^\w\_\s]+/))){
				return {
					"error": 'tokenize parse error! unexpected token like as "'+text.slice(0, 5)+'"'};
			}
			code = match[0];
			while (code){
				if (token_literals.hasOwnProperty(code)){
					break;
				}
				code = code.slice(0, -1);
			}
			if (!code){
				code = match[0][0], types = ['CHARACTER'];
			}
			if (code == '\\'){
				code = text.substr(0, 2);
				types = ['SYMBOL'];
			}
			break;
			break;
		} while(true)
		!types && (types = token_literals[code]);
		if (!types){
			return {"error": 'tokenize parse error! unexpected token like as "'+code+'"'};
		}
		return new Token(code, types || token_literals[code], location && location.fission(code, index));
	};
	return Token;
})();
module.exports = Token;