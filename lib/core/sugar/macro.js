var Macro = (function(){
	var Script = require("./script.js");
	function Macro(name, args, body){
		this.name = name;
		this.args = args && SText.split(args, ',', true);
		this.script = new Script(body.replace(/\\\n\s*|\n$/g, ''), args);
	};
	Macro.prototype.exec = function (handle, src, index){
		var _index, token, params, value;
		_index = src.index;
		src.index = index;
		token = src[index];
		if (token.text == this.name || token.text == '#'+this.name){
			if (this.args){
				if (!(params = getParams(handle, src.next()))){
					src.index = _index;
					return false;
				}
				value = this.value(params);
			}else {
				value = this.value();
			}
			src.delete(index, src.index);
			if (value){
				value = SText.clip(value);
				if (token.text[0] == '#'){
					value = '"'+value.replace(/(^|[^\\])"/g, '$1\\"')+'"';
				}
				src.insert(index+1, value);
			}
		}
		src.index = _index;
		return true;
	};
	Macro.prototype.value = function (params){
		var value, args, temp, re, m, index, param;
		value = this.script.value.apply(this.script, params);
		if (this.args){
			args = this.args;
			temp = '';
			re = toRe(this);
			while (m = value.match(re)){
				index = m[3] || args.indexOf(m[2]);
				if (m[2] == 'ARGR...'){
					param = params.slice(index >= 0 ? index : args.length).join(', ');
				}else if (params[index]){
					param = params[index]+'';
				}else {
					param = '';
				}
				switch (param && m[1]){
					case '###':
						param = '##'+'"'+param.replace(/(^|[^\\])"/g, '$1\\"')+'"';
						break;
					case '#':
						param = '"'+param.replace(/(^|[^\\])"/g, '$1\\"')+'"';
						break;
					case '##@':
						param = '##'+"'"+param.replace(/(^|[^\\])'/g, ""+1+"\\'")+"'";
						break;
					case '#@':
						param = "'"+param.replace(/(^|[^\\])'/g, ""+1+"\\'")+"'";
						break;
					case '##':
						param = '##'+param;
						break;
				}
				temp += value.slice(0, m.index)+param;
				value = value.substr(m.index+m[0].length);
			}
			value = (temp+value).replace(/"##"|'##'|##,|##/g, '');
		}
		return value;
	};
	function toRe(macro){
		var args;
		if (!macro._args_re){
			args = macro.args.join('\\b|\\b');
			args = args ? '|\\b'+args+'\\b' : '';
			macro._args_re = new RegExp('(\#{0,3}@?)(\#(\\d+)|\\bARGR\\.\\.\\.'+args+')');
		}
		return macro._args_re;
	};
	function getParams(handle, src){
		var a, node, b, text, params;
		a = src.index;
		node = handle.parse('(\\(∅ (\\)∅ | ,* #ParamsSub \\)) | #is_token(--1, BLANK) → #not_token(--2, END) → #ParamsSub)@@ParamsExpr');
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
	return Macro;
})();
module.exports = Macro;