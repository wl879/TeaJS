var Card, Syntax, Token, Grammar, Standard, readFile, writeFile;
Card = require("../core/card.js");
Syntax = require("../core/syntax.js");
Token = require("../core/token.js");
Grammar = require("../core/grammar");
Standard = require("../core/standard");
readFile = SText.readFile;
writeFile = SText.writeFile;
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
};
module.exports.create = create;
function createScript(script, args, prepor){
	var temp;
	if (args == null) args = [];
	script = Tea.compile(script, prepor);
	temp = "(function("+(args.join(','))+"){var __output__  = '', echo = write;function write(){for(var i=0; i<arguments.length; i++)__output__ += arguments[i];}"+script+";return __output__;})";
	return eval(temp);
};
module.exports.createScript = createScript;
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
};
module.exports.runScript = runScript;
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
};
module.exports.concatModule = concatModule;
function createModuleTmp(){
	var tmp;
	tmp = "var Module = (function(){_cache = {};_main  = new Module();function Module(filename, dirname){this.id = filename;this.filename = filename;this.dirname = dirname;this.exports = {};this.loaded = false;this.children = [];this.parent = null;};Module.prototype.require = function(file){var id = resolve(this.dirname, file);var mod = _cache[id];if (!mod && !/\.js/.test(id)){if(mod = _cache[id+'.js'])id = id+'.js';}if (!mod){if(mod = _cache[id+'/index.js'])id = id+'/index.js';}if (mod){this.children.push(id);return mod.loaded ? mod.exports : mod.load(this);}if(typeof module != 'undefined'){this.children.push(file);return module.require(file);}};Module.prototype.load = function(parent){this.loaded = true;if(parent) this.parent = parent;this.creater();if(typeof module != 'undefined'){module.constructor._cache[this.id] = this;}return this.exports;};Module.prototype.register = function(creater){var id = this.id;if (!_cache[id]){_cache[id] = this;this.creater = creater;}};Module.makeRequire = function(_module){function require(path){return _module.require(path);};require.main = _main;require.resolve = function(path){return resolve(_module.dirname, path)};require.extensions = null;require.cache = null;return require;};Module.main = function(filename, dirname){_main.id = '.';_main.filename = filename;_main.dirname = dirname;if(typeof module != 'undefined'){_main.parent  = module.parent;_main.__defineGetter__('exports', function(){ return module.exports;});_main.__defineSetter__('exports', function(value){ return module.exports = value;});}return _main;};function resolve(from, to){if(/^(\\~|\\/)/.test(to)) return to;if (from && from != '.') to = from + '/' + to;var m = null;while( m = to.match(/\\/[^\\/]+?\\/\\.\\.\\/|\\/\\.\\//) ){to = to.substr(0, m.index) + to.substr(m.index+m[0].length-1);}return to;};return Module;})()";
	return new Card('Module', tmp);
};
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