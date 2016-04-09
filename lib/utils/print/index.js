// need SText module 
var SText;
SText = require("../stext");
var print = (function(){
	/*
	        black='\033[30m' red='\033[31m' green='\033[32m' orange='\033[33m'
	        blue='\033[34m' purple='\033[35m' cyan='\033[36m' lightgrey='\033[37m'
	         darkgrey='\033[90m' lightred='\033[91m' lightgreen='\033[92m' yellow='\033[93m'
	        lightcyan='\033[94m' pink='\033[95m' lightblue='\033[96m'
	    */
	/*
	        clear terminal '\033c'
	     */
	var color_map, color_patt, color_code, set_patt, print_ers, print_history, print_content, print_scope, print_state, stdout_write, print_write, stdout_width, print_maxwidth, print_indent;
	color_map = {
		"r": '\033[91m',
		"b": '\033[96m',
		"g": '\033[92m',
		"c": '\033[36m',
		"d": '\033[90m',
		"w": '\033[37m'};
	color_patt = new RegExp("(\#?)<("+Object.keys(color_map).join('|')+"):");
	color_code = new RegExp('\033\\[\\d+m', 'g');
	set_patt = new RegExp("(^|\\b|\#|\\s)<(\\$|cp|ac|ar|al|bd):");
	print_ers = [];
	print_history = [];
	print_content = [];
	print_scope = {};
	print_state = false;
	stdout_write = process.stdout.write;
	print_write = function(){
		var text;
		text = Array.prototype.join.call(arguments, ' ');
		print_content.push(text);
		stdout_write.call(process.stdout, text);
	};
	// process.stdout.write  = print_write;
	stdout_width = process.stdout.columns || 0;
	print_maxwidth = 120;
	print_indent = '';
	function print(){
		if (this.constructor != print){
			if (print.stdout.apply(this, arguments)){
				print_write('\n');
			}
		}
	};
	print.isTerminal = !!stdout_width;
	print.indent = function(){
		print_indent += '\t';
		return this;
	};
	print.back = function(){
		print_indent = print_indent.slice(0, -1);
		return this;
	};
	print.debuger = function(){
		print('[Print Debuger]\n<stack>');
	};
	print.bd = function(){
		var text;
		text = print.toText.apply(this, arguments);
		print_write(formatBorder(text, null, countWidth(text)));
		print_write('\n');
	};
	print.stdout = function(){
		var text;
		if (text = print.toText.apply(this, arguments)){
			if (print_state){
				print.refresh();
			}
			if (/<\$:\w+:>/.test(text) && print_history.indexOf(text) != -1){
				return false;
			}
			print_history.push(text);
			text = text.replace(/<\$:(\w+):>/g, function($, $1){return print_scope[$1] || $});
			if (print_indent){
				text = text.replace(/^/mg, print_indent);
			}
			print_write(text);
		}
		return true;
	};
	print.clear = function(){
		var content, move;
		if (print.isTerminal){
			content = print_content.join('');
			move = Math.max(content.split('\n').length-1, 0);
			print_write('\033['+move+'A'+'\033[K');
			print_content = [];
		}else {
			print('<**>');
		}
	};
	print.refresh = function(){
		var text;
		if (arguments.length){
			changeVariable.apply(this, arguments);
		}
		print_state = false;
		if (print_history.length){
			if (arguments.length){
				print_history.push(print.toText.apply(this, arguments));
			}
			text = print_history.join('');
			text = text.replace(/<\$:(\w+):>/g, function($, $1){return print_scope[$1] || $});
			print.clear();
			print_write(text);
		}
	};
	print.toText = function(){
		var texts, type, text;
		texts = [];
		for (var arg, i = 0; i < arguments.length; i++){
			arg = arguments[i];
			if (!arg){
				texts.push(arg+'');
				continue;
			}
			type = arg.className || className(arg);
			if (type == 'String' || type == 'Number' || type == 'Boolean'){
				texts.push(arg);
				continue;
			}
			if (print_ers.hasOwnProperty(type)){
				texts.push(print_ers[type].call(this, arg)+'');
				continue;
			}
			texts.push(formatObject(arg));
		}
		text = texts.join(' ');
		return /<[\w\W]*>/.test(text) ? print.format(text) : text;
	};
	print.stacks = function(err){
		var list, t, fn, fnname, stacks, ref;
		err = err || new Error();
		list = [];
		if (typeof err == 'function'){
			t = 15;
			fn = err;
			while (fn && t--){
				fnname = funcName(fn, true);
				if (list.indexOf(fnname) != -1){
					break;
				}
				list.push(fnname || '???');
				fn = fn.caller;
			}
			return list;
		}
		stacks = err.stack.split('\n');
		for (var i = 1; i < stacks.length; i++){
			if (ref = stackInfo(stacks[i])){
				list.push(ref);
			}
		}
		list = list.filter(function($){return !!$});
		list.className = 'Stacks';
		return list;
	};
	print.format = function(text, width){
		if (width == null) width = 60;
		text = formatDebug(text);
		text = formatColor(text);
		text = formatSet(text, Math.max(width, countWidth(text)));
		text = formatFill(text, Math.max(width, countWidth(text)));
		return text;
	};
	print.fragment = function(text, code, line, col, file){
		var ref;
		if (arguments.length == 1 && typeof text == 'object'){
			file = text.fileName || text.file;
			col = text.columnNumber || text.column || text.col;
			line = text.lineNumber || text.line || text.number;
			code = text.code || text.text;
			text = null;
		}
		if (arguments.length == 4){
			file = col;
		}
		if (!text){
			text = SText.readFile(file);
		}
		if (/\n/.test(text)){
			if (arguments.length == 4){
				ref = SText.indexLine(text, line), text = ref[0], line = ref[1], col = ref[2];
			}else if (!line && code){
				ref = SText.indexLine(text, text.indexOf(code)), text = ref[0], line = ref[1], col = ref[2];
			}else {
				text = text.split('\n')[line-1];
			}
		}
		if (!code && col){
			code = SText.split(text.substr(col-1), /[\;\)\]\}\,]/)[0];
		}
		return formatFragment(text, code, line, col, file);
	};
	print.register = function(name, printer){
		if (printer){
			print_ers[name] = printer;
		}
	};
	function formatObject(obj, _cache){
		var texts, is_arr, text;
		if (_cache == null) _cache = [obj];
		texts = [];
		is_arr = Array.isArray(obj);
		for (var key in obj){
			if (!obj.hasOwnProperty(key)) continue;
			var value = obj[key];
			if (typeof value == 'object' && value){
				if (_cache.indexOf(value) == -1){
					_cache.push(value);
					value = formatObject(value, _cache);
				}else {
					value = '[circular]';
				}
			}else if (typeof value == 'string'){
				value = '"'+SText(value, '"')+'"';
			}
			if (is_arr){
				texts.push(value);
			}else {
				texts.push('"'+key+'" : '+value);
			}
		}
		if (texts.length){
			if (texts.length < 2){
				text = texts.join(' ');
			}else {
				text = '\n'+texts.join('\n').replace(/^/mg, '\t')+'\n';
			}
		}else {
			text = '';
		}
		if (is_arr){
			return '['+text+']';
		}
		return '{'+text+'}';
	};
	function formatDebug(text){
		var m, stacks, the, line_text;
		if (m = text.match(/<(debug|code|fragment|stack)>/)){
			!stacks && (stacks = print.stacks());
			the = stacks[0];
			switch (m[1]){
				case 'debug':
					text = text.replace(/<debug>/g, the.filePoint);
					break;
				case 'code':
					text = text.replace(/<code>/g, the.code+'<> at '+the.filePoint);
					break;
				case 'fragment':
					line_text = SText.readFile(the.fileName, the.lineNumber);
					text = text.replace(/<fragment>/g, formatFragment(line_text, null, the.lineNumber, the.columnNumber, the.fileName));
					break;
				case 'stack':
					text = text.replace(/<stack>/g, printStacks(stacks));
					break;
			}
		}
		return text;
	};
	function formatFragment(text, code, line, col, file){
		var str;
		if (text == null) text = '';
		if (code == null) code = '';
		if (line == null) line = 0;
		if (col == null) col = 0;
		text = text.replace(/\n+$/g, '');
		str = '  '+line+' | '+text+'\\n\n';
		str += str.substr(0, str.length-3-text.length+col).replace(/[^\s]/g, ' ');
		str += '<r:'+SText.copy('^', code.length || 1)+':>\n';
		if (file){
			str = file+':'+line+':'+col+'\n'+str;
		}
		return str;
	};
	function formatFill(text, _width){
		var ls, ws, ds, ms, ts, ss, W, texts, sw;
		ls = text.split('\n');
		ws = [];
		ds = [];
		for (var l, j = 0; j < ls.length; j++){
			l = ls[j];
			ms = [];
			ts = [];
			ss = SText.split(l, /<(\~|[^\\w\\s]{2}|\d+)?>/, false);
			for (var i = 0; i < ss.length; i++){
				if (i%2){
					ms.push(ss[i]);
				}else {
					if (!ws[ts.length] || ss[i].length > ws[ts.length]){
						ws[ts.length] = ss[i].length;
					}
					ts.push(ss[i]);
				}
			}
			ds.push([ts, ms]);
		}
		W = Math.max(_width, ds.length == 1 || /<~>/.test(text) ? stdout_width-5 : 0);
		for (var i = 0; i < ws.length; i++){
			W -= ws[i] || 0;
		}
		if (W < 0){
			W = 0;
		}
		texts = [];
		for (var d, j = 0; j < ds.length; j++){
			d = ds[j];
			ts = d[0];
			ms = d[1];
			sw = Math.floor(W/ms.length);
			for (var i = 0; i < ts.length; i++){
				texts.push(ts[i]);
				if (ms[i]){
					if (/<(\d+)>/.test(ms[i])){
						texts.push(SText.copy(' ', (parseInt(RegExp.$1) || 0)-ts[i].length));
					}else {
						texts.push(SText.copy(ms[i].length == 4 ? ms[i][1] : ' ', ws[i]-ts[i].length+sw));
					}
				}
			}
			texts.push('\n');
		}
		texts.pop();
		return texts.join('');
	};
	function formatColor(text){
		var texts, tmp;
		texts = [];
		while (tmp = formatMatch(text, color_patt)){
			if (tmp[0]){
				texts.push(tmp[0]);
			}
			tmp[2] = print.format(formatColor(tmp[2]));
			if (print.isTerminal && color_map.hasOwnProperty(tmp[1])){
				tmp[2] = color_map[tmp[1]]+tmp[2]+'\033[0m';
			}
			texts.push(tmp[2]);
			text = tmp[3];
		}
		if (text){
			texts.push(text);
		}
		text = texts.join('');
		return text;
	};
	function formatSet(text, _width){
		var texts, tmp, temp;
		texts = [];
		while (tmp = formatMatch(text, set_patt)){
			if (tmp[0]){
				texts.push(tmp[0]);
			}
			switch (tmp[1]){
				case 'bd':
					texts.push(formatBorder(tmp[2], tmp[1], _width));
					break;
				case 'ac':case 'al':case 'ar':
					texts.push(formatAlgin(tmp[2], tmp[1], _width));
					break;
				case 'cp':
					temp = tmp[2].split(' ');
					texts.push(SText.copy(temp[0], parseInt(temp[1])));
					break;
				case '$':
					temp = tmp[2].split(' ');
					changeVariable(temp[0], temp.slice(1).join(' '));
					texts.push('<$:'+temp[0]+':>');
					break;
			}
			text = tmp[3];
		}
		if (text){
			texts.push(text);
		}
		text = texts.join('');
		return text;
	};
	function formatAlgin(text, type, _width){
		var lines, f;
		lines = formatSet(text, _width).split('\n');
		for (var line, i = 0; i < lines.length; i++){
			line = lines[i];
			switch (type){
				case 'ac':
					f = Math.floor((_width-line.length)/2);
					break;
				case 'al':
					f = -1;
					break;
				case 'ar':
					f = _width-line.length;
					break;
			}
			if (f > 0){
				lines[i] = SText.copy(' ', f)+line;
			}else if (f < 0){
				lines[i] = line.replace(/^\s+/g, '');
			}
		}
		return lines.join('\n');
	};
	function formatBorder(text, type, _width){
		var width, lines;
		text = formatSet(text, _width);
		text = SText.spaceTab(text);
		width = Math.max(_width-4, countWidth(text));
		lines = text.split('\n');
		for (var line, i = 0; i < lines.length; i++){
			line = lines[i];
			lines[i] = '| '+line+SText.copy(' ', width-countWidth(line))+' |';
		}
		return SText.copy('-', width+4)+'\n'+lines.join('\n')+'\n'+SText.copy('-', width+4);
	};
	function formatMatch(text, re){
		var m, _a, a, ab, b, s1, s2, s3;
		if (m = text.match(re)){
			_a = m[1] == '#' ? m.index : m.index+m[1].length;
			a = m.index;
			ab = SText.indexPair(text, m[0], ':>', a);
			if (!ab || ab[0] != a || ab[0]+1 == ab[1]){
				return;
			}
			b = ab[1];
			s1 = text.substr(0, _a);
			s2 = text.slice(a+m[0].length, b);
			s3 = text.substr(b+2);
			return [s1, m[2], s2, s3];
		}
	};
	function changeVariable(name, value){
		var data, _not_refresh;
		if (typeof name == 'object'){
			data = name, _not_refresh = value;
			for (var i in data){
				if (!data.hasOwnProperty(i)) continue;
				var value = data[i];
				print_scope[i] = value;
			}
		}else {
			print_scope[name] = value;
		}
		print_state = true;
	};
	function countWidth(text){
		return SText.width(clearColor(text));
	};
	function clearColor(text){
		return text.replace(color_code, '');
	};
	function className(obj){
		if (obj && obj.constructor && obj.constructor.toString){
			return funcName(obj.constructor);
		}
	};
	function funcName(fn, tostr){
		var m;
		if (fn){
			if (m = fn.toString().match(/function\s*(\w+)/)){
				return m[1];
			}
			if (tostr){
				if (m = fn.toString().match(/function\s*\(.*(?:\):|\)\{)/)){
					return m[0].slice(0, -1);
				}
			}
		}
	};
	function stackInfo(str){
		var m, f, info;
		if (m = str.match(/at (.*?) \((.*?)\)$/)){
			if (/print\./.test(m[1])){
				return;
			}
			f = m[2].split(':');
			if (__filename == f[0]){
				return;
			}
			info = {
				"target": m[1],
				"fileName": f[0],
				"lineNumber": parseInt(f[1]),
				"columnNumber": parseInt(f[2]),
				get filePoint(){
					return this.fileName+':'+this.lineNumber+':'+this.columnNumber;
				},
				get code(){
					var code;
					if (!this._code){
						if (code = SText.readFile(this.fileName, this.lineNumber)){
							this._code = SText.split(code.substr(this.columnNumber-1), /[\;\)\]\}\,]/)[0];
						}else {
							this._code = ' ';
						}
					}
					return this.target+' > "'+SText(SText.limit(this._code, 20))+'"';
				}};
			return info;
		}
	};
	function printStacks(stacks){
		var texts;
		texts = [];
		for (var stack, i = 0; i < stacks.length; i++){
			stack = stacks[i];
			if (typeof stack == 'string'){
				texts.push(stack);
			}else {
				texts.push(" • "+(stack.target)+" <~> File \""+(stack.fileName)+"\", line "+(stack.lineNumber));
			}
		}
		return texts.join('\n');
	};
	print.register('Stacks', printStacks);
	return print;
})();
module.exports = print;
if (require.main == module){
	print(process.argv.slice(process.argv.indexOf(__filename)+1).join(' '));
}