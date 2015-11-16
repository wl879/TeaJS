var Template = module.exports;
Template.runScript = function(script, args, param){
	if (!param) param = [];
	script = Template.writeExprFunc(script, args);
	script = "("+script+")("+(param.join(','))+");";
	script = tea.compile(script);
	return script;
};
Template.textScript = function(text, args){
	var chips = [], script, ab, m;
	while (text && (ab = Text.indexPair(text, 0, '#script', '#end'))){
		if (script = text.slice(0, ab[0])){
			chips.push("write '"+(Text(script))+"';");
		}
		if (script = text.slice(ab[0]+7, ab[1])){
			chips.push(script);
		}
		text = text.substr(ab[1]+4);
	}
	if (text){
		chips.push("write '"+(Text(text))+"';");
	}
	script = Template.writeExprFunc(chips.join('\n'), args);
	script = tea.compile(script);
	return script;
};
Template.writeExprFunc = function(script, args){
	if (!args) args = [];
	script = Template.parseWriteExp(script);
	script = Text.trimIndent(script).replace(/^/mg, tab_size).trim();
	return "function("+(args.join(','))+"){\n    __write  = '';\n    _write   = function(){for(i -> arguments){__write += arguments[i]}};\n    "+script+";\n    return __write;\n}";
};
Template.parseWriteExp = function(script, name){
	name = name || '_write';
	script = script.replace(/^(\n?(\s*))\bwrite\b\s+((?:'(?:\\'|.)*'|"(?:\\"|.)*"|[^;'"])*?)(;|\n?$)/mg, '$1'+name+'((($3)+"").replace(/^/mg, "$2"));');
	return script;
};
Template.parseRegExp = function(str){
	str = str.replace(/\s*\n\s*/g, '');
	return str;
};
Template.parseString = function(str){
	var symbol = str.match(/^('+|"+|`)/)[1], qq = symbol[0] == '`' ? "'" : symbol[0];
	str = str.slice(symbol.length, -symbol.length);
	if (!str){
		return qq+str+qq;
	}
	if (/\n/.test(str)){
		str = Text.trimIndent(str);
	}
	if ((symbol[0] == '"' || symbol[0] == '`') && /[^\\](?:\$\{|\$\w)/.test(str)){
		var str_chips = [], m, ab, chip, exp;
		while (m = str.match(/([^\\])\$(\{|[\$_\w]+)/)){
			chip = str.slice(0, m.index+1);
			if (m[2] == '{'){
				if (!(ab = Text.indexPair(str, m.index, '{', '}', true))){
					break;
				}
				exp = str.slice(ab[0]+1, ab[1]);
				str = str.substr(ab[1]+1);
			}else {
				exp = m[2];
				str = str.substr(m.index+m[0].length);
			}
			if (chip){
				str_chips.push('"'+FormatString(symbol, chip)+'"');
			}
			if (/[^\w\s]/.test(exp)){
				str_chips.push('('+exp+')');
			}else {
				str_chips.push(exp);
			}
		}
		if (str){
			str_chips.push('"'+FormatString(symbol, str)+'"');
		}
		str = str_chips.join('+').replace(/^\"\"\+|\+\"\"$/g, '');
	}else {
		str = qq+FormatString(symbol, str)+qq;
	}
	return str;
};
Template.joinRequire = function(requires, main){
	var head = "(function(){\n    var _r = {};\n    function __require(nm){\n        var md = _r[nm];\n        return !md ? {} : (md.init === true ? md.exports : md.init());\n    }\n    function RegisterModule(){\n        for(var i=0, len=arguments.length; i<len; i++) if(!_r[arguments[i]]) _r[arguments[i]] = {'exports':{}};\n    }\n    function CreateModule(nm, creater){\n        if(!_r[nm]) _r[nm] = {'exports':{}};\n        _r[nm].init = function(){ return this.init = true, creater(this, this.exports), this.exports; };\n        return _r[nm].exports;\n    }",
		foot = "    global = typeof(window) != 'undefined' ? window : global;\n    global['__require'] = __require;\n})();",
		modules = [];
	for (var file in requires){
		if (!requires.hasOwnProperty(file)) continue;
		var item = requires[file];
		modules.push('CreateModule("'+item[0]+'", function(module, exports){\n'+item[2].text.replace(/^/mg, '\t\t')+'\n\t});');
	}
	return head+'\n\t'+modules.join('\n\t')+'\n'+foot+'\n'+main.text;
};
function FormatString(symbol, str){
	switch (symbol){
		case '""""':case '`':case "''''":
			str = Text(str, symbol[0]).replace(/([^\\]|^)(\\{2,4,6,8})?\\n/g, '$1$2\\n\\\n');
			break;
		case '"""':case "'''":
			str = str.replace(/([^\\]|^)\n/g, '$1\\n').replace(/^\n/mg, '\\n\\\n');
			break;
		case '"':case "'":default:
			str = str.replace(/([^\\]|^)\n|^\n/g, '$1\\n');
			break;
	}
	if (symbol[0] == '"'){
		if (symbol.length > 1){
			str = str.replace(/([^\\])"/g, '$1\"');
		}
		str = str.replace(/\\'/g, "'");
	}else {
		if (symbol.length > 1){
			str = str.replace(/([^\\])'/g, "$1\'");
		}
		str = str.replace(/\\"/g, '"');
	}
	return str;
}