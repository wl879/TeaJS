var Prepor = (function(){
	var Macro, Sugar, Grammar, Template;
	Macro = require("./macro.js");
	Sugar = require("./sugar.js");
	Grammar = require("../../core/grammar");
	Template = require("../template.js");
	function Prepor(){
		this.standards = {};
		this.expr = {};
		this.stam = {};
		this.sugar = {};
		this.macro = {};
		this.map = {};
	};
	Prepor.prototype.extend = function (){
		for (var porc, i = 0; i < arguments.length; i++){
			porc = arguments[i];
			if (!porc){
				continue;
			}
			for (var type in porc){
				if (!porc.hasOwnProperty(type)) continue;
				var data = porc[type];
				for (var name in data){
					if (!data.hasOwnProperty(name)) continue;
					var value = data[name];
					this[type][name] = value;
				}
			}
		}
	};
	Prepor.prototype.add = function (type, name, args, body, location){
		switch (type){
			case 'sugar':case 'expr':case 'stam':
				this.map[name] = type;
				this.standards[name] = this[type][name] = new Sugar(type, name, args, body, location);
				break;
			case 'macro':
				this.map[name] = 'macro';
				this.macro[name] = new Macro(name, args, body, location, this);
				break;
		}
	};
	Prepor.prototype.undef = function (){
		for (var name, i = 0; i < arguments.length; i++){
			name = arguments[i];
			name = name.trim();
			delete this.map[name];
			delete this.macro[name];
		}
	};
	Prepor.prototype.check = function (name, type, src, parser){
		var mark, _type, tar;
		mark = name.match(/^(#*)/)[1];
		if (mark){
			name = name.substr(mark.length);
		}
		if (_type = this.map[name]){
			if (type && _type != type){
				return false;
			}
			tar = this[_type][name];
			if (src){
				if (_type == 'macro'){
					return checkMarco(this, tar, src, mark);
				}else {
					return tar.parse(parser, src);
				}
			}
			return tar;
		}
	};
	function checkMarco(prepor, macro, src, mark){
		var a, params, value, b;
		a = src.index;
		if (macro.args){
			if (!(params = checkParams(prepor, src.next()))){
				return false;
			}
			value = macro.parse(params);
		}else {
			value = macro.parse();
		}
		b = src.index;
		src.delete(a, b);
		if (value){
			value = SText.clip(value);
			if (mark == '#'){
				value = '"'+value.replace(/(^|[^\\])"/g, '$1\\"')+'"';
			}
			src.insert(a+1, value);
		}
		return true;
	};
	function checkParams(prepor, src, type){
		var a, node, b, text, params;
		a = src.index;
		node = Grammar.parser(type || 'Params', src, null, prepor);
		if (node && node.type == 'ParamsExpr'){
			b = src.index;
			text = src.join(a, b).trim();
			if (text[0] == '(' && SText.indexPair(text, '(', ')', 0)[1] == text.length-1){
				text = text.slice(1, -1);
			}
			params = SText.split(text, ',', true);
			return params;
		}
	};
	Prepor.prototype.isPrepor = true;
	return Prepor;
})();
module.exports = Prepor;