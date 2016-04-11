if (typeof global == 'undefined'){
	if (typeof window == 'undefined'){
		throw 'Tea script run environment error!';
	}
	window.global = window;
}
global.SText = require("../utils/stext");
global.Jsop = require("../utils/jsop");
global.print = require("../utils/print");
global.Fp = require("../utils/fp");
global.isArray = Array.isArray;
global.isJson = Jsop.isJson;
global.isClass = Jsop.isClass;
global.ID = function(){
	!ID.index && (ID.index = 0);
	return parseInt((Date.now()+'').substr(-8)+(ID.index++)+Math.round(Math.random()*100))+'';
};
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
})();
module.exports = Tea;
global.Tea = Tea;