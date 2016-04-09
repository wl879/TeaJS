var Macro = (function(){
	var Template;
	Template = require("../template.js");
	function Macro(name, args, body, location, prepor){
		if (args){
			for (var i = args.length - 1; i >= 0; i--){
				if (!(args[i] = args[i].trim())){
					args.splice(i, 1);
				}
			}
		}
		this.name = name;
		this.args = args;
		this.bodys = Template.create(body.replace(/\\\n\s*/g, ''), args);
		this.location = location;
	};
	Macro.prototype.parse = function (params){
		var value;
		if (!params && this.args){
			return false;
		}
		value = '';
		for (var item, i = 0; i < this.bodys.length; i++){
			item = this.bodys[i];
			if (typeof item == 'string'){
				value += item;
			}else {
				value += item.apply(this, params);
			}
		}
		if (this.args){
			value = replaceParams(value, params, this);
		}
		return value;
	};
	Macro.prototype.error = function (){
		throw Error.create(this.location, new Error());
	};
	function argsRe(macro){
		var args;
		if (!macro._args_re){
			args = macro.args.join('\\b|\\b');
			args = args ? '|\\b'+args+'\\b' : '';
			macro._args_re = new RegExp('(\#{0,3}@?)(\#(\\d+)|\\bARGR\\.\\.\\.'+args+')');
		}
		return macro._args_re;
	};
	function replaceParams(content, params, macro){
		var args, args_re, out, m, val, key, index;
		args = macro.args;
		args_re = argsRe(macro);
		out = '';
		while (m = content.match(args_re)){
			if (!m[0]){
				break;
			}
			val = '';
			key = m[2];
			index = m[3] || args.indexOf(key);
			if (key == 'ARGR...'){
				val = params.slice(index >= 0 ? index : args.length).join(', ');
			}else if (params[index]){
				val = params[index]+'';
			}
			switch (val && m[1]){
				case '###':
					val = '##'+'"'+val.replace(/(^|[^\\])"/g, '$1\\"')+'"';
					break;
				case '#':
					val = '"'+val.replace(/(^|[^\\])"/g, '$1\\"')+'"';
					break;
				case '##@':
					val = '##'+"'"+val.replace(/(^|[^\\])'/g, ""+1+"\\'")+"'";
					break;
				case '#@':
					val = "'"+val.replace(/(^|[^\\])'/g, ""+1+"\\'")+"'";
					break;
				case '##':
					val = '##'+val;
					break;
			}
			out += content.slice(0, m.index)+val;
			content = content.substr(m.index+m[0].length);
		}
		content = (out+content).replace(/"##"|'##'|##,|##/g, '');
		return content;
	};
	return Macro;
})();
module.exports = Macro;