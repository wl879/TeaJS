require("./tools/utils.js");
global.tab_size = '    ';
global.tea = module.exports;
tea.teapath = Path.dirname(__filename);
tea.argv = require("./argv.js");
tea.helper = require("./helper.js");
tea.error = require('./error.js');
tea.preprocess = require("./preprocess");
tea.syntax = require("./syntax");
tea.rewriter = require('./rewriter');
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
// tea.different = function(text1, text2):
// var s1 = new Source(text1, 'Dfiferent text one('+ID()+')'),
// 	s2 = new Source(text2, 'Dfiferent text two('+ID()+')');
// s1 = Hash.slice(s1).filter( (l) => l.type != 'BLANK' && l.type != 'LF');
// s2 = Hash.slice(s2).filter( (l) => l.type != 'BLANK' && l.type != 'LF');
// for i -> s1:
// 	if s1[i].text != s2[i].text:
// 		var info = (s1[i] && @.errorPot(s1[i]))
// 					+'\n****\n'+
// 				   (s2[i] && @.errorPot(s2[i]));
// 		return '[Text compare]\n'+print.border(info).replace(/^/mg, '  ');
// return false;
var RunTimeAtLoaded = Date.now();