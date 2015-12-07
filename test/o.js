#!/usr/bin/env node
(function (){
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
	Module.register('/Users/wl/Sites/TeaJS/test/tmp/prepp.js', 'tmp/prepp.js', function(exports, require, module, __filename, __dirname){
		var a = new RegExp('a'+'$'),
			TEA_HELP = "**** g{Tea} script help *************************************\n\
  # parameter:\n\
  -f,--file  <file>                  输入文件\n\
  -p,--path  <file dir>              项目目录\n\
  -o,--out   <out file>              输出文件 或 目标目录\n\
  -e,--eval  <tea script snippet>    编译一段 tea script 文本\n\
  -j,--join                          合并 require 文件\n\
  -h,--help                          显示帮助\n\
  -v,--verbose                       显示编译信息\n\
  -r,--run                           执行输入件\n\
  -d,--define                        宏定义文件\n\
  -s,--safe                          只编译，不会对变量自动声名等\n\
  --tab <number>                     设置 tab size\n\
  --token                            输出编译的 token 解析\n\
  --ast                              输出 ast 结构\n\
  --nopp                             不进行预编译\n\
  --debug                            显示调试信息 log/prep/syntax/write/all";
		// test token
		// eeee
		// test who is sb xiaoming, lili = who is sb(xiaoming, lili);
		console.log((xiaoming, lili));
		// test argv
		// test run
		console.log('This is Android os');
		//test include
		/* Include file "/Users/wl/Sites/TeaJS/test/tmp/include.js" */
		inlcude(okkkkk);
		// test dfine macro
		/*
		----
		*/
		// console.log('PI =='+PI)
		console.log('3.14 ==', 3.14);
		console.log('#PI ==', 3.14);
		console.log('"\#{PI}" == 3.14');
		// console.log('DEG((4*100)) =='+DEG((4*100)));
		console.log('DEG((4*100)) ==', 4*100*180/3.14);
		// console.log('ABC 1, 2, 3 == '+ABC 1, 2, 3);
		console.log('ABC 1, 2, 3 == ', (1+2+3));
		// test undef
		console.log('DEG(5) ==', DEG(5));
		// test control
		console.log('the file is '+"./test/test_require.tea");
		// test line
		console.log('the line number is '+95);
		console.log('end');
	});
})();

require("tmp/prepp.js");
console.log('ok');