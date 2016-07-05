if (typeof global == 'undefined'){
	if (typeof window == 'undefined'){
		throw 'Tea script run environment error!';
	}
	window.global = window;
}
global.SText = require("./utils/stext");
global.Jsop = require("./utils/jsop");
global.print = require("./utils/print");
global.Fp = require("./utils/fp");
// global.TeaPack      = require "../utils/teapack";
var Helper = require("./helper");
var Argv = require("./utils/argv");
global.Tea = require("./core");
Tea.filename = __filename;
Tea.version = "0.2.1";
Tea.inNode = typeof process != 'undefined';
Tea.argv = Argv.create(null, "* <r:TeaJS:> version <g:0.2.1:>\n\
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
Tea.create = function(file, text, sugar_box, stdv){
	return new Tea(file, text, sugar_box, stdv);
};
Tea.compile = function(text, sugar_box, from, stdv){
	var ctx;
	ctx = new Tea(from, text, sugar_box, stdv);
	return ctx.output();
};
Tea.ID = function(){
	!Tea.ID.index && (Tea.ID.index = 0);
	return parseInt((Date.now()+'').substr(-8)+(Tea.ID.index++)+Math.round(Math.random()*100))+'';
};
Tea.log = function(){
	if (Tea.argv['--verbose']){
		Tea.log = Helper.log;
		Tea.log.apply(null, arguments);
	}
};
Tea.error = function(){
	arguments[arguments.length++] = new Error();
	throw Helper.error(arguments);
};
/**
 * 
 */
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
require("./settings");