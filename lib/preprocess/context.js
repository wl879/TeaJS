var Context = (function(){
	var Processor = require("./processor.js");
	var Macro = require("./macro.js");
	var Sugar = require("./sugar.js");
	var DefPor, Syntax, Require, ReWriter;
	function Context(argv, extend){
		if (!Syntax) Syntax = require("../syntax");
		if (!Require) Require = require("./require");
		if (!ReWriter) ReWriter = require("../rewriter");
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