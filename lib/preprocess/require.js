var Context = require("./context.js");
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