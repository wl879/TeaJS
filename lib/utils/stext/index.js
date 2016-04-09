var pair, pair_re, sep_cache, tabsize;
module.exports = SText;
pair = {'(': ')', '[': ']', '{': '}', '\'': '\'', '\"': '\"', '`': '`'};
pair_re = new RegExp('\\'+Object.keys(pair).join('|\\'), 'g');
sep_cache = {};
function SText(something, qq){
	var cache, text;
	if (typeof something == 'object'){
		cache = [];
		text = JSON.stringify(something, function(key, value){
			if (typeof value === 'object' && value !== null){
				if (cache.indexOf(value) !== -1){
					return '[circular]';
				}
				cache.push(value);
			}
			return value;
		});
		if (arguments.length > 1){
			arguments[0] = text;
			text = format.apply(this, arguments);
		}
	}else {
		text = format.apply(this, arguments);
	}
	return text;
};
exports.tabsize = (tabsize = '    ');
function format(text, qq){
	var i;
	if (!text){
		return text+'';
	}
	text = JSON.stringify(text);
	text = text.replace(/^\"|\"$/g, '');
	if (/%[%sdj]/.test(text) && arguments.length > 1){
		i = 1;
		text = text.replace(/%[%sdj]/g, function($){
			if ($ == '%%') return '%';
			if (i >= arguments.length) return $;
			return SText(arguments[i++], qq);
		});
		for (var $, j = i; j < arguments.length; j++){
			$ = arguments[j];
			text += ' '+SText($, qq);
		}
	}else if (qq != '"'){
		text = text.replace(/\\"/g, '"').replace(/'/g, '\\\'');
	}
	return text;
};
module.exports.format = format;
function re(str){
	if (str instanceof RegExp){
		str = str.toString().replace(/^\/|\/[igmuy]?$/g, '');
	}else if (Array.isArray(str)){
		for (var i = 0; i < str.length; i++){
			str[i] = str[i].replace(/([^\w\s\|])/g, '\\$1');
			str[i] = str[i].replace(/\n/g, '\\n');
			str[i] = str[i].replace(/\t/g, '\\t');
		}
		str = str.join('|');
	}else {
		str = str.replace(/([^\w\s\|])/g, '\\$1');
		str = str.replace(/\n/g, '\\n');
		str = str.replace(/\t/g, '\\t');
	}
	if (!/[^\|]/.test(str)){
		str = str.replace(/\|/g, '\\|');
	}
	return str;
};
module.exports.re = re;
function copy(text, num){
	var tmp = [];
	num = Math.max(num || 0, 0);
	while (num-- > 0){
		tmp.push(text);
	}
	return tmp.join('');
};
module.exports.copy = copy;
function trim(text){
	text = text.replace(/^\s+/, '');
	text = text.replace(/(\\*)?\s+$/, function($, $1){
		if ($1 && $1.length%2){
			return $.substr(0, $1.length+1);
		}
		return $1 || '';
	});
	return text;
};
module.exports.trim = trim;
function trimPP(text){
	return text.replace(/^`+|^'+|^"+|"+$|'+$|`+$/g, '');
};
module.exports.trimPP = trimPP;
function cleanESC(text){
	text = text.replace(/\\(n)\b/g, '\n');
	text = text.replace(/\\(t)\b/g, '\t');
	return text.replace(/\\(\W)/g, '$1');
};
module.exports.cleanESC = cleanESC;
function limit(text, len){
	if (text.length <= len){
		return text;
	}
	return text.substr(0, len)+'..';
};
module.exports.limit = limit;
//
function split(text, separator, _trim, _cesc, _pair){
	var slices, a, _pair_re, m, b, p, ab, ref;
	if (!sep_cache[separator]){
		sep_cache[separator] = new RegExp('(\\\\*)('+(separator ? re(separator) : ' ')+')');
	}
	separator = sep_cache[separator];
	slices = [];
	a = 0;
	if (_pair){
		_pair_re = new RegExp('\\'+Object.keys(_pair).join('|\\'), 'g');
	}else {
		_pair = pair;
		_pair_re = pair_re;
	}
	while (text){
		if (m = text.substr(a).match(separator)){
			if (m[1].length%2 != 0){
				a += m.index+m[0].length;
				continue;
			}
			b = a+m.index+m[1].length;
			// _pair_re.lastIndex = a;
			if (p = matchCheckESC(text, _pair_re, a)){
				ab = indexPair(text, p[0], _pair[p[0]], p.index, true);
				if (ab && b > ab[0]){
					a = ab[1]+1;
					continue;
				}
			}
			slices.push(text.slice(0, b));
			if (_trim === false){
				slices.push(m[2]);
			}
			text = text.slice(b+m[2].length);
			a = 0;
		}else {
			slices.push(text);
			break;
		}
	}
	ref = [];
	for (var text, i = 0; i < slices.length; i++){
		text = slices[i];
		if (_trim) text = trim(text);
		if (_cesc && text) text = cleanESC(text);
		if (_trim && _trim !== 'params'){
			text && ref.push(text);
		}else {
			ref.push(text);
		}
	}
	return ref;
};
module.exports.split = split;
function indexOf(text, target, pos){
	var p, n;
	while (true){
		p = text.indexOf(target, pos);
		if (p <= 0){
			return p;
		}
		n = 0;
		while (text[p-n-1] == '\\'){
			n += 1;
		}
		if (n%2){
			pos = p+1;
			continue;
		}
		return p;
	}
};
module.exports.indexOf = indexOf;
function indexPair(text, left, right, pos, _esc){
	var a, b, _a;
	if (right == null) right = left;
	pos = pos || 0;
	_esc = _esc || (left == "'" || left == '"');
	a = _esc ? indexOf(text, left, pos) : text.indexOf(left, pos);
	if (a == -1){
		return;
	}
	b = _esc ? indexOf(text, right, a+1) : text.indexOf(right, a+1);
	if (b == -1){
		return;
	}
	if (left == right){
		return [a, b];
	}
	_a = a;
	while (true){
		_a = _esc ? indexOf(text, left, _a+1) : text.indexOf(left, _a+1);
		if (_a > a && _a < b){
			b = _esc ? indexOf(text, right, b+1) : text.indexOf(right, b+1);
			if (b == -1){
				return;
			}
			continue;
		}
		break;
	}
	return [a, b];
};
module.exports.indexPair = indexPair;
function slicePair(text, left, right, pos, _esc){
	var ab;
	if (right == null) right = left;
	ab = indexPair(text, left, right, pos, _esc);
	if (ab){
		return text.slice(ab[0]+left.length, ab[1]);
	}
};
module.exports.slicePair = slicePair;
function indexLine(text, pos){
	var lines, shift, num, last, linetext;
	lines = text.split('\n');
	shift = -1;
	num = 0;
	last = lines.length-1;
	for (var line, i = 0; i < lines.length; i++){
		line = lines[i];
		if (i < last){
			line += '\n';
		}
		num += 1;
		shift += line.length;
		if (pos <= shift){
			linetext = line;
			break;
		}
	}
	if (linetext){
		return [linetext, num, linetext.length-1-(shift-pos)];
	}
};
module.exports.indexLine = indexLine;
function indexRe(text, re, pos, _pair){
	var index, len, m, p, ab;
	if (_pair == null) _pair = /"|'|`/g;
	if (!re.global){
		re = new RegExp(this.re(re), (re.ignoreCase ? 'i' : '')+(re.multiline ? 'm' : '')+'g');
	}
	index = (pos || 0)-1;
	len = text.length;
	while (++index < len){
		re.lastIndex = index;
		if (m = re.exec(text)){
			if (_pair){
				_pair.lastIndex = index;
				p = _pair.exec(text);
				if (p && p.index < m.index){
					if (ab = indexPair(text, p[0], pair[p[0]], p.index)){
						index = ab[1]+1;
						continue;
					}
				}
			}
			return m.index;
		}else {
			return -1;
		}
	}
};
module.exports.indexRe = indexRe;
function clip(text, _tabsize){
	var lines, min, indent;
	text = spaceTab(text.replace(/^(\s*?\n)+|\s*$/g, ''), _tabsize);
	lines = text.split('\n');
	min = -1;
	for (var line, i = 0; i < lines.length; i++){
		line = lines[i];
		indent = line.match(/^\s*/)[0].length;
		if (min == -1 || indent < min){
			min = indent;
		}
	}
	if (min > 0){
		text = text.replace((new RegExp('^\ {'+min+'}', 'mg')), '');
	}
	return text;
};
module.exports.clip = clip;
function width(text, _tabsize){
	var lines, w, len;
	lines = spaceTab(text, _tabsize).split('\n');
	w = 0;
	for (var i = 0; i < lines.length; i++){
		if ((len = lines[i].length) > w){
			w = len;
		}
	}
	return w;
};
module.exports.width = width;
function spaceTab(text, _tabsize){
	if (_tabsize == null) _tabsize = tabsize;
	return text.replace(/\t/g, _tabsize);
};
module.exports.spaceTab = spaceTab;
// 
function parse(text){
	try {
		return eval(text);
	}catch (e) {
		return '"'+text+'"';
	};
	return true;
};
module.exports.parse = parse;
function toUnicode(text){
	var texts, u;
	texts = [];
	for (var i = 0; i < text.length; i++){
		u = text.charCodeAt(i);
		texts.push(u <= 0 ? text[i] : "\\u"+('0000'+u.toString(16)).slice(-4));
	}
	return texts.join('');
};
module.exports.toUnicode = toUnicode;
// 
function isPath(text){
	// var winpath = /^[a-zA-Z];[\\/]((?! )(?![^\\/]*\s+[\\/])[\w -]+[\\/])*(?! )(?![^.]+\s+\.)[\w -]+$/; 
	// var lnxPath = /^([\/] [\w-]+)*$/; 
	return /^([^\*\s]|\\[ \t])*(\/([^\*\s]|\\[ \t])+)+$/.test(text);
};
module.exports.isPath = isPath;
function readFile(file, encoding, linenum){
	var fs, text;
	if (typeof encoding == 'number'){
		linenum = encoding, encoding = 'utf-8';
	}
	fs = require('fs');
	if (fs.existsSync(file) && fs.statSync(file).isFile()){
		text = fs.readFileSync(file, encoding || 'utf-8');
		if (linenum){
			text = readLine(text, linenum);
		}
		return text;
	}
};
module.exports.readFile = readFile;
// throw 'SText read the file is not exist';
function writeFile(content, file, encoding){
	var fs, path, dir;
	fs = require('fs');
	path = require('path');
	dir = path.dirname(file);
	if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()){
		mkdir(dir, 0755);
	}
	return fs.writeFileSync(file, content, encoding || 'utf8');
};
module.exports.writeFile = writeFile;
function readLine(text, something){
	var lines;
	if (typeof something == 'number'){
		lines = text.split('\n');
		return lines[something-1];
	}
	if (typeof something == 'string'){
		if (index == text.indexOf(something)){
			if (index >= 0){
				return indexLine(text, text.indexOf(something))[0];
			}
		}
	}
};
module.exports.readLine = readLine;
function mkdir(to, mode){
	var fs, path, base_dir;
	fs = require('fs');
	path = require('path');
	if (!fs.existsSync(to)){
		base_dir = path.dirname(to);
		if (!fs.existsSync(base_dir)){
			mkdir(base_dir, mode);
		}
		return fs.mkdirSync(to, mode || 0755);
	}
};
function matchCheckESC(text, re, last){
	var m, n;
	if (last || last === 0){
		re.lastIndex = last;
	}
	while (m = re.exec(text)){
		if (text[m.index-1] == '\\'){
			n = 1;
			while (text[m.index-n-1] == '\\'){
				n++;
			}
			if (n%2){
				continue;
			}
		}
		return m;
	}
};