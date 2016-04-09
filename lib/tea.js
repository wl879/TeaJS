require("../utils");
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
		this.fileName = file;
		this.dirName = Fp.dirName(this.fileName);
		this.std = std || Argv['--std'] || 'es5';
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
		var std, dirname, main, list, requires;
		if (!this._cast){
			std = this.std;
			dirname = this.dirName;
			main = Tea.CAST(this.AST, std, this.prepor);
			this._cast = main;
			if (Argv['--concat'] && (list = main.scope.cache.require) && list.length){
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
			SText.writeFile(map.text, Fp.resolve(this.dirName, file), 'UTF-8');
		}
		return map;
	};
	Tea.prototype.output = function (file, map){
		var script;
		script = this.CAST.toScript();
		!file && (file = this.outfile);
		!map && (map = this.outmap);
		if (file){
			file = Fp.resolve(this.dirName, file);
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
	Tea.argv = Argv;
	Tea.filename = __filename;
	Tea.dirname = __dirname;
	Tea.prep = Preprocess;
	Tea.version = "0.2.00";
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
})();
module.exports = global.Tea = Tea;