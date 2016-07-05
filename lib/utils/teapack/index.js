var modulePackTmp;
module.exports = TeaPack;
var Fp = require("../fp");
var SText = require("../stext");
function TeaPack(file, content, loader){
	var handle, main;
	handle = {
		"requires": {},
		"misss": [],
		"exts": Object.keys(loader || {}),
		"loader": loader};
	main = findFile(handle, null, file);
	main = readFile(handle, main, content);
	handle.requires[main.file] = main;
	searchRequir(handle, main.content, main.dir);
	handle.package = packRequires(handle.requires);
	return handle;
};
function searchRequir(handle, source, dir){
	var loader, requires, re, m, ab, params, data;
	loader = handle.loader;
	requires = handle.requires;
	re = /(\/\*)[\w\W]*?\*\/|(\/\/).*?(?:\n|$)|(["'`\/])|\b(from|require)\b\s*/g;
	while (m = re.exec(source)){
		if (m[1] || m[2]){
			continue;
		}
		if (m[3]){
			ab = SText.indexPair(source, m[3], m[3], m.index, true);
			re.lastIndex = ab[1]+1;
			continue;
		}
		if ((params = matchRequireParams(handle, source, re.lastIndex, dir)) && params.length){
			for (var item, i = 0; i < params.length; i++){
				item = params[i];
				if (/^["'`]/.test(item) && /\/|\\/.test(item)){
					if (data = findFile(handle, dir, item.slice(1, -1).trim())){
						if (!requires[data.file]){
							requires[data.file] = data;
							readFile(handle, data);
							searchRequir(handle, data.content, data.dir);
						}
						continue;
					}
				}
				handle.misss.push(item);
			}
		}
	}
};
function matchRequireParams(handle, source, index, dir){
	var ab, params;
	switch (source[index]){
		case '(':
			ab = SText.indexPair(source, '(', ')', index, true);
			if (ab && ab[0] == index){
				params = SText.split(source.slice(ab[0], ab[1]+1), ',', true);
			}
			break;
		case '"':case '\'':case '`':
			ab = SText.indexPair(source, source[index], source[index], index, true);
			if (ab && ab[0] == index){
				params = [source.slice(ab[0], ab[1]+1)];
			}
			break;
		default:
			return;
	}
	return params;
};
function findFile(handle, dir, file){
	var id, ext, data, exts, basename;
	id = file;
	file = Fp.resolve(dir, file);
	dir = Fp.dirName(file);
	ext = Fp.extName(file);
	data = {"id": id, "file": file, "dir": dir, "ext": ext && ext.substr(1)};
	if (Fp.isFile(file)){
		return data;
	}
	exts = handle.exts;
	if (exts && exts.length){
		basename = file.substr(0, file.length-ext.length);
		for (var ext, i = 0; i < exts.length; i++){
			ext = exts[i];
			if (Fp.isFile(basename+'.'+ext)){
				data.ext = ext;
				data.file = basename+'.'+ext;
				return data;
			}
		}
	}
};
function readFile(handle, data, content){
	var loader;
	if (!content){
		if ((loader = handle.loader) && loader[data.ext]){
			if (typeof loader[data.ext] == 'function'){
				content = loader[data.ext](data.file);
			}else {
				content = loader[data.ext];
			}
		}else {
			content = Fp.readFile(data.file);
		}
	}
	data.content = content;
	return data;
};
function packRequires(requires){
	var moduls;
	moduls = [];
	for (var i in requires){
		if (!requires.hasOwnProperty(i)) continue;
		var data = requires[i];
		moduls.push("[\n\""+(data.file)+"\",\nfunction(exports, require, module, __filename, __dirname){\n"+(data.content.replace(/^/mg, '\t'))+"\n}]");
	}
	return '('+modulePackTmp+')('+moduls.join(',\n')+');';
};
/**
 * 
 */
modulePackTmp = (function(main){
	var _module_ = typeof module != 'undefined' && module.constructor;
	var modul_cache = _module_ ? _module_._cache : {};
	function Module(file, fn){
		this.id = file;
		this.filename = file;
		this.dirname = driname(file);
		this.exports = {};
		this.loaded = false;
		this.parent = null;
		this.children = [];
		this.creater = fn;
	};
	Module.prototype.require = function(file){
		var modul;
		if (modul = findModule(this, file)){
			this.children.push(modul.id);
			return modul.loaded ? modul.exports : loadModule(modul, this, file);
		}
		if (_module_){
			this.children.push(file);
			return require(file);
		}
	};
	function makeRequire(modul){
		function _require(path){
			return modul.require(path);
		};
		_require.main = _module_ ? module.require.main : main;
		_require.resolve = function(path){return resolveFilename(modul.dirname, path)};
		return _require;
	};
	function findModule(modul, file){
		var ref;
		var id = resolveFilename(modul.dirname, file);
		for (var ref = ['', '.js', '/index.js'], ext, i = 0; i < ref.length; i++){
			ext = ref[i];
			if (modul_cache[id+ext]) return modul_cache[id+ext];
		}
	};
	function loadModule(modul, parent, file){
		modul.parent = parent;
		modul.creater(modul.exports, makeRequire(modul), modul, modul.filename, modul.dirname);
		modul.loaded = true;
		_module_ && (_module_._pathCache["{\"request\":\"'+modul.id+'\",\"paths\":[\"x\"]}"] = modul.id);
		return modul.exports;
	};
	function driname(file){
		return file.replace(/\/[^\/]*$/, '');
	};
	function resolveFilename(from, to){
		var m;
		if (/^(\~|\/)/.test(to))
			return to;
		if (from && from != '.')
			to = from+'/'+to;
		while (m = to.match(/\/[^\/]+?\/\.\.\/|\/\.\//)){
			to = to.substr(0, m.index)+to.substr(m.index+m[0].length-1);
		}
		return to;
	};
	for (var i = 1; i < arguments.length; i++){
		modul_cache[arguments[i][0]] = new Module(arguments[i][0], arguments[i][1]);
	}
	main = new Module(main[0], main[1]);
	if (typeof module != 'undefined'){
		main.__defineGetter__('exports', function(){
			return module.exports;
		});
		main.__defineSetter__('exports', function(value){
			return module.exports = value;
		});
	}
	loadModule(main);
}).toString();