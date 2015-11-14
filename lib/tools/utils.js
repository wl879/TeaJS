var Fs = require('fs');
var Path = require('path');
var Util = require('util');
var Crypto = require('crypto');
var _id_index = 0,
	_pair_token = {'(' : ')', '[' : ']', '{' : '}', '/' : '/', '\'' : '\'', '"' : '"'},
	_pair_re = /\(|\[|\{|\/|'|"/g;
global.tab_size = '    ';
global.ID = function(){
	return parseInt((Date.now()+'').substr(-8)+(_id_index++)+Math.round(Math.random()*100))+'';
};
global.isArray = Array.isArray;
global.isJson = function(obj){
	return obj.constructor.prototype.hasOwnProperty("isPrototypeOf");
};
global.isAlpha = function(c){
	var code = c.length == 1 ? c.charCodeAt(0) : -1;
	return code == 95 || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
};
global.isDigit = function(c){
	var code = c.length == 1 ? c.charCodeAt(0) : -1;
	return code >= 48 && code < 57;
};
global.isAlpNum = function(c){
	return isDigit(c) || isAlpha(c);
};
global.isIdentifier = function(text){
	return /^[\$a-zA-Z\_][\w\$]*$/.test(text);
};
global.isNumber = function(text){
	return typeof text == 'number' ? true : text && !isNaN(Number(text.replace(/^\s*-\s*/, '-')));
};
global.isBlank = function(text){
	return /^[\t \r]+$/.test(text);
};
global.isValue = function(){
	for (var i=0, arg; i < arguments.length; i++){
		arg = arguments[i];
		if (arg != null){
			return arg;
		}
	}
	return arguments[arguments.length-1];
};
global.isClass = function(obj, class_name){
	if (obj && obj.constructor){
		if (class_name && typeof class_name != 'string'){
			return obj.constructor == class_name;
		}
		if (obj.constructor.toString){
			var m = obj.constructor.toString().match(/function\s*(\w+)/);
			if (m){
				return class_name ? class_name == m[1] : m[1];
			}
		}
	}
	return undefined;
};
global.isHas = function(obj, target){
	switch (isClass(obj)){
		case 'Array':case 'String':
			return obj.indexOf(target) != -1;
		case 'Object':
			if (obj.length){
				return Array.prototype.indexOf.call(obj, target) != -1;
			}else {
				return obj.hasOwnProperty(target);
			}
			break;
	}
};
global.checkGlobalSpace = function(){
	var def = 'global process GLOBAL root console Path'.split(' ');
	for (name in global){
		if (!global.hasOwnProperty(name)) continue;
		if (def.indexOf(name) >= 0){
			continue;
		}
		if (typeof global[name] == 'function'){
			continue;
		}
		console.log('!![global space]', name);
	}
};
global.Hash = function(arr, separator){
	var h = {}, keys, extend;
	if (isArray(separator)){
		keys = separator, separator = ',';
	}else if (typeof separator == 'object'){
		extend = Hash.slice(arguments, 1), separator = ',';
	}
	if (typeof arr == 'string'){
		arr = arr.split(separator || ' ');
	}
	var name, val;
	for (var i in arr){
		if (!arr.hasOwnProperty(i)) continue;
		var v = arr[i];
		if (typeof v == 'string'){
			v = v.split(':');
			if (v.length > 1){
				name = v[0].trim(), val = v.slice(1).join(':').trim();
			}else {
				name = keys ? keys[i] || i : v[0], val = v[0].trim();
			}
			h[name] = /\d+|false|true/.test(val) ? eval(val) : (val || false);
		}else if (typeof v == 'number'){
			h[v] = v;
		}else {
			h[i] = Hash.clone(v);
		}
	}
	if (extend){
		extend.unshift(h);
		h = Hash.extend.apply(Hash, extend);
	}
	return h;
};
Hash.sha1 = function(text){
	var sha1 = Crypto.createHash('sha1');
	sha1.update(text);
	return sha1.digest('hex');
};
Hash.extend = function(obj){
	arguments[0] = obj && Hash.clone(obj) || {};
	return Hash.concat.apply(Hash, arguments);
};
Hash.clone = function(obj, deep){
	var tar;
	if (typeof obj == 'object'){
		if (isArray(obj)){
			tar = [];
		}else {
			tar = {};
			if (tar.prototype != obj.prototype){
				tar.prototype = obj.prototype;
				tar.constructor = obj.constructor;
			}
			// tar.__proto__ = obj.__proto__;
		}
		for (k in obj){
			if (!obj.hasOwnProperty(k)) continue;
			tar[k] = deep ? Hash.clone(obj[k], (deep || 1)-1) : obj[k];
		}
		return tar;
	}else {
		return obj;
	}
};
Hash.concat = function(obj){
	for (var i=1, arg; i < arguments.length; i++){
		arg = arguments[i];
		for (k in arg){
			if (!arg.hasOwnProperty(k)) continue;
			obj[k] = arg[k];
		}
	}
	return obj;
};
Hash.slice = function(obj, start, end){
	return Array.prototype.slice.call(obj, start, end);
};
global.Text = function(something, qq){
	if (typeof something == 'object'){
		var cache = [],
			text = JSON.stringify(something, function(key, value){
				if (typeof value === 'object' && value !== null){
					if (cache.indexOf(value) !== -1){
						return '[circular]';
					}
					cache.push(value);
				}
				return value;
			});
		cache = null;
		// Enable garbage collection
	}else {
		var text = Util.format([something]).replace(/^\s*\[\s*(\"|\')?|(\"|\')?\s*\]\s*$/g, '');
	}
	return qq == '"' ? text.replace(/"/g, '\"').replace(/\\'/g, "'") : text;
};
Text.isESC = function(text, pos){
	if (pos <= 0) return false;
	var t = 0;
	while (pos > 0 && text[pos-1] == '\\'){
		t += 1, pos -= 1;
	}
	return (t%2 != 0);
};
Text.readFile = function(file, encoding){
	if (Path.isFile(file)){
		return Fs.readFileSync(file, encoding || 'utf-8');
	}
};
Text.writeFile = function(text, file, encoding){
	var dir = Path.dirname(file);
	if (!Path.isDir(dir)){
		Path.mkdirp(dir);
	}
	return Fs.writeFileSync(file, text, encoding || 'utf8');
};
Text.split = function(text, separator, trim, del_esc){
	separator = new RegExp('(\\\\*)'+(separator.replace(/([^\\]?)(\W)/g, '$1\\$2') || ' '));
	var tmp = [], a = 0, b = -1, m, p;
	while (text){
		if (m = text.substr(a).match(separator)){
			if (!m[1] || m[1].length%2 == 0){
				b = a+m.index+m[1].length;
			}else {
				a += m.index+m[0].length;
				continue;
			}
			_pair_re.lastIndex = a;
			if (m = _pair_re.exec(text)){
				if ((p = this.indexPair(text, a+m.index, m[0], _pair_token[m[0]], true)) && b > p[0] && b < p[1]){
					a = p[1]+1;
					continue;
				}
			}
			a = b;
			tmp.push(text.slice(0, a));
			text = text.slice(a+1), a = 0;
		}else {
			tmp.push(text);
			break;
		}
	}
	var ret = [];
	for (var i=0, v; i < tmp.length; i++){
		v = tmp[i];
		if (trim){
			v = v.trim();
		}
		if (del_esc && v){
			v = v.replace(/\\(.)/g, '$1');
		}
		v && ret.push(v);
	}
	return ret;
};
Text.indexPair = function(text, pos, s1, s2, check_ESC){
	if (typeof s2 == 'number'){
		check_ESC = pos, pos = s2, s2 = s1;
	}
	pos = pos || 0;
	s2 = s2 || s1;
	check_ESC = check_ESC || (s1 == "'" || s1 == '"');
	var a = text.indexOf(s1, pos);
	while (a >= 0 && check_ESC && Text.isESC(text, a)){
		if ((a = text.indexOf(s1, a+1)) == -1) return null;
	}
	if (a == -1) return;
	var b = text.indexOf(s2, a+1);
	while (b > 0 && check_ESC && Text.isESC(text, b)){
		b = text.indexOf(s2, b+1);
	}
	if (b == -1) return null;
	if (s1 == s2) return [a, b];
	var a_b = a;
	while (a_b >= 0 && b > a_b){
		a_b = text.indexOf(s1, a_b+1);
		while (a_b > 0 && check_ESC && Text.isESC(text, a_b)){
			a_b = text.indexOf(s1, a_b+1);
		}
		if (a_b > a && a_b < b){
			b = text.indexOf(s2, b+1);
			while (b > 0 && check_ESC && Text.isESC(text, b)){
				b = text.indexOf(s2, b+1);
			}
		}
	}
	return a >= 0 && a < b ? [a, b] : null;
};
Text.indexLine = function(text, pos){
	var lines = text.split('\n'), shift = -1, num = 0, last = lines.length-1;
	for (var i=0, line; i < lines.length; i++){
		line = lines[i];
		if (i < last){
			line += '\n';
		}
		num += 1;
		shift += line.length;
		if (pos <= shift) break;
	}
	// [text, num, col]
	return [line, num, line.length-1-(shift-pos)];
};
Text.indexBreak = function(text, pos){
	var br_re, ig_re;
	br_re = /[\;\n\)\]\}]/g;
	ig_re = /[^\;\)\]\}\$\w\s\#\"\'\`]\s*$|^\s*[^\;\)\]\}\w\s\"\'\`\$\#]/;
	return this.indexOfReg(text, pos || 0, br_re, ig_re);
};
Text.indexOfReg = function(text, pos, re, ig_reg){
	var m, pm, ab, igm;
	if (typeof re == 'string') re = new RegExp(re, 'g');
	if (!re) return -1;
	var b = pos-1, len = text.length;
	while (++b < len){
		re.lastIndex = b;
		if (m = re.exec(text)){
			_pair_re.lastIndex = b;
			if ((pm = _pair_re.exec(text)) && pm.index < m.index){
				if (ab = this.indexPair(text, pm.index, pm[0], _pair_token[pm[0]])){
					if (pm[0] != '/' || (!/\n/.test(text.slice(ab[0], ab[1]+1)) && !/(\w|\+\+|--|\$|\@)[\t\ \r]*$/g.test(text.substr(0, pm.index)))){
						b = ab[1];
						continue;
					}
				}
			}
			if (ig_reg){
				if ((igm = text.substr(0, m.index+1).match(ig_reg)) && igm.index+igm[0].length-1 == m.index){
					b += 1;
					continue;
				}
				if ((igm = text.substr(m.index).match(ig_reg)) && igm.index === 0){
					b += 1;
					continue;
				}
			}
			b = m.index-1;
			break;
		}else {
			b = text.length-1;
			break;
		}
	}
	// console.log(['++', text.slice(pos, b+1)])
	return b;
};
Text.width = function(text, tab){
	var tmp = text.replace(/\t/g, tab || '    ').split('\n'), w = 0, len;
	for (var i=0; i < tmp.length; i++){
		if ((len = tmp[i].length) > w) w = len;
	}
	return w;
};
Text.count = function(text, str){
	var n = 0, i = -1;
	while ((i = text.indexOf(str, i+1)) != -1){
		n += 1;
	}
	return n;
};
Text.toUnicode = function(text){
	var u, str = [];
	for (var i=0; i < text.length; i++){
		u = text.charCodeAt(i);
		str.push(u <= 0 ? text[i] : "\\u"+('0000'+u.toString(16)).slice(-4));
	}
	return str.join('');
};
Text.trimPP = function(text){
	return text.replace(/^`+|^'+|^"+|"+$|'+$|`+$/g, '');
};
Text.trimIndent = function(text, tab){
	var indent,
		text = text.replace(/^(?:\s*?\n)+|\s*$/g, '').replace(/\t/g, tab || tab_size),
		ls = text.split('\n'),
		min = -1;
	for (var i=0; i < ls.length; i++){
		indent = ls[i].match(/^\s*/)[0].length || 0;
		if (min == -1 || indent < min) min = indent;
	}
	if (min > 0){
		text = text.replace((new RegExp('^\ {'+min+'}', 'mg')), '');
	}
	return text;
};
Text.print = function(data, circular){
	if (typeof data == 'string'){
		return '"'+data+'"';
	}
	if (typeof data == 'number' || typeof data == 'boolean' || data == null){
		return data;
	}
	if (typeof data == 'function'){
		return data.toString();
	}
	var class_name = isClass(data);
	if (class_name == 'RegExp'){
		return data+'';
	}
	if (!circular) circular = [];
	if (circular.indexOf(data) !== -1){
		return '[circular]';
	}
	circular.push(data);
	var list = [], str = '', array_mode = data.hasOwnProperty('length');
	for (k in data){
		if (!data.hasOwnProperty(k)) continue;
		if (array_mode && /\d+/.test(k)){
			list.push(Text.print(data[k], circular));
		}else {
			list.push(k+' : '+Text.print(data[k], circular));
		}
	}
	if (list.length){
		str = '\n'+list.join(',\n').replace(/^/mg, '\t')+'\n';
	}
	if (/Array|Object/.test(class_name)){
		class_name = '';
	}else {
		class_name = ' *'+class_name+'*';
	}
	if (array_mode || isArray(data)){
		str = '['+class_name+str+']';
	}else {
		str = '{'+class_name+str+'}';
	}
	return str;
};
Text.getName = function(text){
	if (text){
		text = text.replace(/^['"]+|['"]+$|\.[^\.]*$|/g, '');
		var name = Path.basename(text);
		if (name == 'index'){
			name = Path.basename(Path.dirname(text));
		}
		return name.replace(/(?:^|[^a-zA-Z0-9\$]+)(\w)/g, function($0, $1){return $1.toUpperCase()});
	}
};
global.Path = Path;
Path.isPathText = function(text){
	// var winpath = /^[a-zA-Z];[\\/]((?! )(?![^\\/]*\s+[\\/])[\w -]+[\\/])*(?! )(?![^.]+\s+\.)[\w -]+$/; 
	// var lnxPath = /^([\/] [\w-]+)*$/; 
	return /^([^\*\s]|\\[ \t])*(\/([^\*\s]|\\[ \t])+)+$/.test(text);
};
Path.isFile = function(path){
	return Fs.existsSync(path) && Fs.statSync(path).isFile();
};
Path.isDir = function(path){
	return Fs.existsSync(path) && Fs.statSync(path).isDirectory();
};
Path.scanAllPath = function(path, filter, level, out){
	if (typeof filter == 'number'){
		out = level, level = filter, filter = null;
	}
	var ret = {"files": [], "dirs": {}, "allfiles": []};
	if (this.isFile(path)){
		ret.files.push(path);
		return ret;
	}else if (!this.isDir(path)){
		return ret;
	}
	if (typeof filter == 'string'){
		filter = this.parseRegExp(filter, 1);
	}
	var dirList = Fs.readdirSync(path), len = dirList.length;
	for (var i_ref = Fs.readdirSync(path), i=0, tmp; i < i_ref.length; i++){
		tmp = i_ref[i];
		tmp = this.join(path, tmp);
		if (Fs.statSync(tmp).isDirectory()){
			if (level){
				ret.dirs[tmp] = this.scanAllPath(tmp, filter, level-1, out);
				if (ret.dirs[tmp].allfiles.length){
					ret.allfiles.push.apply(ret.allfiles, ret.dirs[tmp].allfiles);
				}
			}else {
				ret.dirs[tmp] = 0;
			}
		}else {
			if (filter && (out ? filter.test(tmp) : !filter.test(tmp))){
				continue;
			}
			ret.files.push(tmp);
		}
	}
	if (ret.files.length){
		ret.allfiles = ret.allfiles.concat(ret.files);
	}
	return ret;
};
Path.scanDir = function(path, filter, out){
	var ret = this.scanAllPath(path, filter, 0, out);
	ret.dirs = Object.keys(ret.dirs);
	return ret;
};
Path.scanFile = function(path, filter, out){
	var ret = this.scanAllPath(path, filter, 0, out);
	return ret && ret.files;
};
Path.mkdirp = function(path, mode){
	if (!Fs.existsSync(path)){
		var base_dir = this.dirname(path);
		if (!Fs.existsSync(base_dir)){
			this.mkdirp(base_dir, mode);
		}
		Fs.mkdirSync(path, mode || 0755);
	}
};
Path.parseRegExp = function(str, force){
	if (force || /([^\\]|^)[\*\?]/.test(str)){
		str = str.replace(/\./g, '\\.');
		str = str.replace(/([^\\]|^)\?/g, '$1.');
		str = str.replace(/([^\\]|^)\*/g, '$1.*?');
		try {
			return new RegExp('^'+str+'$');
		} catch (_e){}
	}
};
Path.parseDir = function(text, path){
	if ((/\"|\'/).test(text[0])) text = text.slice(1, -1);
	if (!(/\~|\/|\.]/).test(text[0])) text = './'+text;
	text = path ? this.resolve(path, text) : this.resolve(text);
	var dirs = [], re, tmp, names = text.split('/');
	if (this.isDir(text)){
		return [text];
	}
	for (var i=0, name; i < names.length; i++){
		name = names[i];
		if (re = this.parseRegExp(name)){
			if (dirs.length){
				tmp = [];
				for (var d=0; d < dirs.length; d++){
					tmp.push.apply(tmp, Path.scanDir(dirs[d], re).dirs);
				}
				dirs = tmp;
			}else {
				dirs = Path.scanDir('./', re).dirs;
			}
		}else {
			if (dirs.length){
				tmp = [];
				for (var d=0; d < dirs.length; d++){
					if (this.isDir(dirs[d]+name+'/')){
						tmp.push(dirs[d]+name+'/');
					}
				}
				dirs = tmp;
			}else {
				if (this.isDir(name+'/')){
					dirs.push(name+'/');
				}
			}
		}
		if (!dirs.length){
			dirs.error = 'The dir not exist! '+names.slice(0, i+1).join('/');
			break;
		}
	}
	return dirs;
};
Path.testFile = function(path, exts, name){
	if (name){
		path = this.join(path, name);
	}
	if (exts && exts.length){
		for (var _i=0, ext; _i < exts.length; _i++){
			ext = exts[_i];
			if (this.isFile(path+ext)){
				return path+ext;
			}
		}
	}else if (this.isFile(path)){
		return path;
	}
};
Path.parseFile = function(text, path, exts){
	var file;
	text = Text.trimPP(text);
	if (!(/\~|\/|\.]/).test(text[0])) text = './'+text;
	text = path ? this.resolve(path, text) : this.resolve(text);
	var files = [], error = [];
	if (this.isDir(text)){
		if (file = this.testFile(text, exts || ['.js'], 'index')){
			files.push(file);
			return files;
		}
	}
	var data = this.parse(text);
	if (!exts){
		if (data.ext) exts = [data.ext];
	}else {
		exts.hasOwnProperty(data.ext) || exts.push(data.ext);
	}
	if (file = this.testFile(data.dir, exts, data.name)){
		files.push(file);
		return files;
	}
	var dirs = this.parseDir(data.dir);
	if (dirs.error){
		error.push(dirs.error);
	}else {
		var base_re = this.parseRegExp(data.base, 1), tmp;
		for (var d=0; d < dirs.length; d++){
			if (file = this.testFile(dirs[d], exts, data.name)){
				files.push(file);
			}else if (base_re){
				files.push.apply(files, this.scanFile(dirs[d], base_re));
			}else {
				error.push('File not exist '+dirs[d]+data.base);
			}
		}
	}
	if (files.length == 0 && error.length == 0){
		error.push('File not exist '+text);
	}
	files.error = error.length != 0 ? error : null;
	return files;
};
Path.countPath = function(file, path, out){
	var data = {"file": '', "dir": '', "path": '', "out": '', "outdir": ''};
	if (path){
		data.path = Path.resolve(path);
		if (file && file.indexOf(data.path) != -1){
			file = Path.relative(data.path, file);
		}
		data.file = Path.resolve(data.path, file || '');
	}else {
		data.file = Path.resolve(file || '');
	}
	if (Path.isDir(data.file)){
		if (!path){
			data.path = data.file;
		}
		data.dir = data.file;
		data.file = '';
	}else if (!Path.isFile(data.file)){
		data.file = '';
		data.error = 'can not find file';
		return data;
	}else {
		data.dir = Path.dirname(data.file);
	}
	if (out){
		data.out = Path.resolve(out);
		if (!Path.extname(data.out)){
			data.outdir = data.out;
			if (data.path){
				data.out = Path.resolve(data.outdir, Path.relative(data.path, data.file));
			}else {
				data.out = Path.join(data.outdir, Path.basename(data.file));
			}
		}else {
			data.outdir = Path.dirname(data.out);
		}
	}else if (Path.extname(data.file) == 'tea'){
		data.out = data.file;
		data.outdir = Path.dirname(data.out);
	}
	if (data.out){
		data.out = data.out.replace(/\.tea\b/, '.js');
	}
	return data;
};