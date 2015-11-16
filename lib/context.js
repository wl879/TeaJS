var Prep = require("./preprocess"),
	Tokens = require("./tokens"),
	Syntax = require("./syntax"),
	ReWriter = require("./rewriter");
var Context = (function(){
	function Context(argv, extend){
		if (this.constructor != Context){
			return new Context(argv, extend);
		}
		this.argv = argv;
		this.preProcessor = Prep.new(def_pre_processor);
		if (extend){
			this.extends(argv && argv['preprocess'], extend);
		}
	}
	var def_pre_processor;
	Context.prototype.reinit = function (){
		this._source = null;
		this._ast = null;
		this._rewriter = null;
	}
	Context.prototype.extends = function (){
		for (var i=0, item; i < arguments.length; i++){
			item = arguments[i];
			if (item){
				this.preProcessor.extends(item.preProcessor || item);
			}
		}
		this.reinit();
	}
	Context.prototype.__defineGetter__("source", function(){
		if (!this._source){
			if (this.argv.source){
				this._source = this.argv.source;
			}else if (this.argv.text || this.argv.file){
				this._source = Prep.source(this.argv.text, this.argv.file, this.preProcessor);
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
			this._ast = Syntax.parse(this.source, this.preProcessor);
		}
		return this._ast;
	});
	Context.prototype.__defineGetter__("scope", function(){
		return this.ast.scope;
	});
	Context.prototype.__defineGetter__("rewriter", function(){
		if (!this._rewriter){
			this._rewriter = ReWriter.read(this.ast, this.preProcessor);
		}
		return this._rewriter;
	});
	Context.prototype.__defineGetter__("text", function(){
		return this.writer.text;
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
			this._rewriter = ReWriter.read(this.ast, this.preProcessor);
		}
		return this.scope.requires;
	});
	Context.prototype.echo = function (output, outmap){
		var sourcemap, shell_comm, requires, text;
		if (!output) output = this.argv && this.argv.out;
		if (outmap) sourcemap = this.sourcemap;
		if (this.requires.length){
			shell_comm = '';
			requires = loadRequiresList(this.requires, {});
			text = Prep.template.joinRequire(requires, this.rewriter);
			if (sourcemap){
				for (var _i=0, item; _i < requires.length; _i++){
					item = requires[_i];
					sourcemap.parse(item[2], item[1].source);
				}
			}
			text = text.replace(/\n\s*(\#\!.*\n)/g, function($0, $1){
				shell_comm = $1;
				return '\n';
			});
			text = shell_comm+text;
		}else {
			text = this.rewriter.toText();
		}
		if (sourcemap){
			if (!(typeof outmap == 'string')){
				outmap = output.replace(/\.\w+$/, '.map');
			}
			Text.writeFile(sourcemap.text, outmap);
			text += '\n//# sourceMappingURL='+Path.relative(Path.dirname(output), outmap);
		}
		Text.writeFile(text, output);
	}
	Context.defaultPreprocessor = function(){
		if (!def_pre_processor){
			def_pre_processor = new Prep.new();
		}
		for (var i=0, item; i < arguments.length; i++){
			item = arguments[i];
			if (item){
				if (typeof item == 'string'){
					def_pre_processor.extends(Prep.parseByFile(item));
				}else {
					def_pre_processor.extends(item);
				}
			}
		}
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