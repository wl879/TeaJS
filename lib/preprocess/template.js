function regexp(str){
	str = str.replace(/([^\\]|^)\\i/g, '$1(?:[\\$_a-zA-Z]\\w+)');
	str = str.replace(/(\\?[\(\"\'\{\[])\.{3}(\\?[\)\"\'\}\]])/g, '(?:$1(?:\\\\\\\\|\\\\$1|\\\\$2|$1(?:\\\\\\\\|\\\\$1|\\\\$2|[^$2]+)*$2|[^$2]+)*$2)');
	str = str.replace(/\s*\n\s*/g, '');
	return str;
};
function slices(str){
	var m, ab, str_slices = [], tmp_re = /([^\\]|^)(\{\{|\$[a-zA-Z]+)/;
	while (m = str.match(tmp_re)){
		str_slices.push(str.slice(0, m.index+m[1].length));
		if (m[2] == '{{'){
			if (!(ab = Text.indexPair(str, m.index, '{{', '}}', true))){
				break;
			}
			str_slices.push(str.slice(ab[0]+2, ab[1]));
			str = str.substr(ab[1]+2);
		}else {
			str_slices.push(m[2]);
			str = str.substr(m.index+m[0].length);
		}
	}
	if (str){
		str_slices.push(str);
	}
	return str_slices;
};
function string(str){
	var symbol = str.match(/^('+|"+|`+)/)[1],
		qq = symbol[0] == '`' ? "'" : symbol[0];
	str = str.slice(symbol.length, -symbol.length);
	if (!str){
		return qq+str+qq;
	}
	if (/\n/.test(str)){
		str = Text.trimIndent(str);
	}
	if (qq == '"'){
		var str_slices = [];
		for (var i_ref = slices(str), i=0, item; i < i_ref.length; i++){
			item = i_ref[i];
			if (!item){
				continue;
			}
			if (i%2){
				if (/[^\w\s\$\_]/.test(item)){
					str_slices.push('('+item+')');
				}else {
					str_slices.push(item);
				}
			}else {
				str_slices.push('"'+escapeString(symbol, item)+'"');
			}
		}
		str = str_slices.join('+').replace(/^\"\"\+|\+\"\"$/g, '');
	}else {
		str = qq+escapeString(symbol, str)+qq;
	}
	return str;
};
function run(text, args, param, prep){
	if (param){
		return func(text, args, true, prep).apply(this, param);
	}else {
		return func(text, args, null, prep);
	}
};
function func(text, args, create, prep){
	var script;
	args = args ? args.join(',') : '';
	script = compile(text, prep);
	script = "function("+args+"){\nvar __write  = '';\nfunction write(){for(var i=0; i<arguments.length; i++) __write += arguments[i]};\n"+script+";\nreturn __write;\n}";
	if (create){
		eval('create = '+script);
		return create;
	}
	return script;
};
function compile(text, prep){
	var snippets, script;
	if (!test(text)){
		return tea.compile(text, prep);
	}
	snippets = [];
	for (var i_ref = slices(text), i=0, item; i < i_ref.length; i++){
		item = i_ref[i];
		if (!item){
			continue;
		}
		snippets.push(i%2 ? item : "write '"+item+"';");
	}
	script = tea.compile(snippets.join('\n'), prep);
	return script;
};
function test(text){
	return /([^\\]|^)\{\{/.test(text);
};
function escapeString(symbol, str){
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
			str = str.replace(/([^\\])'/g, $1+"\'");
		}
		str = str.replace(/\\"/g, '"');
	}
	return str;
}
module.exports.regexp = regexp;
module.exports.slices = slices;
module.exports.string = string;
module.exports.run = run;
module.exports.func = func;
module.exports.compile = compile;
module.exports.test = test;