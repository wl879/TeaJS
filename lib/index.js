#!/usr/bin/env node
var cmd_help;
require("./tea.js");
cmd_help = "* <r:TeaJS:> version <g:0.2.00:>\n\
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
... 自定义参数，用于预编译时判断与读取(使用Argv['--name']读取)";
if (!module.parent){
	(function(){
		var files, ctx;
		Argv.parse(process.argv, cmd_help);
		if (Argv['--help']){
			print(Argv.help());
			Tea.exit();
		}
		if (Argv['--tab']){
			Tea.tabsize(parseInt(Argv['--tab']));
		}
		if (Argv['--define']){
			files = checkPath(Argv['--define'], Argv['--path']);
			if (!files){
				print('* <g:Cant find define file as <r:"'+Argv['--define']+'":>!!:>');
				Tea.exit();
			}
			Tea.prep.load(files);
		}
		if (Argv['--eval'] && Argv['--eval'].length){
			ctx = Tea.context(null, Argv['--eval']);
			nextStep(ctx);
			return;
		}
		if (Argv['--file'] || Argv['--path']){
			checkDefine(Argv['--path'] || Fp.dirName(Argv['--file']));
			files = checkPath(Argv['--file'], Argv['--path']);
			for (var file, i = 0; i < files.length; i++){
				file = files[i];
				ctx = Tea.context(file);
				nextStep(ctx);
			}
			return;
		}
		Argv.pipe(function(chunk){
			if (!chunk){
				print('\n* Are you <g:NongShaLei??????:>\n');
				print(Argv.help());
				Tea.exit();
			}
			ctx = Tea.context(null, chunk);
			nextStep(ctx);
			return;
		});
	})();
	function nextStep(ctx){
		var out;
		Tea.log('* <g:Load:>  : '+(ctx.fileName || 'by stdin'));
		if (Argv['--token']){
			print(ctx.fileName);
			print(ctx.source);
		}
		if (Argv['--ast']){
			print(ctx.fileName);
			print(ctx.AST);
		}
		if (Argv['--ast'] || Argv['--token']){
			return;
		}
		if (Argv['--out']){
			out = checkOut(Argv['--out'], Argv['--path'], ctx.fileName);
			ctx.output(out, Argv['--map']);
			Tea.log('* <g:Output:>: '+out);
		}
		if (Argv['--test']){
			runTest(ctx);
		}else if (!Argv['--out']){
			console.log(ctx.output());
		}
	};
	function runTest(ctx, param){
		var child_process, out, cmds, temp_file;
		child_process = require("child_process");
		out = ctx.outfile;
		cmds = [];
		if (!out){
			temp_file = ctx.fileName.replace(/\.(js|tea)$/ig, '')+'.tmp.js';
			ctx.output(temp_file);
			cmds.push('node', temp_file);
		}else {
			cmds.push('node', out);
		}
		if (typeof param == 'string'){
			cmds = cmds.concat(param.split(' '));
		}
		Tea.log('* <r:Test:>  : '+cmds.join(' '));
		child_process.exec(cmds.join(' '), {"maxBuffer": 50000*1024}, function(err, stdout, stderr){
			var text;
			text = stdout+''+stderr;
			print(text.replace(/^/mg, '\t  | '));
			if (temp_file){
				child_process.execSync('rm -rf '+temp_file);
			}
			Tea.exit();
		});
	};
	function checkPath(file, path, out){
		var files, file_list, temp;
		if (path){
			path = Fp.resolve(path);
		}
		if (file){
			files = [];
			file_list = [];
			if (isArray(file)){
				for (var i = 0; i < file.length; i++){
					file_list.push(Fp.resolve(path, file[i]));
				}
			}else {
				file_list.push(Fp.resolve(path, file));
			}
			for (var file, i = 0; i < file_list.length; i++){
				file = file_list[i];
				if (/[^\w\/]/.test(file) || Fp.isDir(file)){
					temp = Fp.checkFiles(file, null, ['index.tea']);
					files.push.apply(files, temp);
				}else if (Fp.isFile(file)){
					files.push(file);
				}else if (Fp.isFile(file+'.tea')){
					files.push(file+'.tea');
				}
			}
		}else {
			files = Fp.scanFile(path, /\.tea/, 100);
		}
		for (var file, i = files.length - 1; i >= 0; i--){
			file = files[i];
			if (/(__define\.tea)$/.test(file)){
				files.splice(i, 1);
			}
		}
		return files;
	};
	function checkOut(out, path, file){
		out = Fp.resolve(out, true);
		if (Fp.isDir(out) || /\/$/.test(out)){
			if (path){
				out = Fp.join(out, Fp.relative(Fp.resolve(path), Fp.resolve(file)));
			}else {
				out = Fp.join(out, Fp.baseName(file));
			}
			out = out.replace(/\.tea$/, checkExt());
		}
		return out;
	};
	function checkExt(){
		switch (Argv['--std']){
			case 'es5':case 'es6':
			default:
				return '.js';
		}
	};
	function checkDefine(path){
		var file;
		file = Fp.join(Fp.resolve(path), '__define.tea');
		if (Fp.isFile(file)){
			Tea.prep.load(file);
		}
	};
}