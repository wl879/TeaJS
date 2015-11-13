require("./utils.js");
/**
 * print
 * [border:...:end] 为输出内容加边框
 * (- x19)  将 - 号输出19个
 * ---- 分隔线
 * <-> 自动间隔
 * <--> 自动间隔
 * \b   删除前一个字符
 * r{} 红色
 * g{} 绿色
 * b{} 蓝色
 */
var std_width = process.stdout.columns,
	is_terminal = !!std_width,
	max_print_width = 0,
	register_printer = {};
global.print = function(){
	if (!print.stdout.apply(print, arguments)){
		process.stdout.write("\n");
	}
};
print.stdout = function(){
	process.stdout.write(this.toText.apply(this, arguments));
};
print.toText = function(){
	var text;
	text = this.toString(Array.prototype.slice.call(arguments));
	text = text.replace(/(.|\n)\u0008/g, '');
	text = this.color(text);
	text = this.flex(text);
	text = text.replace(/\((.*) x(\d+)\)/g, function($0, $1, $2){return print.strc($1, parseInt($2))});
	text = text.replace(/\[border\:(.*?)(\:end\]|$)/g, function($0, $1){return print.border($1)});
	max_print_width = Math.max(max_print_width, Text.width(text) || 4);
	text = this.line(text);
	return text;
};
print.toString = function(args, prefix, postfix){
	var text = classToString(Hash.slice(args));
	if (prefix) text = text.replace(/^/mg, prefix);
	if (postfix) text = text.replace(/$/mg, postfix);
	return text;
};
print.line = function(text){
	if (/^([\W\ x]){4}$/mg.test(text)){
		var the_width = std_width || max_print_width;
		text = text.replace(/^([\W\ x])\1{3}$/mg, function($0, $1){return print.strc($1, the_width)});
	}
	return text;
};
print.flex = function(text, min_width){
	var col_width, mark;
	while (/^(.*?)(?:<-{1,2}>)(.*)$/mg.test(text)){
		col_width = min_width || 80, mark = false;
		text = text.replace(/^(.*?)(<-{1,2}>|$)/mg, function($0, $1, $2){
			mark = mark || $2 && $2.length == 4;
			if (col_width < $1.length && ($2 || mark)){
				col_width = $1.length;
			}
			return $0;
		});
		text = text.replace(/^(.*?)(?:<-{1,2}>)(.*)$/mg, function($0, $1, $2){return $1+print.strc(' ', col_width-$1.length)+$2});
	}
	return text;
};
print.border = function(){
	var text = print.toText.apply(this, arguments).replace(/\t/g, '    '),
		text_width = Text.width(text),
		lines = text.split('\n'),
		c = is_terminal ? '\033[96m' : '',
		e = is_terminal ? '\033[0m' : '';
	for (var i=0; i < lines.length; i++){
		lines[i] = c+'|  '+e+lines[i]+print.strc(' ', text_width-lines[i].length)+c+'  |'+e;
	}
	lines.unshift(c+print.strc('-', text_width+6)+e);
	lines.push(c+print.strc('-', text_width+6)+e);
	return lines.join('\n');
};
print.cellText = function(text1, text2, separator, ret_str){
	var texts1 = text1.replace(/\t/g, tab_size).split('\n'),
		text1_w = Text.width(text1),
		texts2 = text2.replace(/\t/g, tab_size).split('\n'),
		len = Math.max(texts1.length, texts2.length),
		echos = [];
	separator = separator || '    ';
	for (var i = 0; i < len; i++){
		var t1 = texts1[i] || '', t2 = texts2[i] || '';
		echos.push((t1+print.strc(' ', text1_w-t1.length))+separator+t2);
	}
	if (ret_str){
		return echos.join('\n');
	}
	console.log(echos.join('\n'));
};
print.strc = function(str, num){
	var tmp = [];
	num = Math.max(num || 0, 0);
	while (num--){
		tmp.push(str);
	}
	return tmp.join('');
};
print.color = function(text){
	/*
		black='\033[30m' red='\033[31m' green='\033[32m' orange='\033[33m'
		blue='\033[34m' purple='\033[35m' cyan='\033[36m' lightgrey='\033[37m'
	 	darkgrey='\033[90m' lightred='\033[91m' lightgreen='\033[92m' yellow='\033[93m'
		lightcyan='\033[94m' pink='\033[95m' lightblue='\033[96m'
		 */
	if (!/\b[rbgcwd]\{/.test(text)){
		return text;
	}
	var m,
		tmp = [],
		cc,
		cc_order = [],
		cc_table = {"r": '\033[91m',
			"b": '\033[96m',
			"g": '\033[92m',
			"c": '\033[36m',
			"d": '\033[90m',
			"w": '\033[37m'};
	while (m = text.match(/(?:\b|\#)([rbgcwd])\{|([^\\])\}/)){
		tmp.push(text.substr(0, m.index+(m[2] ? 1 : 0)));
		if (is_terminal){
			if (m[2]){
				if (cc_order.length){
					tmp.push('\033[0m');
					cc_order.pop();
					if (cc_order.length){
						tmp.push(cc_order[cc_order.length-1]);
					}
				}
			}else {
				cc = cc_table[m[1]] || '';
				tmp.push(cc);
				cc_order.push(cc);
			}
		}
		text = text.substr(m.index+m[0].length);
	}
	if (text){
		tmp.push(text);
	}
	if (cc_order.length){
		tmp.push('\033[0m');
	}
	return tmp.join('');
};
print.register = function(name, printer){
	if (printer){
		register_printer[name] = printer;
	}
};
function classToString(obj, igArray){
	var type;
	switch (type = isClass(obj)){
		case 'String':case 'Number':case 'Boolean':case 'Undefined':
			return obj;
		case 'Array':
			if (!igArray){
				var text = [];
				for (var i=0; i < obj.length; i++){
					text.push(classToString(obj[i], true));
				}
				return text.join(' ');
			}
			break;
		case 'Object':case 'Function':
			if (!obj) return 'null';
			break;
		default:
			if (register_printer.hasOwnProperty(type)){
				return register_printer[type](obj);
			}
			break;
	}
	return Text(obj);
}