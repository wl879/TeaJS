#!/usr/bin/env node
var Module = (function(){_cache = {};_main  = new Module();function Module(filename, dirname){this.id = filename;this.filename = filename;this.dirname = dirname;this.exports = {};this.loaded = false;this.children = [];this.parent = null;};Module.prototype.require = function(file){var id = resolve(this.dirname, file);var mod = _cache[id];if (!mod && !/.js/.test(id)){if(mod = _cache[id+'.js'])id = id+'.js';}if (!mod){if(mod = _cache[id+'/index.js'])id = id+'/index.js';}if (mod){this.children.push(id);return mod.loaded ? mod.exports : mod.load(this);}if(typeof module != 'undefined'){this.children.push(file);return module.require(file);}};Module.prototype.load = function(parent){this.loaded = true;if(parent) this.parent = parent;this.creater();if(typeof module != 'undefined'){module.constructor._cache[this.id] = this;}return this.exports;};Module.prototype.register = function(creater){var id = this.id;if (!_cache[id]){_cache[id] = this;this.creater = creater;}};Module.makeRequire = function(_module){function require(path){return _module.require(path);};require.main = _main;require.resolve = function(path){return resolve(_module.dirname, path)};require.extensions = null;require.cache = null;return require;};Module.main = function(filename, dirname){_main.id = '.';_main.filename = filename;_main.dirname = dirname;if(typeof module != 'undefined'){_main.parent  = module.parent;_main.__defineGetter__('exports', function(){ return module.exports;});_main.__defineSetter__('exports', function(value){ return module.exports = value;});}return _main;};function resolve(from, to){if(/^(\~|\/)/.test(to)) return to;if (from && from != '.') to = from + '/' + to;var m = null;while( m = to.match(/\/[^\/]+?\/\.\.\/|\/\.\//) ){to = to.substr(0, m.index) + to.substr(m.index+m[0].length-1);}return to;};return Module;})();
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		if (typeof global == 'undefined'){
			if (typeof window == 'undefined'){
				throw 'Tea script run environment error!';
			}
			window.global = window;
		}
		global.SText = require("../utils/stext")
		global.Jsop = require("../utils/jsop")
		global.print = require("../utils/print")
		global.Fp = require("../utils/fp")
		global.isArray = Array.isArray
		global.isJson = Jsop.isJson
		global.isClass = Jsop.isClass
		global.ID = function(){
			!ID.index && (ID.index = 0);
			return parseInt((Date.now()+'').substr(-8)+(ID.index++)+Math.round(Math.random()*100))+'';
		}
		// global.__checkGlobal = function():
		// 	var def = 'global process GLOBAL root console Path Tea Fp'.split(' ');
		// 	for name in global:
		// 		if def.indexOf(name) >= 0:
		// 			continue;
		// 		if typeof global[name] == 'function':
		// 			continue;
		// 		print('[Global scope pollution]', name, global[name]);
		var Tea = (function(){
			var Helper, Token, Source, SourceMap, Syntax, Scope, Card, Grammar, Standard, Preprocess;
			Helper = require("./helper");
			Token = require("./core/token.js");
			Source = require("./core/source.js");
			SourceMap = require("./core/sourcemap.js");
			Syntax = require("./core/syntax.js");
			Scope = require("./core/scope.js");
			Card = require("./core/card.js");
			Grammar = require("./core/grammar");
			Standard = require("./core/standard");
			Preprocess = require("./preprocess");
			require("./settings");
			function Tea(file, text, prepor, std, outfile, map){
				this.fileName = file || '';
				this.std = std || Tea.argv['--std'] || 'es5';
				this.outfile = outfile;
				this.outmap = map;
				if (text && text.isSource){
					this._source = text;
				}else {
					this.sourcetext = text || SText.readFile(file);
				}
				this.prepor = Preprocess.create(prepor);
			};
			Tea.prototype.__defineGetter__("source", function(){
				if (!this._source){
					this._source = Tea.source(this.sourcetext, this.fileName, this.prepor);
				}
				return this._source;
			});
			Tea.prototype.__defineGetter__("AST", function(){
				if (!this._ast){
					this._ast = Tea.AST(this.source, this.prepor);
				}
				return this._ast;
			});
			Tea.prototype.__defineGetter__("CAST", function(){
				var std, main, list, requires;
				if (!this._cast){
					std = this.std;
					main = Tea.CAST(this.AST, std, this.prepor);
					this._cast = main;
					if (Tea.argv['--concat'] && (list = main.scope.cache.require) && list.length){
						requires = {};
						for (var file, i = 0; i < list.length; i++){
							file = list[i];
							if (!requires[file]){
								Tea.log('* <r:Concat require:> : <d:'+file+':>');
								if (!/\.tea/.test(file)){
									requires[file] = {"fileName": file, "CAST": concatFromJs(list, file, std)};
								}else {
									requires[file] = {"fileName": file, "CAST": concatFromTea(list, file, std)};
								}
							}
						}
						this._cast = Preprocess.concatModule(this, Jsop.toArray(requires));
					}
				}
				return this._cast;
			});
			Tea.prototype.__defineGetter__("scope", function(){
				if (!this.AST.scope){
					return Tea.scope(this.AST);
				}
				return this.AST.scope;
			});
			Tea.prototype.sourcemap = function (file){
				var map;
				map = new SourceMap();
				map.sourceRoot = this.fileName;
				map.parse(this.CAST);
				if (file){
					map.file = file;
					SText.writeFile(map.text, Fp.resolve(Fp.dirName(this.fileName), file), 'UTF-8');
				}
				return map;
			};
			Tea.prototype.output = function (file, map){
				var script;
				script = this.CAST.toScript();
				!file && (file = this.outfile);
				!map && (map = this.outmap);
				if (file){
					file = Fp.resolve(Fp.dirName(this.fileName), file);
				}
				if (map){
					map = Fp.resolve(Fp.dirName(file), typeof map == 'string' ? map : file+'.map');
					script += '\n\n//# sourceMappingURL='+(file ? Fp.relative(Fp.dirName(file), map) : map);
					this.sourcemap(map);
					this.outmap = map;
				}
				if (file){
					SText.writeFile(script, file, 'UTF-8');
					this.outfile = file;
				}
				return script;
			};
			// static
			Tea.filename = __filename;
			Tea.prep = Preprocess;
			Tea.version = "0.2.0";
			Tea.inNode = typeof process != 'undefined';
			Tea.argv = require("../utils/argv").create(null, "* <r:TeaJS:> version <g:0.2.0:>\n\
			-h, --help                           显示帮助\n\
			-f, --file    <file path>            编译文件路径\n\
			-p, --path    <project dir>          项目目录\n\
			-o, --out     <output path>          输出文件 或 目标目录\n\
			-e, --eval    <Tea script snippet>   编译一段字符串\n\
			-d, --define  <file path>            宏定义文件路径，默认加载项目下的 __define.tea 文件\n\
			-m, --map     [source output path]   生成 source map 文件\n\
			-c, --concat                         合并文件\n\
			-v, --verbose                        显示编译信息\n\
			-s, --safe                           安全模式编译\n\
			    --clear                          清理注释\n\
			    --tab     <number>               设置 tab size\n\
			    --token                          输出 token 解析\n\
			    --ast                            输出 ast 解析\n\
			    --nopp                           不进行预编译\n\
			    --test                           编译后运行\n\
			... 自定义参数，用于预编译时判断与读取(使用Argv['--name']读取)");
			Tea.context = function(file, text, prepor, stdv){
				return new Tea(file, text, prepor, stdv);
			};
			Tea.compile = function(text, prepor, from, stdv){
				var ctx;
				ctx = new Tea(from, text, prepor, stdv);
				return ctx.output();
			};
			// core method
			Tea.source = function(text, file, prepor){
				var src;
				src = new Source(text, file);
				if (prepor !== false){
					src.prepor = Preprocess.gather(src, prepor);
				}
				return src;
			};
			Tea.scope = function(ast, check_define){
				return Scope.init(ast, check_define);
			};
			Tea.grammar = function(type, src, prepor){
				var grammar, syntax;
				!prepor && (prepor = src.prepor);
				grammar = Grammar.create(prepor);
				syntax = grammar.parser(type, src);
				syntax.source = src;
				return syntax;
			};
			Tea.standard = function(version, syntax, prepor){
				var scope, std, card;
				if (version == null) version = 'es5';
				!prepor && (prepor = syntax.source && syntax.source.prepor);
				scope = Tea.scope(syntax);
				std = Standard.create(version, prepor);
				card = std.read(syntax);
				card.scope = scope;
				return card;
			};
			Tea.card = function(){
				return Jsop.newClass(Card, arguments);
			};
			Tea.AST = function(src, prepor){
				return Tea.grammar('Root', src.refresh(0), prepor);
			};
			Tea.CAST = function(ast, version, prepor){
				return Tea.standard(version, ast, prepor);
			};
			// tools
			Tea.tabsize = function(num){
				SText.tabsize = SText.cope(' ', num);
			};
			Tea.exit = function(state){
				if (state == null) state = 0;
				print('* <r:TeaJS:> exit - Used time <b:'+Tea.uptime('ms')+':>');
				process.exit(state);
			};
			Tea.uptime = function(unit){
				var t;
				t = process.uptime();
				switch (unit){
					case 's':
						return t+'s';
					case 'ms':
						return t*1000+'ms';
				}
				return t*1000;
			};
			Tea.memory = function(unit){
				var data, rss;
				data = process.memoryUsage();
				rss = data.rss;
				switch (unit){
					case 'kb':
						return Math.floor(data.rss*100/1024)/100+' KB';
					case 'mb':
						return Math.floor(data.rss*100/1024/1024)/100+' MB';
				}
				return rss;
			};
			Tea.log = function(){
				if (Tea.argv['--verbose']){
					Tea.log = Helper.log;
					Tea.log.apply(null, arguments);
				}
			};
			function concatFromJs(list, file, std){
				var src, node;
				src = Tea.source(null, file, false);
				while (true){
					src.index = src.indexOf('require', ++src.index);
					if (src.index >= 0){
						if (node = Tea.grammar('RequireExpr', src)){
							concatRequire(list, Tea.standard(std, node));
						}
						continue;
					}
					break;
				}
				return Tea.card('Source', Jsop.toArray(src));
			};
			function concatFromTea(list, file, std){
				var prepor, src, node, card;
				prepor = Tea.prep.create();
				src = Tea.source(null, file, prepor);
				node = Tea.AST(src, prepor);
				card = Tea.CAST(node, std, prepor);
				concatRequire(list, card);
				return card;
			};
			function concatRequire(list, card){
				var scope;
				if (scope = card.scope){
					if (scope.cache.require && scope.cache.require.length){
						list.push.apply(list, scope.cache.require);
					}
				}
			};
			return Tea;
		})()
		module.exports = Tea
		global.Tea = Tea;
	});
	return module.exports;
})('./tea.js', '.');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		// module.exports = SText;
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
		module.exports.tabsize = (tabsize = '    ');
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
		};;
	});
	return module.exports;
})('../utils/stext/index.js', '../utils/stext');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		// javascript object parser
		var SText, ArrPro;
		module.exports = jsop;
		SText = require("../stext");
		ArrPro = Array.prototype;
		function jsop(str){
		    var list, json, i, key, val;
		    if (/^\[.*?\]$/.test(str)){
		        list = SText.split(str.slice(1, -1), /;|,/, true);
		        for (var i=0; i < list.length; i++){
		            if (/(\d+)(\.\d*)?|false|true|null|undefined/.test(list[i])){
		                list[i] = eval('('+list[i]+')');
		            }
		        }
		        return list;
		    }
		    if (/^\{.*?\}$/.test(str)){
		        str = str.slice(1, -1);
		    }
		    list = SText.split(str, /;|,/, true);
		    json = {};
		    for (var _i=0, item; _i < list.length; _i++){
		        item = list[_i];
		        i = item.indexOf(':');
		        if (i > 0){
		            key = item.substr(0, i).trim();
		            val = item.substr(i+1).trim();
		            if (/^\[.*?\]$|^\{.*?\}$/.test(val)){
		                val = jsop(val);
		            }
		        }else {
		            key = item;
		            val = true;
		        }
		        json[key] = val;
		    }
		    return json;
		}
		function data(){
		    var json;
		    json = {"constructor": undefined,
		        "isPrototypeOf": undefined,
		        "toString": undefined,
		        "toLocaleString": undefined,
		        "valueOf": undefined};
		    return json;
		};
		function keys(obj){
		    return Object.keys(obj);
		};
		function toArray(obj, start, end){
		    var temp;
		    if (obj.length == null){
		        temp = [];
		        for (var key in obj){
		            if (!obj.hasOwnProperty(key)) continue;
		            temp.push(obj[key]);
		        }
		        obj = temp;
		    }
		    return ArrPro.slice.call(obj, start, end);
		};
		function concat(obj){
		    arguments[0] = copy(obj) || {};
		    return extend.apply(this, arguments);
		};
		function extend(obj){
		    for (var i=1, arg; i < arguments.length; i++){
		        arg = arguments[i];
		        if (arg){
		            for (var k in arg){
		                if (!arg.hasOwnProperty(k)) continue;
		                obj[k] = arg[k];
		            }
		        }
		    }
		    return obj;
		};
		function copy(obj, deep){
		    if (deep == null) deep = 1;
		    var clone;
		    if (typeof obj == 'object'){
		        if (Array.isArray(obj)){
		            clone = [];
		        }else {
		            clone = {};
		            if (clone.prototype != obj.prototype){
		                clone.prototype = obj.prototype;
		                clone.constructor = obj.constructor;
		            }
		        }
		        for (var key in obj){
		            if (!obj.hasOwnProperty(key)) continue;
		            clone[key] = deep ? copy(obj[key], deep-1) : obj[key];
		        }
		        return clone;
		    }else {
		        return obj;
		    }
		};
		function reverse(obj){
		    var r;
		    r = {};
		    for (var key=0, val; key < obj.length; key++){
		        val = obj[key];
		        if (!r[val]) r[val] = [];
		        r[val].push(key);
		    }
		    return r;
		};
		function newClass(cls, argus){
		    var obj;
		    obj = Object.create(cls.prototype);
		    if (argus.length){
		        cls.apply(obj, argus);
		    }
		    return obj;
		};
		function eq(obj1, obj2){
		    if (obj1 == obj2){
		        return true;
		    }
		    if (!(typeof obj1 == 'object')){
		        return false;
		    }
		    if (obj1.constructor != obj2.constructor){
		        return false;
		    }
		    for (var k in obj1){
		        if (!obj1.hasOwnProperty(k)) continue;
		        if (eq(obj1[k], obj2[k]) == false){
		            return false;
		        }
		    }
		    return true;
		};
		function isJson(obj){
		    return !obj.constructor || obj.constructor.prototype.hasOwnProperty("isPrototypeOf");
		};
		function isEmpty(obj){
		    for (var k in obj){
		        if (!obj.hasOwnProperty(k)) continue;
		        return false;
		    }
		    return true;
		};
		function isClass(obj, class_name){
		    var name;
		    if (obj && obj.constructor){
		        if (class_name && typeof class_name != 'string'){
		            return obj.constructor == class_name;
		        }
		        if (obj.constructor.toString){
		            if (name = funcName(obj.constructor)){
		                return class_name ? class_name == name : name;
		            }
		        }
		    }
		    return undefined;
		};
		function funcName(fn){
		    var m;
		    if (fn && (m = fn.toString().match(/function\s*(\w+)/))){
		        return m[1];
		    }
		};
		module.exports.data = data;
		module.exports.keys = keys;
		module.exports.toArray = toArray;
		module.exports.concat = concat;
		module.exports.extend = extend;
		module.exports.copy = copy;
		module.exports.reverse = reverse;
		module.exports.newClass = newClass;
		module.exports.eq = eq;
		module.exports.isJson = isJson;
		module.exports.isEmpty = isEmpty;
		module.exports.isClass = isClass;
		module.exports.funcName = funcName;;
	});
	return module.exports;
})('../utils/jsop/index.js', '../utils/jsop');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
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
		    var color_map, color_patt, color_code, set_patt, print_ers, print_history, print_content, print_scope, print_state, stdout_width, stdout_write, print_write, print_maxwidth, print_indent;
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
		    function print(){
		        if (this.constructor != print){
		            if (print.stdout.apply(this, arguments)){
		                print_write('\n');
		            }
		        }
		    };
		    if (typeof process != 'undefined'){
		        stdout_width = process.stdout.columns || 0;
		        stdout_write = process.stdout.write;
		        print_write = function(){
		            var text;
		            text = Array.prototype.join.call(arguments, ' ');
		            print_content.push(text);
		            stdout_write.call(process.stdout, text);
		        };
		        process.stdout.write = print_write;
		    }else {
		        stdout_width = 0;
		        print_write = function(){
		            console.log.apply(console, arguments);
		        };
		    }
		    print_maxwidth = 120;
		    print_indent = '';
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
		module.exports = print;;
	});
	return module.exports;
})('../utils/print/index.js', '../utils/print');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Fs, Path, dirName, baseName, extName, name, join;
		Fs = require("fs");
		Path = require("path");
		module.exports.dirName = (dirName = Path && Path.dirname);
		module.exports.baseName = (baseName = Path && Path.basename);
		module.exports.extName = (extName = Path && Path.extname);
		module.exports.name = (name = Path && function(to){return Path.parse(to).name});
		module.exports.join = (join = Path && Path.join);
		function relative(from, to){
		    if (from){
		        to = Path.relative(from, to);
		        if (!/^[\/\.]/.test(to)){
		            to = './'+to;
		        }
		    }
		    return to;
		};
		module.exports.relative = relative;
		function resolve(from, to, check_dir){
		    if (!to){
		        to = from, from = null;
		    }else if (to === true){
		        check_dir = to, to = from, from = null;
		    }
		    to = to.replace(/^`+|^'+|^"+|"+$|'+$|`+$/g, '').trim();
		    if (!/^(\~|\/|\.)/.test(to)){
		        to = './'+to;
		    }
		    from = from ? Path.resolve(from, to) : Path.resolve(to);
		    if (check_dir && /\/$/.test(to)){
		        from += '/';
		    }
		    return from;
		};
		module.exports.resolve = resolve;
		function mkdir(to, mode){
		    var base_dir;
		    if (!Fs.existsSync(to)){
		        base_dir = Path.dirname(to);
		        if (!Fs.existsSync(base_dir)){
		            mkdir(base_dir, mode);
		        }
		        return Fs.mkdirSync(to, mode || 0755);
		    }
		};
		module.exports.mkdir = mkdir;
		function isExist(to){
		    return Fs.existsSync(to);
		};
		module.exports.isExist = isExist;
		function isFile(to){
		    return Fs.existsSync(to) && Fs.statSync(to).isFile();
		};
		module.exports.isFile = isFile;
		function isDir(to){
		    return Fs.existsSync(to) && Fs.statSync(to).isDirectory();
		};
		module.exports.isDir = isDir;
		function scanDir(to, filter, deep, reverse){
		    var res;
		    res = scanPath(to, filter, deep, reverse);
		    return getherDirs(res.dirs);
		};
		module.exports.scanDir = scanDir;
		function scanFile(to, filter, deep, reverse){
		    var res;
		    res = scanPath(to, [null, filter], deep, reverse);
		    return getherFiles(res);
		};
		module.exports.scanFile = scanFile;
		function scanPath(to, filter, deep, reverse){
		    var res, dir_filter, file_filter, dir_list;
		    res = {"files": [], "dirs": {}};
		    if (typeof filter == 'number'){
		        reverse = deep, deep = filter, filter = null;
		    }
		    if (isArray(filter)){
		        dir_filter = filter[0];
		        file_filter = filter[1];
		    }else {
		        dir_filter = filter;
		        file_filter = filter;
		    }
		    dir_filter = wildcard(dir_filter, true);
		    file_filter = wildcard(file_filter, true);
		    if (isFile(to)){
		        res.files.push(to);
		        return res;
		    }
		    if (!isDir(to)){
		        return res;
		    }
		    dir_list = Fs.readdirSync(to);
		    for (var tmp, i = 0; i < dir_list.length; i++){
		        tmp = dir_list[i];
		        tmp = Path.join(to, tmp);
		        if (Fs.statSync(tmp).isDirectory()){
		            if (testFilter(dir_filter, tmp, reverse)){
		                continue;
		            }
		            if (deep){
		                res.dirs[tmp] = scanPath(tmp, filter, deep-1, reverse);
		            }else {
		                res.dirs[tmp] = 0;
		            }
		        }else {
		            if (testFilter(file_filter, tmp, reverse)){
		                continue;
		            }
		            res.files.push(tmp);
		        }
		    }
		    return res;
		};
		module.exports.scanPath = scanPath;
		function checkFiles(to, from, def_file){
		    var res, files, dirs, file;
		    if (Array.isArray(from)){
		        def_file = from, from = null;
		    }
		    res = checkPath(to, from);
		    files = res.files;
		    if (res.error){
		        files.error = res.error;
		    }else if (def_file && !files.length && res.dirs.length){
		        dirs = res.dirs;
		        for (var dir, i = 0; i < dirs.length; i++){
		            dir = dirs[i];
		            for (var name, j = 0; j < def_file.length; j++){
		                name = def_file[j];
		                file = Path.join(dir, name);
		                if (isFile(file)){
		                    files.push(file);
		                }
		            }
		        }
		    }else {
		        for (var file, i = files.length - 1; i >= 0; i--){
		            file = files[i];
		            if (/\/\..+$/.test(file)){
		                files.splice(i, 1);
		            }
		        }
		    }
		    return files;
		};
		module.exports.checkFiles = checkFiles;
		function checkDirs(to, from){
		    var res, dirs;
		    res = checkPath(to, from);
		    dirs = res.dirs;
		    if (res.error){
		        dirs.error = res.error;
		    }
		    return dirs;
		};
		module.exports.checkDirs = checkDirs;
		function checkPath(to, from){
		    var res, names, len, dirs, files, wc, tmp, scan;
		    to = resolve(from, to, true);
		    res = {"files": [], "dirs": []};
		    if (isDir(to)){
		        res.dirs.push(to);
		        return res;
		    }
		    if (isFile(to)){
		        res.files.push(to);
		        return res;
		    }
		    names = to.split('/');
		    len = names.length-1;
		    dirs = [''];
		    files = [];
		    for (var name, i = 0; i < names.length; i++){
		        name = names[i];
		        if (!name && i != 0){
		            break;
		        }
		        wc = wildcard(name);
		        tmp = [];
		        for (var dir, j = 0; j < dirs.length; j++){
		            dir = dirs[j];
		            if (wc){
		                scan = scanPath(dir, wc);
		                tmp.push.apply(tmp, Object.keys(scan.dirs));
		                if (i == len){
		                    files = scan.files;
		                }
		                continue;
		            }else {
		                if (isDir(dir+name+'/')){
		                    tmp.push(dir+name+'/');
		                }
		                if (i == len && isFile(dir+name)){
		                    files.push(dir+name);
		                }
		            }
		        }
		        dirs = tmp;
		        if (!dirs.length && !files.length){
		            res.error = {};
		            res.error.path = names.slice(0, i+1).join('/');
		            res.error.msg = 'Dir "'+res.error.path+'" is not exist!';
		            break;
		        }
		    }
		    res.dirs = dirs;
		    res.files = files;
		    return res;
		};
		module.exports.checkPath = checkPath;
		function wildcard(str, force){
		    if (!str || str instanceof RegExp){
		        return str;
		    }
		    if (force || /([^\\]|^)[\*\?]/.test(str)){
		        str = str.replace(/\./g, '\\.');
		        str = str.replace(/([^\\]|^)\?/g, '$1.');
		        str = str.replace(/([^\\]|^)\*/g, '$1.*?');
		        try {
		            return new RegExp('^'+str+'$');
		        } catch (_e){};
		    }
		};
		function testFile(to, names){
		    if (names && names.length){
		        for (var name, i = 0; i < names.length; i++){
		            name = names[i];
		            name = Path.join(to, name);
		            if (isFile(name)){
		                return name;
		            }
		        }
		    }else if (isFile(to)){
		        return to;
		    }
		};
		function testFilter(filter, path, reverse){
		    if (filter && (reverse ? filter.test(path) : !filter.test(path))){
		        return true;
		    }
		    return false;
		};
		function getherDirs(dirs){
		    var list;
		    list = [];
		    for (var dir in dirs){
		        if (!dirs.hasOwnProperty(dir)) continue;
		        list.push(dir);
		        list.push.apply(list, getherDirs(dirs[dir].dirs));
		    }
		    return list;
		};
		function getherFiles(res){
		    var list;
		    list = res.files.slice();
		    if (res.dirs){
		        for (var dir in res.dirs){
		            if (!res.dirs.hasOwnProperty(dir)) continue;
		            var data = res.dirs[dir];
		            list.push.apply(list, getherFiles(data));
		        }
		    }
		    return list;
		};
		if (!Path || !Fs){
		    console.error('Fp module load fail!');
		    module.exports = null;
		};
	});
	return module.exports;
})('../utils/fp/index.js', '../utils/fp');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		require("./printer.js")
		require("./error.js")
		exports.log = require("./log.js");
	});
	return module.exports;
})('./helper/index.js', './helper');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Node
		Node = require("./node.js")
		var Token = (function(){
			function Token(text, types, location){
				var instance;
				if (!types || typeof types == 'number'){
					instance = Token.create(text, types, location);
					text = instance.text;
					types = instance.types;
					location = instance.location;
					if (instance.error){
						this.error = instance.error;
					}
				}
				this.text = text;
				this.types = types;
				this.indent = -1;
				this.location = location || null;
			};
			Token.prototype = Object.create(Node.prototype);
			Token.prototype.__super__ = Node.prototype;
			Token.prototype.constructor = Token;
			Token.map = {"types": {}, "literals": {}, "complexs": [], "complexre": null};
			Token.prototype.__defineGetter__("types", function(){
				return this._types;
			});
			Token.prototype.__defineSetter__("types", function(types){
				if (types){
					this._types = Jsop.toArray(types);
					this.type = this._types[0];
				}
				return this._types;
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
			// rewrite
			Token.prototype.isToken = true;
			Token.prototype.clone = function (text, types){
				var token = new Token(text || this.text, types || this.types, this.location);
				token.parent = this.parent;
				token.indent = this.indent;
				token.scope = this.scope;
				return token;
			};
			Token.define = function(types, literals){
				var map, literal_re, tmp;
				map = Token.map;
				if (!literals || !literals.length){
					for (var type, i = 0; i < types.length; i++){
						type = types[i];
						!map.types[type] && (map.types[type] = []);
					}
				}
				for (var literal, i = 0; i < literals.length; i++){
					literal = literals[i];
					if (map.types.hasOwnProperty(literal) && /^[A-Z]\w+$/.test(literal)){
						Token.define(types, map.types[literal]);
						continue;
					}
					if (/\w\W|\W\w/.test(literal)){
						literal_re = literal.replace(/(\W)/g, '\\$1');
						if (map.complexs.indexOf(literal_re) == -1){
							map.complexs.push(literal_re);
						}
					}
					for (var type, j = 0; j < types.length; j++){
						type = types[j];
						!map.types[type] && (map.types[type] = []);
						if (map.types[type].indexOf(literal) == -1){
							map.types[type].push(literal);
						}
					}
					if (tmp = map.literals[literal]){
						for (var type, j = 0; j < types.length; j++){
							type = types[j];
							if (tmp.indexOf(type) == -1){
								tmp.push(type);
							}
						}
					}else {
						map.literals[literal] = types.slice();
					}
				}
				if (map.complexs.length){
					map.complexs.sort(function(a, b){return b.length-a.length});
					map.complexre = new RegExp('^(?:'+map.complexs.join('|')+')(?!\\w)', 'g');
				}
			};
			Token.create = function(text, index, location){
				var token_literals, code, token_complex_re, match, types;
				if (index == null) index = 0;
				if (!(text = text.substr(index))){
					throw Error.create('create token object of param is empty!', new Error());
				}
				token_literals = Token.map.literals;
				do {
					if (token_literals.hasOwnProperty(text)){
						code = text;
						break;
					}
					token_complex_re = Token.map.complexre;
					if (token_complex_re && (match = text.match(token_complex_re))){
						if (token_literals.hasOwnProperty(match[0])){
							code = match[0];
							break;
						}
					}
					if (match = text.match(/^\n/)){
						code = match[0];
						break;
					}
					if (match = text.match(/^[\r\t\f\ ]+/)){
						code = match[0], types = ['BLANK'];
						break;
					}
					if (match = text.match(/^\#+\w+/)){
						code = match[0], types = ['TAG'];
						break;
					}
					if (match = text.match(/^(0[xX][0-9a-fA-F]+|(?:\.\d+|\d+(?:\.\d+)?)(?:e\-?\d+)?)/)){
						code = match[0], types = ['NUMBER', 'CONST'];
						break;
					}
					if (match = text.match(/^([\$a-zA-Z_][\w\$]*)/)){
						code = match[0];
						if (!(token_literals.hasOwnProperty(match[0]))){
							types = ['IDENTIFIER'];
						}
						break;
					}
					if (!(match = text.match(/^[^\w\_\s]+/))){
						return {
							"error": 'tokenize parse error! unexpected token like as "'+text.slice(0, 5)+'"'};
					}
					code = match[0];
					while (code){
						if (token_literals.hasOwnProperty(code)){
							break;
						}
						code = code.slice(0, -1);
					}
					if (!code){
						code = match[0][0], types = ['CHARACTER'];
					}
					if (code == '\\'){
						code = text.substr(0, 2);
						types = ['SYMBOL'];
					}
					break;
					break;
				} while(true)
				!types && (types = token_literals[code]);
				if (!types){
					return {"error": 'tokenize parse error! unexpected token like as "'+code+'"'};
				}
				return new Token(code, types || token_literals[code], location && location.fission(code, index));
			};
			Token.tokenize = function(text, index, opt){
				var list, len, tokn;
				if (index == null) index = 0;
				list = [], len = text.length;
				while (index < len){
					if (tokn = Token.create(text, index)){
						if (tokn.error){
							throw Error.create(tokn.error, [text, index, text[index]], new Error());
						}
						list.push(opt == 'code list' ? tokn.text : tokn);
						index += tokn.text.length;
					}else {
						break;
					}
				}
				return list;
			};
			return Token;
		})()
		module.exports = Token;
	});
	return module.exports;
})('./core/token.js', './core');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Source = (function(){
			var Token, Location, re_cache;
			Token = require("./token.js");
			Location = require("./location.js");
			re_cache = {};
			function Source(text, file){
				this.index = 0;
				this.length = 0;
				if (arguments.length){
					this.read(text, file);
				}
			};
			Source.prototype.__defineGetter__("current", function(){
				return this.get(this.index);
			});
			Source.prototype.__defineGetter__("string", function(){
				return this.join();
			});
			Source.prototype.__defineGetter__("peek", function(){
				return this.get(this.nextIndex(this.index, true));
			});
			Source.prototype.__defineGetter__("prev", function(){
				return this.get(this.prevIndex(this.index, true));
			});
			Source.prototype.read = function (text, file){
				var loc, i, len, token;
				loc = new Location(file, text);
				text = loc.source;
				file = loc.fileName;
				this.index = 0;
				this.length = 0;
				i = 0;
				len = text.length;
				while (i < len && (token = Token.create(text, i, loc))){
					if (token.error){
						throw Error.create(token.error, [text, i, text[i], file], new Error());
					}
					i = token.location.end+1;
					this.add(token);
				}
				return this.refresh();
			};
			Source.prototype.get = function (index){
				return this[index] || new Token('\4');
			};
			Source.prototype.add = function (token){
				if (!token || !token.isToken){
					throw Error.create('Add the wrong parameters('+isClass(token)+'), Only to can add Lexeme object', new Error());
				}
				this[this.length++] = token;
				return this;
			};
			Source.prototype.back = function (opt, catch_comm){
				while (opt > 1){
					this.index = this.prevIndex(this.index, opt--, catch_comm);
				}
				this.index = this.prevIndex(this.index, opt, catch_comm);
				return this;
			};
			Source.prototype.next = function (opt, catch_comm){
				while (opt > 1){
					this.index = this.nextIndex(this.index, opt--, catch_comm);
				}
				this.index = this.nextIndex(this.index, opt, catch_comm);
				return this;
			};
			Source.prototype.nextIndex = function (index, ig_lf, catch_comm){
				return countIndex(1, this, index, ig_lf, catch_comm);
			};
			Source.prototype.prevIndex = function (index, ig_lf, catch_comm){
				return countIndex(-1, this, index, ig_lf, catch_comm);
			};
			Source.prototype.delete = function (a, b){
				if (b == null) b = a;
				for (var i=a; i <= b; i++){
					this[i] = null;
				}
				return this;
			};
			Source.prototype.insert = function (pos, value, del_len){
				var list, indent, head_token;
				if (pos == null) pos = 0;
				if (del_len == null) del_len = 0;
				if (typeof value == 'string'){
					value = new Source(value, 'preprocess/insert');
				}else if (value.isToken){
					value = [value];
				}
				list = [pos, del_len];
				if (indent = this.lineIndent(pos)){
					indent = SText.copy(' ', indent);
				}
				for (var token, i = 0; i < value.length; i++){
					token = value[i];
					if (!token || token.type == 'EOT'){
						continue;
					}
					if (i && indent && token.indent >= 0){
						if (token.is('BLANK')){
							token.text += indent;
							token.indent = token.text.length;
						}else {
							token.indent = null;
							head_token = token.clone(indent, ['BLANK']);
							head_token.indent = indent.length;
							list.push(head_token);
						}
					}
					list.push(token);
				}
				Array.prototype.splice.apply(this, list);
				return this;
			};
			Source.prototype.clone = function (a, b){
				var src, i;
				src = new Source();
				a = a < 0 ? this.length+a : (a || 0);
				b = b < 0 ? this.length+b : (b || this.length-1);
				for (i = a; i <= b; i++){
					if (this[i]){
						src.add(this[i]);
					}
				}
				if (b != this.length-1){
					src.add(new Token('\4'));
				}
				return src;
			};
			Source.prototype.indexPair = function (s1, s2, index, not_throw_error){
				index = index != null ? index : this.index;
				var ab = indexPair(this, s1, s2, index);
				if (!ab && !not_throw_error){
					throw Error.create(1004, s2, this[index], new Error());
				}
				return ab;
			};
			Source.prototype.indexLine = function (index){
				index = index != null ? index : this.index;
				var a = index, b = index, len = this.length-2;
				while (a > len || (a > 0 && this[a-1] && this[a-1].type != 'LF')){
					a--;
				}
				while (b < len && (!this[b] || this[b].type != 'LF')){
					b++;
				}
				return [(a > len ? len : a), (b > len ? len : b), index];
			};
			Source.prototype.indexOf = function (target, index){
				var is_re, is_str;
				if (index == null) index = 0;
				if (!(is_re = target instanceof RegExp)){
					is_str = typeof target == 'string';
				}
				for (var i = index; i < this.length; i++){
					if (!this[i]){
						continue;
					}
					if (is_re){
						if (target.test(this[i].text)){
							return i;
						}
					}else if (is_str){
						if (this[i].text == target){
							return i;
						}
					}else if (this[i] == target){
						return i;
					}
				}
			};
			Source.prototype.matchOf = function (re, index){
				var m;
				if (index == null) index = 0;
				var a, b;
				if (m = this.string.match(re)){
					for (var tk, i = index; i < this.length; i++){
						tk = this[i];
						if (!tk){
							continue;
						}
						if (tk.start == m.index){
							a = i;
						}
						if (tk.end == m.index+m[0].length){
							b = i;
						}
						if (a != null && b != null){
							return [a, b];
						}
					}
				}
			};
			Source.prototype.lineIndent = function (index){
				index = index != null ? index : this.index;
				while (index >= 0){
					if (this[index] && this[index].indent >= 0){
						return this[index].indent;
					}
					index--;
				}
				return -1;
			};
			Source.prototype.trimIndent = function (a, b, len){
				var i, token;
				a = a < 0 ? this.length+a : (a || 0);
				b = b < 0 ? this.length+b : (b || this.length-1);
				if (len == null){
					for (i = a; i <= b; i++){
						token = this[i];
						if (token && token.indent >= 0){
							if (len == null || token.indent < len){
								len = token.indent;
							}
						}
					}
				}
				if (len > 0){
					for (i = a; i <= b; i++){
						token = this[i];
						if (token && token.indent >= 0){
							token.indent = Math.max(token.indent-len, 0);
							if (token.type = 'BLANK'){
								token.text = token.text.substr(0, token.indent);
							}
						}
					}
				}
				return this;
			};
			Source.prototype.refresh = function (index){
				var target;
				if (typeof index == 'number'){
					this.index = index;
				}
				target = this[this.index];
				clearSource(this);
				for (var token, i = this.length - 1; i >= 0; i--){
					token = this[i];
					token.indent = -1;
					if (!i || (token.type == 'LF' && (token = this[i+1]))){
						if (token.type == 'BLANK'){
							token.text = SText.spaceTab(token.text);
							token.indent = token.text.length;
						}else {
							token.indent = 0;
						}
					}
				}
				if (target != this[this.index]){
					index = this.indexOf(target);
					if (index >= 0){
						this.index = index;
					}
				}
				return this;
			};
			Source.prototype.join = function (a, b){
				if (isArray(a)){
					b = a[1], a = a[0];
				}
				a = a < 0 ? this.length+a : (a || 0), b = b < 0 ? this.length+b : (b || b === 0 ? b : this.length);
				var texts = [];
				for (var i=a; i <= b; i++){
					if (this[i] && this[i].text != '\4') texts.push(this[i].text);
				}
				return texts.join('');
			};
			Source.prototype.isSource = true;
			function countIndex(ori, src, index, ig_lf, catch_comm){
				var len = src.length-1, type;
				while ((index += ori) >= 0 && index <= len){
					type = src[index] && src[index].type;
					if (!type || type == 'BLANK' || (!catch_comm && type == 'COMMENT') || (ig_lf && type == 'LF')){
						continue;
					}
					return index;
				}
				if (ori > 0){
					return index > len ? len : index;
				}
				return index < 0 ? 0 : index;
			};
			function indexPair(src, s1, s2, index){
				var s1_re, s2_re, len, a, jump, text;
				s1_re = re_cache[s1] || (re_cache[s1] = new RegExp('^('+SText.re(s1)+')$'));
				s2_re = re_cache[s2] || (re_cache[s2] = new RegExp('^('+SText.re(s2)+')$'));
				len = src.length;
				a = -1;
				jump = 0;
				while (index < len){
					if (src[index]){
						text = src[index].text;
						if (text == '\\'){
							index += 2;
							continue;
						}
						if (s1_re.test(text)){
							if (a == -1){
								a = index;
							}else if (s1 == s2 || s2_re.test(text)){
								return [a, index];
							}else {
								jump += 1;
							}
						}else if (s2_re.test(text) && a != -1){
							if (jump == 0){
								return [a, index];
							}
							jump -= 1;
						}
					}
					index += 1;
				}
			};
			function clearSource(src){
				var len, a, list;
				len = src.length;
				for (var token, i = 0; i < src.length; i++){
					token = src[i];
					if (!token){
						continue;
					}
					if (token.type == 'EOT'){
						src[i] = null;
						continue;
					}
					if (token.is('HEAD')){
						a = i;
						while (i < len){
							if (!src[i]){
								i++;
								continue;
							}
							if (src[i].type == 'LF'){
								if (src[a].indent >= 0){
									src.delete(a, i);
								}else {
									src.delete(a, i-1);
								}
								break;
							}
							if (src[i].is('BLANK', 'END')){
								i++;
								continue;
							}
							break;
						}
					}
				}
				list = [];
				for (var token, i = 0; i < src.length; i++){
					token = src[i];
					if (token){
						list.push(token);
					}
					src[i] = null;
				}
				src.length = 0;
				Array.prototype.push.apply(src, list);
				return src.add(new Token('\4'));
			};
			return Source;
		})()
		module.exports = Source;
	});
	return module.exports;
})('./core/source.js', './core');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
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
			};
			SourceMap.prototype.parse = function (card){
				var list, sources, line, line_num, add_comma, last_vlq, last_col, last_loc_line, last_loc_col, loc, vlq, m;
				list = card.toList();
				sources = this._sources;
				line = '';
				line_num = 1;
				add_comma = null;
				last_vlq = null;
				last_col = 0;
				last_loc_line = 1;
				last_loc_col = 0;
				for (var item, i = 0; i < list.length; i++){
					item = list[i];
					if (item.isToken){
						if (item.location && item.location.fileName){
							loc = item.location;
							vlq = encodeVlq(line.length-last_col, sourceId(sources, loc.fileName), loc.lineNumber-last_loc_line, loc.columnNumber-last_loc_col);
							add_comma ? this._mappings.push(',') : (add_comma = true);
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
			};
			SourceMap.prototype.addName = function (name){
				var i = this.names.indexOf(name);
				if (i == -1){
					return this.names.push(name)-1;
				}
				return i;
			};
			SourceMap.prototype.__defineGetter__("sources", function(){
				if (!Fp){
					return this._sources;
				}
				var ss = [];
				var dir = Fp.dirName(this.file);
				for (var file, i = 0; i < this._sources.length; i++){
					file = this._sources[i];
					ss.push(Fp.relative(dir, file));
				}
				return ss;
			});
			SourceMap.prototype.__defineGetter__("mappings", function(){
				return this._mappings.join('');
			});
			SourceMap.prototype.__defineGetter__("text", function(){
				var data;
				data = {
					"version": 3,
					"file": this.file || '',
					"sourceRoot": '',
					"sources": this.sources,
					"names": this.names,
					"mappings": this.mappings};
				return SText(data);
			});
			function sourceId(sources, filename){
				var i;
				i = sources.indexOf(filename);
				if (i == -1){
					return sources.push(filename)-1;
				}
				return i;
			};
			function encodeVlq(){
				var vlq, signBit, valueToEncode, answer, nextChunk;
				vlq = [];
				for (var value, i = 0; i < arguments.length; i++){
					value = arguments[i];
					signBit = value < 0 ? 1 : 0;
					valueToEncode = (Math.abs(value)<<1)+signBit;
					answer = '';
					while (valueToEncode || !answer){
						nextChunk = valueToEncode&VLQ_VALUE_MASK;
						valueToEncode = valueToEncode>>VLQ_SHIFT;
						if (valueToEncode){
							nextChunk = nextChunk|VLQ_CONTINUATION_BIT;
						}
						answer += encodeBase64(nextChunk);
					}
					vlq.push(answer);
				}
				return vlq.join('');
			};
			function encodeBase64(value){
				if (BASE64_CHARS[value]){
					return BASE64_CHARS[value];
				}
				throw Error.create("Cannot Base64 encode value: "+value, new Error());
			};
			return SourceMap;
		})()
		module.exports = SourceMap;
	});
	return module.exports;
})('./core/sourcemap.js', './core');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Node
		Node = require("./node.js")
		var Syntax = (function(){
			function Syntax(type){
				this.type = type;
				// @.subType     = null;
				this.length = 0;
				if (arguments.length > 1){
					this.add.apply(this, Jsop.toArray(arguments, 1));
				}
			};
			Syntax.prototype = Object.create(Node.prototype);
			Syntax.prototype.__super__ = Node.prototype;
			Syntax.prototype.constructor = Syntax;
			Syntax.prototype.__defineGetter__("text", function(){
				var tokens, texts;
				tokens = this.tokens();
				texts = [];
				for (var tk, i = 0; i < tokens.length; i++){
					tk = tokens[i];
					texts.push(tk.text);
				}
				return texts.join('');
			});
			Syntax.prototype.add = function (){
				for (var item, i = 0; i < arguments.length; i++){
					item = arguments[i];
					if (!item){
						continue;
					}
					if (item.isSyntax || item.isToken){
						item.parent = this;
						this[this.length++] = item;
					}else if (isArray(item)){
						if (item.length){
							this.add.apply(this, item);
						}
					}else {
						throw Error.create('Syntax can only add object of "Syntax" or "Code" and "NaN" types ! >> '+item, new Error());
					}
				}
				return this;
			};
			Syntax.prototype.insert = function (pos){
				var args;
				args = Jsop.toArray(arguments, 1);
				for (var i = pos; i < this.length; i++){
					args.push(this[i]);
				}
				this.length = pos;
				this.add.apply(this, args);
				return this;
			};
			Syntax.prototype.clone = function (){
				var node = new Syntax(this.type);
				for (var i = 0; i < this.length; i++){
					node[node.length++] = this[i];
				}
				node.parent = this.parent;
				node.scope = this.scope;
				return node;
			};
			Syntax.prototype.isSyntax = true;
			return Syntax;
		})()
		module.exports = Syntax;
	});
	return module.exports;
})('./core/syntax.js', './core');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Scope = (function(){
			var scope_map, decl_types;
			scope_map = {};
			decl_types = ["function", "static", "proto", "name", 'class', 'argument'];
			function Scope(type, node, parent){
				this.type = type;
				this.target = node;
				this.name = null;
				this.variables = {};
				this.undefines = {};
				this.cache = {};
				if (this.type == 'Class'){
					this.protos = {};
					this.statics = {};
				}
				if (parent){
					this.upper = parent;
					!parent.subs && (parent.subs = []);
					parent.subs.push(this);
				}
			};
			Scope.prototype.__defineGetter__("valid", function(){
				var scope;
				scope = this;
				while (scope.type == 'Let'){
					scope = scope.upper;
				}
				return scope;
			});
			Scope.prototype.__defineGetter__("parent", function(){
				var upper;
				upper = this.upper;
				while (upper.type == 'Let'){
					upper = upper.upper;
				}
				return upper;
			});
			Scope.prototype.__defineGetter__("root", function(){
				var rot;
				rot = this;
				while (rot && rot.type != 'Root'){
					rot = rot.upper;
				}
				return rot;
			});
			Scope.prototype.query = function (name){
				var scope;
				scope = this;
				while (scope && (scope.type != name && scope.name != name)){
					if (scope.type == 'Root' || scope.type == 'Global'){
						return;
					}
					scope = scope.upper;
				}
				return scope;
			};
			Scope.prototype.define = function (state, id, alias){
				var scope;
				if (state.isToken || state.isSyntax){
					alias = id, id = state, state = null;
				}
				if (id.isToken){
					id = id.parent;
				}
				if (!state){
					state = checkScopeMap(id);
					if (!alias && state == 'let'){
						alias = 'l_$';
					}
				}
				if (!state){
					return;
				}
				if (id.type == 'NameExpr'){
					this.name = id[0].text;
				}
				switch (state){
					case 'name':
						this.name = id[0].text;
						break;
					case 'function':case 'class':
						setDefine(this.parent, id, state, alias);
						break;
					case 'proto':case 'static':
						if (!(scope = this.query('Class'))){
							throw Error.create(1002, id, new Error());
						}
						setDefine(scope, id, state, alias);
						break;
					case 'for_let':
						setDefine(this, id, state, alias);
						break;
					case 'let':
						if (!alias && id.parent && id.query('LetStam')){
							alias = 'l_$';
						}
						setDefine(this, id, state, alias);
						break;
					default:
						setDefine(this.valid, id, state, alias);
						break;
				}
				return state;
			};
			function setDefine(scope, ids, state, alias){
				var variables, text, exist;
				variables = scope[state+'s'] || scope.variables;
				if (typeof ids == 'string'){
					ids = [{"text": ids}];
				}
				for (var id, i = 0; i < ids.length; i++){
					id = ids[i];
					text = id.text;
					if (variables.hasOwnProperty(text)){
						exist = variables[text];
						if (exist[0] == 'const'){
							throw Error.create(1003, vars, new Error());
						}
						if (state == 'undefined' || state == 'unknow'){
							continue;
						}
					}else if (state == 'undefined' || state.indexOf('undefined') != -1){
						scope.undefines[text] = id.isToken ? id : text;
					}
					!variables[text] && (variables[text] = [undefined]);
					variables[text][0] = state;
					if (alias){
						variables[text][1] = alias.replace(/\$/g, text);
					}
				}
			};
			Scope.prototype.state = function (target, level){
				var state;
				if (level == null) level = 0;
				if (state = this.check(target, level, true)){
					return state[0];
				}
			};
			Scope.prototype.alias = function (target, level){
				var state;
				if (level == null) level = 0;
				if (state = this.check(target, level, true)){
					return state[1];
				}
			};
			Scope.prototype.check = function (target, level, not_define){
				var name, ref, scope, state, stop, _scope;
				if (level == null) level = 0;
				ref = checkTarget(target), target = ref[0], name = ref[1];
				scope = this;
				if (scope.variables.hasOwnProperty(name)){
					return scope.variables[name];
				}
				while (scope.type == 'Let'){
					scope = scope.upper;
					if (scope.variables.hasOwnProperty(name)){
						return scope.variables[name];
					}
				}
				if (level !== 1){
					if (target && !not_define){
						state = checkScopeMap(target);
						if (state && state != 'undefined' && state != 'unknow'){
							return [this.define(state, target)];
						}
					}
					if (level.isScope){
						stop = level;
						level = 0;
					}
					_scope = null;
					while (scope = scope.upper){
						if (scope == stop && scope != _scope && --level){
							break;
						}
						_scope = scope;
						if (scope.variables.hasOwnProperty(name)){
							state = scope.variables[name];
							this.variables[name] = [/undefined|defined|name/.test(state[0]) ? 'unknow' : state[0], state[1]];
							return scope.variables[name];
						}
					}
					if (state){
						return [this.define(state, target)];
					}
				}
			};
			Scope.prototype.member = function (target){
				var name, ref, cls;
				ref = checkTarget(target), target = ref[0], name = ref[1];
				if (cls = this.query('Class')){
					if (cls.protos.hasOwnProperty(name)){
						return 'proto';
					}
					if (cls.statics.hasOwnProperty(name)){
						return 'static';
					}
				}
			};
			Scope.prototype.cachePush = function (name, something){
				var cache;
				cache = this.cache;
				!cache[name] && (cache[name] = []);
				cache[name].push(something);
				return cache[name];
			};
			Scope.prototype.isScope = true;
			Scope.init = function(ast, check_define, __scope){
				var type;
				if (!__scope){
					__scope = new Scope(ast.is('Let', 'Class', 'Function', 'Root') || 'Root', ast);
					ast.scope = __scope;
				}
				for (var node, i = 0; i < ast.length; i++){
					node = ast[i];
					if (type = node.is('Let', 'Class', 'Function', 'Root')){
						node.scope = new Scope(type, node, __scope);
						Scope.init(node, check_define, node.scope);
					}else {
						node.scope = __scope;
						if (scope_map[node.type]){
							if (type = checkScopeMap(node, scope_map[node.type])){
								if (decl_types.indexOf(type) != -1){
									__scope.define(type, node);
								}
							}
						}
						if (node.isSyntax){
							Scope.init(node, check_define, __scope);
						}
					}
				}
				return ast.scope;
			};
			Scope.defineScope = function(patt){
				var slices;
				slices = SText.split(patt, '->', true);
				compileScopeMap(slices.pop(), slices.reverse(), 0, scope_map);
			};
			Scope.test = function(node){
				return !!scope_map[node.type];
			};
			function compileScopeMap(type, patt, index, __sub){
				var names, test, top, ref, m, testIndex, sub, sub2;
				names = patt[index];
				if (names[0] == '<'){
					names = names.substr(1).trim();
					test = true;
				}else if (/\<\-/.test(names)){
					ref = names.split('<-'), top = ref[0], names = ref[1];
					top = top.trim().split(' ');
				}
				names = names.trim().split(' ');
				for (var name, i = 0; i < names.length; i++){
					name = names[i];
					if (m = name.match(/^(\w+)\[(\d+)\]$/)){
						name = m[1];
						testIndex = m[2];
					}
					sub = sub2 = null;
					if (test){
						__sub[name] = __sub[name] || {};
						sub = __sub;
						if (testIndex){
							__sub[name].testIndex = true;
							sub2 = __sub[name][testIndex] = __sub[name][testIndex] || {};
						}else {
							sub2 = __sub[name].subs = __sub[name].subs || {};
						}
					}else {
						sub = __sub[name] = __sub[name] || {};
						if (testIndex){
							__sub[name].testIndex = true;
							sub = __sub[name][testIndex] = __sub[name][testIndex] || {};
						}
					}
					if (top){
						__sub[name].tops = top;
						top.default = type;
					}
					if (index < patt.length-1){
						compileScopeMap(type, patt, index+1, sub);
						if (sub2){
							compileScopeMap(type, patt, index+1, sub2);
						}
					}else if (!top){
						__sub[name].default = type;
					}
				}
			};
			function checkScopeMap(node, _map, _not_def){
				var parent, map, index, ref;
				if (!_map){
					if (scope_map[node.type]){
						return checkScopeMap(node, scope_map[node.type]);
					}
					return;
				}
				if (parent = node.parent){
					if (parent.type == 'ArgusStam'){
						parent = parent.parent;
					}
					if (parent && (map = _map[parent.type])){
						if (map.testIndex){
							index = node.index;
							if (map[index]){
								if (ref = checkScopeMap(parent, map[index], true) || map.default){
									return ref;
								}
							}
							return checkScopeMap(parent, map, true) || _map.default;
						}
						return checkScopeMap(parent, map);
					}
					if (_map.tops){
						if (parent.scope && _map.tops.indexOf(parent.scope.valid.type) != -1){
							return _map.tops.default;
						}
					}
				}
				if (_map.subs){
					return checkScopeMap(node, _map.subs);
				}
				if (!_not_def && _map.default){
					return _map.default;
				}
			};
			function checkTarget(target){
				var name;
				if (target.isSyntax || target.isToken){
					name = target.text;
					if (target.isToken){
						target = target.parent;
					}
				}else {
					name = target;
					target = null;
				}
				return [target, name];
			};
			return Scope;
		})()
		module.exports = Scope;
	});
	return module.exports;
})('./core/scope.js', './core');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card = (function(){
			var not_semicolon, width_limit;
			not_semicolon = /^(COMMENT|IfStam|WhileStam|DoWhileStam|WithStam|ForStam|SwitchStam|CaseStam|DefaultStam)$/;
			width_limit = 80;
			Card.prototype.isCard = true;
			function Card(type){
				this.type = type || '';
				this.length = 0;
				if (arguments.length > 1){
					this.add.apply(this, Jsop.toArray(arguments, 1));
				}
			};
			Card.prototype.add = function (){
				var type;
				for (var item, i = 0; i < arguments.length; i++){
					item = arguments[i];
					if (!item){
						continue;
					}
					if (item.isToken){
						if (!item.is('EOT')){
							this[this.length++] = item;
						}
						continue;
					}
					type = typeof item;
					if (item.isCard || type == 'string'){
						this[this.length++] = item;
						continue;
					}
					if (type == 'number'){
						this[this.length++] = item+'';
						continue;
					}
					if (isArray(item)){
						this.add.apply(this, item);
						continue;
					}
					throw Error.create(5004, isClass(item), new Error());
				}
				return this;
			};
			Card.prototype.insert = function (pos){
				var args;
				args = Jsop.toArray(arguments, 1);
				for (var i = pos; i < this.length; i++){
					args.push(this[i]);
				}
				this.length = pos;
				this.add.apply(this, args);
				return this;
			};
			Card.prototype.delete = function (a, b){
				if (b == null) b = a;
				Array.prototype.splice.call(this, a, b-a+1);
				return this;
			};
			Card.prototype.__defineGetter__("text", function(){
				return this.toScript();
			});
			Card.prototype.toScript = function (){
				if (!this._formated){
					format(this);
				}
				return toText(this);
			};
			Card.prototype.toList = function (){
				var list;
				list = [];
				for (var item, i = 0; i < this.length; i++){
					item = this[i];
					if (!item) continue;
					if (item.isCard){
						list.push.apply(list, item.toList());
					}else {
						list.push(item);
					}
				}
				return list;
			};
			function toText(list){
				var texts = [];
				for (var item, i = 0; i < list.length; i++){
					item = list[i];
					if (item.isToken){
						if (item.is('EOT')){
							continue;
						}
						texts.push(item.text);
					}else if (item.isCard || isArray(item)){
						texts.push(toText(item));
					}else {
						texts.push(item);
					}
				}
				return texts.join('');
			};
			function countText(card){
				var texts;
				texts = [];
				for (var item, i = 0; i < card.length; i++){
					item = card[i];
					if (!item){
						continue;
					}
					if (item.isToken){
						texts.push(item.text);
					}else if (item.isCard){
						texts.push(countText(item));
					}else {
						texts.push(item);
					}
				}
				return texts.join('');
			};
			function countTextLen(card, limit){
				var len;
				len = 0;
				for (var item, i = 0; i < card.length; i++){
					item = card[i];
					if (limit && len >= limit){
						return len;
					}
					if (item.isToken){
						len += item.text.length;
					}else if (item.isCard || isArray(item)){
						len += countTextLen(item, limit && limit-len);
					}else {
						len += item.length;
					}
				}
				return len;
			};
			function format(card){
				each(card);
				if (card.type == 'Root' && card.length){
					if (card.length > 1 || (card[0].type != 'JsonExpr' && card[0].type != 'ArrayExpr')){
						lineFeed(card);
					}
				}
				return card;
			};
			function each(card){
				var parent;
				parent = card.type;
				for (var item, i = 0; i < card.length; i++){
					item = card[i];
					if (!item){
						continue;
					}
					switch (item.type){
						case 'COMMENT':
							if (Tea.argv['--clear']){
								card[i] = null;
							}
							break;
						case 'ArrayExpr':
							formatArray(item);
							break;
						case 'JsonExpr':
							formatJson(item);
							break;
						case 'VarStam':case 'ConstStam':case 'LetStam':
							formatVar(item);
							break;
						case 'Block':
							if (item.length){
								each(item);
								lineFeed(item, parent);
								indentLine(item, parent);
								if (card.type == 'BlockNode'){
									item.add('\n');
								}else if (typeof card[i+1] == 'string' && /^\s*}/.test(card[i+1])){
									item.add('\n');
								}
							}
							break;
						default:
							if (item.isCard){
								each(item);
							}else if (item == ','){
								card[i] = ', ';
							}
							break;
					}
				}
				return card;
			};
			function lineFeed(card, parent){
				for (var line, i = card.length - 1; i >= 0; i--){
					line = card[i];
					if (line){
						if (!not_semicolon.test(line.type) && parent != 'Block'){
							card.insert(i+1, ';');
						}
						if (i || parent && parent != 'Block'){
							card.insert(i, '\n');
						}
					}
				}
			};
			function indentLine(card, parent){
				if (card.type == 'String')
					return card;
				for (var item, i = 0; i < card.length; i++){
					item = card[i];
					if (item == '\n'){
						card[i] = '\n\t';
						continue;
					}else if (i === 0 && parent){
						card.insert(0, '\t');
						continue;
					}
					if (item.isToken){
						if (!item.is('STRING')){
							card[i] = item.text.replace(/\n/g, '\n\t');
						}
						continue;
					}
					if (item.isCard){
						indentLine(item);
						continue;
					}
					if (typeof item == 'string'){
						card[i] = item.replace(/\n/g, '\n\t');
					}
				}
				return card;
			};
			function formatArray(card){
				var comma;
				comma = card[1];
				if (comma && comma.type == 'CommaExpr'){
					if (countTextLen(comma, width_limit) >= width_limit){
						for (var i = 0; i < comma.length; i++){
							if (comma[i].isCard){
								each(comma[i]);
							}else if (comma[i] == ', ' || comma[i] == ','){
								comma[i] = ',\n';
							}
						}
						comma.insert(0, '\n');
						indentLine(comma);
						return;
					}
				}
				each(card);
			};
			function formatJson(card){
				var comma;
				comma = card[1];
				if (comma && comma.type == 'CommaExpr'){
					if (countTextLen(comma, width_limit) >= width_limit){
						for (var i = 0; i < comma.length; i++){
							if (comma[i].isCard){
								each(comma[i]);
							}else if (comma[i] == ', ' || comma[i] == ','){
								comma[i] = ',\n';
							}
						}
						comma.insert(0, '\n');
						indentLine(comma);
						return;
					}
				}
				each(card);
			};
			function formatVar(card){
				var comma, text;
				comma = card[1];
				if (comma && comma.type == 'CommaExpr'){
					text = countText(comma);
					if (/\=/.test(text) && text.length >= width_limit){
						for (var i = 0; i < comma.length; i++){
							if (comma[i].isCard){
								each(comma[i]);
							}else if (comma[i] == ', ' || comma[i] == ','){
								comma[i] = ',\n';
							}
						}
						indentLine(comma);
						return;
					}
				}
				each(card);
			};
			return Card;
		})()
		module.exports = Card;
	});
	return module.exports;
})('./core/card.js', './core');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Pattern = require("./pattern.js")
		var Grammar = require("./grammar.js")
		function create(prepor){
			return new Grammar(prepor);
		}
		module.exports.create = create
		function pattern(text, src, prepor){
			var patt, grm, node;
			patt = Pattern.compile(text);
			if (src){
				grm = new Grammar(prepor);
				node = grm.pattern(patt, src);
				return node;
			}
			return patt;
		}
		module.exports.pattern = pattern
		function parser(name, src, params, prepor){
			var grm, node;
			grm = new Grammar(prepor);
			node = grm.parser(name, src, params, true);
			if (node && !node.isSyntax && node.length == 1){
				node = node[0];
			}
			return node;
		}
		module.exports.parser = parser
		function define(name, patt, mode){
			var debug;
			if (mode == 'debug'){
				mode = null;
				debug = true;
			}
			if (!mode){
				if (name.match(/\w+(Token|Expr|Decl|Patt|Stam)$/)){
					mode = 'ret node';
				}else {
					mode = 'not check';
				}
			}
			if (typeof patt == 'function'){
				Grammar[name] = {"name": name, "mode": mode, "fn": patt, "debug": debug};
			}else {
				Grammar[name] = {"name": name, "mode": mode, "pattern": Pattern.compile(patt), "debug": debug};
				if (debug){
					print('| * '+name, Grammar[name].pattern);
				}
			}
			return Grammar[name];
		}
		module.exports.define = define;
	});
	return module.exports;
})('./core/grammar/index.js', './core/grammar');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Standard, versions
		Standard = require("./standard.js")
		module.exports.versions = (versions = [])
		function create(version, prepor){
			if (!(Standard.hasOwnProperty(version))){
				throw Error.create(5007, version, new Error());
			}
			return new Standard(version, prepor);
		}
		module.exports.create = create
		function define(name, map){
			var std_obj;
			if (versions.indexOf(name) == -1){
				versions.push(name);
				!Standard[name] && (Standard[name] = {});
			}
			std_obj = compile(map, Standard[name]);
			return std_obj;
		}
		module.exports.define = define
		function compile(map, std_obj){
			var std, ref;
			for (var names in map){
				if (!map.hasOwnProperty(names)) continue;
				var item = map[names];
				std = _compile(item);
				for (var ref = names.split(' '), name, i = 0; i < ref.length; i++){
					name = ref[i];
					if (!/^[A-Z]/.test(name)){
						throw Error.create(5001, name, new Error());
					}
					std_obj[name] = std;
				}
			}
			return std_obj;
		}
		module.exports.compile = compile
		function _compile(data){
			var stds;
			stds = {};
			stds.isStandard = true;
			if (typeof data == 'string' || typeof data == 'function'){
				stds['default'] = data;
			}else if (isArray(data)){
				stds = [];
				stds.isStandard = 'list';
				for (var i = 0; i < data.length; i++){
					stds.push(_compile(data[i]));
				}
			}else {
				for (var cond in data){
					if (!data.hasOwnProperty(cond)) continue;
					var val = data[cond];
					if (typeof val == 'object'){
						val = _compile(val);
					}
					stds[cond.replace(/\s*\n\s*/g, ' ')] = val;
				}
			}
			return stds;
		};
	});
	return module.exports;
})('./core/standard/index.js', './core/standard');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Processor, Gatherer, Template, Source, bases
		Processor = require("./prepor")
		Gatherer = require("./gatherer")
		Template = require("./template.js")
		Source = require("../core/source.js")
		bases = new Processor()
		function create(something){
			var prepor;
			prepor = new Processor();
			prepor.extend(bases);
			if (something){
				if (something.isSource){
					gather(something, prepor);
				}else {
					prepor.extend(something);
					prepor.parent = something;
				}
			}
			return prepor;
		}
		module.exports.create = create
		function gather(src, prepor){
			!prepor && (prepor = new Processor());
			for (var token, i = 0; i < src.length; i++){
				token = src[i];
				if (!token){
					continue;
				}
				if (Gatherer[token.type]){
					i = Gatherer[token.type](prepor, src, i) || i;
				}
			}
			src.refresh(0);
			return prepor;
		}
		module.exports.gather = gather
		function concatModule(main, list){
			return Template.concatModule(main, list);
		}
		module.exports.concatModule = concatModule
		function load(files){
			var src, prepor;
			if (typeof files == 'string'){
				files = [files];
			}
			for (var file, i = 0; i < files.length; i++){
				file = files[i];
				if (src = new Source(null, file)){
					if (prepor = gather(src)){
						extend(prepor);
					}
				}
			}
			return bases;
		}
		module.exports.load = load
		function extend(prepor){
			bases.extend(prepor);
			return bases;
		}
		module.exports.extend = extend;
	});
	return module.exports;
})('./preprocess/index.js', './preprocess');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Token, Node, Grammar, Scope, Standard, ref, names, values, ref0, mode, ref1, ref2
		Token = require("../core/token.js")
		Node = require("../core/node.js")
		Grammar = require("../core/grammar")
		Scope = require("../core/scope.js")
		Standard = require("../core/standard")
		for (var name in (ref = require("./token.js"))){
			if (!ref.hasOwnProperty(name)) continue;
			var value = ref[name];
			names = name.split(' ').filter(function($){return $});
			values = value.replace(/([^\n])\s*\n+\s*/g, '$1  ').split('  ').filter(function($){return $});
			Token.define(names, values);
		}
		for (var name in (ref0 = require("./syntax"))){
			if (!ref0.hasOwnProperty(name)) continue;
			var value = ref0[name];
			mode = null;
			if (typeof value == 'string'){
				value = value.replace(/\n\s*/g, ' ');
			}
			if (/:debug$/.test(name)){
				mode = 'debug';
				name = name.slice(0, -6);
			}
			Grammar.define(name, value, mode);
		}
		for (var name in (ref1 = require("./node.js"))){
			if (!ref1.hasOwnProperty(name)) continue;
			var value = ref1[name];
			names = name.split(' ').filter(function($){return $});
			values = value.replace(/\s*\n+\s*/g, '  ').split('  ').filter(function($){return $});
			Node.define(names, values);
		}
		for (var ref2 = require("./scope.js"), value, i = 0; i < ref2.length; i++){
			value = ref2[i];
			Scope.defineScope(value);
		}
		Standard.define('es5', require("./standards/es5"));
	});
	return module.exports;
})('./settings/index.js', './settings');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Argv = (function(){
		    var _conf_re, _desc, _config;
		    _conf_re = /^\s*(\-\w)?(?:, *)?(\-\-[\w\-]+)?\ +(\<[^\>]+\>|\[[^\]]+\]|"[^"]+"|'[^']+'|\w+?\b)?\s*(.*)$/mg;
		    _desc = {};
		    _config = {};
		    function Argv(argv, desc){
		        this.length = 0;
		        if (argv || desc){
		            this.parse(argv, desc);
		        }
		    }
		    Argv.prototype.parse = function (argv, desc){
		        var last_name, type, value;
		        if (desc){
		            Argv.desc(desc);
		        }
		        if (argv){
		            last_name = '';
		            for (var i=0, name; i < argv.length; i++){
		                name = argv[i];
		                if (i === 0){
		                    if (/^node$|bin.*?node$/.test(name)){
		                        i += 1;
		                        continue;
		                    }
		                    if (name[0] != '-'){
		                        continue;
		                    }
		                }
		                if (name[0] == '-'){
		                    last_name = '';
		                    name = checkName(this, name);
		                    type = _config[name];
		                    if (type == 'boolean'){
		                        this[name] = true;
		                        continue;
		                    }
		                    value = argv[i+1];
		                    if (!value || value[0] == '-'){
		                        if (type == 'important'){
		                            throw '[Important argv]\n\n  '+_desc[name];
		                        }
		                        value = true;
		                    }else {
		                        i += 1;
		                    }
		                    this[name] = value;
		                    last_name = name;
		                }else if (last_name){
		                    if (!Array.isArray(this[last_name])){
		                        this[last_name] = [this[last_name]];
		                    }
		                    this[last_name].push(name);
		                }else if (!this['--file']){
		                    this['--file'] = name;
		                    last_name = '--file';
		                }else {
		                    this[this.length++] = name;
		                }
		            }
		        }
		        return this;
		    }
		    Argv.prototype.pipe = function (callback, timeout){
		        Argv.readPipe(callback, timeout);
		        return this;
		    }
		    Argv.prototype.set = function (desc){
		        Argv.desc(desc);
		        return this;
		    }
		    Argv.prototype.add = function (short, long, desc, type){
		        Argv.add(short, long, desc, type);
		        return this;
		    }
		    Argv.prototype.help = function (com){
		        if (com == null) com = 'help';
		        return print.toText(_desc[com]);
		    }
		    Argv.desc = function(desc, temp){
		        if (temp == null) temp = _conf_re;
		        var opt, m, short, long, type;
		        if (typeof desc == 'string'){
		            opt = [];
		            temp.lastIndex = 0;
		            while (m = temp.exec(desc)){
		                opt.push([m[1], m[2], m[3], m[4]]);
		            }
		            _desc.help = desc;
		        }else if (Array.isArray(desc)){
		            opt = desc;
		        }
		        if (opt && opt.length){
		            for (var i=0, item; i < opt.length; i++){
		                item = opt[i];
		                short = item[0], long = item[1], type = item[2], desc = item[3];
		                if (short || long){
		                    switch (type && type[0]){
		                        case '[':
		                            type = 'default';
		                            break;
		                        case '<':
		                            type = 'important';
		                            break;
		                        case '"':case "'":
		                            type = type.slict(1, -1);
		                            break;
		                        default:
		                            if (type){
		                                if (!desc){
		                                    desc = type, type = null;
		                                }else if (type == 'false'){
		                                    type = false;
		                                }else if (type == 'true'){
		                                    type = true;
		                                }
		                            }else {
		                                type = 'boolean';
		                            }
		                            break;
		                    }
		                    Argv.add(short, long, desc, type);
		                }
		            }
		        }
		    };
		    Argv.add = function(short, long, desc, type){
		        if (short && short.substr(0, 2) == '--'){
		            desc = long, long = short, short = null;
		        }
		        if (!long){
		            long = short, short = null;
		        }
		        if (desc){
		            desc = short+', '+long+' '+type+'      '+desc;
		            if (short) _desc[short] = desc;
		            _desc[long] = desc;
		        }
		        if (type){
		            if (short) _config[short] = type;
		            _config[long] = type;
		        }
		        if (short && long && short != long){
		            Argv.prototype.__defineGetter__(short, function(){
		                return this[long];
		            });
		            Argv.prototype.__defineSetter__(short, function(v){
		                return this[long] = v;
		            });
		        }
		        if (type != null && type != 'default' && type != 'important' && type != 'boolean' && type != 'number'){
		            Argv.prototype[long] = type;
		        }
		    };
		    Argv.readPipe = function(callback, timeout){
		        if (timeout == null) timeout = 100;
		        var timing;
		        process.stdin.setEncoding('utf8');
		        process.stdin.on('readable', function(){
		            var chunk;
		            chunk = process.stdin.read();
		            process.stdin.destroy();
		            process.stdin.resume();
		            clearTimeout(timing);
		            callback(chunk);
		        });
		        timing = setTimeout(function(){
		            process.stdin.destroy();
		            process.stdin.resume();
		            callback(null);
		        }, timeout);
		    };
		    Argv.create = function(argv, desc){
		        return new Argv(argv, desc);
		    };
		    function checkName(self, name){
		        var i, temp, type;
		        if (name[1] != '-' && name.length > 2){
		            for (i = 1; i < name.length-1; i++){
		                temp = '-'+name[i];
		                type = _config[temp];
		                if (type == 'important'){
		                    throw '[Important argv]\n\n  '+_desc[temp];
		                }
		                self[temp] = true;
		            }
		            name = '-'+name[name.length-1];
		        }
		        return name;
		    }
		    return Argv;
		})();
		module.exports = Argv;;
	});
	return module.exports;
})('../utils/argv/index.js', '../utils/argv');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		print.register('Token', tokenPrinter)
		print.register('Source', sourcePrinter)
		print.register('Location', locationPrinter)
		print.register('Pattern', patternPrinter)
		print.register('Syntax', syntaxPrinter)
		print.register('Scope', scopePrinter)
		print.register('Card', cardPrinter)
		print.register('Asset', assetPrinter)
		print.register('GrammarStack', grammarStackPrinter)
		function locationPrinter(loc){
			var text, pos, code, file;
			text = loc.source, pos = loc.start, code = text.slice(loc.start, loc.end+1), file = loc.fileName;
			return printer('Location', print.fragment(text, code, pos, file));
		}
		function tokenPrinter(token){
			return "(<g:"+(token.types.join(' ').replace(/\b(\w{3})\w+\b/g, '$1'))+":> '"+(SText(token.text))+"')";
		}
		function sourcePrinter(src){
			var texts;
			texts = [];
			for (var token, i = 0; i < src.length; i++){
				token = src[i];
				if (!token){
					continue;
				}
				if (token.isToken){
					texts.push((i && token.is('HEAD') ? '\n' : '')+tokenPrinter(token));
				}
			}
			return printer('Source', texts.join(' '));
		}
		function assetPrinter(asset, __level){
			var texts, conf, temp, text;
			if (__level == null) __level = 0;
			texts = [asset.type];
			conf = asset.config;
			for (var key in conf){
				if (!conf.hasOwnProperty(key)) continue;
				if (conf[key]){
					texts.push(key+':"'+conf[key]+'"');
				}
			}
			switch (asset.type){
				case '*':case 'Code Test':case 'Node Test':
					texts[0] += ': "'+asset.content+'"';
					break;
				case 'Codes Test':
					texts[0] += ': ["'+asset.content.join('" "')+'"]';
					break;
				case 'Method Test':
					texts[0] += ': '+asset.content+'('+asset.param.join(', ')+')';
					break;
				case 'Sub':
					texts.push('\n'+patternPrinter(asset.content, __level+1).replace(/^/mg, SText.tabsize)+'\n');
					break;
				case 'Pair Test':
					texts[0] += ': "'+asset.content[0]+'" ... "'+asset.content[1]+'"';
					break;
				case 'Set Test':
					temp = [];
					for (var key in asset.content){
						if (!asset.content.hasOwnProperty(key)) continue;
						if (key[0] != '_'){
							temp.push(key+'→'+asset.content[key].patt);
						}
					}
					texts[0] += ': ['+temp.join(',')+']';
					break;
			}
			text = '['+texts.join(' ')+']';
			return text;
		}
		function patternPrinter(patt, __level){
			var texts, text;
			if (__level == null) __level = 0;
			switch (isClass(patt)){
				case 'Asset':
					return assetPrinter(patt, __level);
				case 'Pattern':
					texts = [];
					for (var i = 0; i < patt.length; i++){
						texts.push(patternPrinter(patt[i], __level+1));
					}
					if (isClass(patt[0]) == 'Pattern'){
						text = texts.join('\n[r{or}]----\n');
					}else {
						text = texts.join('\n').replace(/^/mg, '|  ');
					}
					break;
			}
			if (__level === 0){
				text = printer('Grammar Pattern', '"<'+patt.string+'>"'+'\n'+text);
			}
			return text;
		}
		function syntaxPrinter(node, __level, __indent){
			var indent, texts, text;
			if (__level == null) __level = 0;
			if (__indent == null) __indent = 0;
			indent = '';
			texts = [];
			if (/root|block/i.test(node.type) && node.length){
				indent = '\n'+SText.copy(SText.tabsize, __indent+1);
			}
			for (var item, i = 0; i < node.length; i++){
				item = node[i];
				if (!item) continue;
				if (node[i].isToken){
					texts.push("'"+SText(node[i].text)+"'");
				}else {
					texts.push(indent+syntaxPrinter(node[i], __level+1, indent ? __indent+1 : __indent));
				}
			}
			text = "[(<g:"+(node.type)+":>) "+texts.join(', ')+(indent ? '\n'+SText.copy(SText.tabsize, __indent) : '')+']';
			if (__level === 0){
				return printer('Syntax Tree', text);
			}
			return text;
		}
		function scopePrinter(scope, __level){
			var texts, undefineds, ref, c, m, text;
			if (__level == null) __level = 0;
			texts = [];
			texts.push(scope.type+(scope.name ? ' "'+scope.name+'"' : ''));
			undefineds = Object.keys(scope.undefines);
			if (undefineds.length){
				texts.push('  undefineds : "'+undefineds.join('", "')+'"');
			}
			for (var ref = ['variables', 'protos', 'statics'], type, i = 0; i < ref.length; i++){
				type = ref[i];
				if (c = scope[type]){
					m = {};
					for (var k in c){
						if (!c.hasOwnProperty(k)) continue;
						var v = c[k];
						if (v){
							!m[v[0]] && (m[v[0]] = []);
							m[v[0]].push(k);
						}
					}
					if (!Jsop.isEmpty(m)){
						texts.push('  '+type+' :');
					}
					for (var k in m){
						if (!m.hasOwnProperty(k)) continue;
						var v = m[k];
						texts.push('      "'+k+'" : "'+v.join('", "')+'"');
					}
				}
			}
			if (scope.subs){
				texts.push('<-->');
				for (var i = 0; i < scope.subs.length; i++){
					texts.push('  sub : '+(scopePrinter(scope.subs[i], __level+1)).replace(/^/mg, '        ').trim());
				}
			}
			text = '[ '+texts.join('\n')+'\n]';
			if (__level === 0){
				return printer('Scope Object', text);
			}
			return text;
		}
		function cardPrinter(data, __level, __circular){
			var texts, isblock, text;
			if (__level == null) __level = 0;
			if (__circular == null) __circular = [];
			__circular.push(data);
			texts = [];
			for (var item, i = 0; i < data.length; i++){
				item = data[i];
				if (item.isToken){
					texts.push('"'+SText(item.text)+'"');
				}else if (typeof item == 'string'){
					texts.push(SText(item));
				}else {
					if (__circular.indexOf(item) != -1){
						return '[Circular]';
					}
					texts.push(cardPrinter(item, __level+1, __circular));
				}
			}
			isblock = /root|block/i.test(data.type);
			text = '[('+data.type.replace(/(Expr|Stam|Decl|Patt)$/g, '')+')'+(data.type == 'Root' ? '\n' : '');
			text += texts.join(isblock ? '\n' : '');
			text += ']';
			if (/block/i.test(data.type)){
				text = text.replace(/^/mg, '\t');
			}
			if (__level === 0){
				return printer('Script Card', text);
			}
			return text;
		}
		function grammarStackPrinter(stack, __level){
			var texts, text;
			if (__level == null) __level = 0;
			texts = [];
			if (stack.name){
				texts.push(stack.name);
			}
			for (var item, i = 0; i < stack.subs.length; i++){
				item = stack.subs[i];
				if (typeof item == 'string'){
					texts.push(item);
				}else {
					texts.push(grammarStackPrinter(item, __level+1));
				}
			}
			if (texts.length > 2){
				text = ('*'+texts.join('\n    > ')).replace(/^(?!\*)/mg, '  ');
			}else {
				text = texts.join(' - ');
			}
			if (__level == 0){
				return printer('Grammar stack', text);
			}
			return text;
		}
		function printer(title, text){
			text = "| * "+title+" Printer\n"+(text.replace(/^/mg, '  *  '))+"\n| * End\n";
			return text;
		};
	});
	return module.exports;
})('./helper/printer.js', './helper');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Code
		Code = require("./code.js")
		Error.create = function(){
			var args, msg, name, err, stacks, code;
			args = Jsop.toArray(arguments);
			msg = '';
			name = 'Parse error';
			if (args[args.length-1] instanceof Error){
				err = args.pop();
				stacks = print.stacks(err);
				msg = err.message;
			}else {
				err = new Error();
				stacks = print.stacks(err);
				stacks.shift();
			}
			if (typeof args[0] == 'string'){
				msg = args.shift();
			}else if (typeof args[0] == 'number'){
				code = args.shift();
				msg = Code[code] || 'Undefined error code "'+code+'"';
				name = (Code[Math.floor(code/100)*100] || name)+' ('+code+')';
			}
			err.message = '['+name+']\n\n'+format(msg, args, stacks).replace(/^/mg, ' • ');
			err.stacks = stacks;
			err.__defineGetter__('stack', toStack);
			return err;
		}
		Error.code = Code
		function format(text, args, stacks){
			var i;
			for (var item, i = 0; i < args.length; i++){
				item = args[i];
				switch (isClass(item)){
					case 'Number':
						text = replace(text, '%d', item);
						break;
					case 'String':
						text = replace(text, '%s', item);
						break;
					case 'Standard':
						text = replace(text, '%j', formatStandard(item));
						break;
					case 'Syntax':case 'Token':case 'Source':case 'Location':
						text = replace(text, '%j', formatLocation(item));
						break;
					case 'Object':
					default:
						text = replace(text, '%j', SText(item));
						break;
				}
			}
			if (text.indexOf('%e')){
				i = 0;
				text = text.replace(/%e/g, function(){return '<> at "'+stacks[i].fileName+':'+stacks[i].lineNumber+':'+stacks[i++].columnNumber+'"'});
			}
			return print.format(text);
		}
		function formatStandard(std){
			var cache, texts, p;
			cache = std.cache;
			texts = [
				'-> '+cache.version+'.'+cache.standard+'<>"'+cache.condition+'" : "'+(cache.pattern || '???')+'"'];
			p = cache.__parent;
			while (p){
				if (p.standard){
					texts.push(p.version+'.'+p.standard+'<>"'+p.condition+'" : "'+p.pattern+'"');
				}
				p = p.__parent;
			}
			texts.reverse();
			for (var i = 0; i < texts.length; i++){
				texts[i] = SText.copy('  ', i)+texts[i];
			}
			return texts.join('\n');
		}
		function formatLocation(obj){
			switch (isClass(obj)){
				case 'Syntax':
					return formatLocation(obj.tokens(0));
				case 'Source':
					return formatLocation(obj.current);
				case 'Token':
					return formatLocation(obj.location);
				case 'Location':
					return print.fragment(obj.source, obj.code, obj.lineNumber, obj.columnNumber, obj.fileName);
			}
			return 'undefined';
		}
		function replace(text, substr, target){
			if (text.indexOf(substr) != -1){
				return text.replace(substr, target);
			}
			return text+'\n\n'+target;
		}
		function toStack(){
			if (toStack.caller){
				return this.message;
			}
			console.log(this.message+'\n');
			console.log(print.toText(this.stacks));
			Tea.exit(99);
		};
	});
	return module.exports;
})('./helper/error.js', './helper');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = function(msg, loc){
			if (loc){
				msg += ' <60> '+loc.fileName+':'+loc.lineNumber;
			}
			print(msg.replace(/^/mg, '  '));
		};
	});
	return module.exports;
})('./helper/log.js', './helper');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Node = (function(){
			var array;
			array = Array.prototype;
			function Node(){};
			Node.prototype.__defineGetter__("index", function(){
				return !this.parent ? -1 : array.indexOf.call(this.parent, this);
			});
			Node.prototype.__defineGetter__("root", function(){
				var p, circular;
				p = this;
				circular = [];
				while (p.parent){
					if (circular.indexOf(p.parent) != -1){
						throw Error.create(3, p, new Error());
					}
					p = p.parent;
					circular.push(p);
				}
				return p;
			});
			Node.prototype.find = function (type){
				var list, _list;
				list = [];
				for (var node, i = 0; i < this.length; i++){
					node = this[i];
					if (node.type == type){
						list.push(node);
					}else if (node.isSyntax){
						if (_list = node.find(type)){
							list.push.apply(list, _list);
						}
					}
				}
				if (list.length){
					return list;
				}
			};
			Node.prototype.query = function (type){
				var p;
				p = this.parent;
				while (p && !p.is.apply(p, arguments)){
					if (p.is('Block')){
						return;
					}
					p = p.parent;
				}
				return p;
			};
			Node.prototype.tokens = function (index){
				if (this.isToken){
					return index ? null : (index == 0 ? this : [this]);
				}
				var tokens = [];
				for (var i = 0; i < this.length; i++){
					if (!this[i]){
						continue;
					}
					if (this[i].isToken){
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
			};
			Node.prototype.each = function (fn, __that, __indexs){
				var that, ref;
				if (__indexs == null) __indexs = [];
				that = __that || this;
				if (this.isToken){
					fn.call(that, this, __indexs.concat(0));
				}else {
					for (var node, i = 0; i < this.length; i++){
						node = this[i];
						if (node){
							ref = fn.call(that, node, __indexs.concat(i));
							if (ref === 0){
								continue;
							}
							if (ref === false){
								return __that ? false : this;
							}
							if (node.isSyntax && node.each(fn, that, __indexs.concat(i)) === false){
								return __that ? false : this;
							}
						}
					}
				}
				return this;
			};
			Node.prototype.is = function (){
				var types;
				types = this.types || [this.type];
				for (var item, i = 0; i < arguments.length; i++){
					item = arguments[i];
					if (item == 'HEAD' && this.indent >= 0){
						return item;
					}else if (types.indexOf(item) != -1){
						return item;
					}else if (Node.isType(types[0], item)){
						return item;
					}
				}
				return false;
			};
			Node.map = {};
			Node.define = function(types, names){
				var node_map;
				node_map = Node.map;
				for (var name, i = 0; i < names.length; i++){
					name = names[i];
					if (node_map.hasOwnProperty(name)){
						Node.define(types, node_map[name]);
					}
					for (var type, j = 0; j < types.length; j++){
						type = types[j];
						!node_map[type] && (node_map[type] = []);
						if (node_map[type].indexOf(name) == -1) node_map[type].push(name);
					}
				}
			};
			Node.isType = function(name, type){
				var node_map;
				node_map = Node.map;
				if (!type){
					if (node_map['Expression'].indexOf(name) != -1){
						return 'Expression';
					}
					if (node_map['Declaration'].indexOf(name) != -1){
						return 'Declaration';
					}
					if (node_map['Statement'].indexOf(name) != -1){
						return 'Statement';
					}
					return false;
				}
				return name == type || node_map[type] && node_map[type].indexOf(name) != -1;
			};
			Node.prototype.isNode = true;
			return Node;
		})()
		module.exports = Node;
	});
	return module.exports;
})('./core/node.js', './core');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Location = (function(){
			var file_cache = [], source_cache = [];
			function Location(file, source, code, start, end, line, column){
				if (!source && file){
					source = SText.readFile(file);
				}
				this.__file_id = CacheFile(file);
				this.__source_id = CacheSource(source);
				this.code = code || '';
				this.lineNumber = line != null ? line : null;
				this.columnNumber = column != null ? column : null;
				this.start = start != null ? start : 0;
				this.end = end || start+this.code.length-1;
				if (line == null){
					CountLineNumber(this, start);
				}
			};
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
			};
			function CountLineNumber(loc, start){
				var data;
				if (data = source_cache[loc.__source_id]){
					for (var line_data, i = 0; i < data.length; i++){
						line_data = data[i];
						if (start >= line_data[1] && start <= line_data[2]){
							loc.lineNumber = line_data[0];
							loc.columnNumber = start-line_data[1];
							break;
						}
					}
				}
				return loc;
			};
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
			};
			function CacheSource(source){
				if (typeof source == 'number'){
					return source;
				}
				if (source){
					var index = -1;
					for (var i = 0; i < source_cache.length; i++){
						if (source_cache[i].text == source){
							index = i;
							break;
						}
					}
					if (index == -1){
						var lines = source.split('\n'), shift = 0, data = [];
						for (var line, i = 0; i < lines.length; i++){
							line = lines[i];
							data.push([i+1, shift, (shift += line.length+1)-1, line+'\n']);
						}
						data.source = source;
						index = source_cache.push(data)-1;
					}
					return index;
				}
				return null;
			};
			return Location;
		})()
		module.exports = Location;
	});
	return module.exports;
})('./core/location.js', './core');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Pattern = (function(){
			var Asset, Syntax, cache, check_loop;
			Asset = require("./asset.js");
			Syntax = require("../syntax.js");
			cache = Jsop.data();
			check_loop = {};
			function Pattern(str){
				var or_list, asset_list, patt;
				this.length = 0;
				this.minLimit = 0;
				if (str){
					this.string = str;
					or_list = splitPattern(str);
					if (or_list.length == 1){
						this.type = 'Pattern';
						asset_list = or_list[0];
						for (var i = 0; i < asset_list.length; i++){
							this.add(compileAsset(asset_list[i]));
						}
					}else {
						this.type = 'Or';
						for (var asset_list, j = 0; j < or_list.length; j++){
							asset_list = or_list[j];
							patt = new Pattern();
							patt.string = asset_list.join(' ');
							for (var i = 0; i < asset_list.length; i++){
								patt.add(compileAsset(asset_list[i]));
							}
							this.add(patt);
						}
					}
				}
			};
			Pattern.prototype.add = function (){
				for (var asset, i = 0; i < arguments.length; i++){
					asset = arguments[i];
					this[this.length++] = asset;
					if (asset.isPattern){
						if (asset.minLimit){
							this.minLimit = 1;
						}
					}else {
						this.minLimit += !asset.config.mode || asset.config.mode[0] == '+' ? 1 : 0;
					}
				}
				return this;
			};
			Pattern.prototype.parse = function (grm, src, params){
				var handle, _params, res;
				if (check_loop.index != src.index){
					check_loop.count = {};
					check_loop.index = src.index;
					check_loop.times = 0;
				}else {
					if (check_loop.times > 500){
						throw Error.create(4003, grm.stack('loop'), new Error());
					}
					check_loop.times++;
				}
				handle = grm.handle;
				_params = handle.params;
				handle.params = params;
				if (handle.debug){
					print('['+handle.name+' syntax debug]');
					print.indent();
				}
				res = checkPattern(this, src, grm, true);
				if (handle.debug){
					print.back();
					print('['+handle.name+' syntax debug end]\n');
				}
				handle.params = _params;
				if (handle.error){
					return {"error": handle.error};
				}
				return res;
			};
			Pattern.prototype.isPattern = true;
			Pattern.compile = function(str){
				if (!cache[str]){
					return cache[str] = new Pattern(str);
				}
				return cache[str];
			};
			Pattern.parse = function(grm, patt, src, params){
				if (typeof patt == 'string'){
					patt = Pattern.compile(patt);
				}
				return patt.parse(grm, src, params);
			};
			function splitPattern(str){
				var or_list;
				str = str.replace(/\s+(→)/g, '$1');
				str = str.replace(/(^| |,)(\[|\(|\{|\]|\)|\})(∅|→|\\n\n|:\d+|\+\?|\*\?|\+|\*|\!|\?)( |$)/g, '$1\\$2$3$4');
				or_list = SText.split(str, '|');
				for (var item, i = 0; i < or_list.length; i++){
					item = or_list[i];
					or_list[i] = SText.split(item, ' ', true);
				}
				return or_list;
			};
			function compileAsset(str){
				var asset;
				asset = Asset.compile(str);
				if (asset.type == 'Sub'){
					if (!asset.content.isPattern){
						asset.content = Pattern.compile(asset.content);
					}
				}
				return asset;
			};
			// parse pattern
			function checkPattern(patt, src, grm, __root){
				var start_index, res;
				start_index = src.index;
				if (patt.type == 'Or'){
					for (var i = 0; i < patt.length; i++){
						src.index = start_index;
						if (res = parsePattern(patt[i], src, grm, __root)){
							break;
						}
						if (grm.handle.error){
							return false;
						}
					}
				}else {
					res = parsePattern(patt, src, grm, __root);
				}
				if (res){
					if (res.isEmpty){
						return res;
					}
					return checkPack(patt, grm, res, null, __root);
				}
				src.index = start_index;
				return false;
			};
			function parsePattern(patt, src, grm, __root){
				var start_index, valid_index, res_list, total_ig, test_up, handle, step_index, ref, config;
				start_index = valid_index = src.index;
				res_list = [];
				res_list.matched = 0;
				total_ig = 0;
				test_up = false;
				handle = grm.handle;
				if (__root) handle.cache = res_list;
				for (var asset, i = 0; i < patt.length; i++){
					asset = patt[i];
					test_up = false;
					step_index = src.index;
					ref = parseAsset(asset, src, grm);
					if (handle.error) return false;
					config = asset.config;
					if (ref){
						if (config.mode == '!'){
							return grm.error(config.error, src.current);
						}
						res_list.matched++;
						if (config.test || ref.isTest){
							test_up = true;
							checkPack(asset, grm, ref, res_list);
							src.index = step_index;
							continue;
						}
						if (config.mode == '*' || config.mode == '+'){
							ref = matchMore(asset, src, grm, ref, config.smallest ? patt[i+1] : null);
						}
						if (ref === true){
							checkPack(asset, grm, ref, res_list);
							valid_index = src.index;
							total_ig++;
							continue;
						}
						valid_index = src.index;
						if (!ref.isEmpty){
							grm.next(src, !config.lf);
						}
						if (config.ig){
							checkPack(asset, grm, ref, res_list);
							total_ig++;
							continue;
						}
						ref = checkPack(asset, grm, ref, res_list);
						if (ref.isToken || ref.isSyntax){
							res_list.push(ref);
						}else if (ref.length){
							res_list.push.apply(res_list, ref);
						}
					}else {
						if (config.mode == '?' || config.mode == '*' || config.mode == '!'){
							src.index = step_index;
							if (config.pack == 'check empty'){
								res_list.push(new Syntax(config.name));
							}
							continue;
						}
						if (asset.type == 'Sub' && asset.content.minLimit == 0){
							src.index = step_index;
							continue;
						}
						return grm.error(config.error, src[step_index-1]);
					}
				}
				src.index = valid_index;
				if (res_list.matched){
					if (res_list.length == 1 && patt.length == 1){
						res_list = res_list[0];
					}
					if (res_list.length === 0 && start_index === src.index && total_ig === 0){
						res_list.isEmpty = true;
						if (patt.length == 1 && test_up){
							res_list.isTest = true;
						}
					}
					return res_list;
					src.index = start_index;
				}
			};
			function parseAsset(asset, src, grm){
				var start_index, handle, ref;
				start_index = src.index;
				handle = grm.handle;
				if (start_index >= src.length){
					return false;
				}
				if (asset.type == 'Sub'){
					if (handle.debug){
						print.indent();
					}
					ref = checkPattern(asset.content, src, grm);
					if (handle.debug){
						print.back();
					}
				}else {
					ref = asset.parse(src, grm);
				}
				if (handle.debug){
					print('[Asset] =', !!ref, asset, [ref ? src.join(start_index, src.index) : src[start_index].text]);
				}
				if (ref && !grm.handle.error){
					if (ref === true || ref.isSyntax || ref.isToken || ref.length || ref.matched){
						return ref;
					}
					return true;
				}
				src.index = start_index;
				return false;
			};
			function matchMore(asset, src, grm, res, next_asset){
				var step_index, res_list;
				step_index = src.index;
				res_list = res.isToken || res.isSyntax ? [res] : res;
				while (res = matchNext(asset, src, grm, next_asset)){
					if (step_index == src.index){
						return res_list;
					}
					step_index = src.index;
					if (res_list === true){
						continue;
					}
					if (res.isToken || res.isSyntax){
						res_list.push(res);
					}else if (res.length){
						res_list.push.apply(res_list, res);
					}
				}
				src.index = step_index;
				return res_list;
			};
			function matchNext(asset, src, grm, next_asset){
				var start_index, next, res;
				start_index = src.index;
				if (next_asset){
					grm.handle.try = true;
					grm.next(src, !asset.config.lf);
					next = parseAsset(next_asset, src, grm);
					grm.handle.try = false;
				}
				src.index = start_index;
				if (!next){
					grm.next(src, !asset.config.lf);
					if (res = parseAsset(asset, src, grm)){
						return res;
					}
				}
				src.index = start_index;
				return false;
			};
			function checkPack(asset, grm, res, res_list, __root){
				var handle, config, name, res_cache;
				handle = grm.handle;
				if (!(config = asset.config)){
					if (handle.packName && handle.pattern == asset){
						config = {"name": handle.packName, "pack": handle.packMode};
					}
				}
				if (!config || !(name = config.name)){
					return res;
				}
				switch (config.pack){
					case 'rename pattern':
						handle.packMode = 'rename response';
						handle.packName = name;
						break;
					case 'pattern name':
						handle.packMode = 'response name';
						handle.packName = name;
						break;
					case 'check response':
						if (res && !res.isSyntax && res.length > 1){
							return new Syntax(name, res);
						}
						break;
					case 'packing matched':
						res_cache = handle.cache;
						if (res_cache.length){
							if (res_list && res_cache != res_list){
								res_cache[0] = new Syntax(name, res_cache, res_list, res);
								res_list.length = 0;
							}else {
								res_cache[0] = new Syntax(name, res_cache, res);
							}
							res_cache.length = 1;
						}
						return true;
					case 'response name':
						return new Syntax(name, res);
					case 'rename response':
						if (!res.isSyntax && res.length == 1){
							res = res[0];
						}
						if (res.isSyntax){
							res.type = name;
						}else {
							return new Syntax(name, res);
						}
						break;
				}
				return res;
			};
			return Pattern;
		})()
		module.exports = Pattern;
	});
	return module.exports;
})('./core/grammar/pattern.js', './core/grammar');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Grammar = (function(){
			function Grammar(prepor){
				this.prepor = prepor;
				this.handle = {};
			};
			var Syntax = require("../syntax.js");
			var Pattern = require("./pattern.js");
			Grammar.prototype.next = function (src, ig_lf){
				src.next(ig_lf, true);
				if (this.parser('COMMENT', src, null, false, true)){
					this.next(src, ig_lf);
				}
				return src;
			};
			Grammar.prototype.parser = function (name, src, params, __try, __inherit_handle){
				var parser, _handle, ref;
				if (arguments.length == 1){
					return Grammar.hasOwnProperty(name);
				}
				if (!(Grammar.hasOwnProperty(name))){
					if (__try) return;
					throw Error.create(4001, name, new Error());
				}
				parser = Grammar[name];
				_handle = this.handle;
				if (!__inherit_handle){
					this.handle = {"name": name, "debug": parser.debug, "up": _handle, "start": src.index};
				}
				if (parser.fn){
					ref = parser.fn.call(this, src, params);
				}else {
					this.handle.pattern = parser.pattern;
					ref = this.pattern(parser.pattern, src, params);
				}
				if (this.handle.error){
					return errorResponse(this.handle.error, src, this);
				}
				if (ref){
					ref = packResponse(ref, parser.name, parser.mode, this.handle);
					if (_handle != this.handle){
						!_handle.subs && (_handle.subs = []);
						_handle.subs.push(this.handle);
					}
				}
				this.handle.end = src.index;
				this.handle = _handle;
				return ref;
			};
			Grammar.prototype.pattern = function (patt, src, params, packname){
				var _handle, ref;
				if (!patt.isPattern){
					patt = Pattern.compile(patt);
					if (!src){
						return patt;
					}
				}
				if (packname){
					_handle = this.handle;
					this.handle = {"name": packname, "pattern": patt, "up": _handle};
				}
				if (ref = patt.parse(this, src, params)){
					if (ref.error){
						return errorResponse(ref.error, src, this);
					}
					if (packname){
						ref = packResponse(ref, packname, 'ret node', this.handle);
					}
				}
				if (packname){
					if (_handle != this.handle){
						!_handle.subs && (_handle.subs = []);
						_handle.subs.push(this.handle);
					}
					this.handle = _handle;
				}
				return ref;
			};
			Grammar.prototype.stack = function (check){
				var ref, text, list, m;
				if (this.handle.subs){
					ref = getSubsStack(this.handle);
				}else {
					ref = getUpStack(this.handle);
				}
				ref.className = 'GrammarStack';
				if (check == 'loop'){
					text = print.toText(ref);
					list = text.replace(/^\s*\| \*.*$/mg, '').replace(/[\s\-\*\>]+/g, '-').replace(/(\[|\]|\(|\))/g, '\\$1').split('-');
					for (var i = 0; i < list.length; i++){
						if (list[i]){
							if (m = list.slice(i+1).join('-').match(new RegExp(list[i]+'.*?'+list[i], 'g'))){
								if (m.length > 5){
									return list[i]+' ∞ '+m[0];
								}
							}
						}
					}
					return text;
				}
				return ref;
			};
			Grammar.prototype.error = function (msg, target){
				if (this.handle.try){
					return;
				}
				if (msg){
					this.handle.error = {"message": msg, "target": target};
				}
			};
			function packResponse(res, name, mode, handle){
				switch (mode){
					case 'not check':
						return res;
					case 'ret node':
						if (!res.isSyntax || (res.type != name && !handle.packName)){
							return new Syntax(name, res);
						}
						break;
					default:
						if (res.isToken || res.isSyntax){
							return res;
						}
						if (res.length == 1){
							console.log('xxxxxxxxxxxxxxxxx');
							return res[0];
						}
						if (res.length > 1){
							return new Syntax(name, res);
						}
						break;
				}
				return res;
			};
			function errorResponse(err, src, grm){
				if (err.message === '∆'){
					err.message = 1100;
				}
				if (err.message == 1100 || err.message == 1101){
					if (Error.code && Error.code[err.target.types[1]]){
						err.message = Error.code[err.target.types[1]];
					}else {
						print(grm.stack());
					}
				}
				throw Error.create(err.message, err.target, new Error());
			};
			function getSubsStack(handle){
				var stack;
				if (!handle.subs){
					return handle.name;
				}
				stack = {"name": handle.name, "subs": []};
				if (stack.name && !Grammar[stack.name]){
					stack.name = '['+stack.name+']';
				}
				if (handle.error){
					stack.name = '∆'+stack.name;
				}
				if (handle.packName){
					stack.name += '('+handle.packName+')';
				}
				for (var sub, i = 0; i < handle.subs.length; i++){
					sub = handle.subs[i];
					stack.subs.push(getSubsStack(sub));
				}
				return stack;
			};
			function getUpStack(handle, __sub){
				var stack;
				stack = {"name": handle.name, "subs": []};
				if (stack.name && !Grammar[stack.name]){
					stack.name = '['+stack.name+']';
				}
				if (handle.error){
					stack.name = '∆'+stack.name;
				}
				if (__sub){
					stack.subs.push(__sub);
				}
				if (handle.up){
					return getUpStack(handle.up, stack);
				}
				return stack;
			};
			return Grammar;
		})()
		module.exports = Grammar;
	});
	return module.exports;
})('./core/grammar/grammar.js', './core/grammar');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Standard = (function(){
			var base;
			function Standard(version, prepor){
				this.prepor = prepor;
				if (typeof version == 'Object'){
					this.standard = version;
					this.version = '';
				}else {
					this.standard = Standard[version];
					this.version = version;
				}
				this.handle = {};
			};
			var Card = require("../card.js");
			var Pattern = require("./pattern.js");
			var Scope = require("../scope.js");
			base = {};
			Standard.prototype.read = function (node, loop, __read){
				var ref, _handle;
				if (!node || (!node.isSyntax && !node.isToken)){
					return node;
				}
				// cache block
				if (!loop && !__read && node.type == 'BlockNode'){
					if (ref = cacheBlockNode(this, node)){
						return ref;
					}
				}
				_handle = this.handle;
				if (_handle.target != node){
					this.handle = {"target": node, "up": _handle, "variables": {}};
				}
				if (!loop){
					if (Scope.test(node)){
						node.scope.check(node);
					}
					if (ref = checkStandard(this, node.type, node)){
						if (ref.isSyntax){
							ref = this.read(ref, ref == node);
						}
					}
				}
				if (ref == null && node.isSyntax){
					ref = new Card(node.type);
					for (var item, i = 0; i < node.length; i++){
						item = node[i];
						if (item){
							ref.add(this.read(item));
						}
					}
				}
				checkBlockNode(this, node, ref, loop);
				this.handle = _handle;
				return ref != null ? ref : node;
			};
			Standard.prototype.parser = function (name, node, params, __try){
				if (this.standard[name] || base[name]){
					return checkStandard(this, name, node, params);
				}else if (!__try){
					throw Error.create(5003, name, node, new Error());
				}
			};
			Standard.prototype.pattern = function (patt, node, type){
				var card;
				if (/#|@/.test(patt)){
					card = Pattern.parse(this, patt, node);
					if (type){
						card.type = type;
					}
					return card;
				}
				if (type){
					return new Card(type, patt);
				}
				return patt;
			};
			Standard.es5 = base;
			function cacheBlockNode(std, node){
				var scope, parent, card;
				scope = node.scope;
				if (scope.type == 'Function' || scope.type == 'Class'){
					parent = scope.parent;
					card = new Card('Cache');
					parent.cachePush('blocks', [card, node, std.handle]);
					return card;
				}
			};
			function checkBlockNode(std, node){
				var scope, blocks, card;
				scope = node.scope;
				if (scope.target != node){
					return;
				}
				if (blocks = scope.cache.blocks){
					if (blocks.length){
						for (var data, i = 0; i < blocks.length; i++){
							data = blocks[i];
							card = data[0];
							node = data[1];
							std.handle = data[2];
							card.add(std.read(node, false, true));
							checkBlockNode(std, node.scope.target);
						}
						blocks.length = 0;
					}
				}
			};
			function checkStandard(std, name, node, params){
				var ref, sub_std;
				ref = null;
				setHandle(std.handle, 'standard', name);
				if (std.prepor && std.prepor.standards[name]){
					ref = std.prepor.standards[name].parse(std, node);
				}
				if (!ref){
					if (sub_std = std.standard[name]){
						setHandle(std.handle, 'version', std.version);
						ref = checkCondition(std, sub_std, node, params);
					}
					if (ref === undefined && std.standard != base){
						if (sub_std = base[name]){
							setHandle(std.handle, 'version', 'base');
							ref = checkCondition(std, sub_std, node, params);
						}
					}
				}
				if (ref === undefined){
					if (!sub_std){
						return node;
					}
				}
				return ref;
			};
			function checkCondition(std, sub_std, node, params){
				var list, ref;
				if (sub_std.isStandard === 'list'){
					list = [];
					for (var i = 0; i < sub_std.length; i++){
						if (ref = checkCondition(std, sub_std[i], node, params)){
							list.push(ref);
						}
					}
					return list.length ? list : "";
				}
				for (var cond in sub_std){
					if (!sub_std.hasOwnProperty(cond)) continue;
					if (['isStandard', 'default'].indexOf(cond)>=0){
						continue;
					}
					setHandle(std.handle, 'condition', cond);
					setHandle(std.handle, 'pattern', sub_std[cond]);
					if (parseCondition(std, cond, node)){
						if ((ref = checkPattern(std, sub_std[cond], node, params)) == undefined){
							continue;
						}
						break;
					}
				}
				if (ref == undefined){
					if (sub_std['default']){
						ref = checkPattern(std, sub_std['default'], node, params);
					}
				}
				return ref;
			};
			function checkPattern(std, patt, node, params){
				if (patt && patt.error){
					throw Error.create(patt.error, node, new Error());
				}
				if (patt && patt.isStandard){
					return checkCondition(std, patt, node, params);
				}
				if (patt && typeof patt == 'function'){
					patt = patt.call(std, node, params);
				}
				if (patt && typeof patt == 'string'){
					patt = Pattern.parse(std, patt, node);
				}
				return patt;
			};
			function parseCondition(std, text, node){
				return Pattern.parse(std, Pattern.compile(text, 'Logic'), node);
			};
			function setHandle(handle, name, value){
				if (!/standard|version|condition|pattern/.test(name)){
					handle.variables[name] = value;
				}else {
					handle[name] = value;
					switch (name){
						case 'standard':
							handle.version = null;
						case 'version':
							handle.condition = null;
						case 'condition':
							handle.pattern = null;
							break;
					}
				}
				return value;
			};
			return Standard;
		})()
		module.exports = Standard;
	});
	return module.exports;
})('./core/standard/standard.js', './core/standard');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
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
		})()
		module.exports = Prepor;
	});
	return module.exports;
})('./preprocess/prepor/index.js', './preprocess/prepor');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var modules
		modules = [
			require("./const.js"),
			require("./define.js"),
			require("./control.js"),
			require("./include.js")]
		for (var modu, i = 0; i < modules.length; i++){
			modu = modules[i];
			for (var key in modu){
				if (!modu.hasOwnProperty(key)) continue;
				exports[key] = modu[key];
			}
		};
	});
	return module.exports;
})('./preprocess/gatherer/index.js', './preprocess/gatherer');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card, Syntax, Token, Grammar, Standard, readFile, writeFile
		Card = require("../core/card.js")
		Syntax = require("../core/syntax.js")
		Token = require("../core/token.js")
		Grammar = require("../core/grammar")
		Standard = require("../core/standard")
		readFile = SText.readFile
		writeFile = SText.writeFile
		function create(text, args){
			var temps, a, ab, b, script;
			temps = [];
			if (text.indexOf('#script') != -1){
				while ((a = text.indexOf('#script')) != -1){
					if (ab = SText.indexPair(text, '#script', '#end', a)){
						b = ab[1];
					}else {
						b = text.length;
					}
					if (a){
						temps.push(text.substr(0, a));
					}
					if (script = createScript(text.slice(a+7, b), args)){
						temps.push(script);
					}
					text = text.substr(b+4);
				}
				if (text){
					temps.push(text);
				}
			}else {
				temps = [text];
			}
			return temps;
		}
		module.exports.create = create
		function createScript(script, args, prepor){
			var temp;
			if (args == null) args = [];
			script = Tea.compile(script, prepor);
			temp = "(function("+(args.join(','))+"){var __output__  = '', echo = write;function write(){for(var i=0; i<arguments.length; i++)__output__ += arguments[i];}"+script+";return __output__;})";
			return eval(temp);
		}
		module.exports.createScript = createScript
		function runScript(script, scope, prepor){
			var args, params, fn;
			args = [];
			params = [];
			if (scope){
				for (var key in scope){
					if (!scope.hasOwnProperty(key)) continue;
					var value = scope[key];
					args.push(key);
					params.push(value);
				}
			}
			fn = createScript(script, args, prepor);
			return fn.apply(null, params);
		}
		module.exports.runScript = runScript
		function concatModule(main, list){
			var dir, root;
			dir = Fp.dirName(main.fileName);
			root = new Card('Root');
			if (main.CAST[0].type == 'COMMENT' && /\#\!/.test(main.CAST[0].text)){
				root.add(main.CAST[0]);
			}
			root.add(createModuleTmp());
			for (var ctx, i = 0; i < list.length; i++){
				ctx = list[i];
				root.add(createModuleCard(Fp.relative(dir, ctx.fileName), ctx.CAST, false));
			}
			root.add(createModuleCard(Fp.relative(dir, main.fileName), main.CAST, true));
			return root;
		}
		module.exports.concatModule = concatModule
		function createModuleTmp(){
			var tmp;
			tmp = "var Module = (function(){_cache = {};_main  = new Module();function Module(filename, dirname){this.id = filename;this.filename = filename;this.dirname = dirname;this.exports = {};this.loaded = false;this.children = [];this.parent = null;};Module.prototype.require = function(file){var id = resolve(this.dirname, file);var mod = _cache[id];if (!mod && !/\.js/.test(id)){if(mod = _cache[id+'.js'])id = id+'.js';}if (!mod){if(mod = _cache[id+'/index.js'])id = id+'/index.js';}if (mod){this.children.push(id);return mod.loaded ? mod.exports : mod.load(this);}if(typeof module != 'undefined'){this.children.push(file);return module.require(file);}};Module.prototype.load = function(parent){this.loaded = true;if(parent) this.parent = parent;this.creater();if(typeof module != 'undefined'){module.constructor._cache[this.id] = this;}return this.exports;};Module.prototype.register = function(creater){var id = this.id;if (!_cache[id]){_cache[id] = this;this.creater = creater;}};Module.makeRequire = function(_module){function require(path){return _module.require(path);};require.main = _main;require.resolve = function(path){return resolve(_module.dirname, path)};require.extensions = null;require.cache = null;return require;};Module.main = function(filename, dirname){_main.id = '.';_main.filename = filename;_main.dirname = dirname;if(typeof module != 'undefined'){_main.parent  = module.parent;_main.__defineGetter__('exports', function(){ return module.exports;});_main.__defineSetter__('exports', function(value){ return module.exports = value;});}return _main;};function resolve(from, to){if(/^(\\~|\\/)/.test(to)) return to;if (from && from != '.') to = from + '/' + to;var m = null;while( m = to.match(/\\/[^\\/]+?\\/\\.\\.\\/|\\/\\.\\//) ){to = to.substr(0, m.index) + to.substr(m.index+m[0].length-1);}return to;};return Module;})()";
			return new Card('Module', tmp);
		}
		function createModuleCard(file, block, main){
			var mod;
			file = file.replace(/\.tea$/, '.js');
			if (block[0].type == 'COMMENT' && /\#\!/.test(block[0].text)){
				block.delete(0);
			}
			if (block.type == 'Root'){
				block.type = 'Block';
			}else {
				block = new Card('Block', block);
			}
			block = new Card('Block', block);
			mod = new Card('Module');
			mod.add("(function(__filename, __dirname){var module  = "+(main ? 'Module.main(__filename, __dirname)' : 'new Module(__filename, __dirname)')+";var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){", block, "	});", main ? "\n	return module.load();" : "\n	return module.exports;", "\n})", "('"+file+"', '"+(Fp.dirName(file))+"')");
			return mod;
		};
	});
	return module.exports;
})('./preprocess/template.js', './preprocess');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = {
			"EOT": "\4",
			"LF": "\n",
			"BLANK": "\r  \t  \f  \ ",
			"CONST": "true  false  null  undefined  Infinity  NaN",
			"KEYWORD": "this  instanceof  in  extends  null  undefined  Infinity  true  false  if  while  with  catch  for  switch  case  default  else  try  do  finally  new  typeof  delete  void  return  break  continue  throw  var  function  let  enum  const  import  export  debugger  super  yield  class",
			"IDENTIFIER": "$  prototype  property  extends  import  export  get  set  static  require  class  this  as  of  and  or  not  is",
			"SYMBOL": ",  ;  .  :  ?  \\  \\\\  [  ]  {  }  (  )  //  /*  */  #!  #  =  +=  -=  *=  /=  %=  &=  >>=  <<=  >>>=  >  <  >=  <=  !=  !==  ==  ===  ++  --  !  ~  +  -  *  /  %  &  |  ^  >>  <<  >>>  &&  ||  **  ::  |=  ?=  =?  =|  @  ->  <-  >>  <<  >>>  <<<  =>  <=  ..  ...  `  '  \"  \"\"\"  '''  \"\"\"\"  ''''",
			"QUOTE": "`  '  \"  \"\"\"  '''  \"\"\"\"  ''''",
			"COMM": "//  /*  */  #!",
			"BLOCKBREAK": ";  \n",
			"PREFIX POSTFIX": "++  --",
			"UNARY": "new  typeof  yield  void  not  delete  !  ~  -  +  ++  --",
			"SPREAD": "...",
			"PREC0": "*  /  %  **  \\\\",
			"PREC1": "+  -",
			"PREC2": ">>  <<  >>>",
			"PREC3": ">  <  >=  <=  instanceof  in  of  as  @",
			"PREC4": "!=  !==  ==  ===  is  not is",
			"PREC5": "^  ~  &  |",
			"PREC6": "and  or  &&  ||",
			"ASSIGN": "=  +=  -=  *=  /=  %=  &=  |=  >>=  <<=  >>>=  ?=  =?  |=  =|",
			"TERNARY": "?",
			"LINK": ".  ::  ..",
			"OPEN": "{  (  [",
			"CLOSE": "}  ]  )",
			"BLOCK": ":  {",
			"BITWISE": "PREC2  PREC5",
			"COMPUTE": "PREC0  PREC1  BITWISE",
			"COMPARE": "PREC3  PREC4",
			"LOGIC": "PREC6",
			"BINARY": "COMPUTE  COMPARE  LOGIC  ASSIGN",
			"JOINT": "UNARY  TERNARY  ASSIGN  BINARY  LINK  [  (  ,  ->  <-  =>  <=",
			"END": "LF  EOT  BLOCKBREAK"};
	});
	return module.exports;
})('./settings/token.js', './settings');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = {
			"COMMENT": require("./comment.js"),
			"Root": require("./root.js"),
			"Block": require("./block.js"),
			"StamBlock": "Block | Statement@:BlockStam",
			"Statement": "LabelStam | (\t\\{ → [JsonAssignExpr JsonExpr Block] | \\[ → ArrayAssignExpr | #SUGAR(stam) | [Declaration Keyword MethodDecl LinkStam Comma] )\\n (CLOSE → | #CHECK(last, ==, Expression) [SeleteLeft SeleteRight]@@SeleteStam | SeleteLeft@@SeleteStam | END∅∆1101)",
			"Expression": "[class → Class, Ternary] (#CHECK(last, ==, Access) (Params@@CallExpr | (=@@AssignExpr | ASSIGN@@AssignPatt) Expression∆1107))?",
			"Object": "CONST | ArrowExpr | [\\@ → AtExpr, \\[ → ArrayExpr,\\( → CompelExpr,\\{ → JsonExpr, super → SuperExpr, require → RequireExpr, function → FunctionExpr, VariableExpr, #SUGAR(expr)]",
			"Access": "Object (MemberExpr@~AccessExpr)*",
			"Value": "[@ this]?@@ThisExpr → Object (MemberExpr@~AccessExpr | ParamsExpr@~CallExpr)* SlicePatt?@~SliceExpr",
			"CONST": "REGEXP | STRING | TAG",
			"REGEXP": "[\\/ \\/=] → #CONCAT( \\/=\\\\|\\/...*\\/\\\\|\\/ [g i m y]*, , REGEXP CONST)",
			"STRING": "QUOTE → #CONCAT( , , STRING CONST)",
			"TAG": "# → #CONCAT(#+ [IDENTIFIER KEYWORD], , TAG CONST)",
			"MemberExpr": "[ . → . [IDENTIFIER KEYWORD]∆1108, \\[ → \\\\[ CommaExpr \\\\], :: → :: [IDENTIFIER KEYWORD]?]",
			"AtExpr": "@ [IDENTIFIER KEYWORD]?",
			"SuperExpr": "super (MemberExpr*)@:SuperMember Params?",
			"SlicePatt": "\\[∅ \\]∅ | \\[∅ (Compute? : Compute?) \\]∆1109∅",
			"JsonExpr": "\\{∅ ( \\}∅ | JsonItem (,?∅ JsonItem)* ,*∅ \\}∆1123∅)",
			"JsonItem": "set→ SetterDecl | get→ GetterDecl | IDENTIFIER→ #IS(+1, \\() → MethodDecl | ([NameExpr NUMBER STRING] : Expression)@:AssignExpr",
			"ArrayExpr": "\\[∅ \\]∅ | \\[∅ Expression (,?∅ Expression)* ,*∅ \\]∆1124∅",
			"VariableExpr": "IDENTIFIER",
			"NameExpr": "IDENTIFIER | KEYWORD #ARGU(id)!∆1006",
			"Declaration": "[ var → VarStam, let → LetStam, const → ConstStam, function → FunctionDecl, class → Class, import → ImportStam, export → ExportDecl, static → StaticDecl, get → GetterDecl, set → SetterDecl, prototype → ProtoDecl, property → PropertyDecl, constructor → ConstructorDecl]",
			"Keyword": "[ return → ReturnStam, break → BreakStam, continue → ContinueStam, throw → ThrowStam, debugger → DebuggerStam, if → IfStam, while → WhileStam, do → DoWhileStam, with → WithStam, try → TryStam, switch → SwitchStam, for → ForStam, yield → YieldStam]",
			"YieldStam": "yield Expression",
			"ImportStam": "import!∆1",
			"ExportDecl": "export∅ (default [MethodDecl Declaration Expression] | [MethodDecl Declaration ArgusStam])∆1011",
			"Unary": "not Expression@@NotExpr | PREFIX Value@@PrefixExpr | new Value@@NewExpr | UNARY #Unary@@UnaryExpr | Value POSTFIX?@@PostfixExpr",
			"ComputeLv0": "Unary (PREC0 Unary@~ComputeExpr)*",
			"ComputeLv1": "ComputeLv0 (PREC1 ComputeLv0@~ComputeExpr)*",
			"ComputeLv2": "ComputeLv1 (PREC2 ComputeLv1@~ComputeExpr)*",
			"CompareLv3": "ComputeLv2 (PREC3 ComputeLv2@~CompareExpr)*",
			"Compare": "CompareLv3 (PREC4 CompareLv3@~CompareExpr)*",
			"Compute": "Compare (PREC5 Compare@~ComputeExpr)*",
			"Operate": "Compute (PREC6 [return → ReturnStam, break → BreakStam, continue → ContinueStam, throw → ThrowStam, debugger → DebuggerStam, Assign, Compute]@~LogicExpr)*",
			"Binary": "Assign | Operate",
			"Ternary": "Operate (\\?@@TernaryExpr [Declaration Keyword Expression] (: [Declaration Keyword Expression])?)?",
			"Rest": "...?∅@@RestExpr IDENTIFIER",
			"ArrayAssignExpr": "[∅ (Rest (,∅ Rest)*)@:ArrayPatt ]∅ = Expression",
			"JsonAssignExpr": "{∅ ((IDENTIFIER (\\: IDENTIFIER)?)@?AssignExpr (,∅ (IDENTIFIER (\\: IDENTIFIER)?)@?AssignExpr)*)@:JsonPatt }∅ = Expression",
			"Assign": "[\\[ → ArrayAssignExpr, \\{ → JsonAssignExpr, Access (=@@AssignExpr | ASSIGN@@AssignPatt) Expression∆1107 ]",
			"ArgusItem": "[ ... → Rest, \\[ → ArrayAssignExpr, \\{ → JsonAssignExpr, VariableExpr (= Expression)?@@AssignExpr ]",
			"Argus": "ArgusItem (,∅ ArgusItem)*",
			"ArgusStam": "ArgusItem (,∅ ArgusItem)*",
			"ArgusExpr": "\\(∅ (\\)∅ | ArgusItem (,∅ ArgusItem)* \\)∅)",
			"ParamsGroup": "(Expression (, [\\, \\)]→)*) (,∅ Expression (, [\\, \\)]→)*)*",
			"ParamsExpr": "\\(∅ ( \\)∅ | ,* ParamsGroup \\)∆1104∅)",
			"Params": "ParamsExpr | #IS(--1, BLANK) → #NOT(--2, END) → ParamsGroup@:ParamsExpr",
			"CommaExpr": "Expression (,∅ Expression∆1125)*",
			"Comma": "Expression (,∅ Expression∆1125)*@@CommaExpr",
			"CompelExpr": "(∅ CommaExpr∆1126 )∅",
			"LabelStam": "IDENTIFIER : Statement",
			"SeleteLeft": "(<- | if\\n) Comma∆1127",
			"SeleteRight": "[&& || and or ->] Statement∆1127",
			"LinkStam": "Access (..∅ (Access Params?)@:LinkPatt)+",
			"VarStam": "var∅ ArgusStam∆1007",
			"LetStam": "let∅ ArgusStam∆1009",
			"ConstStam": "const∅ ArgusStam∆1010",
			"ReturnStam": "return\\n CommaExpr?",
			"BreakStam": "break\\n IDENTIFIER?",
			"ContinueStam": "continue\\n IDENTIFIER?",
			"ThrowStam": "throw\\n CommaExpr?",
			"RequireExpr": "require Params",
			"DebuggerStam": "debugger",
			"FunctionExpr": "function \\*?@@GeneratorExpr #NameExpr(id)?@@FunctionDecl ArgusExpr Block",
			"FunctionDecl": "function \\*?@@GeneratorDecl #NameExpr(id)∆1024 ArgusExpr Block",
			"MethodDecl": "NameExpr ArgusExpr [\\{ :] → Block∆1106",
			"ArrowExpr": "(ArgusExpr | IDENTIFIER@:ArgusExpr) =>∅ (\\{→ [JsonExpr Block] | ReturnStam | ThrowStam | Expression)",
			"Class": "class@@ClassExpr (extends! → #NameExpr(id)?@@ClassDecl) (extends Params∆1021)?@:ExtendsExpr Block",
			"GetterDecl": "get∅ NameExpr ArgusExpr?@!ArgusExpr Block",
			"SetterDecl": "set∅ NameExpr ArgusExpr Block",
			"StaticDecl": "static∅ [MethodDecl ArgusStam]",
			"ProtoDecl": "prototype∅ [MethodDecl ArgusStam]",
			"PropertyDecl": "property∅ [MethodDecl ArgusStam]",
			"ConstructorDecl": "constructor@:NameExpr ArgusExpr [\\{ :] → Block∆1106",
			"If": "if ConditionExpr StamBlock∆1012@@IfPatt",
			"Else": "else@@ElsePatt (if∅ ConditionExpr@@ElseIfPatt | ConditionExpr [\\{ :]→@@ElseIfPatt)? StamBlock∆1019",
			"Try": "try StamBlock∆1016@@TryPatt",
			"Catch": "catch ConditionExpr StamBlock@@CatchPatt",
			"Finally": "finally StamBlock@@FinallyPatt",
			"WhileStam": "while ConditionExpr StamBlock∆1013",
			"WithStam": "with ConditionExpr StamBlock∆1014",
			"SwitchStam": "switch ConditionExpr (\\:∅ #Case(indent)* | \\{∅ #Case* \\}∆1110∅)@:BlockNode∆1017",
			"Case": "(case@@CaseStam CommaExpr | default@@DefaultStam) \\:∆1020∅ (#ARGU(indent) #Block(indent, case, default) | #ARGU(indent)! #Block(brace, case, default))?",
			"ConditionExpr": "Comma #CHECK(last, ==, CompelExpr)?@@=ConditionExpr",
			"ForStam": "for ForCondition∆1022 StamBlock∆1106",
			"ForCondition": require("./for.js"),
			"IfStam": "If (#INDENT Else)*",
			"TryStam": "Try (#INDENT Catch)? (#INDENT Finally)?",
			"DoWhileStam": "do StamBlock∆1015 (#INDENT while ConditionExpr)?"};
	});
	return module.exports;
})('./settings/syntax/index.js', './settings/syntax');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = {
			"Object": 'CONST  IDENTIFIER  NUMBER  STRING  REGEXP  COMMENT  JsonExpr  ArrayExpr  ArrowExpr  FunctionExpr',
			"Variable": 'VariableExpr',
			"Access": 'Variable  AccessExpr  SuperExpr  ThisExpr  SliceExpr',
			"Unary": 'UnaryExpr  PrefixExpr  PostfixExpr  NotExpr  NewExpr',
			"Value": 'Object  Access  Unary  RequireExpr  CompelExpr  CallExpr',
			"Operate": 'CompareExpr  ComputeExpr  LogicExpr',
			"Assign": "AssignExpr  ArrayAssignExpr  JsonAssignExpr",
			"Binary": 'Value  Operate  Assign',
			"Ternary": 'TernaryExpr',
			"Comma": 'CommaExpr ArgusExpr ArgusStam ParamsExpr JsonExpr ArrayExpr JsonPatt ArrayExpr',
			"Expression": 'Binary  Ternary  ClassExpr  CommaExpr',
			"IfStam": 'IfPatt  ElseIfPatt  ElsePatt',
			"TryStam": 'TryPatt  CatchPatt  FinallyPatt',
			"Control": 'IfStam  WhileStam  DoWhileStam  WithStam  ForStam  SwitchStam  CaseStam  DefaultStam  TryStam',
			"Statement": 'Control  VarStam  LetStam  ConstStam  ClassDecl  ReturnStam  BreakStam  ContinueStam  DebuggerStam  ThrowStam  LabelStam  LinkStam  SeleteStam',
			"Declaration": 'FunctionDecl  MethodDecl  GetterDecl  SetterDecl  StaticDecl  ProtoDecl  PropertyDecl  ConstructorDecl  ExportDecl',
			"Block": 'BlockStam  BlockNode',
			"NodeBlock": 'Block  Root',
			"Function": 'FunctionExpr  FunctionDecl  GetterDecl  SetterDecl  MethodDecl  PackageExpr  ArrowExpr  ConstructorDecl',
			"Let": 'IfPatt  ElseIfPatt  ElsePatt  WhileStam  DoWhileStam  WithStam  ForStam  SwitchStam',
			"Class": 'ClassExpr  ClassDecl',
			"Scope": 'Json  Let  Class  Function  Root'};
	});
	return module.exports;
})('./settings/node.js', './settings');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Variable = 'VariableExpr ArrayPatt JsonPatt RestExpr'
		var Assign = 'AssignExpr[0] AssignPatt[0] ArrayAssignExpr[0] JsonAssignExpr[0]'
		module.exports = [
			"ClassDecl                                      -> NameExpr -> class",
			"FunctionDecl ConstructorDecl                   -> NameExpr -> function",
			"Class      <- GetterDecl SetterDecl MethodDecl -> NameExpr -> proto",
			"Root                             -> MethodDecl -> NameExpr -> function",
			"ExportDecl -> GetterDecl SetterDecl MethodDecl -> NameExpr -> function",
			"!JsonExpr StaticDecl              -> MethodDecl -> NameExpr -> static",
			"ProtoDecl PropertyDecl           -> MethodDecl -> NameExpr -> proto",
			"                            MethodDecl -> NameExpr -> function",
			"ProtoDecl PropertyDecl ->< "+Assign+" -> "+Variable+" -> proto",
			"!JsonExpr StaticDecl    ->< "+Assign+" -> "+Variable+" -> static",
			"VarStam ConstStam VarPatt    ->< "+Assign+" -> "+Variable+" -> defined",
			"LetStam LetPatt               ->< "+Assign+" -> "+Variable+" -> let",
			"ExportDecl             ->< "+Assign+" -> "+Variable+" -> undefined",
			"                           "+Assign+" -> "+Variable+" -> undefined",
			"                           BlockNode -> VariableExpr -> unknow",
			"                                        VariableExpr -> unknow",
			"ArgusExpr ->< "+Assign+" -> "+Variable+" -> argument"];
	});
	return module.exports;
})('./settings/scope.js', './settings');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		/*
		#内部变量
		    @ref @i                          生成一个随机的标识符名称
		    @name @[name]					 等于 node.scope.valid.name
		    @super @[super]                  等于 node.scope.query( 'Class' ).super
		    @[Clase] @[Function] @[Root]     等于 node.scope.query( ... )
		
		#存取表达式
		    @                                带表传入的对象
		    @[@]                             带表传入的对象的父节点
		    @[0.1]
		 */
		module.exports = {
			"Root Block BlockStam": require("./block.js"),
			"BlockNode": "{#Block}",
			"RequireExpr": require("./require.js"),
			"TestPatt": {"--test": "@"},
			"REGEXP": require("./regexp.js"),
			"STRING": require("./string.js"),
			"ArrayExpr": "[#COMMA]",
			"JsonExpr": "{#COMMA}",
			"CommaExpr": "#COMMA",
			"CompelExpr": "(#COMMA)",
			"VarStam ConstStam LetStam": "var #COMMA(@0)",
			"DebuggerStam": "@0",
			"LabelStam": "@0 @1 @2",
			"ArgusExpr": require("./argus.js"),
			"PrefixExpr PostfixExpr": '@0@1',
			"FunctionDecl": "@0 @1@2@3",
			"FunctionExpr": "@0@1@2",
			"GeneratorDecl": {"default": {"error": 1121}},
			"GeneratorExpr": {"default": {"error": 1121}},
			"ParamsExpr": "(#COMMA( `, --> null` ))",
			"VariableExpr": "#ALIAS",
			"NewExpr": "@0 @1",
			"NotExpr": {"@1 == [Object Access]": '!@1', "default": '!(@1)'},
			"UnaryExpr": {"@0 === [+]": "Math.abs(@1)", "@0 == SYMBOL": "@0@1", "default": "@0 @1"},
			"ArrayAssignExpr": {"#CHECK(@0)": require("./arrayassign.js")},
			"JsonAssignExpr": {"#CHECK(@0)": require("./jsonassign.js")},
			"AssignPatt": {
				"@1 === [?=]": "@[0] == null && (@[0] = @[2])",
				"@1 === [=?]": "#VALUE(@[2], ref) != null && (@[0] = @ref)",
				"@1 === [|=]": "!@[0] && (@[0] = @[2])",
				"@1 === [=|]": "#VALUE(@[2], ref) && (@[0] = @ref)",
				"default": "@0 @1 @2"},
			"AssignExpr": {
				"@0 == SliceExpr": {
					"@[0.1.2]": "[].splice.apply(@[0.0], [@[0.1.0], @[0.1.2]].concat(@2))",
					"@[0.1.1]": {
						"@[0.1.1] === :": "[].splice.apply(@[0.0], [@[0.1.0], 0].concat(@2))",
						"default": "[].splice.apply(@[0.0], [0, @[0.1.1]].concat(@2))"},
					"default": "@[0.0][@[0.0].length + 1] = @2"},
				"@[@] == JsonExpr": "#STR(@0): @2",
				"default": "@0 @1 @2"},
			"SliceExpr": {
				"@[1.2]": "@0.slice(@[1.0], @[1.2])",
				"@[1.1]": {"@[1.1] === :": "@0.slice(@[1.0])", "default": "@0.slice(0, @[1.1])"},
				"default": "@0.slice()"},
			"ComputeExpr": {
				"@1 === **": "Math.pow(@0, @2)",
				"@1 === \\\\\\\\": "Math.floor(@0, @2)",
				"default": "@0@1@2"},
			"CompareExpr": {
				"@0 == CompareExpr": "@0 && @[0.2] @1 @2",
				"@1 === [as @]": {"@2 == STRING": "typeof @0 == @2", "default": "@0 instanceof @2"},
				"@1 === in": {"@2 == ArrayExpr": "@2.indexOf(@0)>=0", "default": "@2.hasOwnProperty(@0)"},
				"@1 === of": {"@2 == ArrayExpr": "@2.indexOf(@0)>=0", "default": "[].indexOf.call(@0, @2)>=0"},
				"@1 === is": "@0 === @2",
				"@1 === not\\ is": "@0 !== @2",
				"default": "@0 @1 @2"},
			"LogicExpr": {
				"@m = @1": {"@1 == or && @m = \\|\\|": undefined, "@1 == and && @m = \\&\\&": undefined},
				"@2 == Expression": "@0 @m #VALUE(@2)",
				"@m == \\|\\|": "if (!#VALUE(@0)) @2",
				"default": 'if (@0) @2'},
			"TernaryExpr": {
				"@3": {
					"@2 == Expression && @4 == Expression": "#VALUE(@0) @1 #VALUE(@2) @3 #VALUE(@4)",
					"default": "if (@0) @2; else @4"},
				"@2 == Expression": "#VALUE(@0, ref) != null ? @ref : @2",
				"default": "if (@0) @2"},
			"SeleteStam": {
				"@1 === [if <-]": "if (@2) @0",
				"@1 === [or \\|\\|]": "if (!#VALUE(@0)) @2",
				"default": "if (@0) @2"},
			"ExportDecl": {
				"@0 === default": {
					"@1 == [FunctionDecl MethodDecl] && #HEAD(module.exports = @[1.name])": '@1',
					"@1 == [ClassDecl]": '#LIST(`@[1]`, `module.exports = @[1.name]`)',
					"@1 == [Value Binary Ternary]": 'module.exports = #VALUE(@1)',
					"@[1.0] == ArgusStam": "#LIST(`@[1]`, `module.exports = @[1.0.-1.0]`)",
					"default": "#LIST(`@[1]`, `module.exports = @[1.-1.0]`)"},
				"@0 == [GetterDecl SetterDecl]": '@0',
				"@0 == [FunctionDecl MethodDecl ClassDecl]": '#LIST(`@[0]`, `module.exports.@[0.name] = @[0.name]`)',
				"@0 == VarStam": "#LIST(`@[0]`, #EACH( @[0.0], `module.exports.@[0] = #VALUE(@[0])` ))",
				"@0 == ArgusStam": "#EACH(@0, `module.exports.@[0] = #VALUE(@)` )",
				"default": {"error": 1103}},
			"MemberExpr": {
				"@0 === [": {"@[1.-1] === UnaryExpr &&  @[1.-1.0] === [-]": "@0@[@.0].length@1@2"},
				"@0 === ::": {"@1": ".prototype.@1", "default": ".prototype"},
				"default": "@"},
			"LinkStam": {"@[@] === AssignExpr": "(#COMMA( 1 ))", "default": "#COMMA( 1 )"},
			"LinkPatt": {"@0 == CompelExpr": "(@[@.0].#COMMA(@0))", "default": "@[@.0].@"},
			"ArrowExpr": {
				"@1 == Expression": "function@0{return @1}",
				"@1 == BlockNode": "function@0@1",
				"default": "function@0{@1}"},
			"ReturnStam BreakStam ContinueStam ThrowStam": '@0 @1',
			"ConditionExpr": "(@0)",
			"IfPatt WhileStam WithStam": "@0 @1@2",
			"ElseIfPatt": "@0 if @1@2",
			"ElsePatt": "@0 @1",
			"DoWhileStam": {"@2": "@0 @1 @2 @3", "default": "@0 {#Block(@1, break)} while(true)"},
			"TryStam": {"@1": "@", "default": "@ catch (_e){}"},
			'CatchPatt': "@0 @1 @2",
			"TryPatt FinallyPatt": "@0 @1",
			"SwitchStam": "@0 @1@2",
			"CaseStam": {
				"@[2.-1] == [ReturnStam BreakStam] ||\n         @[2.-1] == ContinueStam && #DEL(@[2.-1])": '#EACH(@1, `case @:`)#Block(@2)',
				"default": "#EACH(@1, `case @:`)#Block(@2, break)"},
			"DefaultStam": {
				"@[1.-1] == [ReturnStam BreakStam] ||\n         @[1.-1] == ContinueStam && #DEL(@[1.-1])": '@0:#Block(@1)',
				"default": "@0:#Block(@1, break)"},
			"ForStam": "@0 (@1)@2",
			"ForCondition": require("./for.js"),
			"ClassExpr ClassDecl": require("./class.js"),
			"AtExpr": require("./at.js"),
			"SuperExpr": {
				"!@super": {"error": 1115},
				"@1 == SuperMember": {"@2 == ParamsExpr": "@super@1.call(this, #COMMA(@2))", "default": "@super@1"},
				"@1 == ParamsExpr": "@super.@[name].call(this, #COMMA(@1))",
				"default": "@super.@[name]"},
			"MethodDecl": {
				"@[@] == JsonExpr": "\"@0\": function@1@2",
				"@[scope.parent.type] === Class": "@[scope.parent.name].prototype.@0 = function @1@2",
				"default": "function @0@1@2"},
			"SetterDecl": {
				"@[@] == JsonExpr": 'set @0@1@2',
				"@[@] == ExportDecl": "module.exports.__defineSetter__(\"@0\", function@1@2)",
				"@[scope.parent.type] == Class": "@[Class.name].prototype.__defineSetter__(\"@0\", function@1@2)",
				"default": {"error": 1114}},
			"GetterDecl": {
				"@[@] == JsonExpr": "get @0@1@2",
				"@[@] == ExportDecl": "module.exports.__defineGetter__(\"@0\", function@1@2)",
				"@[scope.parent.type] == Class": "@[Class.name].prototype.__defineGetter__(\"@0\", function@1@2)",
				"default": {"error": 1113}},
			"StaticDecl": {
				"@[scope.valid.type] == Class": {
					"@0 == MethodDecl": "@[Class.name].@[0.0] = function@[0.1]@[0.2]",
					"@0 == ArgusStam": "#COMMA( `@[Class.name].@` )"},
				"default": {"error": 1112}},
			"ProtoDecl": {
				"@[scope.valid.type] == Class": {
					"@0 == MethodDecl": "@[Class.name].prototype.@[0.0] = function@[0.1]@[0.2]",
					"@0 == ArgusStam": "#COMMA( `@[Class.name].prototype.@` )"},
				"default": {"error": 1116}},
			"PropertyDecl": {
				"@[scope.valid.type] == Class": {
					"@0 == MethodDecl": "#INSERT( @0, propertys, `this.@[0] = function@[1]@[2]`, Class )",
					"@0 == ArgusStam": "#INSERT( propertys, `#COMMA( `this.@` )`, Class )"},
				"default": {"error": 1117}},
			"ConstructorDecl": {
				"@[scope.parent.type] === Class": "#INSERT( constructors, @, Class )",
				"default": "function @0@1@2"}};
	});
	return module.exports;
})('./settings/standards/es5/index.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = {
			"0": 'Tea core not init',
			"1": 'not supported',
			"2": "max loop",
			"3": "Node Object parent is circular",
			"1000": "Syntax Error",
			"1001": 'nonsupport, so sorry',
			"1002": 'The %s declaration statement need at class inward',
			"1003": 'Identifier "%s" is an const declaration, cant modify',
			"1004": 'Source index pair cant file "%s" token',
			"1005": 'class expression need a name',
			"1006": 'keyword cant do name',
			"1007": 'Var declaration syntax error',
			"1009": 'Let declaration syntax error',
			"1010": 'Const declaration syntax error',
			"1011": 'Export declaration syntax error',
			"1012": 'If statement syntax error',
			"1013": 'While statement syntax error',
			"1014": 'With statement syntax error',
			"1015": 'Do while statement syntax error',
			"1016": 'Try while statement syntax error',
			"1017": 'Switch while statement syntax error',
			"1018": 'For statement syntax error',
			"1019": 'Else statement syntax error',
			"1020": 'Case or default statement syntax error',
			"1021": 'extends statement syntax error',
			"1022": 'Condition expression of for statement syntax error',
			"1023": 'Condition expression miss right ")" token',
			"1024": 'Function declaration need a name',
			"1100": 'Unexpected statement',
			"1101": 'Unexpected statement end',
			"1102": '%s statement syntax error',
			"1103": 'Export statement params type error',
			"1104": 'Params expression miss right ")" token',
			"1105": 'Wrong token "%s" for block statement',
			"1106": 'Invalid block of statement',
			"1107": 'Invalid right-hand side in Assign expression',
			"1108": 'Unexpected Access expression',
			"1109": 'Invalid right token "]" in Access expression',
			"1110": 'Invalid right token "}" in Block statement',
			"1111": 'Unexpected token "%s"',
			"1112": 'Static methods error',
			"1113": 'Getter methods error',
			"1114": 'Setter methods error',
			"1115": 'Super statement error',
			"1116": 'Prototype methods error',
			"1117": 'Property methods error',
			"1118": 'Unexpected token',
			"1119": '"#!" symbole must side in the first line of the source',
			"1120": 'Illegal string template expression',
			"1121": 'ES5 standard dont supported',
			"1122": '',
			"1123": 'Json expression miss right "}" token!',
			"1124": 'Array expression miss right "]" token!',
			"1125": 'Unexpected comma token',
			"1126": 'Unexpected compel expression',
			"1127": 'Invalid right-hand side in selete expression',
			"2000": 'Pre-Process error',
			"2001": 'Include Processor Cannot find file "%s"',
			"2002": 'Unexpected tag of control pre-process',
			"2003": 'Replace loop in macro "%s"',
			"2004": "#script runing error: %s",
			"4000": 'Grammar Module Error',
			"4001": 'Unexpected syntax parser "%s"',
			"4002": 'Unexpected parser "%s" in "%s" syntax pattern object',
			"4003": 'Grammar pattern has nested loop',
			"5000": 'Standard Module Error',
			"5001": 'Substandard parse node name "%s"',
			"5002": 'Standard Module not has "%s" method',
			"5003": 'Undefined Standard parser "%s"',
			"5004": 'Standard Card object cant add a "%s" type object \n\n<stack>',
			"5005": 'Undefined Standard cache name "%s"',
			"5006": 'Invalid standard logic pattern "%s"',
			"5007": 'Undefined standard "%s"',
			"ASSIGN": "Invalid left-hand side in assignment"};
	});
	return module.exports;
})('./helper/code.js', './helper');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Asset = (function(){
			var Method, Token, cache, conf_pack, conf_set, conf_re;
			Method = require("./method.js");
			Token = require("../token.js");
			cache = Jsop.data();
			conf_pack = {
				"@@=": "rename pattern",
				"@@": "pattern name",
				"@=": "rename response",
				"@?": "check response",
				"@~": "packing matched",
				"@:": "response name",
				"@!": "check empty"};
			conf_set = {
				"\\n": "lf",
				"∆": "error",
				"∅": "ig",
				"→": "test",
				"+?": "smallest mode",
				"*?": "smallest mode",
				"+": "mode",
				"*": "mode",
				"?": "mode",
				"!": "mode"};
			conf_re = new RegExp('(?:('+SText.re(Object.keys(conf_set))+'|∆(\\d*))|'+'('+SText.re(Object.keys(conf_pack))+')([A-Za-z]{3,}))$');
			function Asset(str){
				this.config = {"mode": ''};
				this.type = null;
				this.content = null;
				this.param = null;
				this.string = str;
				if (str){
					str = checkConfig(this, str);
					if (str == '*'){
						this.type = '*';
						this.content = str;
					}else {
						checkPairAsset(this, str) || checkSetAsset(this, str) || checkMethodAsset(this, str) || checkSubAsset(this, str) || checkNodeAsset(this, str) || checkCodeAsset(this, str);
					}
				}
			};
			Asset.prototype.parse = function (src, grm){
				switch (this.type){
					case '*':
						return src.current;
					case 'Codes Test':case 'Code Test':
						return parseCodeAsset.call(this, src, grm);
					case 'Pair Test':
						return parsePairAsset.call(this, src, grm);
					case 'Set Test':
						return parseSetAsset.call(this, src, grm);
					case 'Method Test':
						return parseMethodAsset.call(this, src, grm);
					case 'Node Test':
						return parseNodeAsset.call(this, src, grm);
					case 'Sub':
						return;
				}
			};
			Asset.prototype.isAsset = true;
			Asset.compile = function(str){
				if (!cache[str]){
					return cache[str] = new Asset(str);
				}
				return cache[str];
			};
			Asset.parse = function(asset, src, grm){
				if (!asset.isAsset){
					asset = Asset.compile(asset);
				}
				return asset.parse(src, grm);
			};
			// compile asset 
			function checkConfig(self, str){
				var config, m, name;
				config = self.config;
				while (m = str.match(conf_re)){
					if (m.index == 0){
						break;
					}
					if (m.index === 1 && str[0] === '\\'){
						if (m[0].length > 1 && m[1] && !m[2]){
							m.index += 1;
							m[1] = m[1].substr(1);
						}else {
							break;
						}
					}
					if (m[1]){
						if (m[2]){
							config.error = parseInt(m[2]);
						}else {
							name = conf_set[m[1]];
							if (name == 'smallest mode'){
								config.smallest = true;
								config.mode = m[1][0];
							}else {
								config[name] = m[1];
							}
						}
					}else if (m[3]){
						config.pack = conf_pack[m[3]];
						config.name = m[4];
					}
					str = str.substr(0, m.index);
				}
				return str;
			};
			function checkPairAsset(self, str){
				var m;
				if (m = str.match(/^([^\. \(]+?)\.\.\.([^\. ]+)$/)){
					self.type = 'Pair Test';
					self.content = [SText.cleanESC(m[1]), SText.cleanESC(m[2])];
					return true;
				}
			};
			function checkSetAsset(self, str){
				var m, list, key, patt, temp;
				if (m = str.match(/^\[(.*?)\]$/)){
					str = m[1];
					if (/[^\\],/.test(str)){
						list = SText.split(str, ',', 'params', true);
					}else {
						list = SText.split(str, ' ', true, true);
					}
					for (var i = list.length - 1; i >= 0; i--){
						key = i;
						patt = list[i];
						if (patt.indexOf('→') > 0){
							temp = patt.split('→');
							key = temp[0].trim();
							patt = temp[1].trim();
							list.splice(i, 1);
							list.__HasKey__ = true;
						}
						list[key] = {"patt": patt};
						if (/^[A-Z][A-Za-z]+$/.test(patt)){
							list[key].__TestNode__ = true;
						}else if (/[a-z]+/i.test(patt) && /\W+/.test(patt)){
							list[key].__TestPatt__ = true;
						}
					}
					self.type = 'Set Test';
					self.content = list;
					return true;
				}
			};
			function checkMethodAsset(self, str){
				var m;
				if (m = str.match(/^#(\w+)(?:\((.*?)\))?$/)){
					self.type = 'Method Test';
					self.content = m[1];
					self.param = m[2] ? SText.split(m[2], ',', 'params', true) : [];
					return true;
				}
			};
			function checkSubAsset(self, str){
				var m;
				if (str[0] == '(' && str[str.length-1] == ')'){
					str = str.slice(1, -1);
					if (m = str.match(/^(\?\!|\?\=|\?\:)/)){
						switch (m[1]){
							case '?:':
								self.config.ig = true;
								break;
							case '?!':
								self.config.mode = '!';
								break;
							case '?=':
								self.config.test = true;
								break;
						}
						str = str.substr(m[0].length);
					}
					self.type = 'Sub';
					self.content = str;
					return true;
				}
			};
			function checkNodeAsset(self, str){
				if (/^[A-Z]\w+$/.test(str)){
					self.type = 'Node Test';
					self.content = str;
					return true;
				}
			};
			function checkCodeAsset(self, str){
				var token_list;
				str = SText.cleanESC(str);
				if (/^\w+$|\W/.test(str)){
					self.type = 'Code Test';
					self.content = str;
					return true;
				}
				token_list = Token.tokenize(str, 0, 'code list');
				if (token_list.length == 1){
					self.type = 'Code Test';
					self.content = token_listp[0];
				}else {
					self.type = 'Codes Test';
					self.content = token_list;
				}
				return true;
			};
			// parse asset
			function parseSetAsset(src, grm){
				var token, text, types, content, patt, ref;
				token = src.current;
				text = token.text;
				types = token.types;
				content = this.content;
				if (content.__HasKey__){
					if (types[0] != 'NUMBER' && content.hasOwnProperty(text)){
						content = [content[text]];
					}else {
						for (var type, i = 0; i < types.length; i++){
							type = types[i];
							if (content.hasOwnProperty(type)){
								content = [content[type]];
								break;
							}
						}
					}
				}
				for (var item, i = 0; i < content.length; i++){
					item = content[i];
					patt = item.patt;
					if (token.text == patt || types.indexOf(patt) != -1){
						return token;
					}
					if (item.__TestNode__){
						if (ref = grm.parser(patt, src, null, true)){
							return ref;
						}
					}else if (item.__TestPatt__){
						if (ref = grm.pattern(patt, src)){
							return ref;
						}
					}
				}
			};
			function parsePairAsset(src, grm){
				var s1, s2, ref, ab, list;
				ref = this.content, s1 = ref[0], s2 = ref[1];
				if (ab = src.indexPair(s1, s2, src.index, true)){
					if (ab[0] == src.index){
						list = Jsop.toArray(src, ab[0], ab[1]+1);
						src.index = ab[1];
						return list;
					}
				}
				return false;
			};
			function parseCodeAsset(src, grm){
				var code_list, index, list, token;
				if (this.type == 'Code Test'){
					return this.content == src.current.text ? src.current : false;
				}
				code_list = this.content;
				index = src.index-1;
				list = [];
				for (var code, i = 0; i < code_list.length; i++){
					code = code_list[i];
					token = src[++index];
					if (!token || (code != token.text && (!token.is('BLANK') || !/^\s+$/.test(code)))){
						return false;
					}
					list.push(token);
				}
				if (list.length){
					src.index = index;
					return list;
				}
				return false;
			};
			function parseNodeAsset(src, grm){
				var name, token, ref;
				name = this.content;
				token = src.current;
				if (token.types.indexOf(name) != -1){
					return token;
				}
				if (grm.prepor && (ref = grm.prepor.check(name, null, src, grm))){
					return ref;
				}
				if (grm.parser(name)){
					return grm.parser(name, src, this.param);
				}
				if (name == token.text){
					return token;
				}
				return false;
			};
			function parseMethodAsset(src, grm){
				var name;
				name = this.content;
				if (Method.hasOwnProperty(name)){
					return Method[name].call(grm, src, this.param, this.config);
				}
				if (grm.parser(name)){
					return grm.parser(name, src, this.param);
				}
				throw Error.create(4002, name, grm.handle.name, new Error());
			};
			return Asset;
		})()
		module.exports = Asset;
	});
	return module.exports;
})('./core/grammar/asset.js', './core/grammar');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Pattern = (function(){
			var cache, Asset, Card;
			cache = Jsop.data();
			Asset = require("./asset.js");
			Card = require("../card.js");
			function Pattern(text, type){
				var m;
				this.length = 0;
				this.string = text;
				if (type == 'Logic'){
					this.type = type;
					this.add(Asset.compile(text, 'Logic'));
				}else {
					while (m = Asset.test(text)){
						if (m.index){
							this.add(text.slice(0, m.index));
						}
						this.add(Asset.compile(m));
						text = text.substr(m.index+m[0].length);
					}
					if (text){
						this.add(text);
					}
				}
			};
			Pattern.prototype.add = function (){
				for (var asset, i = 0; i < arguments.length; i++){
					asset = arguments[i];
					if (typeof asset == 'string'){
						asset = SText.cleanESC(asset);
					}
					this[this.length++] = asset;
				}
				return this;
			};
			Pattern.prototype.parse = function (std, node){
				if (this.type == 'Logic'){
					return this[0].parse(node, std);
				}else {
					return parsePattern(this, node, std);
				}
			};
			Pattern.prototype.isPattern = true;
			Pattern.compile = function(text, type){
				if (cache[text]){
					return cache[text];
				}
				return cache[text] = new Pattern(text, type);
			};
			Pattern.parse = function(std, patt, node){
				if (typeof patt == 'string'){
					patt = Pattern.compile(patt);
				}
				return patt.parse(std, node);
			};
			function parsePattern(patt, node, std){
				var card;
				card = new Card(node.isNode ? node.type : 'Clip');
				for (var ref, i = 0; i < patt.length; i++){
					ref = patt[i];
					if (ref.isAsset){
						ref = checkAccAsset(ref, node, std);
						if (!ref){
							if (typeof card[card.length-1] == 'string'){
								ref = card[card.length-1].replace(/\s*(\,|\.|\:\:)*\s*$/, '');
								if (!ref){
									Array.prototype.pop.call(card);
								}else {
									card[card.length-1] = ref;
								}
							}
							continue;
						}
					}
					if (ref){
						if (ref === true){
							continue;
						}
						card.add(ref);
					}
				}
				if (!card.length){
					return "";
				}
				if (patt.length == 1 && (patt[0].name == 'LIST' || patt[0].name == 'EACH')){
					return Jsop.toArray(card);
				}
				if (card.length == 1){
					if (card.type == card[0].type){
						card = card[0];
					}else if (patt.length == 1){
						if (patt[0].type == 'Call'){
							card = card[0];
						}
					}
				}
				return card;
			};
			function checkAccAsset(acc, node, std){
				var ref;
				if (ref = acc.parse(node, std)){
					if (ref.isSyntax || ref.isToken){
						if (std.handle.standard == node.type && ref == node){
							ref = std.read(ref, true);
						}else {
							ref = std.read(ref);
						}
					}
				}else if (ref === 0){
					ref = '0';
				}
				return ref;
			};
			return Pattern;
		})()
		module.exports = Pattern;
	});
	return module.exports;
})('./core/standard/pattern.js', './core/standard');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
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
		})()
		module.exports = Macro;
	});
	return module.exports;
})('./preprocess/prepor/macro.js', './preprocess/prepor');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Sugar = (function(){
			var Template, Grammar;
			Template = require("../template.js");
			Grammar = require("../../core/grammar");
			function Sugar(type, name, pattern, body, location){
				this.type = type;
				this.name = name;
				this.pattern = pattern;
				this.bodys = Template.create(body, ['std', 'node', 'scope']);
				this.location = location;
			};
			Sugar.prototype.parse = function (parser, tar, params){
				var index, node, scope, patt;
				if (tar.isSource){
					index = tar.index;
					if (node = parser.pattern(this.pattern, tar, params, this.type == 'expr' || this.type == 'stam' ? this.name : null)){
						return node;
					}
					tar.index = index;
				}else if (tar.isNode){
					scope = tar.scope;
					patt = '';
					for (var item, i = 0; i < this.bodys.length; i++){
						item = this.bodys[i];
						if (typeof item == 'function'){
							item = item.apply(this, [parser, tar, scope]);
						}
						if (typeof item == 'string'){
							patt += item;
						}else if (item){
							return item;
						}
					}
					patt = patt.trim();
					return parser.pattern(patt, tar);
				}
			};
			Sugar.prototype.error = function (){
				throw Error.create(this.location, new Error());
			};
			return Sugar;
		})()
		module.exports = Sugar;
	});
	return module.exports;
})('./preprocess/prepor/sugar.js', './preprocess/prepor');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var SYMBOL
		exports['TAG'] = function(prepor, src, index){
			var token;
			token = src[index];
			src.index = index;
			if (this[token.text]){
				return this[token.text](prepor, src, index);
			}
			prepor.check(token.text, 'macro', src);
		}
		exports['IDENTIFIER'] = function(prepor, src, index){
			var token;
			token = src[index];
			src.index = index;
			prepor.check(token.text, 'macro', src);
		}
		exports['SYMBOL'] = function(prepor, src, index){
			var token, text, type;
			token = src[index];
			text = token.text;
			if (SYMBOL[text]){
				return SYMBOL[text].call(this, prepor, src, index);
			}
			type = token.types[1];
			if (this[type]){
				return this[type](prepor, src, index);
			}
		}
		exports["COMM"] = function(prepor, src, index){
			var token, ab;
			token = src[index];
			switch (token.text){
				case '/*':
					ab = src.indexPair('/*', '*/', index, true);
					break;
				case '#!':
					if (index > 0){
						throw Error.create(1119, src.current, new Error());
					}
				case '//':
					ab = src.indexPair(token.text, '\n', src.index, true) || [index, src.length-1];
					ab[1] = ab[1]-1;
					break;
			}
			if (ab && ab[0] == index){
				token.text = src.join(ab[0], ab[1]);
				token.types = ['COMMENT', 'CONST', 'COMM'];
				token.location.code = token.text;
				token.location.end = src[ab[1]].location.end;
				src.delete(ab[0]+1, ab[1]);
			}
		}
		exports["QUOTE"] = function(prepor, src, index){
			var token, ab;
			token = src[index];
			ab = src.indexPair(token.text, token.text, index);
			if (ab && ab[0] == index){
				token.text = checkMarco(src.clone(ab[0], ab[1]), prepor);
				token.types = ['STRING', 'CONST'];
				token.location.code = token.text;
				token.location.end = src[ab[1]].location.end;
				src.delete(ab[0]+1, ab[1]);
			}
		}
		// else:
		// 	Err 1111, token;
		SYMBOL = {}
		SYMBOL['/'] = function(prepor, src, index){
			var token, ab;
			if (!testValue(src, src.prevIndex(index, true))){
				token = src[index];
				ab = src.indexPair(token.text, /\*\/|\//, index, true);
				if (ab && ab[0] == index){
					if (/^[gimy]+$/.test(src[ab[1]+1].text)){
						ab[1] += 1;
					}
					token.text = checkMarco(src.clone(ab[0], ab[1]), prepor);
					token.types = ['REGEXP', 'CONST'];
					token.location.code = token.text;
					token.location.end = src[ab[1]].location.end;
					src.delete(ab[0]+1, ab[1]);
				}
			}
		}
		// else:
		// 	Err 1111, token;
		SYMBOL['/='] = SYMBOL['/']
		function testValue(src, index){
			var token;
			if (token = src[index]){
				if (token.is('CONST', 'CLOSE', 'POSTFIX')){
					return true;
				}
				if (token.is('IDENTIFIER')){
					if (!token.is('BINARY', 'UNARY')){
						return true;
					}
				}else if (!token.is('KEYWORD')){
					return false;
				}
				token = src[src.prevIndex(index, true)];
				if (token && token.is('LINK')){
					return true;
				}
			}
			return false;
		}
		function checkMarco(src, prepor){
			var text;
			for (var token, i = 0; i < src.length; i++){
				token = src[i];
				if (token && token.type == 'IDENTIFIER'){
					src.index = i;
					prepor.check(token.text, 'macro', src);
				}
			}
			text = src.join();
			return text;
		};
	});
	return module.exports;
})('./preprocess/gatherer/const.js', './preprocess/gatherer');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		exports['#define'] = function(prepor, src, index){
			var token, a, name, args, b, body, ref;
			token = src[index];
			a = src.nextIndex(index);
			if (src[a].is('IDENTIFIER', 'KEYWORD')){
				name = src[a].text;
				if (src[a+1].text == '('){
					args = src.join(a+2, (a = src.indexOf(')', a))-1).split(',');
				}
				ref = checkDefineBody.call(this, src, src.nextIndex(a), prepor), a = ref[0], b = ref[1], body = ref[2];
				prepor.add('macro', name, args, body, token.location);
				src.delete(index, b);
				// debug log
				Tea.log('#define marco: '+name, token.location);
			}
		}
		exports['#undef'] = function(prepor, src, index){
			var token, b, names;
			token = src[index];
			b = src.indexOf('\n', index) || src.length-1;
			names = src.join(index+1, b-1).trim().split(',');
			prepor.undef.apply(prepor, names);
			src.delete(index, b);
			// debug log
			Tea.log('#undef marco : '+names.join(','), token.location);
		}
		exports['#expr'] = exports['#stam'] = exports['#sugar'] = function(prepor, src, index){
			var token, type, a, name, pattern, b, body, ref;
			token = src[index];
			type = token.text.substr(1);
			a = src.nextIndex(index);
			name = src[a].text;
			a = src.nextIndex(a);
			if (src[a].text == '<'){
				pattern = src.join(a+1, (a = src.indexOf('>', a))-1);
			}
			ref = checkDefineBody.call(this, src, src.nextIndex(a), prepor), a = ref[0], b = ref[1], body = ref[2];
			prepor.add(type, name, pattern, body, token.location);
			src.delete(index, b);
			// debug log
			Tea.log('#define '+type+' : '+name, token.location);
		}
		exports['#argv'] = function(prepor, src, index){
			var token, b, argv;
			token = src[index];
			b = src.indexOf('\n', index) || src.length-1;
			argv = src.join(index+1, b).trim();
			Tea.argv.parse(argv.split(' '));
			src.delete(index, b);
			// debug log
			Tea.log('#argv        : '+argv, token.location);
		}
		exports['#line'] = function(prepor, src, index){
			var token;
			token = src[index];
			token.text = token.location.lineNumber+'';
			token.types = ['NUMBER', 'CONST'];
		}
		function checkDefineBody(src, a, prepor){
			var mark, b, body_src, text;
			mark = src[a];
			if (mark.text == '\n' && src[a+1].text == '{'){
				mark = src[++a];
			}
			if (mark.text == '{'){
				b = src.indexPair('{', '}', a, true)[1];
				body_src = src.clone(a+1, b-1);
				b = src.indexOf('\n', b) || src.length-1;
			}else {
				b = src.indexOf('\n', a) || src.length-1;
				body_src = src.clone(a, b-1);
			}
			for (var token, i = 0; i < body_src.length; i++){
				token = body_src[i];
				if (!token || token.text == '#script'){
					continue;
				}
				if (this[token.type]){
					i = this[token.type](prepor, body_src, i) || i;
				}
			}
			text = body_src.join();
			return [a, b, text, body_src];
		};
	});
	return module.exports;
})('./preprocess/gatherer/define.js', './preprocess/gatherer');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Template
		Template = require("../template.js")
		exports['#if'] = exports['#ifdef'] = function(prepor, src, index){
			var blocks, status, pos, tag, token, cond, trimIndent;
			blocks = matchControlBlock(src, index);
			status = false;
			for (var item, i = 0; i < blocks.length; i++){
				item = blocks[i];
				pos = item[1];
				tag = item[0];
				token = src[pos[0]];
				cond = src.join(pos[0]+1, pos[2]).trim();
				status = tag == '#else' || evalCondition(tag, cond, prepor, src, pos[0]);
				if (status){
					if (/:\s*$/.test(cond)){
						trimIndent = src.lineIndent(pos[2]+1)-src.lineIndent(pos[0]);
						if (trimIndent){
							src.trimIndent(pos[2]+1, pos[1]-1, trimIndent);
						}
					}
					src.delete(pos[0], pos[2]);
					src.delete(pos[1], blocks[blocks.length-1][1][3]);
					// debug log
					if (token){
						Tea.log(tag+' '+cond+': true', token.location);
					}
					break;
				}else {
					src.delete(pos[0], pos[1]-1);
					// debug log
					if (token){
						Tea.log(tag+' '+cond+': false', token.location);
					}
				}
			}
		}
		exports['#script'] = function(prepor, src, index){
			var token, a_b, block;
			token = src[index];
			a_b = matchBlock(src, index);
			block = src.clone(a_b[2]+1, a_b[1]-1);
			try {
				var token, a_b, block, output;
				output = Template.runScript(block, {"source": src, "index": index, "prepor": prepor}, prepor);
				src.delete(a_b[0], a_b[3]);
				if (output){
					src.insert(index+1, output);
				}
				// debug log
				Tea.log('#script runed: '+output.substr(0, 20)+'...', token.location);
			}catch (e) {
				var token, a_b, block, output;
				if (e.stacks){
					throw Error.create(e, new Error());
				}
				throw Error.create(2004, e.message, token, new Error());
			};
		}
		exports['#elif'] = exports['#elifdef'] = exports['#else'] = exports['#endif'] = function(prepor, src, index){
			throw Error.create(2002, src[index], new Error());
		}
		function matchControlBlock(src, index, _ret_last){
			var blocks, _index, a_b, next;
			blocks = [];
			_index = index;
			while (true){
				if (a_b = matchBlock(src, _index)){
					blocks.push([src[a_b[0]].text, a_b]);
					next = src[a_b[1]].text;
					if (/#else|#elif|#elifdef/.test(next)){
						_index = a_b[1];
						continue;
					}
					if (next == '#end' || (next = '#endif')){
						blocks.push(['#endif', [a_b[1], a_b[3], a_b[3], a_b[3]]]);
					}
				}
				break;
			}
			if (_ret_last){
				return blocks[blocks.length-1][1][3];
			}
			return blocks;
		}
		function matchBlock(src, index){
			var a, l, _a, b, _b;
			a = src.indexOf(/^(#if|#ifdef|#elif|#elifdef|#else|#script|#test)$/, index);
			l = src.length-1;
			if (a >= 0){
				_a = src.indexOf('\n', a+1);
				if (!_a){
					return [a, l, l, l];
				}
				b = _a;
				while (true){
					b = b < l && src.indexOf(/^#\w+$/, b+1);
					if (!b){
						return [a, l, _a, l];
					}
					switch (src[b].text){
						case '#if':case '#ifdef':
							b = matchControlBlock(src, b, true);
							if (!b){
								return [a, l, _a, l];
							}
							break;
						case '#script':case '#test':
							b = matchBlock(src, b)[1];
							break;
						case '#else':case '#elif':case '#elifdef':case '#endif':
							if (/^(#script|#test)$/.test(src[a].text)){
								return [a, b-1, _a, b-1];
							}
						case '#end':
							_b = src.indexOf('\n', b+1) || l;
							return [a, b, _a, _b];
					}
				}
			}
		}
		function evalCondition(tag, cond, prepor, src, index){
			var is_def, token, the_file, root_file, exp;
			cond = cond.replace(/\:\s*$|\;\s*$/g, '').trim();
			if (!cond){
				return false;
			}
			is_def = tag.indexOf('def') != -1;
			token = src[index];
			the_file = token.fileName;
			root_file = Tea.argv.file;
			exp = cond.replace(/((-{0,2})[\$a-zA-Z_][\w]*)\b/g, function($0, $1, $2){
				var res;
				if ($2){
					res = Tea.argv[$1];
				}else if (is_def){
					return !!prepor.check($1);
				}else {
					switch ($1){
						case '__main':
							return root_file == the_file;
						case '__root':
							return '"'+root_file+'"';
						case '__file':
							return '"'+the_file+'"';
						case '__version':
							return '"'+Tea.version+'"';
						default:
							if (global.hasOwnProperty($1)){
								res = global[$1];
							}else if (Tea.argv.hasOwnProperty($1)){
								res = Tea.argv[$1];
							}else {
								return $1;
							}
							break;
					}
				}
				return typeof res == 'string' ? '"'+res.replace(/\"/g, '\\"')+'"' : res;
			});
			try {
				var is_def, token, the_file, root_file, exp;
				return exp && eval('!!('+exp+')') || tag == '#else';
			}catch (e) {
				var is_def, token, the_file, root_file, exp;
				throw Error.create(e, new Error());
			};
		};
	});
	return module.exports;
})('./preprocess/gatherer/control.js', './preprocess/gatherer');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		exports['#include'] = function(prepor, src, index){
			var token, a, b, dir, files, ab, list;
			token = src[index];
			a = index;
			b = src.nextIndex(a);
			dir = Fp.dirName(src[a].fileName);
			files = [];
			while (src[b].is("QUOTE")){
				ab = src.indexPair(src[b].text, src[b].text, b);
				if (ab[0] = b){
					files.push(src.join(ab[0], ab[1]));
					b = src.nextIndex(ab[1], true);
					if (src[b].text == ','){
						b = src.nextIndex(b, true);
						continue;
					}else {
						b = ab[1];
					}
				}
				break;
			}
			src.delete(a, b);
			for (var path, i = files.length - 1; i >= 0; i--){
				path = files[i];
				list = Fp.checkFiles(path, dir, ['index.tea', 'index.js']);
				if (list.error){
					throw Error.create(2001, list.error.path, src[index], new Error());
				}
				for (var file, j = list.length - 1; j >= 0; j--){
					file = list[j];
					src.insert(a, SText.readFile(file));
					src.insert(a, token.clone('/* Include '+Fp.relative(dir, file)+' */', ['COMMENT']));
					// debug log
					Tea.log('#Include     : '+file, token.location);
				}
			}
		};
	});
	return module.exports;
})('./preprocess/gatherer/include.js', './preprocess/gatherer');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = function(src, params){
			var token, comm_token, ab, handle;
			token = src.current;
			if (token.type == 'COMMENT'){
				comm_token = token;
			}else {
				switch (token.text){
					case '/*':
						ab = src.indexPair('/*', '*/', src.index, true);
						break;
					case '#!':
						throw Error.create(1119, token, new Error());
						break;
					case '//':
						ab = src.indexPair(token.text, '\n', src.index, true) || [src.index, src.length-1];
						ab[1] = ab[1]-1;
						break;
					default:
						return;
				}
				if (ab && ab[0] == src.index){
					src.index = ab[1];
					comm_token = token.clone(src.join(ab[0], ab[1]), ['COMMENT']);
					comm_token.location.code = comm_token.text;
					comm_token.location.end = src[ab[1]].location.end;
				}else {
					throw Error.create(1118, src.current, new Error());
				}
			}
			if (comm_token){
				handle = this.handle;
				if (handle.name == 'Block' || handle.name == 'Root'){
					!handle.comms && (handle.comms = []);
					if (handle.comms.indexOf(comm_token) == -1){
						handle.comms.push(comm_token);
					}
				}
				return comm_token;
			}
		};
	});
	return module.exports;
})('./settings/syntax/comment.js', './settings/syntax');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Syntax
		Syntax = require("../../core/syntax.js")
		module.exports = function(src, params){
			var node;
			this.parser('COMMENT', src, null, false, true);
			if (src.current && src.current.is('BLANK', 'END', 'COMM', 'COMMENT')){
				this.next(src, 1);
			}
			node = this.parser('Block', src, ['brace'], false, true) || new Syntax('Root');
			node.type = 'Root';
			return node;
		};
	});
	return module.exports;
})('./settings/syntax/root.js', './settings/syntax');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Syntax
		Syntax = require("../../core/syntax.js")
		module.exports = function(src, params){
			switch (params && params[0]){
				case 'brace':
					params = params.slice(1);
					params.push('}');
					return checkBraceBlock.call(this, src, params);
				case 'indent':
					return checkIndentBlock.call(this, src, params.slice(1));
				case 'line':
					return checkLineBlock.call(this, src, params.slice(1));
			}
			switch (src.current.text){
				case '{':
					return checkBraceBlock.call(this, src, params);
				case ':':
					return checkIndentBlock.call(this, src, params) || new Syntax('BlockNode');
				case ';':
					throw Error.create(1111, src.current.text, src.current, new Error());
					break;
			}
		}
		function checkLineBlock(src, params){
			var node, ends, back_index, ref;
			node = new Syntax('BlockNode');
			ends = ['\n', ';', '}', ']', ']', 'else', 'while', 'catch', 'finally'];
			if (params && params.length){
				ends.push.apply(ends, params);
			}
			back_index = src.index;
			while (src.index < src.length){
				if (src.current.text == ';'){
					back_index = src.index;
					this.next(src);
					if (src.current.text == ','){
						break;
					}
				}
				if (src.current.type == 'EOT'){
					back_index = src.index;
					break;
				}
				if (ends.indexOf(src.current.text) != -1){
					break;
				}
				if (ref = this.parser('Statement', src)){
					node.add(ref);
					back_index = src.index;
					this.next(src);
					continue;
				}
				break;
			}
			src.index = back_index;
			if (node.length){
				return node;
			}
		}
		function checkIndentBlock(src, params){
			var handle, back_index, step_index, the_indent, node, ends, ref;
			handle = this.handle;
			back_index = src.index;
			step_index = src.current.text == ':' ? src.index : src.prevIndex(back_index, true);
			the_indent = src.lineIndent(step_index);
			node = new Syntax('BlockNode');
			node.subType = 'IndentBlock';
			node.theIndent = the_indent;
			// 
			if (src[step_index].text == ':'){
				step_index = src.nextIndex(step_index);
				if (!src[step_index].is('LF')){
					src.index = step_index;
					node = checkLineBlock.call(this, src, params);
					if (src[src.nextIndex(src.index)].is('LF')){
						step_index = back_index = src.index;
					}else {
						return node;
					}
				}
			}
			src.index = step_index;
			this.next(src, 1);
			step_index = src.index;
			ends = ['}', ')', ']'];
			if (params && params.length){
				ends.push.apply(ends, params);
			}
			while (src.index < src.length){
				if (src.current.type == 'EOT'){
					return node;
				}
				step_index = src.index;
				if (ends.indexOf(src.current.text) == -1){
					if (src.lineIndent(step_index) > the_indent){
						if (src.current.is('BLOCKBREAK', 'BLANK')){
							back_index = src.index;
							this.next(src, 1);
							continue;
						}
						if (ref = this.parser('Statement', src)){
							if (handle.comms && handle.comms.length){
								node.add(handle.comms);
								handle.comms.length = 0;
							}
							node.add(ref);
							back_index = src.index;
							this.next(src, 1);
							continue;
						}
					}
				}
				break;
			}
			if (src[back_index].is('LF')){
				back_index = back_index-1;
			}
			src.index = back_index;
			if (node.length == 0 && src.current.text != ':'){
				return;
			}
			return node;
		}
		function checkBraceBlock(src, ends){
			var check_brace, node, step_index, handle, ref;
			check_brace = false;
			node = new Syntax('BlockNode');
			if (src.current.text == '{'){
				if (this.next(src, 1).current.text == '}')
					return node;
				check_brace = true;
			}
			step_index = src.index;
			handle = this.handle;
			while (src.index < src.length){
				if (src.current.type == 'EOT'){
					if (check_brace){
						return this.error(1110);
					}
					break;
				}
				if (src.current.is('BLOCKBREAK', 'BLANK')){
					step_index = src.index;
					this.next(src, 1);
					continue;
				}
				if (ends && ends.indexOf(src.current.text) != -1){
					src.index = step_index;
					break;
				}
				if (check_brace && src.current.text == '}'){
					break;
				}
				if (ref = this.parser('Statement', src)){
					if (handle.comms && handle.comms.length){
						node.add(handle.comms);
						handle.comms.length = 0;
					}
					node.add(ref);
					step_index = src.index;
					this.next(src, 1);
					continue;
				}
				return this.error(1100, src.current);
			}
			if (!check_brace && node.length == 0){
				return false;
			}
			return node;
		};
	});
	return module.exports;
})('./settings/syntax/block.js', './settings/syntax');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Syntax
		Syntax = require("../../core/syntax.js")
		var patt = "(; → | var∅ Argus@=VarPatt | let∅ Argus@=LetPatt | Argus@:InitPatt)\n            (;∅ (;→ | Comma) ;∆1022∅ Comma? | [in of -> => <- <= ...] Comma ) |\n            CommaExpr (... Comma)?"
		module.exports = function(src, params){
			var start_index, ref, exp1, exp2, exp3, temp;
			start_index = src.index;
			if (src.current.text == '('){
				if (!src.get(src.nextIndex(src.indexPair('(', ')', start_index)[1], true)).is('JOINT')){
					ref = matchCondition(this, this.next(src, 1));
					if (this.next(src, 1).current.text != ')'){
						throw Error.create(1023, src.current, new Error());
					}
				}
			}
			if (!ref){
				ref = matchCondition(this, src);
			}
			exp1 = ref[0], exp2 = ref[1], exp3 = ref[2];
			if (exp1 && !exp2 && !exp3){
				temp = exp1;
				do {
					if (temp.is('CompareExpr') && temp[1] && temp[1].isToken && ['<=', 'in', 'of', '...'].indexOf(temp[1].text)>=0){
						exp2 = temp[1];
						exp3 = temp[2];
						if (temp == exp1){
							exp1 = temp[0];
						}else {
							temp[0].parent = temp.parent;
							temp.parent[temp.parent.length-1] = temp[0];
						}
						break;
					}
				} while (temp = temp[temp.length-1])
			}
			return new Syntax('ForCondition', exp1, exp2, exp3);
		}
		function matchCondition(grammar, src){
			var ref;
			if (!(ref = grammar.pattern(patt, src))){
				throw Error.create(1022, src.current, new Error());
			}
			return ref;
		};
	});
	return module.exports;
})('./settings/syntax/for.js', './settings/syntax');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card
		Card = require("../../../core/card.js")
		module.exports = function(node, params){
			var block, scope, cache, start, undefines;
			if (!node){
				return '';
			}
			block = this.read(node, true);
			block.type = 'Block';
			scope = node.scope;
			cache = scope.cache;
			start = 0;
			while (block[start] && /COMMENT/.test(block[start].type)){
				start += 1;
			}
			if (cache.head){
				block.insert(start, cache.head);
				cache.head = null;
			}
			if (!Tea.argv['--safe']){
				undefines = Jsop.toArray(scope.undefines);
				if (undefines.length){
					block.insert(start, this.pattern('#CARD(var)', undefines));
				}
			}
			if (params && params.length){
				for (var insert, i = 0; i < params.length; i++){
					insert = params[i];
					if (/@|#/.test(insert)){
						block.add(this.pattern(insert, node));
					}else {
						block.add(insert);
					}
				}
			}
			if (cache.end){
				block.add(cache.end);
				cache.end = null;
			}
			if (node.type == 'BlockStam' && block.length > 1){
				block = new Card('BlockNode', '{', block, '}');
			}else if (node.type == 'Root'){
				block.type = 'Root';
			}
			return block;
		};
	});
	return module.exports;
})('./settings/standards/es5/block.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card
		Card = require("../../../core/card.js")
		module.exports = function(node, param){
			var scope, file, params, list, card;
			scope = node.scope.root;
			file = node[0].location.fileName;
			params = parseRequireParams.call(this, node[1], file);
			list = [];
			for (var data, i = 0; i < params.length; i++){
				data = params[i];
				if (data.file){
					scope.cachePush('require', data.file);
				}
				card = new Card('RequireExpr', node[0], '(', data.card, ')');
				list.push(card);
			}
			if (list.length == 1){
				return list[0];
			}
			if (node.parent.is('BlockNode', 'Root')){
				for (var i = 0; i < list.length; i++){
					list[i] = new Card('VarExpr', 'var ', getName(list[i][2].text), ' = ', list[i]);
				}
			}else if (node.parent.is('JsonAssignExpr')){
				for (var i = 0; i < list.length; i++){
					list[i] = new Card('AssignExpr', getName(list[i][2].text), ' : ', list[i]);
				}
				return this.pattern('{#COMMA(@)}', list, 'JsonExpr');
			}else {
				return this.pattern('[#COMMA(@)]', list, 'ArrayExpr');
			}
			return list;
		}
		function parseRequireParams(node, from){
			var list, dir, text, file, files;
			list = [];
			dir = Fp && Fp.dirName(from) || from.split('/').slice(0, -1).join('/');
			for (var item, i = 0; i < node.length; i++){
				item = node[i];
				if (Fp && item.is('STRING')){
					text = item.text;
					if (/\//.test(text)){
						file = Fp.resolve(dir, text);
						if (Fp.isFile(file)){
							list.push(makeData(text, file, dir, item));
							continue;
						}
						if (!/\.js$|\.tea$/.test(file)){
							if (Fp.isFile(file+'.js')){
								list.push(makeData(text, file+'.js', dir, item));
								continue;
							}
							if (Fp.isFile(file+'.tea')){
								list.push(makeData(text, file+'.tea', dir, item));
								continue;
							}
						}
						if (/\.js$/.test(file)){
							if (Fp.isFile(file.replace(/\.js/, '.tea'))){
								list.push(makeData(text, file.replace(/\.js/, '.tea'), dir, item));
								continue;
							}
						}
						if (/\.tea$/.test(file)){
							if (Fp.isFile(file.replace(/\.tea/, '.js'))){
								list.push(makeData(text, file.replace(/\.tea/, '.js'), dir, item));
								continue;
							}
						}
						files = Fp.checkFiles(text, dir, ['index.js', 'index.tea']);
						if (!files.error){
							for (var file, j = 0; j < files.length; j++){
								file = files[j];
								if (file == from){
									continue;
								}
								list.push(makeData(text, file, dir, item));
							}
							continue;
						}
					}
					list.push({"card": item, "file": ''});
				}else {
					list.push({"card": this.read(item), "file": ''});
				}
			}
			return list;
		}
		function makeData(text, file, dir, token){
			var filename;
			filename = Fp.relative(dir, file);
			if (/\/index\.(js|tea)$/.test(filename) && !/\/index\.(js|tea)$/.test(text)){
				filename = Fp.dirName(filename);
			}
			filename = filename.replace(/\.tea$/, '.js');
			return {"card": token.clone('"'+filename+'"'), "file": file};
		}
		function getName(text){
			if (text){
				text = text.replace(/^['"]+|['"]+$|\.[^\.\/\\]*$|/g, '');
				var name = Fp.baseName(text);
				if (name == 'index'){
					name = Fp.baseName(Fp.dirName(text));
				}
				name = name.replace(/(?:^|[^a-zA-Z0-9\$]+)(\w)/g, function($0, $1){return $1.toUpperCase()});
				return name;
			}
		};
	});
	return module.exports;
})('./settings/standards/es5/require.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = function(node, params){
			node.text = node.text.replace(/\n\s*/g, '');
			if (Tea.argv['--const']){
				return "#CONST";
			}
		};
	});
	return module.exports;
})('./settings/standards/es5/regexp.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card
		Card = require("../../../core/card.js")
		module.exports = function(node, params){
			var str, mark, strs, m, ab, temp;
			str = node.text;
			mark = str.match(/^('{4}|'{3}|'|"{4}|"{3}|"|`)/)[1];
			str = str.slice(mark.length, -mark.length);
			if (/\n/.test(str)){
				str = SText.clip(str);
			}
			if (str && (mark[0] == '"' || mark == '`')){
				strs = [];
				while (m = str.match(/(^|[^\\])\$(\w+|\{)\b/)){
					strs.push(formatString(mark, str.substr(0, m.index+m[1].length)));
					if (m[2] == '{'){
						ab = SText.indexPair(str, '{', '}', m.index);
						if (ab){
							temp = str.slice(ab[0]+1, ab[1]);
							if (/[^\w\s\$\_]/.test(temp)){
								strs.push('('+temp+')');
							}else {
								strs.push(temp);
							}
							str = str.substr(ab[1]+1);
						}else {
							throw Error.create(1120, node, new Error());
						}
					}else {
						strs.push(m[2]);
						str = str.substr(m.index+m[0].length);
					}
				}
				if (str){
					strs.push(formatString(mark, str));
				}
				str = strs.join('+');
			}else {
				str = formatString(mark, str);
			}
			return (new Card('String')).add(str);
		}
		function formatString(mark, str){
			// 转义
			if (mark == '`'){
				str = str.replace(/\\`/g, '`');
			}
			if (mark == '`' || mark == '"""' || mark == "'''"){
				str = SText(str, mark == "'''" ? "'" : '"');
			}
			// 转义引号
			if (mark == '`' || mark == '"""' || mark == '""""'){
				str = str.replace(/(^|[^\\])"/g, '$1\\"');
			}else if (mark == "'''" || mark == "''''"){
				str = str.replace(/(^|[^\\])'/g, ""+1+"\\'");
			}
			switch (mark){
				case '""""':case "''''":case "`":
					// 保留换行符
					str = str.replace(/(^|[^\\])\n/g, '$1\\n');
					str = str.replace(/(^|[^\\])\n/g, '$1\\n');
					break;
				case '"""':case "'''":
					// 保留格式
					str = str.replace(/([^\\]|^)(\\{2,4,6,8})?\\n/g, '$1$2\\n\\\n');
					break;
				case '"':case "'":
					// 不保留换行符			
					str = str.replace(/(^|[^\\])\n\s*/g, '$1');
					break;
			}
			return mark[0] == "'" ? "'"+str+"'" : '"'+str+'"';
		};
	});
	return module.exports;
})('./settings/standards/es5/string.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card
		Card = require("../../../core/card.js")
		module.exports = function(node, param){
			var list;
			list = [];
			for (var i = 0; i < node.length; i++){
				list.push(parseItem.call(this, node[i]), ',');
			}
			list.pop();
			return new Card('ArgusExpr', '(', list, ')');
		}
		function parseItem(node, params){
			var type, vars, index;
			type = node.type;
			vars = this.handle.variables;
			if (type == 'RestExpr'){
				index = node.index;
				if (node.parent.length > index+1){
					vars['i'] = node.parent.length-index-1;
					this.pattern('#HEAD(`@[0] = [].slice.call(arguments, @[index], -@i)`)', node);
				}else {
					this.pattern('#HEAD(`@[0] = [].slice.call(arguments, @[index])`)', node);
				}
				return this.read(node, true);
			}
			if (type == 'AssignExpr'){
				if (vars['i']){
					this.pattern('#HEAD(`@[0] = arguments[arguments.length - @i]`)', node);
					vars['i']--;
				}
				this.pattern('#HEAD(`if (@[0] == null) @`)', node);
				return this.read(node[0]);
			}
			if (vars['i']){
				this.pattern('@ = arguments[arguments.length - @i]`)', node);
				vars['i']--;
			}
			return this.read(node);
		};
	});
	return module.exports;
})('./settings/standards/es5/argus.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card
		Card = require("../../../core/card.js")
		module.exports = function(node, params){
			var list, vars, right, left, parser, left_len;
			list = [];
			vars = this.handle.variables;
			right = node[2];
			left = node[0];
			parser = parseItem;
			if (!(right.is('ArrayExpr', 'Variable', 'AccessExpr'))){
				list.push(this.pattern('@ref = @', right), ',');
				right = vars.ref;
			}else if (right.type == 'ArrayExpr'){
				parser = parseArrayRight;
			}
			left_len = left.length;
			for (var i = 0; i < left.length; i++){
				list.push(parser.call(this, left[i], right, vars, left_len), ',');
			}
			list.pop();
			if (node.parent.is('ArgusStam')){
				return list;
			}
			return new Card('ArrayAssignExpr', list);
		}
		function parseItem(left, right, variables, left_len){
			var index;
			index = variables.index || 0;
			variables.index = index+1;
			if (left.type == 'RestExpr'){
				if (left_len > index+1){
					variables.slice = true;
					return this.pattern('@[0] = [].slice.call(@[1], @[2], @[1].length - @[3])', [left, right, index, left_len-index-1], 'AssignExpr');
				}else {
					return this.pattern('@[0] = [].slice.call(@[1], @[2])', [left, right, index+''], 'AssignExpr');
				}
			}
			if (variables.slice){
				return this.pattern('@[0] = @[1][@[1].length - @[2]]', [left, right, left_len-index], 'AssignExpr');
			}
			return this.pattern('@[0] = @[1][@[2]]', [left, right, index+''], 'AssignExpr');
		}
		function parseArrayRight(left, right, variables, left_len){
			var index;
			index = variables.index || 0;
			variables.index = index+1;
			if (index >= right.length){
				return this.read(left);
			}
			if (left.type == 'RestExpr'){
				if (left_len > index+1){
					variables.index = right.length-(left_len-index-1);
					return this.pattern('@[0] = [#COMMA(@[1])]', [left, Jsop.toArray(right, index, variables.index)]);
				}else {
					return this.pattern('@[0] = [#COMMA(@[1])]', [left, Jsop.toArray(right, index)]);
				}
			}
			return this.pattern('@[0] = @[1]', [left, right[index]]);
		};
	});
	return module.exports;
})('./settings/standards/es5/arrayassign.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card
		Card = require("../../../core/card.js")
		module.exports = function(node, params){
			var list, vars, right, left, left_len;
			list = [];
			vars = this.handle.variables;
			right = node[2];
			left = node[0];
			if (!(right.is('Variable', 'AccessExpr'))){
				list.push(this.pattern('@ref = @', right), ',');
				right = vars.ref;
			}
			vars.right = right;
			left_len = left.length;
			for (var i = 0; i < left.length; i++){
				list.push(parseItem.call(this, left[i], right, vars, left_len), ',');
			}
			list.pop();
			return new Card('ArrayAssignExpr', list);
		}
		function parseItem(left, right, variables, left_len){
			if (left.type == 'AssignExpr'){
				return this.pattern('@2 = @right["@0"]', left);
			}
			return this.pattern('@ = @right["@"]', left);
		};
	});
	return module.exports;
})('./settings/standards/es5/jsonassign.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = function(node, param){
			if (!node[1]){
				return rewriteForRange.call(this, node, param);
			}
			switch (node[1].isToken && node[1].text){
				case 'of':case 'in':
					return rewriteForIn.call(this, node, param);
				case '->':case '=>':case '<=':case '<-':
					return rewriteForEach.call(this, node, param);
				case '...':
					return rewriteForRange.call(this, node, param);
				default:
					if (node[0].is('VarPatt', 'LetPatt')){
						return "var @0; @1; @2";
					}
					break;
			}
			return "@0; @1; @2";
		}
		function rewriteForIn(node, param){
			var vars, state;
			vars = this.handle.variables;
			vars.i = node[0][0];
			vars.temp = node[0][1];
			if (!vars.temp && node[1].text == 'of'){
				vars.temp = vars.i;
				vars.i = this.pattern('#VAR(for_let, i)', node);
			}else {
				if (state = node.scope.state(vars.i.text)){
					this.pattern('#VAR(for_let, i, @)', vars.i);
				}else {
					node.scope.define('let', vars.i);
				}
			}
			if (vars.temp){
				node.scope.define('let', vars.temp);
			}
			return "var @i in #VALUE(@[2], ref)"+"#HEAD( `if (!@ref.hasOwnProperty(@i)) continue`, Let )"+(vars.temp ? "#HEAD( `var @temp = @ref[@i]`, Let )" : "");
		}
		function rewriteForEach(node, param){
			var vars, scope, mark, i, def, text, state, init, patt;
			vars = this.handle.variables;
			scope = node.scope;
			mark = node[1].text;
			if (node[0][1]){
				i = node[0][0];
				vars.temp = node[0][1];
			}else if (mark == '<=' || mark == '=>'){
				vars.temp = node[0][0];
			}else {
				i = node[0][0];
			}
			if (i){
				if (i.type == 'AssignExpr'){
					def = '@[0.0.2]';
					i = i[0];
				}
				text = i.text;
				state = scope.state(text);
				if (!state || node[0].type != 'InitPatt'){
					scope.define('for_let', i);
					vars['i'] = text;
				}else {
					if (!def && state != 'for_let'){
						def = text;
					}
					this.pattern('#VAR(for_let, i, @)', i);
				}
			}else {
				this.pattern('#VAR(for_let, i)', node);
			}
			init = [];
			if (node[2].is('Access')){
				vars.ref = node[2];
			}else {
				init.push('@ref = #VALUE(@[2])');
			}
			if (vars.temp){
				init.push('@temp');
				scope.define('let', vars.temp);
			}
			if (mark == '=>' || mark == '->'){
				init.push('@i = '+(def || '0'));
				patt = 'var '+init.join(', ')+'; @i < @ref.length; @i++';
			}else {
				init.push('@i = '+(def || '@ref.length - 1'));
				patt = 'var '+init.join(', ')+'; @i >= 0; @i--';
			}
			if (vars.temp){
				patt += "#HEAD( `@temp = @ref[@i]`, Let )";
			}
			return patt;
		}
		function rewriteForRange(node, param){
			var vars;
			if (node[1]){
				vars = this.handle.variables;
				vars.left = node[0];
				vars.right = node[2];
				if (vars.left.type == 'NUMBER' || vars.right.type == 'NUMBER'){
					return "var @i = @right; @i >= @left; @i--";
				}
				return "var @i = @left; @i <= @right; @i++";
			}
			node = node[0][0];
			if (node.type == 'NUMBER'){
				return "var @i = 0; @i < @; @i++";
			}
			if (node.is('Variable')){
				return "var @i = 0; @i < @.length; @i++";
			}
			if (node.is('Value')){
				return "var @i = 0, @ref = @; @i < @ref.length; @i++";
			}
			return "var @i = 0, @ref = (@); @i < @ref.length; @i++";
		};
	});
	return module.exports;
})('./settings/standards/es5/for.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Card
		Card = require("../../../core/card.js")
		module.exports = function(node, param){
			var handle, vars, scope, i, name, extend, block, start, init_block;
			handle = this.handle;
			vars = handle.variables;
			scope = node.scope;
			if (node[i = 1].type == 'NameExpr'){
				name = node[i++];
			}else if (node.parent.type == 'AssignExpr' && node.parent[0].type == 'VariableExpr'){
				name = node.parent[0][0];
			}else {
				name = '_Class_';
			}
			if (node[i].type == 'ExtendsExpr'){
				extend = node[i++];
				scope.super = 'this.__super__';
			}else {
				scope.super = 'Object.prototype';
			}
			name = vars.name = scope.name = name.text || name;
			block = this.read(node[i], false, true)[1];
			start = 0;
			for (var j = 0; j < block.length; j++){
				if (block[j].type){
					if (/VarStam|LetStam|AssignExpr|RequireExpr|COMMENT|STRING/.test(block[j].type)){
						continue;
					}
				}
				start = j;
				break;
			}
			if (extend){
				block.insert(start, ClassExtends.call(this, scope, extend));
			}
			block.insert(start, ClassConstructor.call(this, scope));
			block.add(new Card('Line', 'return '+name));
			init_block = this.pattern('(function(){@})()', block, 'ClassInit');
			if (node.parent.type == 'AssignExpr'){
				return init_block;
			}
			return this.pattern('var @name = @', init_block, 'ClassDecl');
		}
		function ClassConstructor(scope){
			var cache, constructor, propertys, argu, block;
			cache = scope.cache;
			constructor = cache.constructors && cache.constructors[0];
			propertys = cache.propertys;
			if (constructor){
				argu = this.read(constructor[1]);
				if (propertys){
					constructor.scope.cachePush('head', propertys);
				}
				block = this.read(constructor[2], false, true)[1];
			}else {
				argu = '()';
				block = new Card('Block', propertys);
			}
			return this.pattern('function @name@[0]{@[1]}', [argu, block], 'ConstructorExpr');
		}
		function ClassExtends(scope, node){
			var list, params;
			list = [];
			params = node[1];
			list.push(this.pattern('@name.prototype = Object.create(@[0].prototype)', params, 'Line'));
			list.push(this.pattern('@name.prototype.__super__ = @[0].prototype', params, 'Line'));
			list.push(this.pattern('@name.prototype.constructor = @name', params, 'Line'));
			if (params.length > 1){
				list.push(this.pattern('@name.__extends__ = function(){for(var i=0, args = arguments; i<args.length; i++){var _super = args[i].prototype;for (var name in _super){if (_super[name].hasOwnProperty(name)){this.prototype[name] = _super[name];}}}}', params, 'Line'));
				list.push(this.pattern('@name.__extends__(#COMMA(1))', params));
			}
			return list;
		};
	});
	return module.exports;
})('./settings/standards/es5/class.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		module.exports = function(node, params){
			var name, scope, member;
			name = 'this';
			scope = node.scope;
			if (scope.valid.type == 'Class'){
				name = scope.valid.name;
			}else {
				if (node[1]){
					member = node[1].text;
				}else if (node.parent.type == 'AccessExpr' && node.parent[1].type == 'MemberExpr'){
					member = node.parent[1][1].text;
				}
				if (member && scope.member(member) == 'static'){
					name = scope.query('Class').name;
				}
				// TODO: AT
				// else if scope.parent.type == 'Function':
				// 	f_scope = scope.parent;
				// 	while f_scope.parent.type == 'Function':
				// 		f_scope = f_scope.parent;
				// 	f_scope.cachePush( 'head', 'var _this = this' );
				// 	name = '_this';
				// 	// console.log('???????', f_scope.name)
				
				if (node[1]){}
				return name+'.@1';
			}
			return name;
		};
	});
	return module.exports;
})('./settings/standards/es5/at.js', './settings/standards/es5');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		function SUGAR(src, params){
			var map, sugar, node;
			if (!this.prepor){
				return;
			}
			if (!(map = this.prepor[params[0]])){
				if (sugar = this.prepor.check(params[0])){
					if (node = sugar.parse(this, src)){
						return node;
					}
				}
				return;
			}
			for (var name in map){
				if (!map.hasOwnProperty(name)) continue;
				var sugar = map[name];
				if (node = sugar.parse(this, src)){
					return node;
				}
			}
		}
		module.exports.SUGAR = SUGAR
		function CHECK(src, params, config){
			var left, mark, right, last;
			if (!config.test){
				params[2] = params[2].split(' ');
				config.test = true;
			}
			left = params[0];
			mark = params[1];
			right = params[2];
			switch (left){
				case 'last':
					last = this.handle.cache;
					while (isArray(last)){
						last = last[last.length-1];
					}
					break;
				default:
					last = this.handle.cache[left];
					break;
			}
			if (last && last.is){
				switch (mark){
					case "==":
						return !!last.is.apply(last, right);
					case "===":
						return right.indexOf(last.type) != -1 || right.indexOf(last.text) != -1;
					case "!=":
						return !last.is.apply(last, right);
					case "!==":
						return right.indexOf(last.type) == -1;
				}
			}
			return false;
		}
		module.exports.CHECK = CHECK
		function ARGU(src, argus, config){
			var params;
			config.test = true;
			params = this.handle.params;
			if (params && argus){
				for (var item, i = 0; i < argus.length; i++){
					item = argus[i];
					if (params.indexOf(item) != -1){
						return true;
					}
				}
			}
			return false;
		}
		module.exports.ARGU = ARGU
		function IS(src, params, config){
			var m, index, token;
			if (!params.mode){
				if (m = params[0].match(/^([\+\-]{1,2})(\d+)/)){
					params.mode = [m[1], parseInt(m[2]), 0];
					params.shift();
				}else {
					params.mode = [0, 0, 0];
				}
				if (params.mode[1]){
					config.test = true;
				}
			}
			index = moveIndex(src, params.mode);
			if (!(token = src[index])){
				return false;
			}
			if (params.indexOf(token.text) != -1){
				return token;
			}
			if (token.is.apply(token, params)){
				return token;
			}
			return false;
		}
		module.exports.IS = IS
		function NOT(src, params, config){
			var m, index, token;
			if (!params.mode){
				if (m = params[0].match(/^([\+\-]{1,2})(\d+)/)){
					params.mode = [m[1], parseInt(m[2]), 0];
					params.shift();
				}else {
					params.mode = [0, 0, 0];
				}
				if (params.mode[1]){
					config.test = true;
				}
			}
			index = moveIndex(src, params.mode);
			if (!(token = src[index])){
				return false;
			}
			if (params.indexOf(token.text) != -1){
				return false;
			}
			if (token.is.apply(token, params)){
				return false;
			}
			return token;
		}
		module.exports.NOT = NOT
		function INDENT(src, params){
			var cache, last, check_indent;
			cache = this.handle.cache;
			while (last = cache[cache.length-1]){
				if (last.type == 'BlockNode'){
					if (last.subType == 'IndentBlock')
						check_indent = last.theIndent;
					break;
				}
				cache = last;
			}
			if (check_indent != null && check_indent != src.lineIndent()){
				return false;
			}
			return true;
		}
		module.exports.INDENT = INDENT
		function CONCAT(src, params){
			var a, b, patt, temp, ab, types, token;
			a = params[0] || src.current.text;
			b = params[1];
			if (a && a.isToken){
				a = a.text;
			}
			if (b && b.isToken){
				b = b.text;
			}
			if (typeof a == 'string'){
				if (/\.{3}|\|| /.test(a) && a.length > 2){
					patt = a;
					a = src.index;
					if (temp = this.pattern(patt, src, null, 'Temp')){
						b = src.index;
					}else {
						return false;
					}
				}else if ((ab = src.indexPair(a, b || a, src.index, true)) && ab[0] == src.index){
					a = ab[0];
					b = ab[1];
				}else {
					return false;
				}
			}
			if (a < b){
				types = params[2] && params[2].split(' ') || src.current.types.slice();
				src.index = b;
				token = src[a].clone(src.join(a, b), types);
				token.location.code = token.text;
				token.location.end = src[b].location.end;
				return token;
			}
			return false;
		}
		module.exports.CONCAT = CONCAT
		function moveIndex(src, data){
			var index, num;
			index = src.index;
			if (data){
				num = data[1];
				while (--num >= 0){
					switch (data[0]){
						case '++':
							index++;
							break;
						case '+':
						default:
							index = src.nextIndex(index, !data.lf);
							break;
						case '--':
							index--;
							break;
						case '-':
							index = src.prevIndex(index, !data.lf);
							break;
					}
				}
			}
			return index;
		};
	});
	return module.exports;
})('./core/grammar/method.js', './core/grammar');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Asset = (function(){
			var Method, cache, asset_re;
			Method = require("./method.js");
			cache = Jsop.data();
			asset_re = /#(\w*)(\()?|@(\w+)|@\[(.*?)\]|@|(--\w+\b)/;
			function Asset(str){
				var match;
				if (!(typeof str == 'string')){
					match = str;
					str = match[0];
				}else {
					match = Asset.test(str);
				}
				this.string = str;
				checkAssetType(this, match);
			};
			Asset.prototype.parse = function (){
				switch (this.type){
					case 'Acc':
						return parseAccAsset.apply(this, arguments);
					case 'Call':
						return parseCallAsset.apply(this, arguments);
					case 'Cache':
						return parseCacheAsset.apply(this, arguments);
					case 'Argv':
						return Tea.argv[this.name];
					case 'Logic':
						return parseLogicAsset.apply(this, arguments);
				}
			};
			Asset.prototype.isAsset = true;
			Asset.compile = function(match, logic){
				var str;
				if (typeof match == 'string'){
					if (cache[match]){
						return cache[match];
					}
					if (logic){
						match = [match, null, match];
					}else {
						match = Asset.test(match);
					}
				}
				str = match[0];
				if (!cache[str]){
					cache[str] = new Asset(match);
				}
				return cache[str];
			};
			Asset.test = function(text, is_all){
				var m, ab;
				if (m = text.match(asset_re)){
					if (m[2]){
						if (ab = SText.indexPair(text, '(', ')', m.index+m[1].length)){
							m[2] = text.slice(ab[0]+1, ab[1]);
							m[0] = text.slice(m.index, ab[1]+1);
						}
					}
					if (is_all){
						if (m[0] != text){
							return;
						}
					}
				}
				return m;
			};
			Asset.parse = function(asset, node, std){
				if (!asset.isAsset){
					asset = Asset.compile(asset);
				}
				return asset.parse(node, std);
			};
			// compile asset
			function checkAssetType(self, match){
				var m;
				if (match[1]){
					checkCallAsset(self, match[1], match[2]);
					return true;
				}
				if (match[2]){
					if (m = Asset.test(match[2], true)){
						return checkAssetType(self, m);
					}
					checkLogicAsset(self, match[2]);
					return true;
				}
				if (match[3]){
					self.type = 'Cache';
					self.name = match[3];
					if (/^\d+$/.test(self.name)){
						self.quick = true;
					}
					return true;
				}
				if (match[5]){
					self.type = 'Argv';
					self.name = match[5];
					return true;
				}
				checkAccAsset(self, match[4]);
				return true;
			};
			function checkCallAsset(self, name, params){
				self.type = 'Call';
				self.name = name;
				if (params){
					params = SText.split(params, ',', true);
					for (var item, i = 0; i < params.length; i++){
						item = params[i];
						if (i == 0 && /^@(\w+|\[.*?\])?$/.test(item)){
							params[i] = Asset.compile(item);
						}else if (/^\`([\w\W]*?)\`$/.test(item)){
							params[i] = item.slice(1, -1).trim();
						}
					}
				}
				self.params = params || [];
				return true;
			};
			function checkAccAsset(self, params){
				self.type = 'Acc';
				if (params){
					params = params.split('.');
					for (var item, i = 0; i < params.length; i++){
						item = params[i];
						params[i] = /^-?\d+$/.test(item) ? parseInt(item) : item;
					}
				}
				self.params = params || [];
				return true;
			};
			function checkLogicAsset(self, text){
				var slice, temp, item;
				self.type = 'Logic';
				self.length = 0;
				slice = SText.split(text, /\&\&|\|\|/, false);
				for (var str, i = 0; i < slice.length; i++){
					str = slice[i];
					str = str.trim();
					temp = SText.split(str, / (?:\=\=\=|\!\=\=|\=\=|\!\=|\=|\>\=|\<\=|\>|\<) /, false);
					if (temp.length > 3){
						throw Error.create(5006, str, new Error());
					}
					item = {
						"left": checkLogicCompute(temp[0]),
						"right": checkLogicCompute(temp[2]),
						"oper": temp[1] && temp[1].trim(),
						"string": str,
						"and": slice[++i] == '&&'};
					self[self.length++] = item;
				}
				return self;
			};
			function checkLogicCompute(text){
				var list, slice, m;
				if (text){
					list = [];
					slice = SText.split(text.trim(), /(?:^| )(?:\+|\-) |!/, false);
					for (var str, i = 0; i < slice.length; i++){
						str = slice[i];
						str = str.trim();
						if (/^\[.*\]$/.test(str)){
							list.push(SText.split(str.slice(1, -1), ' ', true, true));
						}else {
							if (m = Asset.test(str, true)){
								list.push(Asset.compile(m));
							}else if (str){
								list.push(SText.cleanESC(str));
							}
						}
					}
					return list;
				}
			};
			// parse asset
			function parseAccAsset(node, std){
				var list, len, ref;
				if (list = this.params){
					for (var acc, i = 0; i < list.length; i++){
						acc = list[i];
						if (!node){
							return;
						}
						if (acc < 0){
							len = node.length;
							if (/block/i.test(node.type)){
								while (acc++ < 0){
									len -= 1;
									while (node[len] && node[len].is('COMMENT')){
										len -= 1;
									}
								}
								node = node[len];
							}else {
								node = node[len+acc];
							}
							continue;
						}
						if (acc == '@'){
							node = node.parent;
							continue;
						}
						if (ref = checkQuick(acc, node, std)){
							node = ref;
							continue;
						}
						node = node[acc];
					}
				}
				return node;
			};
			function parseCallAsset(node, std){
				var params, name, ref;
				params = this.params;
				name = this.name;
				if (params && params.length){
					if (params[0].isAsset && (params[0].type == 'Acc' || params[0].type == 'Cache')){
						node = params[0].parse(node, std);
						params = params.slice(1);
					}
				}
				ref = std.parser(name, node, params, true);
				if (ref != null){
					return ref;
				}
				return callMethod(name, node, params, std);
			};
			function parseCacheAsset(node, std){
				var vars, ref;
				if (this.quick){
					return node[this.name];
				}
				vars = std.handle.variables;
				if (vars.hasOwnProperty(this.name)){
					return vars[this.name];
				}
				if (ref = checkQuick(this.name, node, std)){
					return ref;
				}
				// if @.name == 'ref' || @.name == 'i':
				// 	return callMethod('VAR', node, ['let', @.name], std);
				return '';
			};
			function checkQuick(name, node, std){
				var scope;
				switch (name){
					case 'ref':
						return callMethod('VAR', node, ['undefined ref', name], std);
					case 'i':
						return callMethod('VAR', node, [name], std);
					case 'name':
						return node.isScope ? node.valid.name : node.scope.valid.name;
					case 'super':
						scope = (node.isScope ? node : node.scope).query('Class');
						return scope && scope.super;
					case 'Class':case 'Function':case 'Root':
						return node.isScope ? node.query(name) : node.scope.query(name);
				}
			};
			function parseLogicAsset(node, std){
				var ref;
				ref = false;
				for (var item, i = 0; i < this.length; i++){
					item = this[i];
					ref = parseLogicCompare(item, node, std);
					if (ref){
						if (!item.and){
							return true;
						}
					}else if (item.and){
						return false;
					}
				}
				return false;
			};
			function parseLogicCompare(item, node, std){
				var oper, asset, left, right;
				oper = item.oper;
				if (!oper){
					return parseLogicCompute(item.left, node, std);
				}
				if (oper == '='){
					if (item.left.length == 1){
						asset = item.left[0];
						if (asset.isAsset && asset.type == 'Cache'){
							std.handle.variables[asset.name] = parseLogicCompute(item.right, node, std);
							return true;
						}
					}
					return false;
				}
				left = parseLogicCompute(item.left, node, std);
				right = parseLogicCompute(item.right, node, std);
				switch (oper){
					case '===':case '!==':case '==':case '!=':
						if (typeof right == 'string'){
							right = [right];
						}
						if (left){
							if (left.text && right.indexOf(left.text) != -1){
								return oper[0] == '!' ? false : true;
							}
							if (oper.length == 3){
								if (left.type && right.indexOf(left.type) != -1){
									return oper[0] == '!' ? false : true;
								}
							}else {
								if (left.is && left.is.apply(left, right)){
									return oper == '!=' ? false : true;
								}
							}
						}
						if (right.indexOf(left) != -1){
							return oper[0] == '!' ? false : true;
						}
						return oper[0] == '!' ? true : false;
					case '>=':
						return left >= right;
					case '<=':
						return left <= right;
					case '>':
						return left > right;
					case '<':
						return left < right;
				}
			};
			function parseLogicCompute(exps, node, std){
				var list, _not;
				if (!exps || !exps.length){
					return null;
				}
				list = [];
				for (var exp, i = 0; i < exps.length; i++){
					exp = exps[i];
					if (exp.isAsset){
						exp = exp.parse(node, std);
					}else if (exp == '!'){
						_not = true;
						continue;
					}
					list.push(_not ? !exp : exp);
					_not = false;
				}
				if (list.length == 1){
					return list[0];
				}
				for (var i = 0; i < list.length; i++){
					if (list[i].isToken || list[i].isSyntax || list[i].isCard){
						list[i] = list[i].text;
					}
				}
				return eval(list.join(''));
			};
			function callMethod(name, node, params, std){
				if (!(Method.hasOwnProperty(name))){
					throw Error.create(5002, name, std, node, new Error());
				}
				return Method[name].call(std, node, params);
			};
			return Asset;
		})()
		module.exports = Asset;
	});
	return module.exports;
})('./core/standard/asset.js', './core/standard');
(function(__filename, __dirname){var module  = new Module(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		var Asset, Card
		Asset = null
		Card = require("../card.js")
		function EACH(node, params){
			var i, index, patt, rep, sep, list;
			if (/^\d$/.test(params[i = 0])){
				index = parseInt(params[i++]);
			}else {
				index = 0;
			}
			if (/#|@/.test(params[i])){
				patt = params[i++];
			}
			if (params[i] && /. \-\-\> ./.test(params[i])){
				rep = SText.split(params[i++], '\-\-\>', true, true);
			}
			if (params[i]){
				sep = params[i++];
			}
			list = [];
			for (var item, j = index; j < node.length; j++){
				item = node[j];
				if (patt){
					item = this.pattern(patt.replace(/\$/g, j), item);
				}else {
					if (rep && item.isToken && rep[0] == item.text){
						item = rep[1];
					}else {
						item = this.read(item);
					}
				}
				if (item){
					list.push(item);
					if (sep){
						list.push(sep);
					}
				}
			}
			if (sep && list[list.length-1] == sep){
				list.pop();
			}
			return list;
		}
		module.exports.EACH = EACH
		function COMMA(node, params){
			var list;
			params = (params || []).concat([', ']);
			list = EACH.call(this, node, params);
			return new Card('CommaExpr', list);
		}
		module.exports.COMMA = COMMA
		function INSERT(node, params){
			var name, asset, type, scope;
			name = params[0];
			asset = checkAsset(params[1], node, this);
			type = params[2];
			scope = type && node.scope.query(type) || node.scope;
			scope.cachePush(name, asset);
			return true;
		}
		module.exports.INSERT = INSERT
		function HEAD(node, params){
			return INSERT.call(this, node, ['head', params[0], params[1]]);
		}
		module.exports.HEAD = HEAD
		function END(node, params){
			return INSERT.call(this, node, ['end', params[0], params[1]]);
		}
		module.exports.END = END
		function CHECK(node, params){
			var state;
			if (!(state = node.scope.check(node))){
				return node.scope.define(node);
			}
			return state[0];
		}
		module.exports.CHECK = CHECK
		function STATE(node, params){
			var state, target, alias;
			if (params.length){
				state = params[0];
				target = checkAsset(params[1], node, this);
				alias = params[2];
				return node.scope.define(state, target, alias);
			}else {
				return node.scope.state(node);
			}
		}
		module.exports.STATE = STATE
		function ALIAS(node, params){
			var text, token;
			if (text = node.scope.alias(node)){
				token = node.tokens(0).clone(text);
				return token;
			}else {
				return node;
			}
		}
		module.exports.ALIAS = ALIAS
		function CONST(node, params){
			var text, scope, cache;
			text = node.text;
			if (node.parent.type == 'AssignExpr'){
				return text;
			}
			scope = node.scope.root;
			!scope.consts && (scope.consts = {});
			if (scope.consts[text]){
				return scope.consts[text];
			}else {
				scope.consts[text] = checkVariable('_rg_', scope);
				cache = scope.cache;
				!cache.head && (cache.head = []);
				cache.head.push(scope.consts[text]+' = '+text);
				return scope.consts[text];
			}
		}
		module.exports.CONST = CONST
		function VALUE(node, params){
			var name, ref, _name;
			if (!params || !params.length){
				// return node.is('Value', 'Operate') ? @.read(node) : @.pattern('(@)', node);
				return node.is('AssignExpr') ? this.pattern('(@)', node) : this.read(node);
			}
			name = params[0];
			if (/@|#/.test(name)){
				ref = checkAsset(name, node, this);
				// if node.parent.is('AssignExpr'):
				// 	return ref.insert(0, '(').add(')');
				return ref;
			}
			if (['VariableExpr', 'AccessExpr', 'IDENTIFIER'].indexOf(node.type)>=0){
				return this.handle.variables[name] = node;
			}
			_name = checkVariable(name, node.scope, node);
			this.handle.variables[name] = _name;
			return this.pattern('(@'+name+' = @)', node);
		}
		module.exports.VALUE = VALUE
		function LIST(node, params){
			var list, ref;
			list = [];
			for (var i = 0; i < params.length; i++){
				ref = this.pattern(params[i], node);
				if (isArray(ref)){
					list.push.apply(list, ref);
				}else {
					list.push(ref);
				}
			}
			return list;
		}
		module.exports.LIST = LIST
		function VAR(node, params){
			var type, name, _name, asset;
			type = params[0];
			name = params[1];
			if (!name){
				name = type, type = 'undefined';
			}
			_name = checkVariable(name, node.scope, node, type);
			if (asset = params[2]){
				if (/#|@/.test(asset)){
					asset = checkAsset(asset, node, this);
				}
				if (asset){
					node.scope.define(type, asset, _name);
				}
			}
			return this.handle.variables[name] = _name;
		}
		module.exports.VAR = VAR
		function STR(node, params){
			if (node.is('STRING')){
				return node;
			}
			return this.pattern('"@"', node);
		}
		module.exports.STR = STR
		function DEL(node, params){
			node.parent[node.index] = null;
			return true;
		}
		module.exports.DEL = DEL
		function CARD(node, params){
			var type, list, card;
			type = params[0];
			if (params[1]){
				node = checkAsset(params[1], node, this);
			}
			list = [];
			for (var i = 0; i < node.length; i++){
				if (node[i]){
					if (node[i].isNode){
						list.push(this.read(node[i]));
					}else {
						list.push(node[i]);
					}
				}
			}
			if (list.length){
				switch (type){
					case 'var':
						card = this.pattern('var #COMMA(@)', list);
						card.type = 'VarStam';
						return card;
					default:
						return new Card(type || 'Line', list);
				}
			}
		}
		module.exports.CARD = CARD
		function checkAsset(text, node, std){
			var m;
			!Asset && (Asset = require("./asset.js"));
			if (m = Asset.test(text)){
				if (m[0] == text){
					return Asset.parse(text, node, std);
				}
				return std.pattern(text, node);
			}
			return text;
		}
		function checkVariable(name, scope, node, type, deep){
			var name_map, i, _name, state;
			if (name == null) name = 'i';
			if (deep == null) deep = true;
			if (name.length == 1){
				name_map = [
					'i',
					'j',
					'k',
					'l',
					'm',
					'n',
					'o',
					'p',
					'q',
					'r',
					's',
					't',
					'u',
					'v',
					'w',
					'k',
					'y',
					'z'];
				i = name_map.indexOf(name);
			}else {
				i = 0;
			}
			_name = name;
			while (state = checkExist(_name, scope, deep)){
				if (state == 'undefined ref'){
					break;
				}
				if (name_map){
					_name = name_map[++i];
				}else {
					_name = name+(i++);
				}
			}
			if (node.parent.is('Assign')){
				node = node.parent;
			}
			if (node.parent.is('ArgusStam')){
				node = node.parent;
			}
			if (node.is('VarStam', 'LetStam', 'ConstStam') || node.parent.is('VarStam', 'LetStam', 'ConstStam')){
				return _name;
			}
			scope.define(type || 'undefined', _name);
			return _name;
		}
		function checkExist(name, scope, deep){
			var state, node;
			if (state = scope.state(name)){
				return state;
			}
			if (deep && (node = scope.target)){
				node.each(function(target, indexs){
					var type;
					type = target.type;
					if (target.is('Function') || type == 'MemberExpr'){
						return 0;
					}
					if (type == 'IDENTIFIER' || type == 'KEYWORD'){
						if (target.text == name){
							state = 'unknow';
							return false;
						}
					}
				});
			}
			return state;
		};
	});
	return module.exports;
})('./core/standard/method.js', './core/standard');
(function(__filename, __dirname){var module  = Module.main(__filename, __dirname);var require = Module.makeRequire(module);var exports = module.exports;module.register(function(){
		require("./tea.js")
		if (!module.parent){
			(function(){
				var files, ctx;
				Tea.argv.parse(process.argv);
				if (Tea.argv['--help']){
					print(Tea.argv.help());
					Tea.exit();
				}
				if (Tea.argv['--tab']){
					Tea.tabsize(parseInt(Tea.argv['--tab']));
				}
				if (Tea.argv['--define']){
					files = checkPath(Tea.argv['--define'], Tea.argv['--path']);
					if (!files){
						print('* <g:Cant find define file as <r:"'+Tea.argv['--define']+'":>!!:>');
						Tea.exit();
					}
					Tea.prep.load(files);
				}
				if (Tea.argv['--eval'] && Tea.argv['--eval'].length){
					ctx = Tea.context(null, Tea.argv['--eval']);
					nextStep(ctx);
					return;
				}
				if (Tea.argv['--file'] || Tea.argv['--path']){
					checkDefine(Tea.argv['--path'] || Fp.dirName(Tea.argv['--file']));
					files = checkPath(Tea.argv['--file'], Tea.argv['--path']);
					for (var file, i = 0; i < files.length; i++){
						file = files[i];
						ctx = Tea.context(file);
						nextStep(ctx);
					}
					return;
				}
				Tea.argv.pipe(function(chunk){
					if (!chunk){
						print('\n* Are you <g:NongShaLei??????:>\n');
						print(Tea.argv.help());
						Tea.exit();
					}
					ctx = Tea.context(null, chunk);
					nextStep(ctx);
					return;
				});
			})();
			function nextStep(ctx){
				var out;
				Tea.log('* <g:Load:>  : '+(ctx.fileName || 'by stdin'));
				if (Tea.argv['--token']){
					print(ctx.fileName);
					print(ctx.source);
				}
				if (Tea.argv['--ast']){
					print(ctx.fileName);
					print(ctx.AST);
				}
				if (Tea.argv['--ast'] || Tea.argv['--token']){
					return;
				}
				if (Tea.argv['--out']){
					out = checkOut(Tea.argv['--out'], Tea.argv['--path'], ctx.fileName);
					ctx.output(out, Tea.argv['--map']);
					Tea.log('* <g:Output:>: '+out);
				}
				if (Tea.argv['--test']){
					runTest(ctx);
				}else if (!Tea.argv['--out']){
					console.log(ctx.output());
				}
			};
			function runTest(ctx, param){
				var child_process, out, cmds, temp_file;
				child_process = require("child_process");
				out = ctx.outfile;
				cmds = [];
				if (!out){
					temp_file = ctx.fileName.replace(/\.(js|tea)$/ig, '')+'.tmp.js';
					ctx.output(temp_file);
					cmds.push('node', temp_file);
				}else {
					cmds.push('node', out);
				}
				if (typeof param == 'string'){
					cmds = cmds.concat(param.split(' '));
				}
				Tea.log('* <r:Test:>  : '+cmds.join(' '));
				child_process.exec(cmds.join(' '), {"maxBuffer": 50000*1024}, function(err, stdout, stderr){
					var text;
					text = stdout+''+stderr;
					print(text.replace(/^/mg, '\t  | '));
					if (temp_file){
						child_process.execSync('rm -rf '+temp_file);
					}
					Tea.exit();
				});
			};
			function checkPath(file, path, out){
				var files, file_list, temp;
				if (path){
					path = Fp.resolve(path);
				}
				if (file){
					files = [];
					file_list = [];
					if (isArray(file)){
						for (var i = 0; i < file.length; i++){
							file_list.push(Fp.resolve(path, file[i]));
						}
					}else {
						file_list.push(Fp.resolve(path, file));
					}
					for (var file, i = 0; i < file_list.length; i++){
						file = file_list[i];
						if (/[^\w\/]/.test(file) || Fp.isDir(file)){
							temp = Fp.checkFiles(file, null, ['index.tea']);
							files.push.apply(files, temp);
						}else if (Fp.isFile(file)){
							files.push(file);
						}else if (Fp.isFile(file+'.tea')){
							files.push(file+'.tea');
						}
					}
				}else {
					files = Fp.scanFile(path, /\.tea/, 100);
				}
				for (var file, i = files.length - 1; i >= 0; i--){
					file = files[i];
					if (/(__define\.tea)$/.test(file)){
						files.splice(i, 1);
					}
				}
				return files;
			};
			function checkOut(out, path, file){
				out = Fp.resolve(out, true);
				if (Fp.isDir(out) || /\/$/.test(out)){
					if (path){
						out = Fp.join(out, Fp.relative(Fp.resolve(path), Fp.resolve(file)));
					}else {
						out = Fp.join(out, Fp.baseName(file));
					}
					out = out.replace(/\.tea$/, checkExt());
				}
				return out;
			};
			function checkExt(){
				switch (Tea.argv['--std']){
					case 'es5':case 'es6':
					default:
						return '.js';
				}
			};
			function checkDefine(path){
				var file;
				file = Fp.join(Fp.resolve(path), '__define.tea');
				if (Fp.isFile(file)){
					Tea.prep.load(file);
				}
			};
		};
	});
	return module.load();
})('./index.js', '.');