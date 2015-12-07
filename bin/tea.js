#!/usr/bin/env node
(function (){
	var _require, __modules, Module;
	if (!global && typeof (window) != 'undefined'){
		global = window;
	}
	_require = require;
	require = function(key){
		var mod = __modules[key];
		if (mod){
			if (mod.loaded){
				return mod.exports;
			}
			return mod.load();
		}else {
			return module.require(key);
		}
	};
	__modules = {};
	Module = function(filename, creater){
		this.id = filename;
		this.exports = {};
		this.filename = filename;
		this.loaded = false;
		this.creater = creater;
		this.require = require;
	};
	Module.prototype.load = function(){
		this.loaded = true;
		this.creater(this.exports, require, this, this.filename, this.filename.replace(/\/.+$/g, ''));
		module.constructor._cache[this.filename] = this;
		return this.exports;
	};
	Module.register = function(filename, key, creater){
		if (!(__modules.hasOwnProperty(key))){
			__modules[key] = new Module(filename, creater);
		}
	};
	Module.register('/Users/wl/Sites/TeaJS/src/tea.tea', '../src/tea.tea', function(exports, require, module, __filename, __dirname){
		require("../src/tools/utils.tea");
		global.tab_size = '    ';
		global.tea = module.exports;
		tea.teapath = Path.dirname(__filename);
		tea.argv = require("../src/argv.tea");
		tea.helper = require("../src/tools/helper.tea");
		tea.error = require("../src/error.tea");
		tea.preprocess = require("../src/preprocess/index.tea");
		tea.syntax = require("../src/syntax/index.tea");
		tea.rewriter = require("../src/rewriter/index.tea");
		tea.context = tea.preprocess.context;
		tea.source = tea.syntax.source;
		tea.defineToken = tea.syntax.token.define;
		tea.tabSize = function(size){
			global.tab_size = print.strc(' ', parseInt(size));
		};
		tea.exit = function(msg, target, name){
			if (debug.log){
				debug.log('* r{Tea exit - Run time:} b{'+tea.runTimes('ms')+'}');
			}
			if (arguments.length){
				print(tea.error(new Error(), msg, target, name).text);
			}
			process.exit();
		};
		tea.runTimes = function(unit){
			var t = Date.now()-RunTimeAtLoaded;
			switch (unit){
				case 's':
					return t/1000+'s';
				case 'ms':
					return t+'ms';
			}
			return t;
		};
		tea.compile = function(src, por){
			var ast, write;
			if (typeof src == 'string'){
				src = tea.source(src, null, por);
			}
			if (src){
				if (ast = tea.syntax.parse(src, por)){
					if (write = tea.rewriter.read(ast, por)){
						return write.text;
					}
				}
			}
			return '';
		};
		tea.checkFile = function(file){
			var _file = Path.resolve(file);
			if (!Path.isFile(_file)){
				if (this.argv.dir){
					_file = Path.resolve(this.argv.dir, file);
					if (Path.isFile(_file)){
						return _file;
					}
				}
				if (this.path){
					_file = Path.resolve(this.argv.path, file);
					if (Path.isFile(_file)){
						return _file;
					}
				}
			}else {
				return _file;
			}
		};
		tea.countOutput = function(file){
			var pathdata = Path.countPath(file, tea.argv.path, tea.argv.outdir);
			return pathdata.out;
		};
		var RunTimeAtLoaded = Date.now();
	});Module.register('/Users/wl/Sites/TeaJS/src/tools/utils.tea', '../src/tools/utils.tea', function(exports, require, module, __filename, __dirname){
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
		global.checkGlobalScope = function(){
			var def = 'global process GLOBAL root console Path'.split(' ');
			for (var name in global){
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
				}
				for (var k in obj){
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
				for (var k in arg){
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
			}else {
				var text = Util.format([something]).replace(/^\s*\[\s*(\"|\')?|(\"|\')?\s*\]\s*$/g, '');
			}
			return qq == '"' ? text.replace(/"/g, '\\"').replace(/([^\\])\\'/g, '$1\'') : text;
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
						if ((p = this.indexPair(text, m.index, m[0], _pair_token[m[0]], true)) && b > p[0]){
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
			for (var k in data){
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
			if (!data.file){
				if (data.path){
					data.dir = data.path;
				}
			}else if (Path.isDir(data.file)){
				if (!path){
					data.path = data.file;
				}
				data.dir = data.file;
				data.file = '';
			}else if (!Path.isFile(data.file)){
				data.file = '';
				data.error = 'can not find file: '+file;
				return data;
			}else {
				data.dir = Path.dirname(data.file);
			}
			if (out){
				data.out = Path.resolve(out);
				if (!Path.extname(data.out)){
					data.outdir = data.out;
					if (data.file){
						if (data.path){
							data.out = Path.resolve(data.outdir, Path.relative(data.path, data.file));
						}else {
							data.out = Path.join(data.outdir, Path.basename(data.file));
						}
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
	});Module.register('/Users/wl/Sites/TeaJS/src/argv.tea', '../src/argv.tea', function(exports, require, module, __filename, __dirname){
		var Argv = (function(){
			function Argv(argv, opt, desc_text){
				this.___desc = {};
				this.pathdata = {};
				this.length = 0;
				if (arguments.length){
					this.parse(argv, opt, desc_text);
				}
			}
			Argv.prototype.parse = function (argv, opt, desc_text){
				var value;
				if (desc_text){
					var re = /^[\ \t]*(\-(?:\-[\w\-]+)?\w)\,?\ *(\-\-[\w\-]+)?\ *(\<[^\>]+\>)?\s*(.*)$/mg,
						m,
						_opt = [];
					while (m = re.exec(desc_text)){
						_opt.push([m[1], m[2], m[3], m[4]]);
					}
					if (_opt.length){
						opt = opt ? opt.concat(_opt) : _opt;
					}
					this.___desc._help_ = desc_text;
				}
				if (opt && opt.length){
					for (var i=0, o; i < opt.length; i++){
						o = opt[i];
						if (o.length > 2 && o[0] && o[1] && o[0][0] == '-' && o[1][0] == '-'){
							this.add(o[0], o[1], o[3] || o[2] || '');
						}
					}
				}
				if (argv){
					var i = /node$/.test(argv[0]) ? 2 : 1;
					for (var name; i < argv.length; i++){
						name = argv[i];
						if (name[0] == '-'){
							value = argv[i+1];
							if (!value || value[0] == '-'){
								value = true;
							}else {
								i += 1;
							}
							this[name] = value;
						}else if (!this['--file']){
							this['--file'] = name;
						}else {
							this[this.length++] = name;
						}
					}
					return this.check();
				}
			}
			Argv.prototype.check = function (){
				this.pathdata = Path.countPath(this['--file'], this['--path'], this['--out']);
				if (this.pathdata.error){
					throw tea.error(new Error(), this.pathdata.error);
				}
				return this;
			}
			Argv.prototype.__defineGetter__("file", function(){
				return this.pathdata.file;
			});
			Argv.prototype.__defineGetter__("dir", function(){
				return this.pathdata.dir;
			});
			Argv.prototype.__defineGetter__("path", function(){
				return this.pathdata.path;
			});
			Argv.prototype.__defineGetter__("outdir", function(){
				return this.pathdata.outdir;
			});
			Argv.prototype.__defineGetter__("out", function(){
				if (this.pathdata.out){
					return this.pathdata.out;
				}
				if (/\.tea$/.test(this.pathdata.file)){
					return this.pathdata.file.replace(/\.tea$/, '.js');
				}
			});
			Argv.prototype.__defineSetter__("file", function(file){
				this.pathdata = Path.countPath(file, this.pathdata.path, this.pathdata.outdir);
				if (this.pathdata.error){
					throw tea.error(new Error(), this.pathdata.error);
				}
				return this.pathdata.file;
			});
			Argv.prototype.__defineSetter__("out", function(out){
				this.pathdata = Path.countPath(this.pathdata.file, this.pathdata.path, out);
				if (this.pathdata.error){
					throw tea.error(new Error(), this.pathdata.error);
				}
				return this.pathdata.out;
			});
			Argv.prototype.add = function (short, long, desc, fn){
				if (short.substr(0, 2) == '--'){
					desc = long, long = short, short = null;
				}
				var name = long.replace(/^-+/, '');
				if (desc){
					this.___desc[short] = desc;
					this.___desc[long] = desc;
				}
				if (short && long && short != long){
					var self = this;
					this.__defineGetter__(short, function(){
						return self[long];
					});
					this.__defineSetter__(short, function(v){
						return self[long] = v;
					});
				}
			}
			Argv.prototype.showDesc = function (com){
				return this.___desc[com];
			}
			Argv.prototype.showHelp = function (){
				print(this.___desc._help_);
			}
			Argv.prototype.copy = function (extend){
				var argv = new Argv();
				for (var i in this){
					if (!this.hasOwnProperty(i)) continue;
					if (this[i] == null || i[0] == '_' && i[1] == '_'){
						continue;
					}
					argv[i] = this[i];
				}
				if (extend){
					for (var i in extend){
						if (!extend.hasOwnProperty(i)) continue;
						argv[i] = extend[i];
					}
				}
				argv.parent = argv.parent || argv;
				return argv;
			}
			return Argv;
		})();
		module.exports = new Argv(null, null, "r{** g{Tea} 0.1.20 w{script help} *************************************************************}\n\
  # parameter:\n\
    -f,--file  <file>                  输入文件\n\
    -p,--path  <project dir>           项目目录\n\
    -o,--out   <output>                输出文件 或 目标目录\n\
    -e,--eval  <tea script snippet>    编译一段 tea script 文本\n\
    -j,--join                          合并 require 文件\n\
    -m,--map                           生成 source map 文件\n\
    -h,--help                          显示帮助\n\
    -v,--verbose                       显示编译信息\n\
    -r,--run                           执行输入件\n\
    -d,--define                        宏定义文件\n\
    -s,--safe                          只编译，不会对变量自动声名等\n\
    --clear                            清理注释\n\
    --tab <number>                     设置 tab size\n\
    --token                            输出编译的 token 解析\n\
    --ast                              输出 ast 结构\n\
    --nopp                             不进行预编译\n\
    --debug                            显示调试信息 [log prep syntax write all]");
	});Module.register('/Users/wl/Sites/TeaJS/src/tools/helper.tea', '../src/tools/helper.tea', function(exports, require, module, __filename, __dirname){
		require("../src/tools/debug.tea");
		var Helpter = module.exports;
		Helpter.getLocation = function(something){
			switch (isClass(something)){
				case 'Ast':
					return this.getLocation(something.tokens(0));
				case 'Node':
					return this.getLocation(something.tokens(0));
				case 'Source':
					return this.getLocation(something.current);
				case 'Token':
					return this.getLocation(something.location);
				case 'Location':
					return something;
			}
		};
		Helpter.errorPot = function(something){
			switch (isClass(something)){
				case 'Ast':case 'Node':case 'Source':case 'Token':
					if (!(something = this.getLocation(something))){
						break;
					}
				case 'Location':
					var text = something.source,
						pos = something.start,
						code = text.slice(something.start, something.end+1),
						file = something.fileName;
					return this.errorPotByText(text, pos, code, file);
				case 'Array':
					return this.errorPotByText.apply(this, something);
				case 'String':
					if (arguments.length > 1){
						return this.errorPotByText.apply(this, arguments);
					}
					return something;
			}
		};
		Helpter.errorPotByText = function(text, pos, code, file){
			if (pos == -1 && code){
				pos = text.indexOf(code);
			}
			var line = Text.indexLine(text, pos),
				line_text = line[0],
				num = line[1],
				col = line[2];
			if (code){
				code = code.replace(/\n/, '\\n');
			}
			var pot_num = num+' | ',
				pot_shift = (pot_num+line_text.substr(0, col)).replace(/[^\s]/g, ' ')+code.replace(/./g, '^'),
				pot_line = (line_text.substr(0, col)+print.color('#r{'+code+'}')+line_text.substr(col+code.length)).replace(/\n/, '\\n'),
				qq_mark = (/(?:[^\\]|^)"/).test(line_text) ? "'" : '"',
				pot_echo = qq_mark+pot_num+pot_line+'\n'+qq_mark+pot_shift;
			if (file){
				pot_echo = (Path.isPathText(file) ? 'At ' : 'From ')+file+':'+num+':'+col+'\n'+pot_echo.replace(/^(\'|\")/mg, '$1\t');
			}
			return pot_echo;
		};
		Helpter.atFile = function(something){
			var location;
			if (location = Helpter.getLocation(something)){
				return 'at '+location.fileName+':'+location.lineNumber+':'+location.columnNumber;
			}
			return '';
		};
		Helpter.atFileByText = function(file, text, pos){
			var line = Text.indexLine(text, pos), num = line[1], col = line[2];
			return (Path.isPathText(file) ? 'At ' : 'From ')+file+':'+num+':'+col;
		};
		debug.addEvent('log', function(){
			debug.echo(print.toString(arguments));
		});
		debug.addEvent('prep', function(msg, token){
			if (token && token.istoken){
				token = ' <--> '+Helpter.atFile(token);
			}
			debug.echo(print.toString(arguments).replace(/^(\s+)/mg, ' ·$1'));
		});
		debug.addEvent('syntax', function(){
			debug.echo(print.toString(arguments));
		});
		debug.addEvent('write', function(){
			debug.echo(print.toString(arguments));
		});
		debug.addEvent('token', function(){
			debug.echo(print.toString(arguments));
		});
		function tokenPrinter(token, show_token){
			if (show_token || show_token == null){
				var type = token.types.join(',');
				if (show_token == 'shot'){
					type = type.replace(/[a-z]+/g, '');
				}
				return '['+(token.indent >= 0 ? '*' : '')+'('+(type)+') g{\''+Text(token.text)+'\'}]';
			}
			return '[(TOKEN) '+token.text+']';
		}
		function sourcePrinter(src){
			var texts = [];
			for (var i=0, t; i < src.length; i++){
				t = src[i];
				if (!t){
					continue;
				}
				if (t.istoken){
					texts.push((i && t.is('LineHead') ? '\n' : '')+tokenPrinter(t, 'shot'));
				}else {
					texts.push(lexemePrinter(src[i], 'shot')+(src[i].isToken('LF') ? '\n' : ''));
				}
			}
			return texts.join(', ');
		}
		function nodePrinter(node, text, _level, _indent){
			if (!_level) _level = 0;
			if (!_indent) _indent = 0;
			var O = _level%2 ? 'r{[}' : '[',
				C = _level%2 ? 'r{]}' : ']',
				isBlock = /BLOCK/.test(node.type) && node.length,
				isNode = /node|block/i.test(node.type);
			if (!text) text = '';
			text += O+'(g{'+node.type+'}) ';
			if (isBlock){
				text += '\n'+print.strc('\t', _indent+1);
			}
			for (var i=0; i < node.length; i++){
				if (!node[i]) continue;
				if (i != 0){
					text += ', ';
				}
				if (isNode){
					text += '\n'+print.strc('\t', _indent+1);
				}
				if (node[i].length >= 0){
					text = nodePrinter(node[i], text, (_level || 0)+1, isBlock || isNode ? _indent+1 : _indent);
				}else if (node[i].text){
					text += "'"+Text(node[i].text)+"'";
				}
			}
			text += (isBlock || isNode ? '\n'+print.strc('\t', _indent)+C : C);
			if (_level == 0){
				text = text.replace(/^(\s+)((?:\*\*\*\ \]\ \*\*\*|\])+\,)\s*/mg, '$1$2\n$1');
			}
			return text;
		}
		function macroPrinter(macro){
			var text;
			text = '[(Macro - '+macro.type+') '+macro.name+(macro.params ? '('+macro.params.join(',')+')' : '')+' "'+Text(macro.body.length > 30 ? macro.body.substr(0, 30)+'...' : macro.body)+'"'+']';
			return text;
		}
		function scopePrinter(scope){
			var temp, texts = [];
			for (var key in scope){
				if (!scope.hasOwnProperty(key)) continue;
				var item = scope[key];
				if (key == 'node' || key == 'top' || key == '_top_' || item == null){
					continue;
				}
				if (key == 'variables'){
					var v_types = {};
					for (var name in item){
						if (!item.hasOwnProperty(name)) continue;
						var type = item[name];
						if (!v_types[type]) v_types[type] = [];
						v_types[type].push(name);
					}
					var v_text = [];
					for (var type in v_types){
						if (!v_types.hasOwnProperty(type)) continue;
						var varbs = v_types[type];
						v_text.push(type+' : ["'+varbs.join('", "')+'"]');
					}
					if (v_text.length){
						texts.push(key+' :\n'+v_text.join(',\n').replace(/^/mg, '\t'));
					}
					continue;
				}
				if (key == 'argumentsDefine'){
					var sub_text = [];
					for (var j=0; j < item.length; j++){
						sub_text.push(print.toText(item[j]).replace(/^/mg, '\t'));
					}
					if (sub_text.length){
						texts.push(key+' : [\n'+sub_text.join(',\n')+']');
					}
					continue;
				}
				if (key == 'sub' || key == 'letScope'){
					var sub_text = [];
					for (var k in item){
						if (!item.hasOwnProperty(k)) continue;
						sub_text.push(k+' : '+scopePrinter(item[k]));
					}
					if (sub_text.length){
						texts.push(key+' : [\n'+sub_text.join(',\n').replace(/^/mg, '\t')+']');
					}
					continue;
				}
				if (temp = print.toString([item])){
					if (temp.length > 2){
						texts.push(key+' : '+temp);
					}
				}
			}
			return '[\n'+texts.join('\n').replace(/^/mg, '\t')+']';
		}
		function writerPrinter(data, level, _circular_cache){
			if (!_circular_cache){
				_circular_cache = [];
			}
			_circular_cache.push(data);
			var texts = [];
			for (var i=0, item; i < data.length; i++){
				item = data[i];
				if (item.istoken){
					texts.push("'"+Text(item.text)+"'");
				}else if (typeof item == 'string'){
					texts.push("'"+Text(item)+"'");
				}else {
					if (_circular_cache.indexOf(item) != -1){
						return '[Circular]';
					}
					texts.push(writerPrinter(item, (level || 0)+1, _circular_cache));
				}
			}
			var text = '[('+data.type+') '+texts.join('·')+']';
			return text;
		}
		function SyntaxPrinter(sre, __level){
			var text = [];
			for (var i=0, r; i < sre.length; i++){
				r = sre[i];
				if (r.type == 'Or'){
					if (text.length){
						text.push('|');
					}
					text.push((__level%2 ? 'd{' : 'w{')+SyntaxPrinter(r, (__level || 0))+'}');
				}else if (r.type == 'Sub'){
					text.push("("+(r.assertion)+SyntaxPrinter(r.key, (__level || 0)+1)+')');
				}else {
					text.push("[("+(r.type)+")"+(r.key)+r.quantifier+"]");
				}
			}
			return text.join(' ');
		}
		print.register('Token', tokenPrinter);
		print.register('Source', sourcePrinter);
		print.register('Node', nodePrinter);
		print.register('Ast', nodePrinter);
		print.register('Macro', macroPrinter);
		print.register('Scope', scopePrinter);
		print.register('Writer', writerPrinter);
		print.register('SyntaxReg', SyntaxPrinter);
	});Module.register('/Users/wl/Sites/TeaJS/src/tools/debug.tea', '../src/tools/debug.tea', function(exports, require, module, __filename, __dirname){
		require("../src/tools/printer.tea");
		var debug_lv = 0, debug_event_listener = [];
		global.debug = function(e){
			var text;
			if (arguments.length == 0 || e instanceof Error){
				text = debug.stacksToText(e);
			}else {
				text = print.toString(arguments, '~ ');
			}
			debug.echo(text, new Error(), true);
		};
		debug.echo = function(text, error, show_line_info){
			if (show_line_info || (debug_lv&64) == 64){
				var at_line = debug.line(error || new Error(), true);
				text = text.replace(/(\n|$)/, '<-->'+at_line+'$1');
			}
			print(text);
		};
		debug.line = function(err, ret_str){
			var stacks = debug.stacks(err || (new Error)), stack = stacks[0];
			if (ret_str){
				return stacks[0].filetext;
			}
			if (debug.log){
				debug.log(stacks[0].filetext);
			}
		};
		debug.eventMap = {"all" : 0};
		debug.addEvent = function(name, shot_name, func){
			if (typeof shot_name == 'function'){
				func = shot_name, shot_name = null;
			}
			var num = this.eventMap.all+1;
			this.eventMap.all += num;
			this.eventMap[name] = num;
			if (shot_name){
				this.eventMap[shot_name] = num;
			}
			this['__'+name] = func;
		};
		debug.onEvent = function(part, fn){
			if (fn){
				var lv = parseDebugConf(part);
				if ((debug_lv&lv) == lv){
					fn(debug_lv);
				}else {
					debug_event_listener.push([lv, fn]);
				}
			}else {
				var lv = typeof part == 'number' ? part : this.eventMap[part];
				return (debug_lv&(lv || 0)) == lv;
			}
		};
		debug.disable = function(part){
			debug_lv = parseDebugConf(part);
			for (var name in this.eventMap){
				if (!this.eventMap.hasOwnProperty(name)) continue;
				if (debug[name] && (debug_lv&this.eventMap[name]) != this.eventMap[name]){
					debug[name] = null;
				}
			}
		};
		debug.enable = function(part){
			debug_lv = parseDebugConf(part);
			var open_list = [];
			for (var name in this.eventMap){
				if (!this.eventMap.hasOwnProperty(name)) continue;
				if (debug['__'+name]){
					if ((debug_lv&this.eventMap[name]) == this.eventMap[name]){
						debug[name] = debug['__'+name];
						open_list.push(name);
					}else {
						debug[name] = null;
					}
				}
			}
			if (open_list.length){
				print('* Debug enable: "'+open_list.join('", "')+'"');
			}
			for (var i=debug_event_listener.length-1, item; i >= 0; i--){
				item = debug_event_listener[i];
				if ((debug_lv&item[0]) == item[0]){
					item[1](argvj_debug_level);
				}
			}
		};
		debug.stacks = function(err, shift){
			var stacks;
			if (isArray(err)) return err;
			if (typeof err == 'number'){
				shift = err, err = null;
			}
			if (typeof err == 'string'){
				stacks = err.split('\n');
			}else {
				err = err || new Error();
				stacks = err.stack.split('\n');
			}
			var i = 1, ret = [], m, tmp;
			if (err && err.name == 'Error'){
				while (i < stacks.length && /at (.*Function.debug|.*Function.print|.*?TeaError|.*?tea\.throw)/i.test(stacks[i])){
					i++;
				}
			}
			for (; i < stacks.length; i++){
				if (stacks[i].indexOf('anonymous') != -1){
					continue;
				}
				if (m = stacks[i].match(/at (.*?) \((.*?)\)$/)){
					tmp = m[2].split(':');
					ret.push({"fileName": tmp[0],
						"lineNumber": tmp[1],
						"columnNumber": tmp[2],
						"code": m[1],
						"source": stacks[i],
						"filetext": m[2]});
				}
			}
			if (shift){
				ret = ret.slice(shift);
			}
			ret.message = stacks[0];
			return ret;
		};
		debug.stacksToText = function(stacks, msg, name){
			stacks = debug.stacks(stacks || new Error);
			var text = msg === false ? [] : ['['+(name || 'Tea error stack')+']'+(msg && '\n'+msg || '')];
			for (var i=0, stack; i < stacks.length; i++){
				stack = stacks[i];
				if (typeof stacks[i] == 'string'){
					text.push(stacks[i]);
				}else {
					text.push(" · "+(stack.code)+" <-> File \""+(stack.fileName)+"\", <->line "+(stack.lineNumber));
				}
			}
			text = text.join('\n');
			return print.toText(text);
		};
		debug.__defineGetter__('level', function(){return debug_lv});
		function parseDebugConf(part){
			var e = debug_lv;
			if (typeof part == 'number'){
				e = part;
			}else if (part){
				for (var i_ref = part.replace(/\W+/g, ' ').trim().split(' '), i=0, name; i < i_ref.length; i++){
					name = i_ref[i];
					if (debug.eventMap[name]){
						e += debug.eventMap[name];
					}
				}
			}
			return e;
		}
	});Module.register('/Users/wl/Sites/TeaJS/src/tools/printer.tea', '../src/tools/printer.tea', function(exports, require, module, __filename, __dirname){
		require("../src/tools/utils.tea");
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
	});Module.register('/Users/wl/Sites/TeaJS/src/error.tea', '../src/error.tea', function(exports, require, module, __filename, __dirname){
		var helper = require("../src/tools/helper.tea");
		var TeaError = (function(){
			var err_code = {101 : 'Array expression miss right "]" token!',
					102 : 'Json expression miss right "}" token!',
					103 : 'Compel expression miss right ")" token!',
					104 : 'member expression miss right "]" token',
					105 : 'params expression miss right ")" token',
					106 : 'switch expression miss right "}" token',
					107 : 'for expression miss right "}" token',
					108 : 'for expression miss right expression',
					109 : 'export expression right expression syntax error',
					110 : 'block statement miss right "}" token',
					201 : 'unexpected dot expression',
					202 : 'unexpected params expression',
					203 : 'unexpected json expression assign',
					204 : 'unexpected assignment declaration expression',
					208 : 'unexpected assignment expression',
					205 : 'unexpected comma expression',
					206 : 'unexpected selete right pattern expression',
					207 : 'unexpected selete left pattern expression',
					208 : 'unexpected control Clauses',
					209 : 'unexpected token ILLEGAL',
					210 : 'unexpected break expression',
					211 : 'unexpected continue expression',
					212 : 'unexpected token ILLEGAL',
					213 : 'unexpected for condition expression left token',
					214 : 'unexpected compel expression',
					215 : 'unexpected expression',
					301 : 'getter or setter statement syntax error',
					302 : 'method statement syntax error',
					303 : 'if statement syntax error',
					304 : 'while statement syntax error',
					305 : 'with statement syntax error',
					306 : 'do while statement syntax error',
					307 : 'try while statement syntax error',
					308 : 'switch while statement syntax error',
					309 : 'for statement syntax error',
					311 : 'condition statement syntax error',
					312 : 'switch case or default statement syntax error',
					313 : 'case or default expression syntax error',
					314 : 'extends expression syntax error',
					315 : 'array pattern assignment declaration syntax error',
					316 : 'var declaration statement syntax error',
					317 : 'let declaration statement syntax error',
					318 : 'const declaration statement syntax error',
					319 : 'arguments statement syntax error',
					320 : 'indent illegal',
					321 : 'class declaration statement syntax error! miss name',
					322 : 'get declaration statement illegal',
					323 : 'set declaration statement illegal',
					324 : 'static declaration statement illegal',
					325 : '*proto declaration statement illegal',
					326 : '*init declaration statement illegal',
					402 : 'block statement illegal',
					401 : 'const declaration not supported',
					403 : 'yield declaration not supported',
					501 : 'define token statement illegal'};
			function TeaError(err, msg, target, name, err_shift){
				var sub, stacks;
				if (msg instanceof Error){
					err = msg, msg = target, target = name, name = err_shift, err_shift = arguments[5];
				}
				if (!(err instanceof Error)){
					name = target, target = msg, msg = err, err = new Error(), err_shift = 2;
				}
				if (err.type == 'TeaError'){
					sub = err, err = new Error(), err_shift = 2;
				}
				if (typeof msg == 'object'){
					err_shift = name, name = target, target = msg, msg = '';
				}
				stacks = debug.stacks(err, err_shift);
				name = '['+(name && name[0].toUpperCase()+name.substr(1) || 'Tea error')+']';
				if (typeof msg == 'number') msg = err_code[msg];
				msg = msg ? msg[0].toUpperCase()+msg.substr(1) : stacks.message;
				var error = new Error(msg);
				error.type = 'TeaError';
				error.name = print.toText(name);
				error.target = target;
				error.stacks = stacks;
				error.__defineGetter__('text', toString);
				error.__defineGetter__('stack', printError);
				if (sub){
					sub.top = error;
					return sub;
				}
				return error;
			}
			TeaError.code = err_code;
			function toString(){
				var texts = [], stacks = [];
				texts.push(this.name);
				stacks.push(debug.stacksToText(this.stacks));
				if (this.target){
					var bug_pot = helper.errorPot(this.target);
					texts.push(('\n'+bug_pot+'\n->  '+this.message+'\n').replace(/^/mg, '\t'));
				}else {
					texts.push(this.message);
				}
				var top = this.top, top_texts = [];
				while (top){
					top_texts.push('   '+top.name);
					if (top.target){
						var bug_pot = helper.errorPot(top.target);
						top_texts.push((bug_pot+'\n->  '+top.message).replace(/^/mg, '\t'));
					}else {
						top_texts.push(top.message);
					}
					texts.push(top_texts.join('\n'));
					stacks.push(debug.stacksToText(top.stacks, false));
					top = top.top;
				}
				texts.push('----', stacks.join('\n'));
				return texts.join('\n');
			}
			function printError(){
				print(this.text);
				process.exit(1);
			}
			return TeaError;
		})();
		module.exports = TeaError;
	});Module.register('/Users/wl/Sites/TeaJS/src/preprocess/index.tea', '../src/preprocess/index.tea', function(exports, require, module, __filename, __dirname){
		var Context = require("../src/preprocess/context.tea");
		function context(argv, extend){
			return new Context(argv, extend);
		};
		function setDefault(){
			Context.defaultProcessor.apply(Context, arguments);
		};
		module.exports.context = context;
		module.exports.setDefault = setDefault;
	});Module.register('/Users/wl/Sites/TeaJS/src/preprocess/context.tea', '../src/preprocess/context.tea', function(exports, require, module, __filename, __dirname){
		var Context = (function(){
			var Processor = require("../src/preprocess/processor.tea");
			var Macro = require("../src/preprocess/macro.tea");
			var Sugar = require("../src/preprocess/sugar.tea");
			var DefPor, Syntax, Require, ReWriter;
			function Context(argv, extend){
				if (!Syntax) Syntax = require("../src/syntax/index.tea");
				if (!Require) Require = require("../src/preprocess/require.tea");
				if (!ReWriter) ReWriter = require("../src/rewriter/index.tea");
				this.macro = {"map": []};
				this.macrofun = {"map": []};
				this.statement = {"map": []};
				this.expression = {"map": []};
				this.argv = argv || {};
				this.processor = new Processor(this);
				if (DefPor){
					this.extends(DefPor);
				}
				if (extend){
					this.extends(extend);
				}
			}
			Context.prototype.__defineGetter__("length", function(){
				return this.macro.map.length+this.macrofun.map.length+this.statement.map.length+this.expression.map.length;
			});
			Context.prototype.__defineGetter__("source", function(){
				if (!this._source){
					if (this.argv.source){
						this._source = this.argv.source;
					}else if (this.argv.text || this.argv.file){
						this._source = this.parse(this.argv.text, this.argv.file);
					}
				}
				return this._source;
			});
			Context.prototype.__defineGetter__("fileName", function(){
				return this.source.fileName;
			});
			Context.prototype.__defineGetter__("sourceText", function(){
				return this.source.source;
			});
			Context.prototype.__defineGetter__("ast", function(){
				if (!this._ast){
					this._ast = Syntax.parse(this.source, this);
				}
				return this._ast;
			});
			Context.prototype.__defineGetter__("scope", function(){
				return this.ast.scope;
			});
			Context.prototype.__defineGetter__("rewriter", function(){
				if (!this._rewriter){
					this._rewriter = ReWriter.read(this.ast, this);
				}
				return this._rewriter;
			});
			Context.prototype.__defineGetter__("text", function(){
				return this.rewriter.text;
			});
			Context.prototype.__defineGetter__("sourcemap", function(){
				var map;
				map = ReWriter.sourceMap();
				map.file = this.argv.out || '';
				map.sourceRoot = this.fileName;
				map.parse(this.rewriter, this.source);
				return map;
			});
			Context.prototype.__defineGetter__("requires", function(){
				if (!this._rewriter){
					this._rewriter = ReWriter.read(this.ast, this);
				}
				return this.scope.requires;
			});
			Context.prototype.parse = function (text, file){
				return Syntax.source(text, file, this);
			}
			Context.prototype.clone = function (argv, extend){
				var ctx;
				ctx = new Context(argv, extend);
				ctx.extend(this);
				return ctx;
			}
			Context.prototype.undef = function (name){
				var i;
				for (var _i_ref = ['macrofun', 'macro', 'statement', 'expression'], _i=0, type; _i < _i_ref.length; _i++){
					type = _i_ref[_i];
					if ((i = this[type].map.indexOf(name)) >= 0){
						this[type].map.splice(i, 1);
						delete this[type][name];
					}
				}
			}
			Context.prototype.add = function (something){
				if (typeof something == 'string'){
					if (something == 'expression' || something == 'statement'){
						something = new Sugar(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], this);
					}else {
						something = new Macro(arguments[0], arguments[1], arguments[2], this);
					}
				}
				var key = something.name, type = something.type;
				this[type][key] = something;
				if (this[type].map.indexOf(key) == -1){
					this[type].map.push(key);
				}
				return something;
			}
			Context.prototype.get = function (key){
				if (!(this.length)) return;
				var limits = arguments.length > 1 ? Hash.slice(arguments, 1) : ['macrofun', 'macro', 'statement', 'expression'];
				for (var _i=0, type; _i < limits.length; _i++){
					type = limits[_i];
					if (this[type].map.indexOf(key) != -1){
						return this[type][key];
					}
				}
			}
			Context.prototype.extends = function (extend){
				for (var _i_ref = ['macrofun', 'macro', 'statement', 'expression'], _i=0, type; _i < _i_ref.length; _i++){
					type = _i_ref[_i];
					for (var _j=0, key; _j < extend[type].map.length; _j++){
						key = extend[type].map[_j];
						this.add(extend[type][key]);
					}
				}
			}
			Context.prototype.reinit = function (){
				this._source = null;
				this._ast = null;
				this._rewriter = null;
			}
			Context.prototype.echo = function (output, outmap){
				var requires, text, sourcemap;
				if (!output) output = this.argv && this.argv.out;
				if (this.requires.length){
					requires = Require.load(this.requires);
					Require.join(requires, this.rewriter);
				}
				text = this.rewriter.text;
				if (output){
					if (outmap){
						sourcemap = this.sourcemap;
						if (!(typeof outmap == 'string')){
							outmap = output.replace(/\.\w+$/, '.map');
						}
						Text.writeFile(sourcemap.text, outmap);
						text += '\n//# sourceMappingURL='+Path.relative(Path.dirname(output), outmap);
					}
					Text.writeFile(text, output);
				}
				return text;
			}
			Context.defaultProcessor = function(){
				if (!DefPor) DefPor = new Context();
				for (var i=0, item; i < arguments.length; i++){
					item = arguments[i];
					if (item){
						DefPor.extends(typeof item == 'string' ? Context.parseByFile(item) : item);
					}
				}
			};
			Context.parseByFile = function(file, ctx){
				if (ctx == null) ctx = new Context();
				ctx.parse(file);
				return ctx;
			};
			function loadRequiresList(list, cache){
				for (var file in list){
					if (!list.hasOwnProperty(file)) continue;
					var key = list[file];
					if (file == 'length' || cache.hasOwnProperty(file)){
						continue;
					}
					if (debug.log){
						debug.log('** require file: '+file);
					}
					var ctx = new Context({"file": file});
					cache[file] = [key, ctx, ctx.rewriter];
					if (ctx.requires.length){
						loadRequiresList(ctx.requires, cache);
					}
				}
				return cache;
			}
			return Context;
		})();
		module.exports = Context;
	});Module.register('/Users/wl/Sites/TeaJS/src/preprocess/processor.tea', '../src/preprocess/processor.tea', function(exports, require, module, __filename, __dirname){
		var Processor = (function(){
			var include_cache = {}, Template = require("../src/preprocess/template.tea");
			function Processor(ctx){
				this.context = ctx;
			}
			Processor.prototype.string = function (src, text, i, token){
				return Processor.string(this.context, src, text, i, token);
			}
			Processor.prototype.comm = function (src, text, i, token){
				return Processor.comm(this.context, src, text, i, token);
			}
			Processor.prototype.regexp = function (src, text, i, token){
				return Processor.regexp(this.context, src, text, i, token);
			}
			Processor.prototype.pound = function (src, text, i, token, control_cache){
				return Processor.pound(this.context, src, text, i, token, control_cache);
			}
			Processor.prototype.macro = function (src, text, i, token){
				return Processor.macro(this.context, src, text, i, token);
			}
			Processor.prototype.matchNode = function (type, src, opt){
				var exp;
				if (!(this.context[type])) return;
				var map = this.context[type].map, _index = src.index;
				for (var i=0, name; i < map.length; i++){
					name = map[i];
					src.index = _index;
					if (exp = this.context[type][name].parse(src, opt)){
						if (debug.prep){
							debug.prep('[Prep '+type+': '+name+' matched]', src[_index]);
						}
						return exp;
					}
				}
			}
			Processor.string = function(ctx, src, text, i, token){
				var b, str, re, m, val;
				if ((b = indexRight(text, i, token.text)) === false){
					throw tea.error(new Error(), 'tokenize string pattern error! miss right token', token);
				}
				str = text.slice(i, b+1);
				re = /([^\\]|^)(\#\{((\w+)(.*?))\})/g;
				while (m = re.exec(str)){
					val = parseMacro(ctx, null, m[3], 0, null, m[4]);
					str = str.slice(0, m.index+1)+(val || '')+str.substr(m.index+m[0].length);
					re.lastIndex = m.index+1;
				}
				str = Template.string(str);
				token.text = str;
				token.types = ['StringTokn', 'ConstTokn'];
				token.location.end = b;
				return token;
			};
			Processor.regexp = function(ctx, src, text, i, token){
				var b, match;
				if (!testValue(src, src.prevIndex(src.length, true))){
					if ((b = indexRight(text, i, '/', '/')) === false){
						throw tea.error(new Error(), 'tokenize regexp pattern error! miss right token', token);
					}
					if (match = text.substr(b+1).match(/^[gimy]+/)){
						b = b+match[0].length;
					}
					token.text = Template.regexp(text.slice(i, b+1));
					token.types = ['RegExpDecl', 'ConstTokn'];
					token.location.end = b;
				}
				return token;
			};
			Processor.comm = function(ctx, src, text, i, token){
				var b;
				switch (token.text){
					case '/*':
						if ((b = indexRight(text, i, '/*', '*/')) === false){
							throw tea.error(new Error(), 'tokenize comment pattern error! miss right token', token);
						}
						token.types = ['CommDecl', 'MultiLineComm'];
						break;
					case '//':
						token.types = ['CommDecl', 'LineComm'];
						break;
					case '#!':
						token.types = ['CommDecl', 'ShellComm'];
						break;
				}
				if (!b){
					if ((b = text.indexOf('\n', i)) == -1){
						b = text.length;
					}
					b -= 1;
				}
				token.text = text.slice(i, b+1);
				token.location.end = b;
				return token;
			};
			Processor.pound = function(ctx, src, text, i, token, cache){
				var match, type;
				if (match = text.substr(i+1).match(/^([\$A-Za-z_][\w\$]*)(\:?)/)){
					type = match[1];
					if (Processor.hasOwnProperty(type)){
						token = Processor[type](ctx, src, text, i, token);
					}else if (/^(elifdef|elif|ifdef|else|endif|if)$/.test(type)){
						token = Processor.control(ctx, src, text, i, token, type, cache);
					}else if (type == 'end'){
						token = text.indexOf('\n', i);
					}else {
						token.text = '#'+match[0];
						token.types = ['InstructionExpr', 'ConstTokn'];
						token.location.end = i+match[0].length;
						token = parseMacro(ctx, src, text, i, token, match[0], token.location.end);
					}
				}
				return token;
			};
			Processor.token = function(ctx, src, text, i, token){
				var m;
				if (m = text.substr(i).match(/^#token (\w+(?:\s*,\s*\w+)*) (.*)$/m)){
					var types = Text.split(m[1], ',', true), symbols = Text.split(m[2], ',', true);
					tea.defineToken(types, symbols);
					if (debug.prep){
						debug.prep('[Prep define token: g{"'+symbols.join('","')+'"}]', token);
					}
					return i+m[0].length;
				}else {
					throw tea.error(new Error(), 'define token syntax error!', token);
				}
			};
			Processor.line = function(ctx, src, text, i, token){
				token.text = token.location.lineNumber+'';
				token.types = ['NumTokn', 'ConstTokn'];
				if (token.indent >= 0){
					token.types.push('LineHead');
				}
				token.location.end = i+4;
				return token;
			};
			Processor.argv = function(ctx, src, text, i, token){
				var m, arg;
				if (!(m = text.substr(i).match(/^#argv (.*$)/m))){
					throw tea.error(new Error(), 'define argv syntax error!', token);
				}
				var args = Text.split(m[1], ' ', true);
				for (var _i=0, item; _i < args.length; _i++){
					item = args[_i];
					if (!item){
						continue;
					}
					if (arg = item.match(/\s*((-{0,2})[\w\-]+)(?:\s*=\s*(.*))?/)){
						tea.argv[arg[1]] = evalValue(arg[3]);
						if (debug.prep){
							debug.prep('[Prep set argv: g{'+arg[1]+' == '+tea.argv[arg[1]]+'}]', token);
						}
					}
				}
				return i+m[0].length;
			};
			Processor.run = function(ctx, src, text, i, token){
				var abcd, b, res;
				if (!(abcd = indexInstruction(text, i))){
					throw tea.error(new Error(), 'define run script syntax error', token);
				}
				b = abcd[3];
				try {
					if (res = Template.run(text.slice(i+4, b-3), ['source', 'index', 'argv'], [src, i, tea.argv], ctx)){
						src.parse(res, null, ctx);
						if (debug.prep){
							debug.prep('[Prep run instruction]', token);
						}
					}
				}catch (e) {
					var err_pot = tea.helper.errorPot(token);
					err_pot = err_pot.replace(/[^\n]*$/g, '')+text.slice(i+4, b-3).replace(/^/mg, err_pot.match(/"(\s*\d+\s*\|)/)[1]+'\t')+'\n"';
					throw tea.error(new Error(), e, 'Prep run eval error: '+e.message, err_pot);
				}
				return b+1;
			};
			Processor.define = function(ctx, src, text, i, token){
				var m, name, params, body;
				if (!(m = text.substr(i).match(/^#define +(\w+)(\(.*?\))? *(\s*""""[\w\W]*?""""|(?:.*\\\n)*.*)/))){
					throw tea.error(new Error(), 'define macro syntax error!', token);
				}
				name = m[1], params = m[2] && (m[2].slice(1, -1).trim() || []), body = m[3] && Text.trimIndent(m[3].replace(/\\\n/g, '\n').replace(/^\s*""""|""""\s*$/g, ''));
				if (body && /#(?:if|argv)/.test(body)){
					body = ctx.parse(body).join();
				}
				var macro = ctx.add(name, params, body);
				if (macro.error){
					throw tea.error(new Error(), macro.error, token);
				}
				if (debug.prep){
					debug.prep('[Prep define: g{'+name+(m[2] || '')+'}]', token);
				}
				return i+m[0].length;
			};
			Processor.undef = function(ctx, src, text, i, token){
				var m;
				if (!(m = text.substr(i).match(/^#undef (.+)$/m))){
					throw tea.error(new Error(), 'undefine syntax error!', token);
				}
				var names = m[1].trim().replace(/\s+/g, ' ').split(' ');
				for (var _i=0, name; _i < names.length; _i++){
					name = names[_i];
					ctx.undef(name);
				}
				if (debug.prep){
					debug.prep('[Prep undef: g{'+names.join(', ')+'}]', token);
				}
				return i+m[0].length;
			};
			Processor.include = function(ctx, src, text, i, token){
				var m, file_list, file_dir, files, temp;
				if (!(m = text.substr(i).match(/^#include +((?:[^\,\;\s\\]+(?:\\\ )*)+(?:\s*,\s*(?:[^\,\;\s\\]+(?:\\\ )*)+)*)\;*/))){
					throw tea.error(new Error(), 'include syntax error!', token);
				}
				file_list = m[1].replace(/\s*,\s*/g, ',').replace(/\s*;+/g, '').trim().split(','), file_dir = Path.dirname(token.fileName || src.fileName);
				files = [];
				for (var f=0; f < file_list.length; f++){
					temp = Path.parseFile(file_list[f], file_dir);
					if (temp.error){
						throw tea.error(new Error(), 'Can not find file: '+file_list[f]+' in "'+file_dir+'" dir', token);
					}
					for (var _i=0, file; _i < temp.length; _i++){
						file = temp[_i];
						if (!include_cache[file]){
							include_cache[file] = ctx.parse(null, file);
							include_cache[file].trimIndent();
						}
						if (include_cache[file].length){
							src.insert(token.clone('/* Include file "'+file+'" */\n', ['CommDecl']));
							src.insert(include_cache[file].clone());
							if (debug.prep){
								debug.prep('[Prep include: file at g{"'+file+'"}]', token);
							}
						}
					}
				}
				return i+m[0].length;
			};
			Processor.test = function(ctx, src, text, i, token){
				var b, m;
				if (!(b = indexRight(text, i, '#test', '#end'))){
					b = text.length;
				}
				text = text.slice(i, b-3);
				if (!(m = text.match(/#test(.*)\n/))){
					throw tea.error(new Error(), 'define test block syntax error', token);
				}
				text = text.substr(m[0].length);
				if (m[1] && m[1].trim() == 'run'){
					tea.argv['--test'] = true;
				}
				token.text = '/* Test: */\n'+tea.compile(text, ctx)+'\n/* Test end */';
				token.types = ['TestPatt', 'CommDecl'];
				src.add(token);
				return b+1;
			};
			Processor.expr = function(ctx, src, text, i, token){
				var m, type, name, pattern, writer;
				if (!(m = text.substr(i).match(/#(expr|stat) +([A-Z][\w]+(?:Tokn|Patt|Decl|Expr|Stam)) +[\/\`]((?:[^\/\`]|\\\/|\\\`)+)[\/\`] *(\s*""""[\w\W]*?""""|(?:.*\\\n)*.+)/))){
					throw tea.error(new Error(), 'define syntactic sugar syntax error', token);
				}
				type = m[1] == 'expr' ? 'expression' : 'statement';
				name = m[2];
				pattern = m[3];
				writer = Text.trimIndent(m[4].replace(/\\\n/g, '\n').replace(/^\s*""""|""""\s*$/g, ''));
				var ss = ctx.add(type, name, pattern, writer);
				if (ss.error){
					throw tea.error(new Error(), ss.error, token);
				}
				if (debug.prep){
					debug.prep('[Prep register '+type+': '+name+' -> /'+pattern+'/]', token);
				}
				return i+m[0].length;
			};
			Processor.control = function(ctx, src, text, i, token, type, cache){
				var blocks, status, data;
				if (type == 'if' || type == 'ifdef'){
					if (!(blocks = indexControl(text, i))){
						throw tea.error(new Error(), 'define control preprocess syntax error', token);
					}
					status = false;
					for (var _i=0, item; _i < blocks.length; _i++){
						item = blocks[_i];
						if (status){
							item[1] = false;
						}else {
							item[1] = status = evalCondition(ctx, item[0], item[1], src, token);
						}
						cache[item[2]] = item;
					}
				}
				if (!(data = cache[i])){
					throw tea.error(new Error(), 'unexpected #'+type+' ctx instruction', token);
				}
				if (data[1]){
					return data[4]+1;
				}else {
					return data[5]+1;
				}
			};
			Processor.macro = function(ctx, src, text, i, token){
				if (testIdExpr(src, src.length)){
					return parseMacro(ctx, src, text, i, token, token.text);
				}
				return token;
			};
			Processor.stam = Processor.expr;
			function parseMacro(ctx, src, text, i, token, name, b){
				if (b == null) b = i+name.length-1;
				var macro, params, ab, val_src;
				if (macro = ctx.get(name, 'macrofun')){
					params = text.substr(b+1);
					if (/^\s*\(/g.test(params) && (ab = Text.indexPair(params, 0, '(', ')'))){
						b += ab[1]+1;
						params = params.slice(ab[0]+1, ab[1]);
					}else if (/^\ +[^\n\;\}\]\)\,]/.test(params)){
						ab = Text.indexBreak(params, 0);
						b += ab+1;
						params = params.slice(0, ab+1);
					}else {
						params = '';
					}
				}
				if (!macro || !params){
					macro = ctx.get(name, 'macro');
				}
				if (macro){
					val_src = macro.getValue(params, true);
					if (src){
						src.insert(val_src);
						if (debug.prep){
							debug.prep('[Prep macro matched: '+name+']', token);
						}
					}else {
						return val_src.join();
					}
					return b+1;
				}
				return token;
			}
			function indexInstruction(text, i){
				var m, a, a_, b, type, label, b_, abcd;
				if (m = text.substr(i).match(/^#(\w+)(\:?)/)){
					a = i, a_ = i+m[0].length-1;
					b = i+m[0].length-1;
					type = m[1];
					label = !!m[2];
					var t = 10;
					while (t--){
						if (!(m = text.substr(b+1).match(/#(\w+)(\:?)/))){
							b = text.length, b_ = b;
							break;
						}else {
							if (m[1] == 'end' || m[1] == 'end'+type || m[1] == 'endif' && /^(ifdef|if|elifdef|elif|else)$/.test(type)){
								b = b+1+m.index, b_ = b+m[0].length-1;
								break;
							}else if (label && m[2] || /^(elifdef|elif|else)$/.test(m[1])){
								b_ = b = b+m.index;
								break;
							}
							b = b+m.index;
							if (/^(ifdef|if)$/.test(m[1])){
								if (!(b = indexControl(text, b+1, 'end'))){
									return;
								}
							}else if (/^(run|test)$/.test(m[1]) || m[2] == ':'){
								if (!(abcd = indexInstruction(text, b+1))){
									return;
								}
								b = abcd[3];
							}
						}
					}
					return [a, b, a_, b_];
				}else {
					throw tea.error(new Error(), 'not find instruction');
				}
			}
			function indexControl(text, i, only_index){
				var re, cache, abcd, a, b, _a, _b, m;
				re = /^#(ifdef|if)\b/;
				cache = [];
				while (re.test(text.substr(i))){
					if (!(abcd = indexInstruction(text, i))){
						return;
					}
					a = abcd[0], b = abcd[1], _a = abcd[2], _b = abcd[3];
					if (only_index){
						cache.push([a, b, _a, _b]);
					}else {
						m = text.substr(_a+1).match(/.*$/m);
						cache.push([text.slice(a+1, _a+1), m[0], a, b, _a+m[0].length, _b]);
					}
					re = /^#(elifdef|elif|else)\b/;
					i = _b+1;
				}
				if (!only_index){
					var last = cache[cache.length-1];
					if (m = text.substr(last[3]).match(/^#(endif|end).*$/m)){
						cache.push(['endif', '', last[3], last[3], last[5], last[3]+m[0].length-1]);
					}
				}
				if (only_index == 'end'){
					return cache[cache.length-1][3];
				}
				return cache;
			}
			function indexRight(text, index, s1, s2){
				if (s2 == null) s2 = s1;
				var a_b = Text.indexPair(text, index, s1, s2, true);
				return !a_b || a_b[0] !== index ? false : a_b[1]+s2.length-1;
			}
			function testValue(src, index){
				var token;
				if (token = src[index]){
					if (token.is('ConstTokn', 'Close', 'Postfix')){
						return true;
					}
					if (token.is('IdentifierTokn')){
						if (!token.is('Binary', 'Unary')){
							return true;
						}
					}else if (token.is('Keyword')){
						if (token.is('Restricted')){
							return false;
						}
					}else {
						return false;
					}
					token = src[src.prevIndex(index, true)];
					if (token && token.is('Member')){
						return true;
					}
				}
				return false;
			}
			function testIdExpr(src, index){
				var last;
				last = src[src.prevIndex(index, true)];
				if (last && last.eq('.', '::', '..', 'function', 'set', 'get', 'static')){
					return false;
				}
				return true;
			}
			function evalValue(val){
				if (val == 'false' || val == 'null'){
					return false;
				}else if (val){
					try {
						return eval(val);
					}catch (e) {
						return '"'+val+'"';
					}
				}
				return true;
			}
			function evalCondition(ctx, type, condition, src, token){
				var isdef, root_file, the_file, exp;
				isdef = type.indexOf('def') != -1, root_file = tea.argv.file, the_file = token.fileName || src.fileName, exp = condition.trim().replace(/\:$/, '').replace(/((-{0,2})([\$a-zA-Z_][\w]*)\b)/g, function($0, $1, $2, $3){
					var res;
					if ($2){
						if ($3 == 'main'){
							return root_file == the_file;
						}
						if ($3 == 'root'){
							return '"'+root_file+'"';
						}
						if ($3 == 'file'){
							return '"'+the_file+'"';
						}
						res = tea.argv[$1];
					}else if (isdef){
						return !!ctx.get($1)+'';
					}else {
						if (global.hasOwnProperty($1)){
							res = global[$1];
						}else if (tea.argv.hasOwnProperty($1)){
							res = tea.argv[$1];
						}else {
							return $1;
						}
					}
					return typeof res == 'string' ? '"'+res.replace(/\"/g, '\"')+'"' : res;
				});
				try {
					return exp && eval('!!('+exp+')') || type == 'else';
				}catch (e) {
					throw tea.error(new Error(), e, '[ProProcess condition '+type+' "'+condition+'" -> "'+exp+'" error', token, 'ProProcess condition error!');
				}
			}
			module.exports = Processor;
			return Processor;
		})();
	});Module.register('/Users/wl/Sites/TeaJS/src/preprocess/template.tea', '../src/preprocess/template.tea', function(exports, require, module, __filename, __dirname){
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
					str = str.replace(/([^\\])'/g, "$1\'");
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
	});Module.register('/Users/wl/Sites/TeaJS/src/preprocess/macro.tea', '../src/preprocess/macro.tea', function(exports, require, module, __filename, __dirname){
		var Macro = (function(){
			var Template = require("../src/preprocess/template.tea");
			function Macro(name, params, body, parent){
				this.name = name;
				this.type = params ? 'macrofun' : 'macro';
				if (params){
					if (typeof params == 'string'){
						this.params = Text.split(params, ',', true);
					}else {
						this.params = params;
					}
				}else {
					this.params = [];
				}
				this.body = body;
				this.parent = parent;
				if (Template.test(body)){
					try {
						this.script = Template.func(body, params, true);
					}catch (e) {
						this.error = e;
					}
				}
			}
			Macro.prototype.getValue = function (params, ret_src){
				var value, val_src;
				if (typeof params == 'string'){
					params = Text.split(params.replace(/^\((.*)\)$/g, '$1'), ',', 'trim');
				}
				if (this.script){
					value = this.script.apply(this.parent, params || []);
				}else {
					value = this.body;
				}
				value = replaceParam(value, this.params, params || []);
				value = Text.trimIndent(value);
				val_src = this.parent.parse(value);
				if (ret_src){
					return val_src;
				}
				return val_src.join();
			}
			function replaceParam(value, keys, params){
				var keys_join = keys.join('|'),
					re = new RegExp('(#*?)('+(keys_join ? '\\b(?:'+keys_join+')\\b|' : '')+'#(\\d+)|\\bARGR\\.\\.\\.)(##)?', 'g'),
					m,
					hash,
					unhash,
					key,
					num,
					arg,
					val,
					insert = [],
					id;
				while (m = re.exec(value)){
					hash = m[1], key = m[2], num = m[3], unhash = m[4];
					num = num || keys.indexOf(key);
					if (key == 'ARGR...'){
						val = params.slice(keys.length).join(', ');
					}else if (params[num]){
						val = params[num];
					}
					id = '$$$'+ID()+'$$$';
					insert.push([id, (val ? hash%2 ? '"'+val+'"' : val : '')]);
					value = value.slice(0, m.index)+id+value.substr(re.lastIndex);
					re.lastIndex = m.index+id.length;
				}
				for (var i=0; i < insert.length; i++){
					value = value.replace(insert[i][0], insert[i][1]);
				}
				return value;
			}
			module.exports = Macro;
			return Macro;
		})();
	});Module.register('/Users/wl/Sites/TeaJS/src/preprocess/sugar.tea', '../src/preprocess/sugar.tea', function(exports, require, module, __filename, __dirname){
		var Sugar = (function(){
			var Syntax = require("../src/syntax/index.tea");
			function Sugar(type, name, pattern, writer, parser){
				this.type = type;
				this.name = name;
				this.stxre = Syntax.regexp(pattern);
				this.parser = parser;
				this.writer = writer;
			}
			Sugar.prototype.parse = function (src, opt){
				var node = Syntax.matchNode(this.name, this.stxre, src, 'ret node');
				if (node && this.parser){
					return this.parser.call(this, node, src, opt);
				}
				return node;
			}
			Sugar.prototype.read = function (reader, node){
				var write = reader.new(this.name);
				if (typeof this.writer == 'string'){
					write.read(this.writer, node);
				}else {
					write = this.writer(node, write) || write;
				}
				return write;
			}
			module.exports = Sugar;
			return Sugar;
		})();
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/index.tea', '../src/syntax/index.tea', function(exports, require, module, __filename, __dirname){
		var token,
			location,
			source,
			regexp,
			match,
			matchNode,
			Node = require("../src/syntax/node.tea"),
			Scope = require("../src/syntax/scope.tea"),
			Parser = require("../src/syntax/parser.tea"),
			SyntaxReg = require("../src/syntax/regexp.tea");
		token = require("../src/syntax/token.tea");
		location = require("../src/syntax/location.tea");
		source = require("../src/syntax/source.tea");
		function parse(src, ctx){
			var ast = new Node('Root');
			ast.context = null;
			ast.source = src;
			ast.fileName = src.fileName;
			ast.filePath = Path.dirname(ast.fileName);
			src.index = 0;
			src.refresh();
			var old_por = src.context;
			if (ctx){
				src.context = ctx;
			}
			ast.add(Parser.Node(src));
			Scope.parse(ast);
			ast.context = src.context;
			src.context = old_por;
			return ast;
		};
		regexp = SyntaxReg.compile;
		match = function(stx_re, src, opt){
			if (typeof stx_re == 'string'){
				if (Parser.hasOwnProperty(stx_re)){
					return Parser[stx_re](src, opt);
				}
				stx_re = Syntax.regexp(stx_re);
			}
			return SyntaxReg.match(stx_re, src);
		};
		matchNode = SyntaxReg.matchNode;
		module.exports.token = token;
		module.exports.location = location;
		module.exports.source = source;
		module.exports.parse = parse;
		module.exports.regexp = regexp;
		module.exports.match = match;
		module.exports.matchNode = matchNode;
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/node.tea', '../src/syntax/node.tea', function(exports, require, module, __filename, __dirname){
		var NodeBase = require("../src/syntax/base.tea");
		var Node = (function(){
			function Node(type){
				this.type = type;
				this.length = 0;
				this.isnode = true;
				this._scope = null;
				if (arguments.length > 1){
					this.add.apply(this, Array.prototype.slice.call(arguments, 1));
				}
			}
			Node.prototype = new NodeBase();
			Node.prototype.constructor = Node;
			Node.prototype.__super__ = NodeBase.prototype;
			Node.prototype.__defineGetter__("text", function(){
				var tokens, texts;
				tokens = this.tokens;
				texts = [];
				for (var _i=0, tk; _i < tokens.length; _i++){
					tk = tokens[_i];
					texts.push(tk.text);
				}
				return texts.join('');
			});
			Node.prototype.add = function (){
				for (var i=0, node; i < arguments.length; i++){
					node = arguments[i];
					if (!node){
						continue;
					}
					if (node.isnode || node.istoken){
						node.parent = this;
						this[this.length++] = node;
					}else if (isArray(node)){
						this.add.apply(this, node);
					}else {
						throw tea.error(new Error(), 'Node can only add object of "Node" or "Code" and "NaN" types ! >> '+node);
					}
				}
				return this;
			}
			Node.prototype.tokens = function (index){
				var tokens = [];
				for (var i=0; i < this.length; i++){
					if (this[i].istoken){
						tokens.push(this[i]);
					}else {
						tokens.push.apply(tokens, this[i].tokens());
					}
					if (index === 0){
						return tokens[0];
					}
				}
				if (typeof index == 'number'){
					return tokens[index < 0 ? tokens.length+index : index];
				}
				return tokens;
			}
			Node.prototype.clone = function (){
				var node = new Node(this.type);
				for (var i=0; i < this.length; i++){
					node[node.length++] = this[i];
				}
				node.parent = this.parent;
				return node;
			}
			return Node;
		})();
		module.exports = Node;
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/base.tea', '../src/syntax/base.tea', function(exports, require, module, __filename, __dirname){
		var Scope = require("../src/syntax/scope.tea");
		var NodeBase = (function(){
			var nodemap = require("../src/syntax/map.tea").node;
			function NodeBase(){}
			NodeBase.prototype.__defineGetter__("root", function(){
				var root = this;
				while (root.parent){
					root = root.parent;
				}
				return root;
			});
			NodeBase.prototype.__defineGetter__("offsetParent", function(){
				var parent = this.parent;
				while (parent && (['ArgumentsDecl', 'NodeStam', 'CommaExpr'].indexOf(parent.type) != -1)){
					parent = parent.parent;
				}
				return parent;
			});
			NodeBase.prototype.__defineGetter__("scopeParent", function(){
				if (this.type == 'Root'){
					return this;
				}
				var parent = this.parent;
				while (parent && !parent.is('ScopeNode')){
					parent = parent.parent;
				}
				return parent;
			});
			NodeBase.prototype.__defineGetter__("parent", function(){
				return this._parent;
			});
			NodeBase.prototype.__defineSetter__("parent", function(parent){
				this._scope = null;
				return this._parent = parent;
			});
			NodeBase.prototype.__defineGetter__("nextSibling", function(){
				var index = this.index;
				if (index >= 0){
					return this.parent[index+1];
				}
			});
			NodeBase.prototype.__defineGetter__("prevSibling", function(){
				var index = this.index;
				if (index-1 >= 0){
					return this.parent[index-1];
				}
			});
			NodeBase.prototype.__defineGetter__("index", function(){
				return !this.parent ? -1 : Array.prototype.indexOf.call(this.parent, this);
			});
			NodeBase.prototype.__defineGetter__("scope", function(){
				if (!this._scope){
					if (this.parent){
						this._scope = this.parent.scope;
					}else {
						this._scope = new Scope(this);
					}
				}
				return this._scope;
			});
			NodeBase.prototype.__defineSetter__("scope", function(scope){
				return this._scope = scope;
			});
			NodeBase.prototype.__defineGetter__("offsetScope", function(){
				var scope = this.scope;
				if (scope.isLetScope){
					return scope.parent;
				}
				return scope;
			});
			NodeBase.prototype.queryParent = function (type){
				var p = this.parent;
				while (p && p.type != type){
					p = p.parent;
				}
				return p;
			}
			NodeBase.prototype.is = function (){
				var list, types;
				list = arguments.length > 1 ? arguments : arguments[0].split(' '), types = this.types || [this.type];
				for (var i=0; i < list.length; i++){
					if (types.indexOf(list[i]) != -1){
						return list[i];
					}else if (nodemap.test(types[0], list[i])){
						return list[i];
					}
				}
				return false;
			}
			NodeBase.prototype.eq = function (){
				var text, list;
				if (this.isnode){
					if (this.length == 1 && this[0].istoken){
						text = this[0].text;
					}else {
						return false;
					}
				}else {
					text = this.text;
				}
				list = arguments.length > 1 ? arguments : arguments[0].split(' ');
				for (var i=0; i < list.length; i++){
					if (list[i] == text){
						return text;
					}
				}
				return false;
			}
			return NodeBase;
		})();
		module.exports = NodeBase;
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/scope.tea', '../src/syntax/scope.tea', function(exports, require, module, __filename, __dirname){
		var Scope = (function(){
			var global_scope = new Scope();
			global_scope.type = 'Global';
			global_scope.top = null;
			function Scope(node){
				this.name = null;
				if (node && (node.isnode || node.istoken)){
					this.node = node;
					this.type = node.type;
					this.node.scope = this;
				}else {
					this.type = node || '?';
				}
				this.variables = {};
				this.lets = {};
				this.consts = [];
				this.exports = [];
				this.argumentsDefine = [];
				this.sub = [];
				switch (this.type){
					case 'ClassExpr':
						this.construct = null;
						this.inits = [];
						this.protos = [];
						this.statics = [];
						break;
					case 'Root':
						this.requires = {"length": 0};
						break;
				}
			}
			Scope.prototype.__defineGetter__("top", function(){
				if (!this._top_){
					var scopeParent = this.node && this.node.scopeParent;
					this._top_ = scopeParent && scopeParent.scope || global_scope;
				}
				return this._top_;
			});
			Scope.prototype.__defineSetter__("top", function(scope){
				scope.addSub(this);
				return this._top_ = scope;
			});
			Scope.prototype.__defineGetter__("parent", function(){
				var top = this.top;
				while (top.isLetScope){
					top = top.top;
				}
				return top;
			});
			Scope.prototype.__defineGetter__("root", function(){
				var rot = this;
				while (rot && rot.type != 'Root'){
					rot = rot.top;
				}
				return rot || global_scope;
			});
			Scope.prototype.queryParent = function (type){
				var p = this;
				while (p && p.type != type){
					if (p.type == 'Root' || p.type == 'Global'){
						return;
					}
					p = p.top;
				}
				return p;
			}
			Scope.prototype.addSub = function (scope){
				if (this.sub.indexOf(scope) == -1){
					this.sub.push(scope);
				}
				return this;
			}
			Scope.prototype.set = function (type, name, force){
				var names = typeof name == 'string' ? [name] : name;
				for (var i=0, name; i < names.length; i++){
					name = names[i];
					if (this.hasOwnProperty(type) && isArray(this[type])){
						if (this[type].indexOf(name) == -1){
							this[type].push(name);
						}
						return this;
					}
					var variables = this.variables;
					if (force || !(variables.hasOwnProperty(name))){
						variables[name] = type;
					}
				}
				return this;
			}
			Scope.prototype.get = function (type){
				var variables = this.variables, list = [];
				for (var name in variables){
					if (!variables.hasOwnProperty(name)) continue;
					if (variables[name] == type){
						list.push(name);
					}
				}
				return list;
			}
			Scope.prototype.setLet = function (name, rename){
				this.set('let', name);
				if (rename){
					this.lets[name] = rename;
				}
			}
			Scope.prototype.getLet = function (name){
				var scope = this.isDefined(name, 'let', 100, true);
				if (scope){
					return scope.lets[name] || name;
				}
			}
			Scope.prototype.isDefined = function (name, type, level, ret_scope){
				var variables, scope = this, _scope;
				if (!level) level = 100;
				while (scope && scope != _scope && level--){
					_scope = scope;
					variables = scope.variables;
					if (variables.hasOwnProperty(name)){
						type = type ? variables[name] == type : variables[name];
						if (ret_scope && type){
							return scope;
						}
						return type;
					}
					if (type == 'let' && !scope.isLetScope){
						break;
					}
					scope = scope.top;
				}
				return false;
			}
			Scope.prototype.create = function (node, let_type){
				var scope = new Scope(node);
				scope.top = this;
				if (let_type){
					scope.isLetScope = true;
				}
				return scope;
			}
			Scope.prototype.addRequire = function (file){
				if (!Path.isFile(file)){
					throw tea.error(new Error(), 'join the "'+file+'" file not exist');
				}
				if (this.requires.hasOwnProperty(file)){
					return this.requires[file];
				}
				var key = Path.join('./', Path.relative(tea.argv.outdir || '', file));
				this.requires[file] = key;
				this.requires.length++;
				return key;
			}
			Scope.parse = function(node, __scope, __let_scope){
				if (!__scope) __scope = node.scope || global_scope;
				switch (node.is('ScopeNode', 'ControlStam')){
					case 'ScopeNode':
						__scope = __scope.create(node);
						__let_scope = null;
						break;
					case 'ControlStam':
						__let_scope = (__let_scope || __scope).create(node, 'let');
						break;
					default:
						node.scope = __let_scope || __scope;
						break;
				}
				for (var i=0, item; i < node.length; i++){
					item = node[i];
					item.scope = __let_scope || __scope;
					if (item.type == 'IdentifierTokn'){
						checkIdentifier(node, item, __scope, __let_scope);
					}
					if (item.isnode){
						Scope.parse(item, __scope, __let_scope);
					}
				}
				return __scope;
			};
			function createScope(node, parent_scope){
				var scope = new Scope(node);
				scope.top = parent_scope;
				return scope;
			}
			function checkIdentifier(parent, id, scope, let_scope){
				var idexpr, ass_expr, argu_expr, arr_patt, expr, p = parent;
				do {
					if (p.type == 'IdentifierExpr'){
						idexpr = p;
						continue;
					}
					if (p.type == 'ArrayPatt'){
						arr_patt = p;
						continue;
					}
					if (p.type == 'AssignmentDecl' || p.type == 'AssignmentExpr'){
						ass_expr = p;
						continue;
					}
					if (p.type == 'ArgumentsDecl' || p.type == 'ArgumentsExpr'){
						argu_expr = p;
						continue;
					}
					if (p.type == 'CommaExpr' || p.type == 'CommaStam' || p.type == 'NodeStam'){
						continue;
					}
					expr = p;
					break;
				} while (p = p.parent);
				if (!idexpr){
					if (argu_expr){
						if (let_scope && let_scope.type == 'ForStam' && expr.type == 'VarDecl' && /ForPConditionPatt|ForInConditionPatt/.test(expr.parent.type)){
							checkArguments('LetDecl', ass_expr, id, scope, let_scope);
						}else {
							checkArguments(expr.type, ass_expr, id, scope, let_scope);
						}
					}else if (expr.is('FunctionDecl', 'GetterDecl', 'SetterDecl', 'MethodDecl', 'ClassExpr', 'ClassExpr')){
						checkFunctionName(parent, id, scope);
					}else if (ass_expr && arr_patt){
						checkIdentifierExpr(expr, ass_expr, arr_patt, id, scope, let_scope);
					}else if (/AtExpr/.test(parent.parent.type) && parent.index == 1){
						checkAt(parent.parent, id);
					}
				}else {
					checkIdentifierExpr(expr, ass_expr, idexpr, id, scope, let_scope);
				}
				return;
			}
			function checkAt(parent, id){
				var scope, top_scope;
				if (parent.length == 2 && parent.parent.type == 'AssignmentExpr'){
					scope = parent.offsetScope;
					if (scope.type == 'ClassExpr'){
						scope.set('statics', id.text);
						scope.set('static', id.text);
						return;
					}
					top_scope = scope.parent;
					if (top_scope.type == 'ClassExpr'){
						if (top_scope.protos.indexOf(scope.name) != -1){
							top_scope.set('protos', id.text);
							top_scope.set('proto', id.text, true);
						}else if (top_scope.statics.indexOf(scope.name) != -1){
							top_scope.set('statics', id.text);
							top_scope.set('static', id.text);
						}
					}
				}
			}
			function checkArguments(expr_type, ass_expr, id, scope, let_scope){
				var root;
				switch (expr_type){
					case 'LetDecl':
						if (let_scope){
							let_scope.set('let', id.text);
						}else {
							scope.set('let', id.text);
						}
						break;
					case 'ConstDecl':
						if (root = scope.root){
							root.set('undefined', id.text);
							root.set('consts', id.text);
						}
						scope.set('const', id.text);
						break;
					case 'VarDecl':
						scope.set('defined', id.text);
						break;
					case 'ExportDecl':
						if (!scope.isDefined(id.text)){
							scope.set('undefined', id.text);
						}
						scope.set('exports', id.text);
						break;
					case 'ProtoDecl':case 'InitDecl':
						scope.set('protos', id.text);
						scope.set('proto', id.text, true);
						break;
					case 'StaticDecl':
						scope.set('statics', id.text);
						scope.set('static', id.text);
						break;
					case 'FunctionExpr':case 'FunctionDecl':case 'GetterDecl':case 'SetterDecl':case 'MethodDecl':case 'LambdaExpr':
						scope.set('argument', id.text);
						if (ass_expr){
							scope.argumentsDefine.push(ass_expr.clone());
						}
						break;
				}
			}
			function checkFunctionName(parent, id, scope){
				var expr_type = parent.parent.type;
				if (expr_type == 'JsonExpr'){
					return;
				}
				var top_scope = scope.parent;
				if (expr_type == 'ExportDecl'){
					top_scope.set('exports', id.text);
				}
				switch (parent.type){
					case 'GetterDecl':
						top_scope.set('getter', id.text);
						break;
					case 'SetterDecl':
						top_scope.set('setter', id.text);
						break;
					case 'ClassExpr':
						top_scope.set('class', id.text);
						break;
					case 'FunctionDecl':
						top_scope.set('function', id.text);
						break;
					case 'MethodDecl':
						switch (expr_type){
							case 'StaticDecl':
								top_scope.set('statics', id.text);
								top_scope.set('static', id.text);
								break;
							case 'ProtoDecl':case 'ClassExpr':case 'InitDecl':
								top_scope.set('protos', id.text);
								top_scope.set('proto', id.text);
								break;
							default:
								if (top_scope.type == 'ClassExpr'){
									top_scope.set('protos', id.text);
									top_scope.set('proto', id.text);
								}else {
									top_scope.set('function', id.text);
								}
								break;
						}
						break;
					default:
						return;
				}
				scope.name = id.text;
			}
			function checkIdentifierExpr(expr, ass, idexpr, id, scope, let_scope){
				if (let_scope && let_scope.isDefined(id.text, 'let')){
					return;
				}
				var forstam = let_scope && let_scope.type == 'ForStam' && /ForPConditionPatt|ForInConditionPatt/.test(expr.type);
				if (ass && idexpr.index == 0){
					if (forstam && ass.parent.index == 0){
						let_scope.set('let', id.text);
					}else {
						if (scope.isDefined(id.text, null, 1) == 'unknow'){
							scope.set('modfiy', id.text, true);
						}else if (!/defined/.test(scope.isDefined(id.text))){
							scope.set('undefined', id.text);
						}
					}
				}else if (!scope.isDefined(id.text, null, 1)){
					if (forstam && idexpr.parent.index == 0){
						let_scope.set('let', id.text);
					}else {
						scope.set('unknow', id.text);
					}
				}
			}
			return Scope;
		})();
		module.exports = Scope;
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/map.tea', '../src/syntax/map.tea', function(exports, require, module, __filename, __dirname){
		var token,
			node,
			token_map = {'LF' : '\n',
				'BlankTokn' : '\r  \t  \f  \ ',
				'CommDecl' : '//  /*  */  #!',
				'SymbolTokn Instruction' : '#',
				'ConstTokn Boolean' : 'true  false',
				'ConstTokn Null' : 'null  undefined  Infinity',
				'Keyword' : 'this  instanceof  in  extends  null  undefined  Infinity  true  false  '+'if  while  with  catch  for  switch  case  default  else  try  do  finally  '+'new  typeof  delete  void  return  break  continue  throw  var  function  '+'let  enum  const  import  export  debugger  super  yield  class',
				'IdentifierTokn' : 'eval  arguments  extends  import  export  get  set  static  as  of  and  or  not  is  require  let  enum  const  debugger  super  yield  class',
				'Restricted' : 'instanceof  in  Infinity  '+'if  while  with  catch  for  switch  case  default  else  try  do  finally  '+'new  typeof  delete  void  return  break  continue  throw',
				'SymbolTokn' : ';  ,  .  :  ?  \\  [  ]  {  }  (  )  //  /*  */  #!  '+'=  +=  -=  *=  /=  %=  &=  >>=  <<=  >>>=  '+'>  <  >=  <=  !=  !==  ==  ===  ++  --  '+'!  ~  +  -  *  /  %  &  |  ^  >>  <<  >>>  &&  ||  '+'**  ::  |=  ?=  @  ->  <-  >>  <<  >>>  <<<  =>  <=  ..  ...',
				'SymbolTokn Quote' : '\'  "  """  \'\'\'  """"  \'\'\'\'  `',
				'Controler' : 'if  while  with  catch  for  switch  case  default  else  try  do  finally',
				'Declaration' : 'function  require  class  package  static  get  set  import  export',
				'Clauses' : 'let  enum  const  var  return  break  continue  throw  debugger',
				'Expression IdentifierTokn' : 'super  this  @',
				'ClassRestricted' : 'static  get  set  extends',
				'Unary' : 'new  typeof  yield  delete  void  not  !  ~  -  +  ++  --',
				'Prefix Postfix' : '++  --',
				'Binary Compute' : '+  -  *  /  %  &  |  ^  >>  <<  >>>  **  \\',
				'Binary Compare' : 'instanceof  in  of  as  extends  is  not is  >  <  >=  <=  !=  !==  ==  ===',
				'Binary Logic' : 'and  or  &&  ||',
				'Binary Assign' : '=  +=  -=  *=  /=  %=  &=  |=  >>=  <<=  >>>=  ?=  |=',
				'Ternary' : '?',
				'Member' : '.  ::  ..  [',
				'Comma' : ',',
				'Open' : '{  (  [',
				'Close' : '}  ]  )',
				'BlockBreakTokn BlockBreak' : ';  \n',
				'BlockStart' : ':  {',
				'Contextual' : 'Binary  Member  Comma  in  as  of  ->  <-  =>  <=  ...',
				'EndTokn' : 'BlockBreakTokn  Close  /*  //',
				'IGLF' : 'Unary  Binary  Ternary  Member  Assign  Comma  Open  Contextual'},
			node_map = {'Token' : 'ConstTokn IdentifierTokn NumTokn StringTokn RegexpTokn SymbolTokn TmlTokn BlockBreakTokn',
				'DataPatt' : 'Token ArrayExpr JsonExpr UnaryExpr IdentifierExpr PrefixExpr PostfixExpr NotExpr',
				'AccessorExpr' : 'DataPatt CompelExpr',
				'ValueExpr' : 'AccessorExpr CallExpr',
				'LogicExpr' : 'CompareExpr ComputeExpr ValueExpr',
				'BinaryExpr' : 'LogicExpr',
				'FunctionExpr' : 'FunctionDecl ClassExpr GetterDecl SetterDecl MethodDecl PackageExpr LambdaExpr',
				'ExprStam' : 'SuperExpr ThisExpr AtExpr TernaryExpr Ternary2.5Expr BinaryExpr FunctionExpr RequireStam CommDecl ImportExpr ExtendsExpr',
				'ClausesStam' : 'LetDecl ConstDecl VarDecl ReturnStam BreakStam ContinueStam ThrowStam DebuggerStam ExportDecl',
				'ControlStam' : 'IfPatt ElseIfPatt ElsePatt WhileStam DoWhileStam WithStam ForStam SwitchStam CaseStam DefaultStam TryPatt CatchPatt FinallyPatt',
				'ConditionPatt' : 'ForPConditionPatt ForPConditionPatt ForPConditionPatt',
				'BlockStam' : 'LineBlockStam IndentBlockStam StamBlockStam',
				'StatementStam' : 'ControlStam ClausesStam AssignmentExpr CommaExpr SeleteStam BlockStam ExprStam',
				'NodeStam' : 'BlockStam',
				'ScopeNode' : 'Root FunctionExpr',
				'IgSemicolon' : 'LabelStam IfStam ElseIfStam ElseStam WhileStam WithStam ForStam WitchStam TryStam CatchStam FinallyStam FunctionExpr GetterDecl SetterDecl ClassExpr MethodDecl ExportDecl StaticDecl PackageExpr CommDecl BlockBreakTokn'};
		token = {"types": {},
			"literals": {},
			"complexs": [],
			"complexre": null,
			"define": function(types, literals){
				var literal_re, tmp;
				if (arguments.length == 1){
					if (isJson(types)){
						for (var i in types){
							if (!types.hasOwnProperty(i)) continue;
							this.define(i, types[i]);
						}
					}
					return;
				}
				types = isArray(types) ? types : types.split(' ');
				literals = isArray(literals) ? literals : literals.split('  ');
				for (var _i=0, literal; _i < literals.length; _i++){
					literal = literals[_i];
					if (this.types.hasOwnProperty(literal) && /^[A-Z]\w+$/.test(literal)){
						this.define(types, this.types[literal]);
						continue;
					}
					if (/\w\W|\W\w/.test(literal)){
						literal_re = literal.replace(/(\W)/g, '\\$1');
						if (this.complexs.indexOf(literal_re) == -1){
							this.complexs.push(literal_re);
						}
					}
					for (var _j=0, type; _j < types.length; _j++){
						type = types[_j];
						if (!this.types[type]) this.types[type] = [];
						if (this.types[type].indexOf(literal) == -1){
							this.types[type].push(literal);
						}
					}
					if (tmp = this.literals[literal]){
						for (var _j=0, type; _j < types.length; _j++){
							type = types[_j];
							if (tmp.indexOf(type) == -1){
								tmp.push(type);
							}
						}
					}else {
						this.literals[literal] = types.slice();
					}
				}
				if (this.complexs.length){
					this.complexs.sort(function(a, b){return b.length-a.length});
					this.complexre = new RegExp('^(?:'+this.complexs.join('|')+')(?!\\w)', 'g');
				}
			}};
		node = {"map": {},
			"all": [],
			"test": function(name, type){
				if (!type){
					if (this.map['Expr'].indexOf(name) != -1){
						return 'Expr';
					}
					if (this.map['Decl'].indexOf(name) != -1){
						return 'Decl';
					}
					if (this.map['Stam'].indexOf(name) != -1){
						return 'Stam';
					}
					return false;
				}
				return name == type || this.map[type] && this.map[type].indexOf(name) != -1;
			},
			"define": function(types, names){
				if (arguments.length == 1){
					if (isJson(types)){
						for (var i in types){
							if (!types.hasOwnProperty(i)) continue;
							this.define(i, types[i]);
						}
					}
					return;
				}
				types = isArray(types) ? types : types.split(' ');
				names = isArray(names) ? names : names.split(' ');
				for (var _i=0, name; _i < names.length; _i++){
					name = names[_i];
					if (this.map.hasOwnProperty(name)){
						this.define(types, this.map[name]);
					}
					for (var _j=0, type; _j < types.length; _j++){
						type = types[_j];
						if (!this.map[type]) this.map[type] = [];
						if (this.map[type].indexOf(name) == -1) this.map[type].push(name);
						if (this.all.indexOf(name) == -1) this.all.push(name);
					}
				}
			}};
		token.define(token_map);
		node.define(node_map);
		module.exports.token = token;
		module.exports.node = node;
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/parser.tea', '../src/syntax/parser.tea', function(exports, require, module, __filename, __dirname){
		var Parser = module.exports,
			Node = require("../src/syntax/node.tea"),
			SyntaxReg = require("../src/syntax/regexp.tea");
		Parser.define = function(name, pattern, callback){
			var m;
			if (typeof pattern == 'string'){
				var stx_re = SyntaxReg.compile(pattern), rule = null;
				if (m = name.match(/(\w+):([\-\w]+)/)){
					name = m[1];
					switch (m[2]){
						case '1':
							rule = 'ret node';
							break;
						case '2':
							rule = 'check empty';
							break;
						case '3':
							rule = 'ret list';
							break;
						case '4':
							rule = 'not check';
							break;
						default:
							rule = m[2];
							break;
					}
				}
				Parser[name] = function(src, param){
					var res = SyntaxReg.matchNode(name, stx_re, src, rule);
					if (res && callback){
						return callback(res, src, param);
					}
					return res;
				};
			}else {
				Parser[name] = function(src, param){
					var res = pattern(rc);
					if (res && callback){
						return callback(res, src, param);
					}
					return res;
				};
			}
		};
		Parser.define('NameExpr', 'is(IdentifierTokn Restricted)');
		Parser.define('ConstPatt', '(:UnaryExpr [+|-] NumTokn) | ConstTokn');
		Parser.define('UnaryExpr', '(:NotExpr not ExprStam) | (:PrefixExpr is(Prefix) ValuePatt) | (:UnaryExpr is(Unary) ValuePatt)');
		Parser.define('JsonPatt\:4', 'eq?(get set) +1is?(IdentifierTokn Restricted) (eq?(set) SetterDecl | GetterDecl){err:301} | '+'is?(IdentifierTokn Restricted) +1eq(\\\() MethodDecl{err:302} | '+'(:AssignmentExpr is(IdentifierTokn NumTokn StringTokn) : ExprStam{err:203})');
		Parser.define('JsonExpr\:1', '(?\{) ((?\}) | JsonPatt ((?\,)? JsonPatt)* (?\,)* (?\}{err:102}))');
		Parser.define('ArrayExpr\:1', '(?\[) ((?\]) | ExprStam ((?\,)? ExprStam)* (?\,)* (?\]{err:101}))');
		Parser.define('CompelExpr\:1', '(?\\\() CommaExpr{err:214} (?\\\))');
		Parser.define('IdentifierExpr\:1', 'IdentifierTokn');
		Parser.define('SlicePatt\:2', '(?\[) ( (?\]) | (ComputeExpr? : ComputeExpr? | (:MemberExpr CommaPatt) )? (?\]{err:104}) )');
		Parser.define('DotExpr\:1', '(?\.) (NameExpr | (:MemberExpr ConstPatt)){err:201}');
		Parser.define('MemberExpr', 'DotExpr | SlicePatt | (:MemberPatt eq?(!.) is(Member) is(IdentifierTokn Restricted)?)');
		Parser.define('AccessorExpr', '(Expression() | DataPatt) (is?(Member) MemberExpr)*');
		Parser.define('SuperExpr\:1', '(:AccessorExpr super (is?(Member) MemberExpr)*) ParamsExpr?');
		Parser.define('ThisExpr\:1', 'this (is?(Member) MemberExpr)*');
		Parser.define('AtExpr\:1', '@ (:DotExpr NameExpr)? (is?(Member) MemberExpr)*');
		Parser.define('ParamsPatt\:4', '(LambdaExpr | ExprStam) (, (?=\,|\\\)))*');
		Parser.define('ParamsExpr\:1', '(?\\\() ((?\\\)) | ,* ParamsPatt ((?\,) ParamsPatt)* (?\\\)){err:105})');
		Parser.define('ParamsStam', 'eq?(\\\() ParamsExpr | --1is(BlankTokn !LineHead) is?(!Close !Contextual !BlockBreak !Controler !Clauses) (:ParamsStam ParamsPatt ((?\,) ParamsPatt)*)');
		Parser.define('ArgumentsPatt\:3', 'AssignmentDecl ((?\,) AssignmentDecl)*');
		Parser.define('ArgumentsExpr\:1', '(?\\\() ArgumentsPatt? (?\\\))');
		Parser.define('ArgumentsDecl\:1', 'ArgumentsPatt');
		Parser.define('ValueExpr', 'is?(Unary Prefix) UnaryExpr | (::PostfixExpr ValuePatt is(Postfix)?)');
		Parser.define('ComputeExpr', 'ValueExpr (is(Compute) ValueExpr)*');
		Parser.define('CompareExpr', 'ComputeExpr (is(Compare) ComputeExpr)*');
		Parser.define('LogicRightPatt\:4', 'CompareExpr (:::AssignmentExpr is(Assign) (eq?(\\\() LambdaExpr|ExprStam) )?');
		Parser.define('LogicExpr', 'CompareExpr (is(Logic) LogicRightPatt)*');
		Parser.define('ArrayPatt\:1', '(?\[) IdentifierTokn ((?,) IdentifierTokn)* (?\])');
		Parser.define('AssignmentDecl', 'IdentifierTokn ( = (LambdaExpr|ExprStam){err:204})? | eq?(\[) ArrayPatt ={err:315} ExprStam{err:315}');
		Parser.define('AssignmentExpr', '(eq?(\[) ArrayPatt | ValueExpr) is(Assign) (eq?(\\\() LambdaExpr|ExprStam){err:208}');
		Parser.define('BinaryExpr', 'AssignmentExpr | LogicExpr');
		Parser.define('TernaryExpr', 'LogicExpr ((:::Ternary2.5Expr ? (Clauses()|ExprStam)) (:::TernaryExpr : (Clauses()|ExprStam))?)?');
		Parser.define('LambdaExpr', 'ArgumentsExpr (?->) (ReturnStam|ExprStam)');
		Parser.define('CommaPatt\:4', 'ExprStam ((?\,) ExprStam{err:205})*');
		Parser.define('CommaExpr\:1', 'CommaPatt');
		Parser.define('CommaStam', 'ExprStam ((?\,) ExprStam{err:205})*');
		Parser.define('ExprStam\:4', 'Declaration() | AssignmentExpr | TernaryExpr');
		Parser.define('FunctionExpr', 'function (:::FunctionDecl IdentifierTokn)? ArgumentsExpr Block()');
		Parser.define('FunctionDecl', 'function IdentifierTokn ArgumentsExpr Block()');
		Parser.define('PackageExpr', 'package ArgumentsExpr? Block()');
		Parser.define('ExtendsExpr\:2', 'extends ParamsStam{err:314}');
		Parser.define('ClassExpr\:1', 'class IdentifierTokn? ExtendsExpr? Block(classStatement)');
		Parser.define('GetterDecl', 'get NameExpr ArgumentsExpr? Block()');
		Parser.define('SetterDecl', 'set NameExpr ArgumentsExpr Block()');
		Parser.define('StaticDecl', 'static (MethodDecl | ArgumentsDecl)');
		Parser.define('MethodDecl', 'NameExpr ArgumentsExpr eq?({ :) Block(){err:402}');
		Parser.define('ProtoDecl', '(?\*) proto (MethodDecl | ArgumentsDecl)');
		Parser.define('InitDecl', '(?\*) init (MethodDecl | ArgumentsDecl)');
		Parser.define('VarDecl\:1', 'var ArgumentsDecl{err:306}');
		Parser.define('LetDecl\:1', 'let ArgumentsDecl{err:307}');
		Parser.define('ConstDecl\:1', 'const ArgumentsDecl{err:308}');
		Parser.define('ReturnStam\:1', 'return{lf} CommaExpr?');
		Parser.define('BreakStam\:1', 'break{lf} IdentifierTokn?');
		Parser.define('ContinueStam\:1', 'continue{lf} IdentifierTokn?');
		Parser.define('ThrowStam\:1', 'throw{lf} CommaExpr?');
		Parser.define('DebuggerStam\:1', 'debugger');
		Parser.define('ExportDecl\:1', 'export (eq?(class) ClassExpr | FunctionDecl | MethodDecl | ArgumentsDecl){err:109}');
		Parser.define('RequireStam\:1', 'require ParamsStam');
		Parser.define('CallExpr', 'AccessorExpr ParamsStam');
		Parser.define('ConditionStam\:CompelExpr', 'CommaPatt{err:311}');
		Parser.define('IfStam\:1', 'IfPatt ElseIfPatt*');
		Parser.define('DoWhileStam\:1', 'do Block(controlStatement){err:306} (while ConditionStam)?');
		Parser.define('TryStam\:1', 'TryPatt CatchPatt* FinallyPatt?');
		Parser.define('IfPatt\:1', 'if ConditionStam Block(controlStatement){err:303}');
		Parser.define('ElseIfPatt', 'else (?if) ConditionStam Block(controlStatement) | '+'(::ElsePatt else Block(controlStatement))', checkElseIfPatt);
		Parser.define('WhileStam\:1', 'while ConditionStam Block(controlStatement){err:304}');
		Parser.define('WithStam\:1', 'with ConditionStam Block(controlStatement){err:305}');
		Parser.define('TryPatt', 'try Block(controlStatement){err:307}');
		Parser.define('CatchPatt', 'catch ConditionStam Block(controlStatement)');
		Parser.define('FinallyPatt', 'finally Block(controlStatement)');
		Parser.define('SwitchStam\:1', 'switch ConditionStam ('+'(:IndentBlockStam (?\\\:) SwitchIndentBlockPatt* ) | '+'(:BlockStam (?\{) SwitchBlockPatt* (?\}){err:106})'+' ){err:308}');
		Parser.define('SwitchIndentBlockPatt', '((:::CaseStam case CommaExpr) | (:::DefaultStam default)) :{err:313} IndentBlockStam(end:case,default)?');
		Parser.define('SwitchBlockPatt', '((:::CaseStam case CommaExpr) | (:::DefaultStam default)) :{err:313} BlockStam(end:case,default)?');
		Parser.define('ForStam\:1', 'for ForCondition() Block(controlStatement){err:402}');
		Parser.define('LabelStam', 'IdentifierTokn : StatementStam');
		Parser.define('SeleteLeftStam\:3', '(<-|--1is(BlankTokn !LineHead) if) CommaStam{err:207}');
		Parser.define('SeleteRightStam\:3', '(&&|\\\|\\\||and|or|->) StatementStam{err:206}');
		Parser.define('StatementStam', 'is?(Controler) ControlClauses() | '+'(eq?({) (JsonExpr|Block()) | Clauses() | Statement() | MethodDecl) (:::SeleteStam SeleteLeftStam)? | '+'CommaStam (:::CallExpr if(ValueExpr) ParamsStam)? (:::SeleteStam SeleteLeftStam|SeleteRightStam)?');
		Parser.define('ClassStatStam', 'Declaration(classStatement) | StatementStam');
		Parser.define('StatementPatt', '(is(CommDecl) | is?(IdentifierTokn) LabelStam | StatementStam){lf} is?(EndTokn){err:215}');
		Parser.define('ClassStatementPatt', '(is(CommDecl) | is?(IdentifierTokn) LabelStam | Declaration(classStatement) | StatementStam){lf} is?(EndTokn){err:215}');
		Parser.RegExpDecl = function(src, param){
			var a, b, _ref;
			_ref = src.indexPair('/', '/', src.index), a = _ref[0], b = _ref[1];
			while (src[b+1] && /^[gimy]+/.test(src[b+1].text)){
				b += 1;
			}
			src.current.text = src.join(a, b);
			src.current.types = ['RegExpDecl', 'ConstTokn'];
			src.delete(a+1, b);
			return src.current;
		};
		Parser.DataPatt = function(src, param){
			switch (src.text){
				case '(':
					return Parser.CompelExpr(src, param);
				case '[':
					return Parser.ArrayExpr(src, param);
				case '{':
					return Parser.JsonExpr(src, param);
				case '/':
					return Parser.RegExpDecl(src, param);
			}
			switch (src.current.is('Unary', 'IdentifierTokn', 'ConstTokn')){
				case 'Unary':
					return Parser.UnaryExpr(src, param);
				case 'IdentifierTokn':
					return new Node('IdentifierExpr', src.current);
				case 'ConstTokn':
					return src.current;
			}
		};
		Parser.ValuePatt = function(src, opt){
			var res, member, param;
			if (res = Parser.AccessorExpr(src, opt)){
				while (true){
					var peek = src.peek, _index = src.index;
					if (peek.is('Member')){
						if (member = Parser.MemberExpr(src.next(1), opt)){
							if (res.type == 'AccessorExpr'){
								res.add(member);
							}else {
								res = new Node('AccessorExpr', res, member);
							}
							continue;
						}
					}else if (peek.text == '(' && (param = Parser.ParamsExpr(src.next(1), opt))){
						res = new Node('CallExpr', res, param);
						continue;
					}
					src.index = _index;
					break;
				}
				return res;
			}
			return false;
		};
		Parser.ForCondition = function(src, opt){
			var b, res, o_index = src.index;
			if (src.text == '('){
				b = src.nextIndex(src.indexPair('(', ')', src.index)[1], true);
				if (!src[b].is('Contextual')){
					if (res = Parser.ForCondition(src.next(1), opt)){
						if (src.next(1).text == ')'){
							return res;
						}
						throw tea.error(new Error(), 107, src.current);
					}
					throw tea.error(new Error(), 213, src[o_index]);
				}
			}
			var exp1, exp2, exp3, isbreak = false;
			switch (src.text){
				case 'var':
					exp1 = Parser.VarDecl(src, opt);
					break;
				case 'let':
					exp1 = Parser.LetDecl(src, opt);
					break;
				case ';':
					exp1 = new Node('Empty');
					break;
				default:
					exp1 = Parser.CommaExpr(src, opt);
					break;
			}
			if (src.peek.text == ';' || (exp1.type == 'Empty' && src.text == ';')){
				o_index = src.index;
				if (src.text == ';'){
					src.next(1);
				}else {
					src.next(2);
				}
				if (src.text == ';'){
					isbreak = true;
					o_index = src.index;
					if (!(exp3 = Parser.CommaExpr(src.next(1), opt))){
						src.next = o_index;
					}
				}else if ((exp2 = Parser.CommaExpr(src, opt)) && src.next(1).text == ';'){
					isbreak = true;
					o_index = src.index;
					if (!(exp3 = Parser.CommaExpr(src.next(1), opt))){
						src.next = o_index;
					}
				}else {
					isbreak = false;
					src.next = o_index;
				}
				if (isbreak){
					return new Node('ForBaseConditionPatt', exp1, exp2, exp3);
				}
			}
			if (!exp1 || exp1.type == 'Empty'){
				throw tea.error(new Error(), 309, src[o_index]);
			}
			if (src.peek.eq('in', 'of', '=>', '<=', '->', '<-')){
				exp2 = src.next(1).current;
				if (!(exp3 = Parser.CommaExpr(src.next(1), opt))){
					throw tea.error(new Error(), 108, exp2);
				}
				return checkForStamType(exp1, exp2, exp3);
			}else {
				var last = exp1, last_index = exp1.length-1, last_len, last_tmp;
				while ((last_tmp = last[last_index]) && (last_len = last_tmp.length)){
					if (last_tmp.is('CompareExpr') && last_tmp[last_len-2].eq('<=', 'in', 'of', '->', '<-')){
						exp2 = last_tmp[last_len-2];
						exp3 = last_tmp[last_len-1];
						if (last_len > 3){
							last[last_index] = new Node('CompareExpr', Hash.slice(last_tmp, 0, last_len-2));
						}else {
							last[last_index] = last_tmp[0];
							last_tmp[0].parent = last;
						}
						break;
					}else {
						last = last_tmp;
						last_index = last_len-1;
					}
				}
				if (exp2){
					return checkForStamType(exp1, exp2, exp3);
				}else {
					return new Node('ForPConditionPatt', exp1);
				}
			}
		};
		Parser.Expression = function(src, opt){
			var exp;
			switch (src.text){
				case 'require':
					return Parser.RequireStam(src, opt);
				case 'super':
					return Parser.SuperExpr(src, opt);
				case 'this':
					return Parser.ThisExpr(src, opt);
				case '@':
					return Parser.AtExpr(src, opt);
			}
			if (src.context && (exp = src.context.processor.matchNode('expression', src, opt))){
				return exp;
			}
			return false;
		};
		Parser.Declaration = function(src, opt){
			var token = src.current, isClassBlock = opt && opt.classStatement;
			switch (token.text){
				case 'function':
					return Parser.FunctionExpr(src, opt);
				case 'package':
					return Parser.PackageExpr(src, opt);
				case 'class':
					return Parser.ClassExpr(src, opt);
				case 'get':
					if (!isClassBlock){
						throw tea.error(new Error(), 322, token);
					}
					if (src.peek.type == 'IdentifierTokn'){
						return Parser.GetterDecl(src, opt);
					}
					break;
				case 'set':
					if (!isClassBlock){
						throw tea.error(new Error(), 323, token);
					}
					if (src.peek.type == 'IdentifierTokn'){
						return Parser.SetterDecl(src, opt);
					}
					break;
				case 'static':
					if (!isClassBlock){
						throw tea.error(new Error(), 324, token);
					}
					if (src.peek.type == 'IdentifierTokn'){
						return Parser.StaticDecl(src, opt);
					}
					break;
				case '*':
					switch (src[src.index+1].text){
						case 'proto':
							if (!isClassBlock){
								throw tea.error(new Error(), 325, token);
							}
							return Parser.ProtoDecl(src, opt);
						case 'init':
							if (!isClassBlock){
								throw tea.error(new Error(), 326, token);
							}
							return Parser.InitDecl(src, opt);
					}
					break;
			}
			return false;
		};
		Parser.Clauses = function(src, opt){
			var token = src.current;
			switch (token.text){
				case 'var':
					return Parser.VarDecl(src, opt);
				case 'let':
					return Parser.LetDecl(src, opt);
				case 'const':
					throw tea.error(new Error(), 401, token);
					return Parser.ConstDecl(src, opt);
				case 'yield':
					throw tea.error(new Error(), 401, token);
					return Parser.ConstDecl(src, opt);
				case 'return':
					return Parser.ReturnStam(src, opt);
				case 'break':
					return Parser.BreakStam(src, opt);
				case 'continue':
					return Parser.ContinueStam(src, opt);
				case 'throw':
					return Parser.ThrowStam(src, opt);
				case 'debugger':
					return Parser.DebuggerStam(src, opt);
				case 'export':
					return Parser.ExportDecl(src, opt);
			}
			return false;
		};
		Parser.ControlClauses = function(src, opt){
			var token = src.current;
			switch (token.text){
				case 'if':
					return Parser.IfStam(src, opt);
				case 'while':
					return Parser.WhileStam(src, opt);
				case 'do':
					return Parser.DoWhileStam(src, opt);
				case 'with':
					return Parser.WithStam(src, opt);
				case 'try':
					return Parser.TryStam(src, opt);
				case 'switch':
					return Parser.SwitchStam(src, opt);
				case 'for':
					return Parser.ForStam(src, opt);
			}
			throw tea.error(new Error(), 208, token);
			return false;
		};
		Parser.Statement = function(src, opt){
			var exp;
			if (src.context && (exp = src.context.processor.matchNode('statement', src, opt))){
				return exp;
			}
			return false;
		};
		Parser.LineBlockStam = function(src, opt){
			var sta,
				stamfn = src.isClassBlock || opt.classStatement ? 'ClassStatStam' : 'StatementStam',
				node = new Node('LineBlockStam'),
				o_index = src.index,
				not_emtpy,
				end = opt.end ? opt.end.split(',') : [];
			end.push('\n', ';', '}', ']', ']', 'else', 'while', 'catch', 'finally', 'case', 'default');
			while (src.index < src.length){
				if (src.current.text == ';'){
					not_emtpy = true;
					o_index = src.index;
					src.next();
					if (src.current.text == ','){
						break;
					}
				}
				if (src.current.type == 'EOT'){
					return node;
				}
				if (end.indexOf(src.current.text) != -1){
					break;
				}
				if (sta = Parser[stamfn](src, opt)){
					node.add(sta);
					o_index = src.index;
					src.next();
					continue;
				}
				break;
			}
			src.index = o_index;
			return node.length || not_emtpy ? node : false;
		};
		Parser.IndentBlockStam = function(src, opt){
			var line_block,
				sta,
				stamfn = src.isClassBlock || opt.classStatement ? 'ClassStatStam' : 'StatementStam',
				node = new Node('IndentBlockStam'),
				o_index = src.index,
				b_index = src.prevIndex(o_index, true),
				the_indent = src.lineIndent(b_index),
				line_indent,
				a,
				b,
				c,
				not_emtpy;
			node.indent = the_indent;
			if (src[b_index].text == ':'){
				b_index = src.nextIndex(b_index);
				if (src[b_index].type != 'LF'){
					src.index = b_index;
					if (line_block = Parser.LineBlockStam(src, opt)){
						if (src[src.nextIndex(src.index)].type == 'LF'){
							o_index = src.index;
							src.next(1);
							node = line_block;
							node.type = 'IndentBlockStam';
						}else {
							return line_block;
						}
					}else {
						src.index = o_index;
						return false;
					}
				}
			}
			var end = opt.end ? opt.end.split(',') : [];
			end.push('}', ')', ']');
			if (o_index-b_index > 2){
				if (c = collageComment(node, src, b_index+1, o_index)){
					o_index = c;
				}
			}
			while (src.index < src.length){
				if (src.current.type == 'EOT'){
					return node;
				}
				b_index = src.index;
				if (end.indexOf(src.current.text) == -1){
					if (line_indent == null){
						line_indent = src.lineIndent(b);
					}else if (src.current.indent >= 0){
						line_indent = src.current.indent;
					}else if (src[src.index-1].indent >= 0 && src[src.index-1].type == 'BlankTokn'){
						line_indent = src[src.index-1].indent;
					}
					if (line_indent > the_indent){
						if (src.current.is('BlockBreak')){
							not_emtpy = true;
							o_index = src.index;
							src.next(1);
							continue;
						}
						if (sta = Parser[stamfn](src, opt)){
							collageComment(node, src, o_index+1, b_index);
							node.add(sta);
							o_index = src.index;
							src.next(1);
							continue;
						}
						if (!src.current.is('Close')){
							throw tea.error(new Error(), 320, src.current);
						}
					}
				}
				if (o_index+1 < b_index){
					if (c = collageComment(node, src, o_index+1, b_index, the_indent)){
						o_index = c;
					}
				}
				break;
			}
			src.index = o_index;
			return node.length || not_emtpy ? node : false;
		};
		Parser.BlockStam = function(src, opt){
			var sta,
				stamfn = src.isClassBlock || opt.classStatement ? 'ClassStatStam' : 'StatementStam',
				node = new Node('BlockStam'),
				o_index = src.index,
				b_index = src.prevIndex(src.index, true),
				end = opt.end ? opt.end.split(',') : [];
			end.push('}');
			while (src.index < src.length){
				while (src.current.is('BlockBreak')){
					b_index = src.index;
					src.next(1, true);
				}
				if (src.current.type == 'EOT'){
					return node;
				}
				if (src.current.type == 'CommDecl'){
					node.add(src.current);
					b_index = src.index;
					src.next(1, true);
					continue;
				}
				if (end.indexOf(src.current.text) != -1){
					src.index = b_index;
					return node;
				}
				if (sta = Parser[stamfn](src, opt)){
					node.add(sta);
					b_index = src.index;
					src.next(1, true);
					continue;
				}
				break;
			}
			return false;
		};
		Parser.StamBlockStam = function(src, opt){
			var sta,
				stamfn = src.isClassBlock || opt.classStatement ? 'ClassStatStam' : 'StatementStam';
			if (sta = Parser[stamfn](src, opt)){
				if (src.peek.text == ';'){
					src.next(1);
				}
				return new Node('StamBlockStam', sta);
			}
		};
		Parser.Block = function(src, opt){
			var o_index = src.index, _old_isClassBlock = src.isClassBlock, ref;
			if (!opt.controlStatement){
				src.isClassBlock = opt.classStatement;
			}
			switch (src.text){
				case '{':
					if (src.next(1).current.text == '}'){
						return new Node('BlockStam');
					}
					if (ref = Parser.BlockStam(src, opt)){
						if (src.next(1).text != '}'){
							throw tea.error(new Error(), 110, src.current);
						}
					}
					break;
				case ':':
					if (!(ref = Parser.IndentBlockStam(src.next(1), opt))){
						src.index = o_index;
						return new Node('IndentBlockStam');
					}
					break;
				case ';':
					ref = false;
					break;
				default:
					if (opt.controlStatement){
						ref = Parser.StamBlockStam(src, opt);
					}else {
						ref = false;
					}
					break;
			}
			src.isClassBlock = _old_isClassBlock;
			if (ref){
				return ref;
			}
			if (ref === false){
				return false;
			}
			src.index = o_index;
			return new Node('BlockStam');
		};
		Parser.Node = function(src, opt){
			var res;
			src.isClassBlock = false;
			var i = src.index, node = new Node('NodeStam'), token;
			while (i < src.length){
				token = src.current;
				if (token.is('BlockBreak', 'BlankTokn')){
					i = src.next(1).index;
					token = src.current;
				}
				if (token.type == 'EOT'){
					break;
				}
				if (res = Parser.StatementPatt(src, opt)){
					node.add(res);
					i = src.next(1, true).index;
				}else {
					throw tea.error(new Error(), 209, src.current);
				}
			}
			return node;
		};
		function collageComment(node, src, a, b, check){
			var list = [], c;
			for (var i = a; i < b; i++){
				if (src[i].type == 'CommDecl'){
					if (check != null){
						if (src.lineIndent(i) > check){
							c = i;
							list.push(src[i]);
						}else {
							break;
						}
					}else {
						c = i;
						list.push(src[i]);
					}
				}else if (!src[i].is('BlankTokn', 'LF', 'EOT')){
					return;
				}
			}
			if (list.length){
				node.add(list);
			}
			return c;
		}
		function checkForStamType(exp1, exp2, exp3){
			if (exp2 && exp2.text == 'in' && exp1){
				if (exp1.type == 'VarDecl' ? exp1[1].length == 1 : exp1.length == 1){
					return new Node('ForInConditionPatt', exp1, exp2, exp3);
				}
			}
			return new Node('ForPConditionPatt', exp1, exp2, exp3);
		}
		function checkElseIfPatt(node, src, param){
			if (node.type == 'ElsePatt' && node[1].type == 'StamBlockStam'){
				var peek = src.peek, block, o_index = src.index;
				if (peek.text == ':' || peek.text == '{'){
					if (block = Parser.Block(src.next(1), param)){
						node[1].type = 'ConditionStam';
						node.type = 'ElseIfPatt';
						node.add(block);
					}else {
						src.index = o_index;
					}
				}
			}
			return node;
		}
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/regexp.tea', '../src/syntax/regexp.tea', function(exports, require, module, __filename, __dirname){
		var Token = require("../src/syntax/token.tea"),
			Node = require("../src/syntax/node.tea"),
			Parser = require("../src/syntax/parser.tea");
		var SyntaxReg = (function(){
			var stx_re_cache = {};
			function SyntaxReg(){
				this.length = 0;
				this.quantifier = '';
				this.minmatch = 0;
			}
			SyntaxReg.prototype.push = function (){
				for (var i=0; i < arguments.length; i++){
					if (arguments[i] instanceof SyntaxReg){
						arguments[i].parent = this;
					}
				}
				return Array.prototype.push.apply(this, arguments);
			}
			SyntaxReg.prototype.match = function (srcr){
				return SyntaxReg.match(this, src);
			}
			SyntaxReg.compile = function(source){
				if (stx_re_cache[source]){
					return stx_re_cache[source];
				}
				var stx_re = compileSyReg(source);
				stx_re.source = source;
				return stx_re_cache[source] = stx_re;
			};
			SyntaxReg.match = function(stx_re, src){
				var res, matchlist = [];
				matchlist.index = src.index;
				if (res = matchInit(stx_re, src, matchlist)){
					matchlist.lastIndex = src.index;
					matchlist.unshift(res);
				}else {
					matchlist.length = 0;
				}
				return matchlist;
			};
			SyntaxReg.matchNode = function(name, stx_re, src, rule){
				var res = matchInit(stx_re, src);
				if (res){
					if (rule){
						if (typeof rule == 'string' && res.type == rule){
							res.type = name;
						}else if (rule == 'check empty'){
							if (res.length == 0){
								res = new Node(name);
							}else if (res.length == 1){
								res = res[0];
							}else {
								res = new Node(name, res);
							}
						}else if (rule == 'ret list'){
							if (res.isnode){
								res = Hash.slice(res);
							}
						}else if (rule != 'not check'){
							res = new Node(name, res === true ? null : res);
						}
					}else {
						if (!res.istoken && !res.isnode && res !== true){
							if (res.length == 1){
								res = res[0];
							}else if (res.length > 1){
								res = new Node(name, res);
							}
						}
					}
					return res;
				}
			};
			function compileSyReg(source, __parent){
				var chipp, chips = Text.split(source, ' ');
				for (var i=chips.length-1, chip; i >= 0; i--){
					chip = chips[i];
					if (/[^\\]\|[^\|]/.test(chip)){
						chipp = Text.split(chip, '|');
						if (chipp.length){
							for (var j = chipp.length-1; j > 0; j--){
								chipp.splice(j, 0, '|');
							}
							chips.splice.apply(chips, [i, 1].concat(chipp));
						}
					}
				}
				var stx_re = new SyntaxReg(), or_list = [], ptn;
				for (var i=0, chip; i < chips.length; i++){
					chip = chips[i];
					if (chip == '|'){
						or_list.push(stx_re);
						stx_re = new SyntaxReg();
						continue;
					}
					ptn = compilePtn(chip);
					ptn.parent = stx_re;
					stx_re.push(ptn);
					stx_re.minmatch += !ptn.quantifier || ptn.quantifier[0] == '+' ? 1 : 0;
				}
				if (or_list.length){
					if (stx_re.length){
						or_list.push(stx_re);
					}
					stx_re = new SyntaxReg();
					for (var i=0; i < or_list.length; i++){
						or_list[i].type = 'Or';
						or_list[i].quantifier = '?';
						or_list[i].parent = stx_re;
						stx_re.push(or_list[i]);
						stx_re.minmatch += or_list[i].minmatch;
					}
				}
				stx_re.parent = __parent;
				return stx_re;
			}
			function compilePtn(source){
				var m,
					ptn = {"type": '', "key": '', "quantifier": '', "param": {}, "text": source},
					text = source;
				if (m = text.match(/[^\\](\+\?|\*\?|\!|\?|\+|\*)$/)){
					ptn.quantifier = m[1], text = text.slice(0, -1);
				}
				if (m = text.match(/(?:\{([^\}]*)\})$/)){
					ptn.param = compileParam(m[1]);
					text = text.slice(0, m.index);
				}
				if (text[0] == '(' && text[text.length-1] == ')'){
					text = text.slice(1, -1);
					if (m = text.match(/^(\?[\=\!\:]?)?(?:(\:{1,3})([A-Z][\w\.\-]+(?:Tokn|Patt|Expr|Stam|Decl)\b))?/)){
						if (m[1] || m[2]){
							ptn.assertion = (m[1] || '')+(m[2] || '');
							if (m[3]){
								ptn.name = m[3];
							}
							text = text.substr(m[0].length);
						}
					}
					ptn.type = 'Sub';
					ptn.key = compileSyReg(text, ptn);
				}else if (text == '*'){
					ptn.type = 'ALL';
					ptn.key = text;
				}else if (Token.types.hasOwnProperty(text)){
					ptn.type = 'Tokn';
					ptn.key = text;
				}else if (m = text.match(/^[A-Z]\w+(?:Tokn|(Patt|Expr|Stam|Decl))$/)){
					ptn.type = m[1] ? 'Node' : 'Tokn';
					ptn.key = text;
				}else if (m = text.match(/^(?:([\+\-]{1,2})(\d+))?(\w+)([\=\?]?)\((.*?)\)$/)){
					return compileCall(ptn, m);
				}else if (m = text.match(/^\/(.*?)\/([img]*)$|^\[(.*?)\]([img]*)$/)){
					ptn.type = 'RegExp';
					try {
						if (text[0] == '['){
							ptn.key = new RegExp('^('+compileVal(m[3]).replace(/([^\|\\\w])/g, '\\$1')+')$', m[4]);
						}else {
							ptn.key = new RegExp(compileVal(m[1]).replace(/\\{2}/g, '\\'), m[2]);
						}
					}catch (e) {
						throw tea.error(new Error(), e.message, [source, source.indexOf(text), text], 'Syntax RegExp parse error');
					}
				}else {
					text = compileVal(text);
					var token_list = Token.tokenize(text, 0, 'code list');
					if (token_list.length == 1){
						ptn.type = 'Code';
						ptn.key = text;
					}else {
						ptn.type = 'CodeList';
						ptn.key = token_list;
					}
				}
				return ptn;
			}
			function compileVal(text){
				return text.replace(/\\(\W)/g, '$1');
			}
			function compileParam(source){
				return source ? Hash(source) : {};
			}
			function compileCall(ptn, match){
				ptn.type = 'Call';
				ptn.key = match[3];
				ptn.test = match[4] || match[1];
				if (match[5]){
					if (ptn.key == 'is' || ptn.key == 'eq' || ptn.key == 'if'){
						ptn.param = Hash.concat(ptn.param, compileTokenCallParams(compileVal(match[5])));
					}else {
						ptn.param = Hash.concat(ptn.param, compileParam(compileVal(match[5])));
					}
				}
				ptn.param.mark = match[1];
				ptn.param.num = match[2] && parseInt(match[2]);
				return ptn;
			}
			function compileTokenCallParams(param){
				var param = param.split(' '), yes_param = [], not_param = [];
				for (var i=0; i < param.length; i++){
					if (param[i][0] == '!'){
						not_param.push(param[i].substr(1));
					}else {
						yes_param.push(param[i]);
					}
				}
				return {"yes": yes_param.length && yes_param, "no": not_param.length && not_param};
			}
			function matchInit(stx_re, src, __m){
				var o_name = stx_re.tempName;
				stx_re.tempName = null;
				stx_re.checkIndent = false;
				var res = matchSyReg.call(stx_re, stx_re, src, __m);
				stx_re.tempName = o_name;
				return res;
			}
			function matchSyReg(stx_re, src, __m, __r){
				var res,
					next_ptn,
					o_index = src.index,
					s_index = o_index,
					p_index = o_index,
					sub_index,
					res_list = [];
				res_list.matched = 0;
				for (var i=0, ptn; i < stx_re.length; i++){
					ptn = stx_re[i];
					if (ptn.type == 'Or'){
						src.index = o_index, res_list.length = 0, res_list.matched = 0, this.checkIndent = false;
					}
					sub_index = matchSubIndex.call(this, ptn, __m);
					s_index = src.index;
					res = matchPattern.call(this, ptn, src, __r || res_list, __m);
					if (res){
						res_list.matched++;
						if (ptn.type == 'Or'){
							return res;
						}
						if (ptn.assertion == '?!'){
							return matchBad.call(this, ptn, src, o_index, __m);
						}
						if (ptn.assertion == '?='){
							src.index = s_index = p_index;
							continue;
						}
						if (ptn.quantifier[0] == '*' || ptn.quantifier[0] == '+'){
							if (ptn.quantifier[1] == '?'){
								next_ptn = stx_re[i+1];
							}
							res = matchPatternMore.call(this, res, ptn, next_ptn, src, __r || res_list, __m);
						}
						if (res === true){
							p_index = src.index;
							continue;
						}
						if (ptn.assertion != '?'){
							res = matchResName.call(this, ptn, res);
							matchSaveSubList.call(this, ptn, sub_index, res, __m);
							if (res.istoken || res.isnode){
								res_list.push(res);
							}else if (res.length){
								res_list.push.apply(res_list, res);
							}
						}
						p_index = src.index;
						src.next(!ptn.param.lf);
					}else {
						if (ptn.quantifier[0] == '?' || ptn.quantifier[0] == '*'){
							src.index = s_index;
							continue;
						}
						if (ptn.assertion == '?!' || ptn.type == 'Or'){
							src.index = s_index;
							continue;
						}
						if (ptn.type == 'Sub' && ptn.key.minmatch == 0){
							src.index = s_index;
							continue;
						}
						return matchBad.call(this, ptn, src, o_index, __m);
					}
				}
				src.index = p_index;
				if (res_list.matched){
					if (res_list.length == 1 && stx_re.length == 1 && /^(Sub|Tokn|Node|Call)$/.test(stx_re[0].type)){
						res_list = res_list[0];
					}
					return matchResName.call(this, stx_re, res_list);
				}else {
					src.index = o_index;
				}
			}
			function matchPattern(ptn, src, __r, __m){
				var res, o_index = src.index, token = src.current;
				if (this.checkIndent || this.checkIndent === 0){
					if (this.checkIndent > src.lineIndent(o_index)){
						this.checkIndent = false;
						return;
					}
					this.checkIndent = false;
				}
				switch (ptn.type){
					case 'ALL':
						return token;
					case 'RegExp':
						if (ptn.key.test(token.text)) return token;
						break;
					case 'Code':
						if (ptn.key == token.text) return token;
						break;
					case 'Tokn':
						if (token.is(ptn.key)) return token;
						break;
					case 'CodeList':
						return matchTokenList.call(this, ptn, src);
					case 'Patt':case 'Expr':case 'Stam':case 'Decl':case 'Node':case 'Call':
						res = matchCallPattern.call(this, ptn, src, __r, __m);
						break;
					case 'Sub':
						res = matchSyReg.call(this, ptn.key, src, __m, __r);
						break;
					case 'Or':
						res = matchSyReg.call(this, ptn, src, __m, null);
						break;
				}
				if (res){
					if (res == true || res.isnode || res.istoken || res.length || res.matched){
						return res;
					}
					return true;
				}
				src.index = o_index;
				return res;
			}
			function matchPatternMore(res, ptn, next_ptn, src, __r, __m){
				var _res_list = res.istoken || res.isnode ? [res] : res,
					_res,
					o_index = src.index;
				while (_res = matchPatternNext.call(this, ptn, next_ptn, src, __r, __m)){
					if (o_index == src.index){
						return _res_list;
					}
					o_index = src.index;
					if (_res_list === true){
						continue;
					}
					if (_res.istoken || _res.isnode){
						_res_list.push(_res);
					}else if (_res.length){
						_res_list.push.apply(_res_list, _res);
					}
				}
				src.index = o_index;
				return _res_list;
			}
			function matchPatternNext(ptn, next_ptn, src, __r, __m){
				var res, o_index = src.index, next_res;
				if (next_ptn){
					this.try = true;
					next_res = matchPattern.call(this, next_ptn, src.next(!ptn.param.lf), __r, __m);
					this.try = false;
				}
				if (!next_res){
					src.index = o_index;
					if (res = matchPattern.call(this, ptn, src.next(!ptn.param.lf), __r, __m)){
						return res;
					}
				}
				src.index = o_index;
			}
			function matchCallPattern(ptn, src, __r, __m){
				var res;
				switch (ptn.key){
					case 'is':case 'eq':
						return matchToken.call(this, ptn, src);
					case 'if':
						var lase_res = __r[__r.length-1], yes = ptn.param.yes, no = ptn.param.no;
						if (!lase_res || !lase_res.is){
							return ptn.param.yes ? false : true;
						}
						if ((!yes || lase_res.is.apply(lase_res, yes)) && (!no || !lase_res.is.apply(lase_res, no))){
							return true;
						}
						return false;
					default:
						var name = ptn.key;
						if (Parser.hasOwnProperty(name)){
							var o_index = src.index;
							res = Parser[name](src, ptn.param, __m);
							this.checkIndent = false;
							if (res){
								if (res.type == 'IndentBlockStam' || res.type == 'LineBlockStam'){
									this.checkIndent = src.lineIndent(o_index);
								}else {
									var last = res[res.length-1];
									if (last && (last.type == 'IndentBlockStam' || last.type == 'LineBlockStam')){
										this.checkIndent = src.lineIndent(o_index);
									}
								}
							}
							return ptn.test ? !!res : res;
						}else {
							throw tea.error(new Error(), "unexpected syntax parser as \""+name+"\"");
						}
						break;
				}
				throw tea.error(new Error(), 'Syntax pattern unexpected call function', [this.source, -1, name]);
			}
			function matchToken(ptn, src){
				var param = ptn.param, num = param.num, _index = src.index;
				switch (param.mark){
					case '+':
						while (--num >= 0){
							_index = src.nextIndex(_index, !param.lf);
						}
						break;
					case '++':
						while (--num >= 0){
							_index++;
						}
						break;
					case '-':
						while (--num >= 0){
							_index = src.prevIndex(_index, !param.lf);
						}
						break;
					case '--':
						while (--num >= 0){
							_index--;
						}
						break;
				}
				var yes = param.yes, no = param.no, token = src[_index];
				if (!token){
					return !yes && no && ptn.test ? true : false;
				}
				if ((!yes || token[ptn.key].apply(token, yes)) && (!no || !token[ptn.key].apply(token, no))){
					return !ptn.test ? token : true;
				}
				return false;
			}
			function matchTokenList(ptn, src){
				var index = src.index-1, list = [], tokens = ptn.key;
				for (var _i=0, key; _i < tokens.length; _i++){
					key = tokens[_i];
					index++;
					if (/^\s+$/.test(tokens) && src[index].type == 'BlankTokn'){
						continue;
					}
					if (key == src[index].text){
						list.push(src[index]);
						continue;
					}
					return;
				}
				if (list.length){
					src.index = index;
					return list;
				}
			}
			function matchBad(ptn, src, o_index, __m){
				var err_token = src.current;
				src.index = o_index;
				if (ptn.param.err && !ptn.param.try && !this.try){
					throw tea.error(new Error(), ptn.param.err, err_token, 'Syntax parse error');
				}
				return false;
			}
			function matchResName(ptn, res){
				if (ptn.type == 'Or'){
					ptn = ptn.parent || ptn;
				}
				var name = ptn.tempName || ptn.name;
				if (name){
					if (!res || res === true){
						return res;
					}
					if (ptn.assertion == '::'){
						if (!res.isnode && res.length > 1){
							res = new Node(name, res);
						}
					}else if (ptn.assertion == ':::'){
						this.tempName = ptn.name;
					}else {
						res = new Node(name, res);
					}
				}
				return res;
			}
			function matchSubIndex(ptn, __m){
				if (__m && ptn.type == 'Sub' && (!ptn.assertion || ptn.assertion[0] != '?')){
					__m.push(null);
					return __m.length-1;
				}
			}
			function matchSaveSubList(ptn, sub_index, res, __m){
				if (__m){
					if (sub_index != null){
						__m.splice(sub_index, 1, res);
					}
					if (ptn.type == 'Node' || ptn.type == 'Tokn'){
						if (!__m[ptn.key]){
							__m[ptn.key] = [];
						}
						__m[ptn.key].push(res);
					}
					return true;
				}
			}
			return SyntaxReg;
		})();
		module.exports = SyntaxReg;
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/token.tea', '../src/syntax/token.tea', function(exports, require, module, __filename, __dirname){
		var NodeBase = require("../src/syntax/base.tea");
		var Token = (function(){
			var tokenmap, token_literals, token_symbol, token_complex_re;
			tokenmap = require("../src/syntax/map.tea").token;
			token_literals = tokenmap.literals;
			token_symbol = tokenmap.types.SymbolTokn;
			token_complex_re = tokenmap.complexre;
			function Token(text, types, indent, location){
				if (this.constructor != Token){
					if (arguments.length == 1 || typeof types == 'number'){
						return Token.parse(text, types);
					}
					return new Token(text, types, indent, location);
				}
				if (!types){
					if (text == '\4'){
						types = ['EOT', 'BlockBreakTokn', 'BlockBreak', 'EndTokn'];
					}else if (token_literals.hasOwnProperty(text)){
						types = token_literals[text];
					}else if (text){
						types = ['Character'];
					}else {
						types = ['EMPTY'];
					}
				}
				this.text = text;
				this.types = Hash.slice(types);
				if (indent != null) this.indent = indent;
				this.location = location || null;
				this.istoken = true;
			}
			Token.prototype = new NodeBase();
			Token.prototype.constructor = Token;
			Token.prototype.__super__ = NodeBase.prototype;
			Token.prototype.__defineGetter__("types", function(){
				return this._types;
			});
			Token.prototype.__defineSetter__("types", function(types){
				this.type = types[0];
				this._types = types;
				return this._types;
			});
			Token.prototype.__defineSetter__("indent", function(num){
				this._indent = (num != null ? num : -1);
				var i = this.types.indexOf('LineHead');
				if (this._indent >= 0){
					if (i == -1) this.types.push('LineHead');
				}else if (i >= 0){
					this.types.splice(i, 1);
				}
			});
			Token.prototype.__defineGetter__("indent", function(){
				return this._indent;
			});
			Token.prototype.__defineGetter__("fileName", function(){
				return this.location && this.location.fileName;
			});
			Token.prototype.__defineGetter__("start", function(){
				return this.location && this.location.start;
			});
			Token.prototype.__defineGetter__("end", function(){
				return this.location && this.location.end;
			});
			Token.prototype.clone = function (text, types){
				var token = new Token(text || this.text, types || this.types, this.indent, this.location);
				token.parent = this.parent;
				return token;
			}
			Token.types = tokenmap.types;
			Token.define = function(types, literals){
				return tokenmap.define(types, literals);
			};
			Token.parse = function(text, index){
				if (index == null) index = 0;
				var match, code;
				if (!(text = text.substr(index))){
					return;
				}
				if (token_complex_re && (match = text.match(token_complex_re))){
					if (token_literals.hasOwnProperty(match[0])){
						return new Token(match[0], token_literals[match[0]]);
					}
				}
				if (match = text.match(/^\n/)){
					return new Token(match[0], token_literals[match[0]]);
				}
				if (match = text.match(/^[\r\t\f\ ]+/)){
					return new Token(match[0], ['BlankTokn']);
				}
				if (match = text.match(/^(0[xX][0-9a-fA-F]+|(?:\.\d+|\d+(?:\.\d+)?)(?:e\-?\d+)?)/)){
					return new Token(match[0], ['NumTokn', 'ConstTokn']);
				}
				if (match = text.match(/^([\$a-zA-Z_][\w\$]*)/)){
					if (token_literals.hasOwnProperty(match[0])){
						return new Token(match[0], token_literals[match[0]]);
					}
					return new Token(match[0], ['IdentifierTokn']);
				}
				if (!(match = text.match(/^[^\w\_\s]+/))){
					return {"error": 'tokenize parse error! unexpected token like as "'+text.slice(0, 5)+'"'};
				}
				code = match[0];
				while (code && token_symbol.indexOf(code) == -1){
					code = code.slice(0, -1);
				}
				if (!code){
					return new Token(match[0]);
				}
				if (token_literals.hasOwnProperty(code)){
					return new Token(code, token_literals[code]);
				}
				return {"error": 'tokenize parse error! undefined token "'+code+'"'};
			};
			Token.tokenize = function(text, index, opt){
				if (index == null) index = 0;
				var list, tk;
				list = [];
				while (tk = Token.parse(text, index)){
					list.push(opt == 'code list' ? tk.text : tk);
					index += tk.text.length;
				}
				return list;
			};
			return Token;
		})();
		module.exports = Token;
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/location.tea', '../src/syntax/location.tea', function(exports, require, module, __filename, __dirname){
		var Location = (function(){
			var file_cache = [], source_cache = [];
			function Location(file, source, code, start, end, line, column){
				if (!source && file){
					source = Text.readFile(file);
				}
				this.__file_id = CacheFile(file);
				this.__source_id = CacheSource(source);
				this.code = code || '';
				this.lineNumber = (line != null ? line : null);
				this.columnNumber = (column != null ? column : null);
				this.start = (start != null ? start : 0);
				this.end = end || start+this.code.length-1;
				if (line == null){
					CountLineNumber(this, start);
				}
			}
			Location.prototype.__defineGetter__("fileName", function(){
				return file_cache[this.__file_id] || '';
			});
			Location.prototype.__defineGetter__("source", function(){
				var data = source_cache[this.__source_id];
				return data && data.source || '';
			});
			Location.prototype.__defineGetter__("line", function(){
				var data = source_cache[this.__source_id];
				return data && data[this.lineNumber-1][3] || '';
			});
			Location.prototype.fission = function (code, start, end){
				return new Location(this.__file_id, this.__source_id, code, start, end);
			}
			function CountLineNumber(loc, start){
				var data;
				if (data = source_cache[loc.__source_id]){
					for (var i=0, line_data; i < data.length; i++){
						line_data = data[i];
						if (start >= line_data[1] && start <= line_data[2]){
							loc.lineNumber = line_data[0];
							loc.columnNumber = start-line_data[1];
							break;
						}
					}
				}
				return loc;
			}
			function CacheFile(file){
				if (typeof file == 'number'){
					return file;
				}
				if (file){
					var index = file_cache.indexOf(file);
					if (index == -1){
						index = file_cache.push(file)-1;
					}
					return index;
				}
				return null;
			}
			function CacheSource(source){
				if (typeof source == 'number'){
					return source;
				}
				if (source){
					var index = -1;
					for (var i=0; i < source_cache.length; i++){
						if (source_cache[i].text == source){
							index = i;
							break;
						}
					}
					if (index == -1){
						var lines = source.split('\n'), shift = 0, data = [];
						for (var i=0, line; i < lines.length; i++){
							line = lines[i];
							data.push([i+1, shift, (shift += line.length+1)-1, line+'\n']);
						}
						data.source = source;
						index = source_cache.push(data)-1;
					}
					return index;
				}
				return null;
			}
			return Location;
		})();
		module.exports = Location;
	});Module.register('/Users/wl/Sites/TeaJS/src/syntax/source.tea', '../src/syntax/source.tea', function(exports, require, module, __filename, __dirname){
		var Source = (function(){
			var Splice = Array.prototype.splice,
				Slice = Array.prototype.slice,
				IndexOf = Array.prototype.indexOf,
				Token = require("../src/syntax/token.tea"),
				Location = require("../src/syntax/location.tea"),
				PreProcess = require("../src/preprocess/index.tea");
			function Source(source, file, ctx){
				if (this.constructor != Source){
					return new Source(source, file, ctx);
				}
				this.index = 0;
				this.length = 0;
				this.source = null;
				this.fileName = null;
				this.context = ctx || PreProcess.context();
				if (arguments.length){
					this.parse(source, file, this.context, true).clean();
				}
			}
			Source.prototype.parse = function (text, file, ctx, init){
				if (ctx == null) ctx = this.context;
				var loc, i, control_cache, token, code;
				if (!file && !/^["']/.test(text) && Path.isPathText(text)){
					file = text, text = null;
				}
				loc = new Location(file, text);
				text = loc.source;
				file = loc.fileName;
				i = 0;
				control_cache = {};
				if (init || !this.source){
					this.source = text;
					this.fileName = file;
				}
				while (i < text.length && (token = Token(text, i))){
					if (token.error){
						throw tea.error(new Error(), token.error, [text, i, text[i], file]);
					}
					token.location = loc.fission(token.text, i);
					if (this.length && this[this.length-1].is('LF')){
						token.indent = token.type == 'BlankTokn' ? token.text.replace(/\t/g, tab_size).length : 0;
					}
					switch (code = token.text){
						case '"':case '"""':case '""""':case '`':case "'":case "'''":case "''''":
							token = ctx.processor.string(this, text, i, token);
							break;
						case '/*':case '#!':case '//':
							token = ctx.processor.comm(this, text, i, token);
							break;
						case '/':
							token = ctx.processor.regexp(this, text, i, token);
							break;
						case '#':
							token = ctx.processor.pound(this, text, i, token, control_cache);
							break;
						default:
							if (token.type == 'IdentifierTokn'){
								token = ctx.processor.macro(this, text, i, token);
							}
							break;
					}
					if (typeof token == 'number'){
						if (token < 0){
							break;
						}
						i = token;
					}else {
						i = token.location.end+1;
						this.add(token);
					}
				}
				return this;
			}
			Source.prototype.__defineGetter__("text", function(){
				return this.current.text;
			});
			Source.prototype.__defineGetter__("type", function(){
				return this.current.type;
			});
			Source.prototype.__defineGetter__("current", function(){
				return this.get(this.index);
			});
			Source.prototype.__defineGetter__("peek", function(){
				return this.get(this.nextIndex(this.index, true));
			});
			Source.prototype.__defineGetter__("prev", function(){
				return this.get(this.prevIndex(this.index, true));
			});
			Source.prototype.is = function (){
				return this.current.is.apply(this[this.index], arguments);
			}
			Source.prototype.eq = function (){
				return this.current.eq.apply(this[this.index], arguments);
			}
			Source.prototype.get = function (index){
				return this[index] || {};
			}
			Source.prototype.add = function (tok){
				if (!tok || !tok.istoken){
					throw tea.error(new Error(), 'Add the wrong parameters('+isClass(tok)+'), Only to can add Lexeme object');
				}
				this[this.length++] = tok;
				return this;
			}
			Source.prototype.back = function (opt, catch_comm){
				while (opt > 1){
					this.index = this.prevIndex(this.index, opt--, catch_comm);
				}
				this.index = this.prevIndex(this.index, opt, catch_comm);
				return this;
			}
			Source.prototype.next = function (opt, catch_comm){
				while (opt > 1){
					this.index = this.nextIndex(this.index, opt--, catch_comm);
				}
				this.index = this.nextIndex(this.index, opt, catch_comm);
				return this;
			}
			Source.prototype.nextIndex = function (index, ig_lf, catch_comm){
				return GoIndex(1, this, index, ig_lf, catch_comm);
			}
			Source.prototype.prevIndex = function (index, ig_lf, catch_comm){
				return GoIndex(-1, this, index, ig_lf, catch_comm);
			}
			Source.prototype.indexPair = function (s1, s2, index, not_throw_error){
				index = (index != null ? index : this.index);
				var ab = IndexPair(this, s1, s2, index);
				if (!ab && !not_throw_error){
					throw tea.error(new Error(), 'Source index pair miss "'+s2+'" token', this[index], 'Source error');
				}
				return ab;
			}
			Source.prototype.indexLine = function (index){
				index = (index != null ? index : this.index);
				var a = index, b = index, len = this.length-2;
				while (a > len || (a > 0 && this[a-1] && this[a-1].type != 'LF')){
					a--;
				}
				while (b < len && (!this[b] || this[b].type != 'LF')){
					b++;
				}
				return [(a > len ? len : a), (b > len ? len : b), index];
			}
			Source.prototype.lineIndent = function (index){
				index = (index != null ? index : this.index);
				while (index >= 0){
					if (this[index] && this[index].indent >= 0){
						return this[index].indent;
					}
					index--;
				}
				return -1;
			}
			Source.prototype.trimIndent = function (a, b){
				this.length && TrimIndent(this, a, b);
				return this;
			}
			Source.prototype.indexOf = function (){
				return IndexOf.apply(this, arguments);
			}
			Source.prototype.matchOf = function (re, index){
				if (index == null) index = 0;
				var m, a, b;
				if (m = this.source.match(re)){
					for (var i=index, tk; i < this.length; i++){
						tk = this[i];
						if (!tk){
							continue;
						}
						if (tk.start == m.index && tk.fileName == this.fileName){
							a = i;
						}
						if (tk.end == m.index+m[0].length && tk.fileName == this.fileName){
							b = i;
						}
						if (a != null && b != null){
							return [a, b];
						}
					}
				}
			}
			Source.prototype.delete = function (a, b){
				if (b == null) b = a;
				for (var i = a; i <= b; i++){
					this[i] = null;
				}
				return this;
			}
			Source.prototype.insert = function (pos, list){
				if (arguments.length == 1){
					list = pos, pos = this.length;
				}
				list = list.istoken ? [list] : Slice.call(list);
				var indent = this.lineIndent(pos);
				for (var i=list.length-1, t; i >= 0; i--){
					t = list[i];
					if (!t || t.type == 'EOT'){
						Splice.call(list, i, 1);
					}else if (indent > 0 && t.indent >= 0){
						t.indent += indent;
					}
				}
				list.unshift(pos, 0);
				Splice.apply(this, list);
				return this;
			}
			Source.prototype.clone = function (a, b){
				var src = new Source();
				a = typeof a != 'number' ? 0 : a;
				b = typeof b != 'number' ? this.length : b;
				for (var i = a; i < b; i++){
					if (this[i]){
						src.add(this[i]);
					}
				}
				if (b != this.length){
					src.add(this[this.length-1]);
				}
				return src;
			}
			Source.prototype.clean = function (){
				var a;
				a = -1;
				for (var i=0, token; i < this.length; i++){
					token = this[i];
					if (!token){
						continue;
					}
					if (token.type == 'EOT'){
						this[i] = null;
					}
					if (token.is('LineHead')){
						a = i;
					}
					if (token.is('LF')){
						if (a != -1){
							this.delete(a, i);
						}
						a = -1;
						continue;
					}
					if (!token.is('BlankTokn')){
						a = -1;
					}
				}
				return this.refresh().add(Token('\4'));
			}
			Source.prototype.refresh = function (){
				var target = this[this.index], a = 0, del_i = -1, del_len = 0;
				for (var i=this.length-1, token; i >= 0; i--){
					token = this[i];
					if (token){
						if (del_len){
							Splice.call(this, del_i, del_len);
						}
						del_i = -1, del_len = 0;
					}else {
						del_i = i, del_len += 1;
					}
				}
				if (del_len){
					Splice.call(this, del_i, del_len);
				}
				if (target != this[this.index]){
					this.index = this.indexOf(target);
				}
				return this;
			}
			Source.prototype.join = function (a, b){
				if (isArray(a)){
					b = a[1], a = a[0];
				}
				a = a < 0 ? this.length+a : (a || 0), b = b < 0 ? this.length+b : Math.min(b || Infinity, this.length);
				var texts = [];
				for (var i = a; i <= b; i++){
					if (this[i] && this[i].text != '\4') texts.push(this[i].text);
				}
				return texts.join('');
			}
			function TrimIndent(src, a, b){
				if (a == null) a = 0;
				if (b == null) b = src.length-1;
				var _a = a, _b = b;
				while (src[_a].is('BlankTokn', 'LF')){
					_a++;
				}
				if (_a > a){
					if (src[--_a].type != 'LF'){
						_a--;
					}
					src.delete(a, _a);
				}
				while (src[_b].is('BlankTokn', 'LF')){
					_b--;
				}
				if (_b < b){
					src.delete(++_b, b);
				}
				var min = -1;
				for (var i = a; i <= b; i++){
					if (src[i] && src[i].indent >= 0){
						if (min == -1 || src[i].indent < min){
							min = src[i].indent;
						}
					}
				}
				if (min > 0){
					for (var i = a; i <= b; i++){
						if (src[i] && src[i].indent >= 0){
							src[i].indent -= min;
							if (src[i].indent == 0){
								src[i+1].indent = src[i].indent;
								src[i++] = null;
							}else if (src[i].type == 'BlankTokn'){
								src[i].text = src[i].text.replace(/\t/g, tab_size).substr(0, src[i].indent);
							}
						}
					}
				}
				return src;
			}
			function GoIndex(ori, src, index, ig_lf, catch_comm){
				var len = src.length-1, type;
				while ((index += ori) >= 0 && index <= len){
					type = src[index] && src[index].type;
					if (!type || type == 'BlankTokn' || (!catch_comm && type == 'CommDecl') || (ig_lf && type == 'LF')){
						continue;
					}
					return index;
				}
				if (ori > 0){
					return index > len ? len : index;
				}
				return index < 0 ? 0 : index;
			}
			function IndexPair(src, s1, s2, index){
				var s1_re = new RegExp('^'+s1.replace(/([^\w\|])/g, '\\$1')+'$'),
					s2_re = new RegExp('^'+s2.replace(/([^\w\|])/g, '\\$1')+'$'),
					len = src.length,
					a = -1,
					jump = 0;
				while (index < len){
					if (src[index].text == '\\'){
						index += 2;
						continue;
					}
					if (s1_re.test(src[index].text)){
						if (a == -1){
							a = index;
						}else if (s1 == s2){
							return [a, index];
						}else {
							jump += 1;
						}
					}else if (s2_re.test(src[index].text) && a != -1){
						if (jump == 0) return [a, index];
						jump -= 1;
					}
					index += 1;
				}
			}
			return Source;
		})();
		module.exports = Source;
	});Module.register('/Users/wl/Sites/TeaJS/src/preprocess/require.tea', '../src/preprocess/require.tea', function(exports, require, module, __filename, __dirname){
		var Context = require("../src/preprocess/context.tea");
		function join(requires, main){
			var reader = main.reader, modules = [];
			for (var file in requires){
				if (!requires.hasOwnProperty(file)) continue;
				var item = requires[file];
				var key = item[0],
					ctx = item[1],
					module_write = reader.new('ModuleReg').read("Module.register('#0', '#1', function(exports, require, module, __filename, __dirname){#2});", [file, key, reader.new('NodeStam', ctx.rewriter)]);
				modules.push(module_write);
			}
			modules = reader.new('ModulePackage', requireTemplate(), reader.new('NodeStam', modules));
			main.insert(0, modules);
			return main;
		};
		function load(files, cache){
			if (cache == null) cache = {};
			for (var file in files){
				if (!files.hasOwnProperty(file)) continue;
				var key = files[file];
				if (file == 'length' || cache.hasOwnProperty(file)){
					continue;
				}
				if (debug.log){
					debug.log('** require file: '+file);
				}
				var ctx = new Context({"file": file});
				cache[file] = [key, ctx];
				if (ctx.requires.length){
					load(ctx.requires, cache);
				}
			}
			return cache;
		};
		function requireTemplate(){
			var format;
			format = function(){
				var _require, __modules, Module;
				if (!global && typeof (window) != 'undefined'){
					global = window;
				}
				_require = require;
				require = function(key){
					var mod = __modules[key];
					if (mod){
						if (mod.loaded){
							return mod.exports;
						}
						return mod.load();
					}else {
						return module.require(key);
					}
				};
				__modules = {};
				Module = function(filename, creater){
					this.id = filename;
					this.exports = {};
					this.filename = filename;
					this.loaded = false;
					this.creater = creater;
					this.require = require;
				};
				Module.prototype.load = function(){
					this.loaded = true;
					this.creater(this.exports, require, this, this.filename, this.filename.replace(/\/.+$/g, ''));
					module.constructor._cache[this.filename] = this;
					return this.exports;
				};
				Module.register = function(filename, key, creater){
					if (!(__modules.hasOwnProperty(key))){
						__modules[key] = new Module(filename, creater);
					}
				};
			};
			return '('+format.toString().replace(/^\t|^ {4}/mg, '').replace(/\s*\}\s*$/, '#}')+')();\n\n';
		}
		module.exports.join = join;
		module.exports.load = load;
	});Module.register('/Users/wl/Sites/TeaJS/src/rewriter/index.tea', '../src/rewriter/index.tea', function(exports, require, module, __filename, __dirname){
		var Reader = require("../src/rewriter/reader.tea"),
			SourceMap = require("../src/rewriter/sourcemap.tea"),
			Beautify = require("../src/rewriter/beautify.tea");
		exports.read = function(ast, ctx){
			if (!ctx) ctx = ast.context;
			var write = Reader(ctx).read(ast);
			return write;
		};
		exports.sourceMap = function(){
			return new SourceMap();
		};
	});Module.register('/Users/wl/Sites/TeaJS/src/rewriter/reader.tea', '../src/rewriter/reader.tea', function(exports, require, module, __filename, __dirname){
		var Reader = (function(){
			var Writer = require("../src/rewriter/writer.tea");
			var ES5 = require("../src/rewriter/ES5.tea");
			var pattern_cache = {};
			function Reader(ctx){
				if (this.constructor != Reader){
					return new Reader(ctx);
				}
				this.context = ctx;
			}
			Reader.prototype.new = function (type){
				var write = new Writer(this, type);
				if (arguments.length > 1){
					write.read.apply(write, Hash.slice(arguments, 1));
				}
				return write;
			}
			Reader.prototype.read = function (node, do_each){
				var res;
				if (!node){
					return;
				}
				if (!node.istoken && !node.isnode){
					return node;
				}
				if (!do_each && (res = getReader(node.type, this, node))){
					if (res.isnode){
						return this.read(res, true);
					}
					return res;
				}else if (node.isnode){
					var write = this.new(node.type);
					for (var i=0, item; i < node.length; i++){
						item = node[i];
						write.read(item);
					}
					return write;
				}else if (node.istoken){
					return node;
				}
			}
			Reader.prototype.patt = function (patt, node, write){
				var res;
				if (!(patt = getPattern(patt, node))){
					return;
				}
				if (!write) write = this.new(patt.name || node.type);
				var patt_list = patt.list;
				for (var i=0, chip; i < patt_list.length; i++){
					chip = patt_list[i];
					if (chip.ispattern){
						if (res = parsePatternAccessor.call(this, chip, node)){
							if (res.type == write.type){
								for (var j=0; j < res.length; j++){
									write.read(res[j]);
								}
							}else {
								write.read(res);
							}
						}else if (res === null && typeof patt_list[i-1] == 'string'){
							Array.prototype.pop.call(write);
						}
					}else if (chip){
						write.read(chip);
					}
				}
				return write;
			}
			Reader.compilePattern = function(source){
				var m;
				if (pattern_cache[source]){
					return pattern_cache[source];
				}
				var chips = source.replace(/ ?\| ?/g, '|').split('|'), patt = [];
				for (var i=0, chip; i < chips.length; i++){
					chip = chips[i];
					var ptn = {"condition": '', "list": [], "name": '', "source": chip};
					if (m = chip.match(/^\(\:(\w+)\)\ ?/)){
						ptn.name = m[1];
						chip = chip.substr(m[0].length);
					}
					if (m = chip.match(/^\(\?(.*?)\)\ ?/)){
						ptn.condition = compilePatternCondition(m[1]);
						chip = chip.substr(m[0].length);
					}
					while (m = chip.match(/\b([A-Z]\w+[A-Z]\w+)\(#(\d+(?:\.\d+)*)?\)|#(\d+(?:\.\d+)*)?/)){
						ptn.list.push(chip.slice(0, m.index));
						ptn.list.push(compilePatternAccessor(m, ptn.source));
						chip = chip.substr(m.index+m[0].length);
					}
					if (chip){
						ptn.list.push(chip);
					}
					patt.push(ptn);
				}
				patt.isreader = true;
				return pattern_cache[source] = patt;
			};
			function getReader(type, self, node){
				var write, reader;
				if (!reader && ES5.hasOwnProperty(type)){
					reader = ES5[type];
				}
				if (reader){
					if (typeof reader == 'function'){
						write = self.new(type);
						reader = reader.call(self, node, write) || write;
					}
					if (typeof reader == 'string' || reader.isreader){
						return self.patt(reader, node);
					}
					return reader;
				}
				if (self.context && (reader = self.context.get(type, 'statement', 'expression'))){
					return reader.read(self, node);
				}
			}
			function getPattern(patt, node){
				var item, patt = patt.isreader ? patt : Reader.compilePattern(patt);
				for (var i=0; i < patt.length; i++){
					if (!patt[i].condition){
						return patt[i];
					}
					var conds = patt[i].condition;
					for (var j=0, cond; j < conds.length; j++){
						cond = conds[j];
						item = getNodeItem(node, cond.indexs, true);
						if (item && item[cond.fn].apply(item, cond.param)){
							if (cond.logic != '&&'){
								return patt[i];
							}
						}else if (cond.logic != '||'){
							break;
						}
					}
				}
			}
			function getNodeItem(node, indexs, strict){
				var item = node;
				if (indexs){
					for (var _i=0, i; _i < indexs.length; _i++){
						i = indexs[_i];
						if (item[i]){
							item = item[i];
						}else {
							if (strict){
								return null;
							}
							break;
						}
					}
					if (item == node || !item){
						return null;
					}
				}
				return item;
			}
			function initReader(reader){
				for (var name in reader){
					if (!reader.hasOwnProperty(name)) continue;
					var ptn = reader[name];
					if (typeof ptn == 'string'){
						Reader.compilePattern(ptn);
					}
					if (/ /.test(name)){
						delete reader[name];
						for (var _i_ref = name.split(' '), _i=0, n; _i < _i_ref.length; _i++){
							n = _i_ref[_i];
							reader[n] = ptn;
						}
					}
				}
			}
			function compilePatternCondition(text){
				var m, list = [];
				while (m = text.match(/^\ *#(\d+(?:\.\d+)*)? (is|eq) (.*?)(\&\&|\|\||$)/)){
					list.push({"fn": m[2],
						"indexs": m[1] && m[1].split('.'),
						"param": m[3].trim().split(','),
						"logic": m[4]});
					if (m[4]){
						text = text.substr(m[0].length);
						continue;
					}
					break;
				}
				return list;
			}
			function compilePatternAccessor(match, source){
				var fn, index, param;
				if (fn = match[1]){
					index = match[2];
				}else {
					index = match[3];
				}
				if (index){
					index = index.split('.');
				}
				return {"fn": fn, "indexs": index, "param": param, "ispattern": true, "source": source};
			}
			function parsePatternAccessor(patt, node){
				var item, write;
				if (!(item = getNodeItem(node, patt.indexs))){
					return null;
				}
				if (!patt.fn){
					write = item.istoken || item.isnode ? this.read(item, node == item) : item;
				}else if (/^[A-Z]+$/.test(patt.fn) && this[patt.fn]){
					write = item.isnode || item.istoken ? this.read(item, node == item) : item;
					this[patt.fn](write);
				}else if (write = getReader(patt.fn, this, item)){
					return write;
				}else {
					throw tea.error(new Error(), 'writer patt has undefined function', [patt.source, -1, patt.fn]);
				}
				return write;
			}
			initReader(ES5);
			Reader.prototype.COMMA = function (write){
				return this.JOIN(write, ',');
			}
			Reader.prototype.JOIN = function (write, separator){
				if (separator == null) separator = ' ';
				for (var i = write.length-1; i >= 1; i--){
					Array.prototype.splice.call(write, i, 0, separator);
				}
				return write;
			}
			Reader.prototype.VAR = function (){
				var list = [];
				for (var i=0; i < arguments.length; i++){
					if (arguments[i]){
						list.push(this.read(arguments[i]));
					}
				}
				if (list.length){
					this.COMMA(list);
					var write = this.new('VarDecl', 'var #0', [list]);
					return write;
				}
			}
			return Reader;
		})();
		module.exports = Reader;
	});Module.register('/Users/wl/Sites/TeaJS/src/rewriter/writer.tea', '../src/rewriter/writer.tea', function(exports, require, module, __filename, __dirname){
		var Beautify = require("../src/rewriter/beautify.tea");
		var Writer = (function(){
			function Writer(reader, type){
				this.length = 0;
				this.type = type && type.type || type;
				this.reader = reader;
				this.iswriter = true;
			}
			Writer.prototype.__defineGetter__("text", function(){
				return Writer.listToText(Beautify(this));
			});
			Writer.prototype.__defineGetter__("lastText", function(){
				var last = this;
				while (true){
					if (last.istoken){
						return last.text;
					}
					if (typeof last == 'string' || typeof last == 'number'){
						return last;
					}
					if (last = last[last.length-1]){
						continue;
					}
					return null;
				}
			});
			Writer.prototype.insert = function (pos){
				var argus = [pos, 0];
				for (var i=1, item; i < arguments.length; i++){
					item = arguments[i];
					if (item.istoken || item.isnode){
						item = this.reader.read(item);
					}
					if (item){
						if (isArray(item)){
							argus.push.apply(argus, item);
						}else {
							argus.push(item);
						}
					}
				}
				Array.prototype.splice.apply(this, argus);
				return this;
			}
			Writer.prototype.add = function (){
				for (var i=0, item; i < arguments.length; i++){
					item = arguments[i];
					if (item){
						this[this.length++] = item;
					}
				}
				return this;
			}
			Writer.prototype.delete = function (a, b){
				if (b == null) b = a;
				Array.prototype.splice.call(this, a, b-a+1);
				return this;
			}
			Writer.prototype.read = function (test_patt){
				if (typeof test_patt == 'string' && /#/.test(test_patt)){
					this.reader.patt(test_patt, arguments[1], this);
				}else {
					for (var i=0, item; i < arguments.length; i++){
						item = arguments[i];
						if (!item){
							continue;
						}
						if (item.istoken || item.isnode){
							item = this.reader.read(item);
						}else if (isArray(item)){
							this.read.apply(this, item);
							continue;
						}
						if (item){
							this[this.length++] = item;
						}
					}
				}
				return this;
			}
			Writer.prototype.toList = function (not_beautify){
				if (!not_beautify){
					return Beautify(this);
				}
				var list = [];
				for (var _i=0, item; _i < this.length; _i++){
					item = this[_i];
					if (!item) continue;
					if (item.iswriter){
						list.push.apply(list, item.toList(true));
					}else {
						list.push(item);
					}
				}
				return list;
			}
			Writer.listToText = function(list){
				var texts = [];
				for (var _i=0, item; _i < list.length; _i++){
					item = list[_i];
					if (item.istoken){
						texts.push(item.text);
					}else if (item.iswriter || isArray(item)){
						texts.push(Writer.listToText(item));
					}else {
						texts.push(item);
					}
				}
				return texts.join('');
			};
			return Writer;
		})();
		module.exports = Writer;
	});Module.register('/Users/wl/Sites/TeaJS/src/rewriter/beautify.tea', '../src/rewriter/beautify.tea', function(exports, require, module, __filename, __dirname){
		function Beautify(writer){
			var shell_comm = [], list = Beautify.start(writer, null, shell_comm);
			if (shell_comm.length){
				list.unshift(shell_comm[0], '\n');
			}
			return list;
		}
		Beautify.start = function(writer, not_concat, shell_comm){
			var w_list = [];
			for (var i=0, item; i < writer.length; i++){
				item = writer[i];
				switch (item.type){
					case 'CommDecl':
						if (item[0]){
							item = item[0];
						}
						if (item.is('ShellComm')){
							if (shell_comm){
								shell_comm.push(item);
							}
							if (writer[i+1] == '\n'){
								i++;
							}
							continue;
						}
						break;
					case 'VarDecl':case 'LetDecl':
						item = this.varList(item);
						i = this.concatVarList(writer, i, item);
						item = this.wrapList(item, writer.constructor.listToText(item));
						break;
					case 'JsonExpr':case 'ArrayExpr':
						item = this.start(item, true, shell_comm);
						item = this.wrapList(item, writer.constructor.listToText(item));
						break;
					case 'NodeStam':
						item = this.start(item, null, shell_comm);
						if (item.length && writer.type != 'Root'){
							this.indentList(item);
							this.trimList(item).unshift('\n\t');
							item.push('\n');
						}
						break;
					default:
						if (item.iswriter){
							item = this.start(item, null, shell_comm);
						}else if (item == ','){
							item = ', ';
						}
						break;
				}
				w_list.push(item);
			}
			if (not_concat){
				return w_list;
			}
			return this.concatList(w_list);
		};
		Beautify.indentList = function(list){
			for (var i=0, item; i < list.length; i++){
				item = list[i];
				if (item.istoken){
					if (item.type != 'StringTokn'){
						item.text = item.text.replace(/\n/g, '\n\t');
					}
				}else if (typeof item == 'string'){
					list[i] = item.replace(/\n/g, '\n\t');
				}
			}
			return list;
		};
		Beautify.wrapList = function(list, text){
			if (text.length > 80 || /\n/.test(text)){
				for (var i=0, item; i < list.length; i++){
					item = list[i];
					if (/^\s*,\s*$/.test(item)){
						list[i] = ',\n';
					}
				}
				list = this.concatList(list);
				this.indentList(list);
			}
			return list;
		};
		Beautify.varList = function(writer){
			var list = [];
			for (var i=0, item; i < writer.length; i++){
				item = writer[i];
				if (item.type == 'ArgumentsDecl'){
					list.push.apply(list, this.start(item, true));
				}else if (item.iswriter){
					list.push(this.start(item));
				}else if (item == ','){
					list.push(', ');
				}else {
					list.push(item);
				}
			}
			return list;
		};
		Beautify.concatVarList = function(writer, index, list){
			var _b, b = index;
			while (true){
				_b = b+1;
				while (typeof writer[_b] == 'string' && /^[;|\n|\s]+$/.test(writer[_b])){
					_b += 1;
				}
				if (writer[_b] && /LetDecl|VarDecl/.test(writer[_b].type)){
					list.push(', ');
					list.push.apply(list, this.trimList(this.varList(writer[_b]), /^(var\ |var\b|\ )/, /(;|\n)$/));
					b = _b;
					continue;
				}
				break;
			}
			return b;
		};
		Beautify.concatList = function(list){
			var res_list = [];
			for (var _i=0, item; _i < list.length; _i++){
				item = list[_i];
				if (isArray(item)){
					res_list.push.apply(res_list, item);
				}else {
					res_list.push(item);
				}
			}
			return res_list;
		};
		Beautify.trimList = function(list, left, right){
			if (left == null) left = /^\s+/;
			if (right == null) right = /\s+$/;
			if (left){
				this.trimLeft(list, left);
			}
			if (right){
				this.trimRight(list, right);
			}
			return list;
		};
		Beautify.trimLeft = function(list, re){
			if (re == null) re = /^\s+/;
			while (list[0]){
				if (list[0].istoken){
					if (!(list[0].text = list[0].text.replace(re, ''))){
						list.shift();
						continue;
					}
				}else if (typeof list[0] == 'string'){
					if (!(list[0] = list[0].replace(re, ''))){
						list.shift();
						continue;
					}
				}else if (list.hasOwnProperty('length')){
					if (this.trimLeft(list[0], re).length == 0){
						list.shift();
						continue;
					}
				}
				break;
			}
			return list;
		};
		Beautify.trimRight = function(list, re){
			if (re == null) re = /\s+$/;
			var last;
			while (list[last = list.length-1]){
				if (list[last].istoken){
					if (!(list[last].text = list[last].text.replace(re, ''))){
						list.pop();
						continue;
					}
				}else if (typeof list[last] == 'string'){
					if (!(list[last] = list[last].replace(re, ''))){
						list.pop();
						continue;
					}
				}else if (list.hasOwnProperty('length')){
					if (this.trimRight(list[last], re).length == 0){
						list.pop();
						continue;
					}
				}
				break;
			}
			return list;
		};
		module.exports = Beautify;
	});Module.register('/Users/wl/Sites/TeaJS/src/rewriter/ES5.tea', '../src/rewriter/ES5.tea', function(exports, require, module, __filename, __dirname){
		var ES5 = {'CommaExpr CommaStam ArgumentsDecl' : 'COMMA(#)',
				'ArgumentsExpr CompelExpr ConditionStam' : '\(COMMA(#)\)',
				'ParamsStam ParamsExpr' : '\(ParamsPatt(#)\)',
				'ArrayExpr' : '\[COMMA(#)\]',
				'JsonExpr' : '\{COMMA(#)\}',
				'PrefixExpr PostfixExpr' : '#0#1',
				'ReturnStam BreakStam ContinueStam ThrowStam' : '#0 #1',
				'DotExpr' : '.#0',
				'DebuggerStam' : '#0',
				'FunctionDecl' : '#0 #1#2#3',
				'FunctionExpr' : '#0#1#2',
				'ExportDecl' : '#1',
				'IfPatt' : '#0 #1#2',
				'ElseIfPatt' : '#0 if #1#2',
				'ElsePatt' : '#0 #1',
				'WhileStam' : '#0 #1#2',
				'WithStam' : '#0 #1#2',
				'TryPatt' : '#0 #1',
				'CatchPatt' : '#0 #1 #2',
				'FinallyPatt' : '#0 #1',
				'ThisExpr' : 'this#1',
				'LabelStam' : '#0#1 #2',
				'ForBaseConditionPatt' : '(#0; #1; #2)',
				'ForInConditionPatt' : '(#0 #1 #2)',
				'UnaryExpr' : '(? #0 eq +) Math.abs(#1) | (? #0 is SymbolTokn) #0#1 | #0 #1',
				'NotExpr' : '(? #1 is ValueExpr) !#0 | !(#1)',
				'TernaryExpr' : '(? #2 is ExprStam && #4 is ExprStam) #0 #1 #2 #3 #4 | if (#0) #2; else #4',
				'LambdaExpr' : '(? #1 is ReturnStam) function#0{#1} | function#0{return #1}',
				'Root' : 'NodeStam(#0)',
				'BlockStam IndentBlockStam LineBlockStam StamBlockStam' : '{NodeStam(#)}'};
		ES5.TestPatt = function(node, __write){
			if (tea.argv['--test']){
				__write.add(node);
			}
		};
		ES5.CommDecl = function(node, __write){
			if (!tea.argv['--clear'] || node.text[0] == '#'){
				__write.add(node);
			}
		};
		ES5.IdentifierExpr = function(node, __write){
			var let_name, id = node[0], scope = node.scope;
			if (let_name = scope.getLet(id.text)){
				id.text = let_name;
			}else if (this.class_scope){
				switch (scope.isDefined(id.text)){
					case 'static':case 'unknow':
						if (this.class_scope.variables[id.text] == 'static'){
							id.text = this.class_scope.name+'.'+id.text;
						}
						break;
				}
			}
			__write.read(id);
		};
		ES5.ComputeExpr = function(node, __write){
			var list = [];
			for (var i=0; i < node.length; i++){
				switch (node[i].istoken && node[i].text){
					case '**':
						list.push('Math.pow(', list.pop(), ', ', node[++i], ')');
						break;
					case '\\':
						list.push('Math.floor(', list.pop(), '/', node[++i], ')');
						break;
					default:
						list.push(node[i]);
						break;
				}
			}
			__write.read(list);
		};
		ES5.CompareExpr = function(node, __write){
			var list = [];
			if (node.length == 5 && node[3].eq('<', '>', '>=', '<=')){
				return '#0 #1 #2 && #2 #3 #4';
			}
			for (var i=0; i < node.length; i++){
				switch (i%2 && node[i].text){
					case 'as':
						if (node[i+1].type == 'StringTokn'){
							list.push('typeof ', list.pop(), ' == ', node[++i]);
						}else {
							list.push(' instanceof ', node[++i]);
						}
						break;
					case 'in':
						if (node[i+1].type == 'ArrayExpr'){
							list.push(node[++i], '.indexOf(', list.pop(), ')>=0');
						}else {
							list.push(node[++i], '.hasOwnProperty(', list.pop(), ')');
						}
						break;
					case 'of':
						list.push('[].indexOf.call(', node[++i], ', ', list.pop(), ')>=0');
						break;
					case 'is':
						node[i].text = ' === ';
						list.push(node[i]);
						break;
					case 'not is':
						node[i].text = ' !== ';
						list.push(node[i]);
						break;
					default:
						if (i%2){
							node[i].text = ' '+node[i].text+' ';
						}
						list.push(node[i]);
						break;
				}
			}
			__write.read(list);
		};
		ES5.LogicExpr = function(node, __write){
			var i;
			for (i = 1; i < node.length; i += 2){
				switch (node[i].text){
					case 'and':
						node[i].text = '&&';
						break;
					case 'or':
						node[i].text = '||';
						break;
				}
			}
			if (node.length == 3){
				if (node[2].is('ExprStam')){
					return '#0 #1 #2';
				}
				if (node.parent.is('NodeStam')){
					if (node[1].text == '||'){
						if (node[0].is('ValueExpr')){
							return 'if (!#0) #2';
						}
						return 'if (!(#0)) #2';
					}
					return 'if (#0) #2';
				}
				return '#0 #1 (#2)';
			}
			__write.read(this.JOIN(Hash.slice(node), ' '));
		};
		ES5['Ternary2.5Expr'] = function(node, __write){
			if (node.parent.is('NodeStam')){
				return 'if (#0) #2';
			}else {
				if (!node[0].is('ValueExpr')){
					var ref = allocateRefName(node.scope);
					return '(('+ref+' = #0) != null ? '+ref+' : #2)';
				}
			}
			return '(#0 != null ? #0 : #2)';
		};
		ES5.SeleteStam = function(node, __write){
			switch (node[1].text){
				case 'if':case '<-':
					return 'if (#2) #0';
				case 'or':case '||':
					if (node[0].is('ValueExpr')){
						return 'if (!#0) #2';
					}
					return 'if (!(#0)) #2';
				default:
					return 'if (#0) #2';
			}
		};
		ES5.AssignmentExpr = function(node, __write){
			var left = node[0], right = node[2];
			if (left.type == 'ArrayPatt'){
				return assignmentArrayPatt.call(this, __write, left, right, node);
			}else if (left.type == 'AccessorPatt' && left[left.length-1].type == 'SlicePatt'){
				return assignmentSlicePatt.call(this, __write, left, right, node);
			}else if (node.parent.type == 'ArgumentsExpr'){
				return left;
			}else {
				switch (node[1].text){
					case '?=':
						if (node.parent && node.parent.is('NodeStam')){
							return 'if (#0 == null) #0 = #2';
						}
						return '(#0 == null && (#0 = #2))';
					case '|=':
						if (node.parent && node.parent.is('NodeStam')){
							return 'if (!#0) #0 = #2';
						}
						return '(!#0 && (#0 = #2))';
				}
			}
			if (node.parent.type == 'JsonExpr'){
				if (node[0].is('IdentifierTokn')){
					return '"#0"#1 #2';
				}
			}
			return '#0 #1 #2';
		};
		ES5.AssignmentDecl = ES5.AssignmentExpr;
		ES5.ParamsPatt = function(node, __write){
			for (var i=0, item; i < node.length; i++){
				item = node[i];
				if (item.istoken && item.text == ','){
					__write.add('null');
				}else {
					__write.read(item);
				}
			}
			this.COMMA(__write);
		};
		ES5.SlicePatt = function(node, __write){
			var ab = accessorSlicePatt.call(this, node);
			if (!ab[1]){
				__write.read('.slice(', ab[0] || '', ')');
			}else {
				__write.read('.slice(', ab[0] || '0', ', ', ab[1], ')');
			}
		};
		ES5.MemberExpr = function(node, __write){
			if (node[0].type == 'UnaryExpr' && node[0][0].text == '-'){
				var parent = node.parent.clone();
				parent.length = node.index;
				if (parent){
					__write.read('[#0.length#1]', [parent, node[0]]);
				}
			}else {
				__write.read('[', node[0], ']');
			}
		};
		ES5.MemberPatt = function(node, __write){
			switch (node[0].text){
				case '::':
					node[0].text = '.prototype';
					break;
				case '..':
					node[0].text = '.constructor';
					break;
			}
			return '#0.#1';
		};
		ES5.LetDecl = function(node, __write){
			node[0].text = 'var';
			resetDefineVariableDecl(node[1], node.scope, 'let', 'let_');
			return '#0 #1';
		};
		ES5.VarDecl = function(node, __write){
			resetDefineVariableDecl(node[1], node.scope, 'defined');
			return '#0 #1';
		};
		ES5.DoWhileStam = function(node, __write){
			if (node[2]){
				return '#0 #1 #2 #3';
			}else {
				return '#0{NodeStam(#1)break;} while (true)';
			}
		};
		ES5.TryStam = function(node, __write){
			if (node.length > 1){
				return '#';
			}else {
				return '# catch (_e){}';
			}
		};
		ES5.SwitchStam = function(node, __write){
			var block = node[2],
				block_body = this.new('NodeStam'),
				exp_cache = [],
				case_write,
				sub_block;
			for (var _i=0, item; _i < block.length; _i++){
				item = block[_i];
				if (!case_write) case_write = this.new(item.type);
				if (item.type == 'CaseStam'){
					for (var _j=0, key; _j < item[1].length; _j++){
						key = item[1][_j];
						case_write.read(item[0], ' ', key, ':');
					}
					sub_block = item[3];
				}else {
					case_write.read(item[0], ':');
					sub_block = item[2];
				}
				if (sub_block){
					var sub_write = ES5.SwitchCaseBlock.call(this, sub_block, this.new('NodeStam'));
					block_body.read(case_write.read(sub_write));
					case_write = null, sub_block = null;
				}
			}
			__write.read(node[0], ' ', node[1], this.new(block.type, '{', block_body, '}'));
		};
		ES5.SwitchCaseBlock = function(node, __write){
			var last = node.length-1;
			while (node[last] && node[last].is('CommDecl')){
				last -= 1;
			}
			var insert_break = true;
			if (node[last] && node[last].is('ReturnStam', 'BreakStam', 'ContinueStam')){
				if (node[last].type == 'ContinueStam'){
					node[last] = null;
				}
				insert_break = false;
			}
			ES5.NodeStam.call(this, node, __write);
			if (insert_break){
				__write.read('\nbreak;');
			}
			return __write;
		};
		ES5.forCondition = function(node, __write){
			var scope = node.scope,
				exp1 = node[0],
				exp2 = node[1],
				exp3 = node[2],
				$mark = exp2 && exp2.text || '->',
				$var,
				$i,
				$i_text,
				$def,
				$temp,
				$len,
				$tar,
				$tar_exp;
			if (exp1.type == 'VarDecl'){
				$var = true, exp1 = exp1[1];
			}
			if (!exp3){
				exp3 = exp1, exp1 = null;
			}
			if (exp1){
				switch (exp1.type){
					case 'CommaExpr':case 'ArgumentsDecl':
						$i = exp1[0], $temp = exp1[1];
						break;
					default:
						$i = exp1;
						break;
				}
			}
			if ($i){
				if ($i.type == 'AssignmentDecl' || $i.type == 'AssignmentExpr'){
					$def = $i[2], $i = $i[0];
				}else if ($i.type == 'ConstTokn'){
					$def = $i, $i = null;
				}
				if ($i){
					if ($i.type == 'IdentifierExpr'){
						$i = $i[0];
					}
					if ($i.type != 'IdentifierTokn'){
						tea.throw('for condition(3) statiment syntax error!', $i);
					}
					if (/\=|of/.test($mark)){
						$temp = $i, $i = null;
					}
				}
			}
			if (!$i){
				$var = true, $i = allocateVarName(scope);
			}
			$i_text = $i.text || $i;
			var def_type = scope.isDefined($i_text);
			$var = $var || !def_type || def_type == 'let';
			if (exp3.type == 'CommaExpr' && exp3.length == 1){
				exp3 = exp3[0];
			}
			switch (exp3.is('ArrayExpr', 'JsonExpr', 'AccessorExpr', 'IdentifierExpr', 'AtExpr', 'NumTokn')){
				case 'AccessorExpr':case 'IdentifierExpr':case 'AtExpr':
					$tar = exp3;
					break;
				case 'NumTokn':
					$len = this.new('NumTokn').read(exp3);
					break;
				default:
					$tar = $i_text+'_ref';
					$tar_exp = this.new('AssignmentExpr').read($tar, ' = ', exp3);
					break;
			}
			$len = $len || this.new('AssignmentExpr').read($tar, '.length');
			$tar = this.new('IdentifierExpr').read($tar);
			$i = this.new('IdentifierExpr').read($i);
			return [$mark, $var, $i, $def, $temp, $len, $tar, $tar_exp];
		};
		ES5.ForStam = function(node, __write){
			var block_body, condition = node[1];
			if (condition.type == 'ForBaseConditionPatt'){
				return '#0 #1#2';
			}
			var scope = node.scope,
				_ref = ES5.forCondition.call(this, condition), $mark = _ref[0], $var = _ref[1], $i = _ref[2], $def = _ref[3], $temp = _ref[4], $len = _ref[5], $tar = _ref[6], $tar_exp = _ref[7];
			scope.setLet('__length', $len.text);
			scope.setLet('__index', $i.text);
			scope.setLet('__target', $tar.text);
			var cond_body = this.new('ConditionBody');
			block_body = this.new('NodeStam');
			if (/in|of/.test($mark)){
				cond_body.read($var ? 'var ' : '', $i, ' in ', $tar);
				if ($tar_exp){
					__write.read(this.VAR($tar_exp), ';\n');
				}
				block_body.add(this.new('IfStam', 'if (!#0.hasOwnProperty(#1)) continue;\n', [$tar, $i]));
				if ($temp){
					block_body.add(this.new('AssignmentExpr', 'var #0 = #1[#2];\n', [$temp, $tar, $i]));
				}
			}else {
				if ($mark[0] == '<'){
					if ($def = $def || [$tar, '.length-1']){
						$def = [$i, '=', $def];
					}
					cond_body.read('#0; #1 >= #2; #1--', [this.VAR($tar_exp, $def, $temp), $i, '0']);
				}else {
					if ($def = $def || $var && '0'){
						$def = [$i, '=', $def];
					}
					cond_body.read('#0; #1 < #2; #1++', [this.VAR($tar_exp, $def, $temp), $i, $len]);
				}
				if ($temp){
					block_body.add(this.new('AssignmentExpr', '#0 = #1[#2];\n', [$temp, $tar, $i]));
				}
			}
			ES5.NodeStam.call(this, node[2], block_body);
			__write.add(node[0], ' ', this.new('ForConditionPatt', '(', cond_body, ')'), this.new(node[2].type, '{', block_body, '}'));
		};
		ES5.PackageExpr = function(node, __write){
			if (node.length == 2){
				return '(function()#1)()';
			}
			var params = this.new('ParamsExpr'),
				argus = this.new('ArgumentsExpr'),
				has_ass = false;
			if (node[1].length){
				resetDefineVariableDecl(node[1], node.scope, 'argument');
				for (var i=0, item; i < node[1].length; i++){
					item = node[1][i];
					if (item.type == 'AssignmentDecl'){
						has_ass = true;
						argus.read(item[0]);
						params.read(item[2]);
					}else {
						argus.read('_'+i);
						params.read(item);
					}
				}
			}
			__write.read('(function(#0)#1)(#2)', [this.COMMA(argus), node[2], this.COMMA(params)]);
		};
		ES5.ClassExpr = function(node, __write){
			var _i = 1, scope = node.scope, name, extend, block, is_ass = false;
			if (node[_i].type == 'IdentifierTokn'){
				name = node[_i++];
			}
			if (node[_i].type == 'ExtendsExpr'){
				extend = node[_i++];
			}
			if (!name){
				if (node.parent.type == 'AssignmentDecl'){
					is_ass = true;
					name = node.parent[0];
				}else if (node.parent.type == 'AssignmentExpr'){
					is_ass = true;
					name = node.parent[0][0];
				}
			}
			if (!name){
				throw tea.error(new Error(), 321, node[0]);
			}
			scope.name = name.text;
			block = node[_i];
			var old_scope = this.class_scope;
			this.class_scope = scope;
			var block_write = this.new('NodeStam');
			ES5.NodeStam.call(this, block, block_write);
			_i = 0;
			for (; _i < block_write.length; _i++){
				if (block_write[_i].type){
					if (/VarDecl|LetDecl|Assignment|Require/.test(block_write[_i].type)){
						continue;
					}
				}else if (typeof block_write[_i] == 'string' && /\s*(\n|;|,)\s*/.test(block_write[_i])){
					continue;
				}
				break;
			}
			if (extend){
				block_write.insert(_i, ES5.ExtendsExpr.call(this, extend));
			}
			var construct_write = this.new('ConstructorStam'),
				construct_body = this.new('NodeStam');
			if (scope.inits.length){
				construct_body.read(scope.inits);
			}
			if (scope.construct){
				ES5.NodeStam.call(this, scope.construct[2], construct_body);
				construct_write.read('function #0#1{#2}\n', [name, scope.construct[1], construct_body]);
			}else {
				construct_write.read('function #0(){#1}\n', [name, construct_body]);
			}
			block_write.insert(_i, construct_write);
			block_write.read('\nreturn #0;', [name]);
			if (is_ass){
				__write.read('(function(){#0})()', [block_write]);
			}else {
				__write.read('var #1 = (function(){#0})()', [block_write, name]);
			}
			this.class_scope = old_scope;
		};
		ES5.ExtendsExpr = function(node, __write){
			if (!__write) __write = this.new('ExtendsExpr');
			var scope = node.scope, name = scope.name, list = node[1];
			__write.read('#0.prototype = new #1();\n#0.prototype.constructor = #0;\n#0.prototype.__super__ = #1.prototype;\n', [name, list[0]]);
			if (list.length > 1){
				__write.read('#0.__extends = function(){\n    for (var i=0; i<arguments.length; i++){\n        var _super = arguments[i].prototype;\n        for (var name in _super)\n            if (_super[name].hasOwnProperty(name))\n                this.prototype[name] = _super[name];\n    }\n};\n#0.__extends(COMMA(#1));\n', [name, Hash.slice(list, 1)]);
			}
			return __write;
		};
		ES5.SuperExpr = function(node, __write){
			var acc = node[0], pam = node[1], supe = acc[0];
			supe.text = 'this.__super__';
			if (acc.length == 1){
				supe.text += '.'+(node.scope.name || 'constructor');
			}
			if (pam){
				var pam_write = this.read(pam);
				pam_write[1].insert(0, 'this', ', ');
				__write.read(acc, '.call', pam_write);
			}else {
				return '#0.call(this, arguments)';
			}
		};
		ES5.AtExpr = function(node, __write){
			var scope = node.scope;
			if (scope.type == 'ClassExpr'){
				node[0].text = scope.name;
			}else {
				scope = scope.queryParent('ClassExpr');
				if (scope && classStaticAtSymbol(scope, node)){
					node[0].text = scope.name;
				}else {
					node[0].text = 'this';
				}
			}
			return '#';
		};
		ES5.SetterDecl = function(node, __write){
			if (node.parent.type == 'JsonExpr'){
				return '#0 #1#2#3';
			}
			var class_scope = node.scope.parent;
			if (class_scope.type == 'ClassExpr'){
				var type = node.type == 'SetterDecl' ? '__defineSetter__' : '__defineGetter__';
				if (node.length < 4){
					__write.read('#0.prototype.'+type+'("#1", function()#2)', [class_scope.name, node[1], node[2]]);
				}else {
					__write.read('#0.prototype.'+type+'("#1", function#2#3)', [class_scope.name, node[1], node[2], node[3]]);
				}
			}
		};
		ES5.GetterDecl = ES5.SetterDecl;
		ES5.MethodDecl = function(node, __write){
			if (node.parent.type == 'JsonExpr'){
				return '"#0": function#1#2';
			}
			var scope = node.scope, class_scope = scope.parent;
			switch (class_scope.type){
				case 'ClassExpr':
					var class_name = class_scope.name;
					if (scope.name == 'constructor'){
						class_scope.construct = node;
						return '';
					}else {
						__write.read('#0.prototype.#1 = function #2#3', [class_name, node[0], node[1], node[2]]);
					}
					break;
				default:
					return 'function #0#1#2';
			}
		};
		ES5.StaticDecl = function(node, __write){
			var class_scope = node.scope;
			if (class_scope.type != 'ClassExpr'){
				class_scope = class_scope.parent;
			}
			var exp = node[1];
			if (exp.type == 'ArgumentsDecl'){
				for (var i=0, item; i < exp.length; i++){
					item = exp[i];
					if (item.type == 'AssignmentDecl'){
						__write.read('#0.#1 #2 #3;', [class_scope.name, item[0], item[1], item[2]]);
					}else {
						__write.read('#0.#1 = null;', [class_scope.name, item]);
					}
					if (i < exp.length-1){
						__write.add('\n');
					}
				}
			}else {
				__write.read('#0.#1 = function#2#3;', [class_scope.name, exp[0], exp[1], exp[2]]);
			}
		};
		ES5.ProtoDecl = function(node, __write){
			var class_scope = node.scope.queryParent('ClassExpr');
			if (!class_scope){
				throw tea.error(new Error(), 325, node[0]);
			}
			var exp = node[1], class_name = class_scope.name;
			if (exp.type == 'ArgumentsDecl'){
				for (var i=0, item; i < exp.length; i++){
					item = exp[i];
					if (item.type == 'AssignmentDecl'){
						__write.read('#0.prototype.#1 #2 #3;', [class_name, item[0], item[1], item[2]]);
					}else {
						__write.read('#0.prototype.#1 = null;', [class_name, item]);
					}
					if (i < exp.length-1){
						__write.add('\n');
					}
				}
			}else {
				__write.read('#0.prototype.#1 = function#2#3;', [class_name, exp[0], exp[1], exp[2]]);
			}
		};
		ES5.InitDecl = function(node, __write){
			var class_scope = node.scope;
			if (class_scope.type != 'ClassExpr'){
				throw tea.error(new Error(), 326, node[0]);
			}
			var exp = node[1], write = this.new('InitDecl');
			if (exp.type == 'ArgumentsDecl'){
				for (var i=0, item; i < exp.length; i++){
					item = exp[i];
					if (item.type == 'AssignmentDecl'){
						write.read('this.#0 #1 #2;\n', item);
					}else {
						write.read('this.# = null;\n', item);
					}
				}
			}else {
				write.read('this.#0 = function#1#2;\n', exp);
			}
			class_scope.inits.push(write);
			return '';
		};
		ES5.RequireStam = function(node, __write){
			var format,
				type,
				write,
				_format,
				scope = tea.argv['--join'] ? node.scope.root : 0,
				params = parseRequire(node[1], scope);
			if (params.length > 1){
				if (node.parent.is('AssignmentDecl', 'AssignmentExpr')){
					if (node.parent[0].type == 'ArrayExpr'){
						format = '#0(#1)';
						type = 'arr';
						write = this.new('ArrayExpr');
					}else {
						format = '"#2": #0(#1)';
						type = 'json';
						write = this.new('JsonExpr');
					}
				}else {
					format = 'var #2 = #0(#1)';
					type = 'var';
					write = this.new('VarExpr');
				}
			}else {
				write = __write;
				format = '#0(#1)';
			}
			for (var i=0; i < params.length; i++){
				_format = params[i].name ? format : '#0(#1)';
				write.read(this.new('RequireExpr', _format, [node[0], params[i].expr, params[i].name]));
			}
			switch (type){
				case 'var':
					__write.read(this.JOIN(write, ';\n'));
					break;
				case 'json':
					__write.read('{', this.JOIN(write, ', '), '}');
					break;
				case 'arr':
					__write.read('[', this.JOIN(write, ', '), ']');
					break;
			}
		};
		ES5.NodeStam = function(node, __write){
			var res;
			if (!__write) __write = this.new('NodeStam');
			var len = node.length-1;
			for (var i=0, item; i < node.length; i++){
				item = node[i];
				res = this.read(item);
				if (res && (res.istoken || res.length)){
					__write.add(res);
					if (item.type != 'CommDecl' && (item.is('AssignmentExpr', 'ClausesStam', 'CommaStam') || !/(\}|;)$/.test(res.lastText))){
						__write.add(';');
					}
					if (i < len){
						__write.add('\n');
					}
				}
			}
			nodeVarSafety.call(this, node, __write);
			return __write;
		};
		function nodeVarSafety(node, __write){
			var argv = tea.argv || {}, scope = node.scope, a = 0;
			while (__write[a] && (__write[a].type == 'CommDecl' || __write[a] == '\n')){
				a += 1;
			}
			if (!argv['--safe']){
				var un_defineds = scope.get('undefined');
				if (un_defineds && un_defineds.length){
					__write.insert(a, this.VAR.apply(this, un_defineds), ';\n');
				}
			}
			var argus = scope.argumentsDefine;
			if (argus && argus.length){
				var write = this.new('ArgumentsStam');
				for (var i=0; i < argus.length; i++){
					write.read('if (#0 == null) #0 #1 #2;\n', argus[i]);
				}
				__write.insert(0, write);
			}
			var exts = scope.exports;
			if (exts && exts.length){
				var write = this.new('ExportStam');
				for (var i=0; i < exts.length; i++){
					write.add('\nmodule.exports.'+exts[i]+' = '+exts[i]+';');
				}
				__write.add(write);
			}
		}
		function assignmentSlicePatt(__write, left, right, node){
			left.length -= 1;
			if (left[left.length].length == 0){
				__write.read('#0.push(#1)', [left, right]);
			}else {
				var ab = accessorSlicePatt.call(this, left[left.length], true);
				__write.read('#0.splice.apply(#0, [#1, #2].concat(#3))', [left, ab[0], ab[1], right]);
			}
		}
		function assignmentArrayPatt(__write, left, right, node){
			var ref;
			if (right.type == 'ArrayExpr'){
				for (var i=0; i < left.length; i++){
					if (i > 0){
						__write.add(', ');
					}
					if (right[i]){
						__write.read('#0 #1 #2', [left[i], node[1], right[i]]);
					}else {
						throw tea.error(new Error(), 'array pattern assignment declaration syntax error', right[i-1]);
					}
				}
			}else {
				if (right.is('IdentifierExpr')){
					ref = right;
				}else {
					var ref = allocateRefName(node.scope);
					if (node.parent.parent.type == 'VarDecl'){
						node.scope.set('defined', ref, true);
					}
					__write.read(this.new('AssignmentExpr', '#0 = #1', [ref, right]));
				}
				for (var i=0; i < left.length; i++){
					__write.read(this.new('AssignmentExpr', '#0 #1 #2[#3]', [left[i], node[1], ref, i+'']));
				}
				this.COMMA(__write);
			}
		}
		function accessorSlicePatt(node, count_b){
			var a, b;
			if (node.length == 3){
				a = node[0], b = node[2];
			}else if (node.length == 2){
				if (node[0].text == ':'){
					a = 0, b = node[1];
				}else {
					a = node[0], b = 0;
				}
			}else if (node.length >= 1){
				a = 0, b = 0;
			}
			if (count_b){
				var parent = node.parent, write = this.new('AccessorExpr');
				if (b){
					write.type = 'ComputeExpr';
					if (b[0] && b[0].text == '-'){
						write.read(parent, '.length', b);
					}else {
						write.read(b, '-', a);
					}
					b = write;
				}else {
					b = write.read(parent, '.length');
				}
			}
			return [a, b];
		}
		function resetDefineVariableDecl(decl_list, scope, type, prefix){
			for (var i=0, left; i < decl_list.length; i++){
				left = decl_list[i];
				if (left.type == 'AssignmentDecl'){
					left = left[0];
				}
				if (left.type == 'ArrayPatt'){
					for (var _i=0, item; _i < left.length; _i++){
						item = left[_i];
						item.text = resetDefine(scope, type, item.text, prefix);
					}
				}else if (left.istoken){
					left.text = resetDefine(scope, type, left.text, prefix);
				}else {
					decl_list[i] = resetDefine(scope, type, decl_list[i], prefix);
				}
			}
		}
		function resetDefine(scope, type, name, prefix){
			scope.set(type, name, true);
			if (prefix){
				if (type == 'let'){
					scope.lets[name] = prefix+name;
				}
				return prefix+name;
			}
			return name;
		}
		function allocateVarName(scope){
			var keymap = 'ijklmnopqrstuvwxyz';
			for (var i=0; i < keymap.length; i++){
				if (!scope.isDefined('_'+keymap[i])){
					var key = '_'+keymap[i];
					scope.set('let', key);
					return key;
				}
			}
			return '__i';
		}
		function allocateRefName(scope){
			var i = 0, name = '_ref', stat = scope.isDefined(name, null, 1);
			while (true){
				if (!stat || stat == 'let'){
					scope.set('undefined', name);
					return name;
				}
				name += i++;
				stat = scope.isDefined(name, null, 1);
			}
		}
		function classStaticAtSymbol(clas_scope, node){
			if (clas_scope.type = 'ClassExpr'){
				if (node.length > 1 && node[1].type == 'DotExpr'){
					var member = node[1][0];
					if (member.type == 'IdentifierTokn' && clas_scope.statics.indexOf(member.text) != -1){
						var name = member.text;
						if (clas_scope.protos.indexOf(name) == -1){
							return name;
						}
					}
				}
			}
			return false;
		}
		function parseRequire(node, scope){
			var list = [], root_dir = node.root.filePath || '';
			for (var i=0, item; i < node.length; i++){
				item = node[i];
				if (item.is('StringTokn')){
					if (scope && Path.isPathText(item.text)){
						var files = Path.parseFile(item.text, root_dir, ['.js', '.tea']);
						if (!files.error){
							for (var _i=0, file; _i < files.length; _i++){
								file = files[_i];
								list.push({"name": parseRequireName(file),
									"expr": item.clone('"'+scope.addRequire(file)+'"'),
									"file": file});
							}
							continue;
						}
						if (debug.log){
							debug.log('** [Require: Can not join file: '+item.text+']');
						}
					}
					list.push({"name": parseRequireName(item.text), "expr": item, "file": ''});
				}else {
					list.push({"name": '', "expr": item, "file": ''});
				}
			}
			return list;
		}
		function parseRequireName(file){
			return Text.getName(file);
		}
		module.exports = ES5;
	});Module.register('/Users/wl/Sites/TeaJS/src/rewriter/sourcemap.tea', '../src/rewriter/sourcemap.tea', function(exports, require, module, __filename, __dirname){
		var SourceMap = (function(){
			var VLQ_SHIFT, VLQ_CONTINUATION_BIT, VLQ_VALUE_MASK, BASE64_CHARS;
			VLQ_SHIFT = 5;
			VLQ_CONTINUATION_BIT = 1<<VLQ_SHIFT;
			VLQ_VALUE_MASK = VLQ_CONTINUATION_BIT-1;
			BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
			function SourceMap(){
				this.version = 3;
				this.file = '';
				this.sourceRoot = '';
				this.names = [];
				this._sources = [];
				this._mappings = [];
			}
			SourceMap.prototype.__defineGetter__("sources", function(){
				var ss = [], dir = Path.dirname(this.file);
				for (var _i=0, file; _i < this._sources.length; _i++){
					file = this._sources[_i];
					ss.push(Path.relative(dir, file));
				}
				return ss;
			});
			SourceMap.prototype.__defineGetter__("mappings", function(){
				return this._mappings.join('');
			});
			SourceMap.prototype.addSource = function (file){
				var i = this._sources.indexOf(file);
				if (i == -1){
					return this._sources.push(file)-1;
				}
				return i;
			}
			SourceMap.prototype.addName = function (name){
				var i = this.names.indexOf(name);
				if (i == -1){
					return this.names.push(name)-1;
				}
				return i;
			}
			SourceMap.prototype.parse = function (writer, src){
				var loc,
					vlq,
					m,
					line = '',
					line_num = 1,
					add_comma,
					last_vlq,
					last_col = 0,
					last_loc_line = 1,
					last_loc_col = 0;
				for (var i_ref = writer.toList(), i=0, item; i < i_ref.length; i++){
					item = i_ref[i];
					if (item.istoken){
						if (item.location && item.location.fileName){
							loc = item.location;
							vlq = SourceMap.encodeVlq(line.length-last_col, this.addSource(loc.fileName), loc.lineNumber-last_loc_line, loc.columnNumber-last_loc_col);
							if (add_comma) this._mappings.push(','); else add_comma = true;
							this._mappings.push(vlq);
							last_vlq = vlq;
							last_col = line.length;
							last_loc_line = loc.lineNumber;
							last_loc_col = loc.columnNumber;
						}
						item = item.text;
					}
					if (/\n/.test(item)){
						while (m = item.match(/\n/)){
							this._mappings.push(';');
							line_num++;
							line = item = item.substr(m.index+1);
						}
						add_comma = last_col = 0;
					}else {
						line += item;
					}
				}
				return this;
			}
			SourceMap.prototype.__defineGetter__("data", function(){
				return {"version": 3,
					"file": this.file || '',
					"sourceRoot": '',
					"sources": this.sources,
					"names": this.names,
					"mappings": this.mappings};
			});
			SourceMap.prototype.__defineGetter__("text", function(){
				return Text(this.data);
			});
			SourceMap.encodeVlq = function(){
				var signBit, valueToEncode, answer, nextChunk, vlq = '';
				for (var _i=0, value; _i < arguments.length; _i++){
					value = arguments[_i];
					signBit = value < 0 ? 1 : 0;
					valueToEncode = (Math.abs(value)<<1)+signBit;
					answer = '';
					while (valueToEncode || !answer){
						nextChunk = valueToEncode&VLQ_VALUE_MASK;
						valueToEncode = valueToEncode>>VLQ_SHIFT;
						if (valueToEncode){
							nextChunk = nextChunk|VLQ_CONTINUATION_BIT;
						}
						answer += this.encodeBase64(nextChunk);
					}
					vlq += answer;
				}
				return vlq;
			};
			SourceMap.encodeBase64 = function(value){
				if (BASE64_CHARS[value]){
					return BASE64_CHARS[value];
				}
				throw tea.error(new Error(), "Cannot Base64 encode value: "+value);
			};
			return SourceMap;
		})();
		module.exports = SourceMap;
	});
})();

var ctx;
var Tea = require("../src/tea.tea");
var ChildProcess = require("child_process");
if (!module.parent){
	tea.argv.parse(process.argv);
	if (tea.argv['--tab']){
		tea.tabSize(tea.argv['--tab']);
	}
	if (tea.argv['--help']){
		tea.argv.showHelp();
		tea.exit();
	}
	if (!tea.argv['--file'] && !tea.argv['--path'] && !tea.argv['--eval']){
		if (process.argv.length > 2){
			print('* g{Are you r{NongShaLei}!!}');
		}
		tea.argv.showHelp();
		tea.exit();
	}
	if (tea.argv['--define']){
		var define_file = tea.checkFile(tea.argv['--define']);
		if (!define_file){
			print('* g{Cant find define file as r{"'+tea.argv['--define']+'"}!!}');
			tea.exit();
		}
		tea.preprocess.setDefault(define_file);
	}
	if (tea.argv['--debug']){
		debug.enable(tea.argv['--debug'] === true ? 'all' : tea.argv['--debug']);
	}else if (tea.argv['--verbose']){
		debug.enable('log');
	}
	if (tea.argv['--eval']){
		ctx = tea.context({"text": tea.argv['--eval'], "file": 'by tea eval cmd'});
	}else {
		if (tea.argv.file){
			if (debug.log){
				debug.log('* b{Compile:} d{"'+tea.argv.file+'"}');
			}
			ctx = tea.context(tea.argv);
		}else if (tea.argv.dir){
			if (debug.log){
				debug.log('* g{Building folder:} "'+tea.argv.dir+'"');
			}
			var file_list = Path.scanAllPath(tea.argv.dir, /\.js$|\.tea$/, 10).allfiles;
			if (file_list.length){
				for (var i=0, file; i < file_list.length; i++){
					file = file_list[i];
					if (debug.log){
						debug.log('  * b{Compile:} d{"'+file+'"}');
					}
					ctx = tea.context(tea.argv.copy({"file": file}));
					ctx.echo();
					if (debug.log){
						debug.log('  * g{Output to:} "'+ctx.argv.out+'"');
					}
				}
			}else {
				print("* r{The folder not find file!!}");
			}
			tea.exit();
		}else {
			print('"g{Cant find r{"'+tea.argv.file+'"} file}"');
			tea.exit();
		}
	}
	if (tea.argv['--token']){
		print('* r{The parse tokens}');
		console.log(print.toText(ctx.source).replace(/^/mg, '\t'));
		print('* r{The parse source}');
		console.log(print.border(ctx.source.join()).replace(/^/mg, '\t'));
	}
	if (tea.argv['--ast']){
		print('* r{The root node}');
		console.log(print.toText(ctx.ast).replace(/^/mg, '\t'));
		print('* r{The node space}');
		console.log(print.toText(ctx.scope).replace(/^/mg, '\t'));
	}
	if (tea.argv['--token'] || tea.argv['--ast']){
		tea.exit();
	}
	if (tea.argv['--out']){
		if (tea.argv['--map']){
			ctx.echo(tea.argv.out, tea.argv['--map']);
			if (debug.log){
				debug.log('* g{Output and source map to} : "'+tea.argv.out+'"');
			}
		}else {
			ctx.echo(tea.argv.out);
			if (debug.log){
				debug.log('* g{Output to} : "'+tea.argv.out+'"');
			}
		}
	}
	if (tea.argv['--test']){
		var cmds = [], cmd, temp_file;
		if (!tea.argv['--out']){
			temp_file = tea.argv.file.replace(/\.(js|tea)$/g, '')+'.tmp.js';
			ctx.echo(temp_file);
			cmds.push('node', temp_file);
		}else {
			cmds.push('node', tea.argv.out);
		}
		if (typeof ctx.argv['--test'] == 'string'){
			cmds = cmds.concat(tea.argv['--test'].split(' '));
		}
		print('** r{Test exec}: g{'+cmds.join(' '))+'}';
		ChildProcess.exec(cmds.join(' '), {"maxBuffer": 50000*1024}, function(err, stdout, stderr){
			var out = stdout+''+stderr;
			console.log(out.replace(/^/mg, '  | '));
			if (temp_file){
				ChildProcess.execSync('rm -rf '+temp_file);
			}
			tea.exit();
		});
	}else {
		if (!tea.argv['--out']){
			console.log(ctx.rewriter.text);
		}
		tea.exit();
	}
}