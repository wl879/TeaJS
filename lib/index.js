#!/usr/bin/env node
var help_text;
var Tea = require("./tea.js");
var ChildProcess = require("child_process");
help_text = "r{** g{Tea} w{script help} *************************************************************}\n\
  # parameter:\n\
    -f,--file  <file>                  输入文件\n\
    -p,--path  <project dir>           项目目录\n\
    -o,--out   <output>                输出文件 或 目标目录\n\
    -e,--eval  <tea script snippet>    编译一段 tea script 文本\n\
    -j,--join                          合并 require 文件\n\
    -h,--help                          显示帮助\n\
    -v,--verbose                       显示编译信息\n\
    -r,--run                           执行输入件\n\
    -d,--define                        宏定义文件\n\
    -s,--safe                          只编译，不会对变量自动声名等\n\
    --clear                            清理注释\n\
    --tab <number>                     设置 tab size\n\
    --token                            输出编译的 token 解析\n\
    --ast                              输出 ast 结构\n\
    --nopp                             不进行预编译\n\
    --debug                            显示调试信息 log/prep/syntax/write/all";
if (!module.parent){
	tea.argv.parse(process.argv, null, help_text, __filename);
	if (tea.argv['--tab']){
		tea.tabSize(tea.argv['--tab']);
	}
	if (tea.argv['--help']){
		tea.argv.showHelp();
		tea.exit();
	}
	if (!tea.argv['--file'] && !tea.argv['--path'] && !tea.argv['--eval']){
		print('* g{Are you r{NongShaLei}!!}');
		tea.argv.showHelp();
		tea.exit();
	}
	if (tea.argv['--define']){
		var define_file = tea.checkFile(tea.argv['--define']);
		if (!define_file){
			print('* g{Cant find define file as r{"'+tea.argv['--define']+'"}!!}');
			tea.exit();
		}
		tea.context.definePreProcessor(define_file);
	}
	if (tea.argv['--debug']){
		debug.enable(tea.argv['--debug'] === true ? 'all' : tea.argv['--debug']);
	}else if (tea.argv['--verbose']){
		debug.enable('log');
	}
	var ctx;
	if (tea.argv['--eval']){
		ctx = tea.context({"text": tea.argv['--eval'], "file": 'by tea eval cmd'});
	}else {
		if (tea.argv.file){
			if (debug.log){
				debug.log('* b{Compile:} d{"'+tea.argv.file+'"}');
			}
			ctx = tea.context(tea.argv);
		}else if (tea.argv.dir){
			if (debug.log){
				debug.log('* g{Building folder:} "'+tea.argv.dir+'"');
			}
			var file_list = Path.scanAllPath(tea.argv.dir, /\.js$|\.tea$/, 10).allfiles;
			if (file_list.length){
				for (var i=0, file; i < file_list.length; i++){
					file = file_list[i];
					if (debug.log){
						debug.log('  * b{Compile:} d{"'+file+'"}');
					}
					ctx = tea.context(tea.argv.copy({"file": file}));
					ctx.echo();
					if (debug.log){
						debug.log('  * g{Output to:} "'+ctx.argv.out+'"');
					}
				}
			}else {
				print("* r{The folder not find file!!}");
			}
			tea.exit();
		}else {
			print('"g{Cant find r{"'+tea.argv.file+'"} file}"');
			tea.exit();
		}
	}
	if (tea.argv['--token']){
		print('* r{The parse source}');
		console.log(print.border(ctx.sourceText).replace(/^/mg, '\t'));
		print('* r{The parse tokens}');
		console.log(print.toText(ctx.source).replace(/^/mg, '\t'));
	}
	if (tea.argv['--ast']){
		print('* r{The root node}');
		console.log(print.toText(ctx.ast).replace(/^/mg, '\t'));
		print('* r{The node space}');
		console.log(print.toText(ctx.scope).replace(/^/mg, '\t'));
	}
	if (tea.argv['--token'] || tea.argv['--ast']){
		tea.exit();
	}
	// --------------------------------------------------------
	if (tea.argv['--out']){
		ctx.echo(tea.argv.out);
		if (debug.log){
			debug.log('* g{Output to} : "'+tea.argv.out+'"');
		}
	}
	if (tea.argv['--test']){
		var cmds = [], cmd, temp_file;
		if (!tea.argv['--out']){
			temp_file = tea.argv.file.replace(/\.(js|tea)$/g, '')+'.tmp.js';
			ctx.echo(temp_file);
			cmds.push('node', temp_file);
		}else {
			cmds.push('node', tea.argv.out);
		}
		if (typeof ctx.argv['--test'] == 'string'){
			cmds = cmds.concat(tea.argv['--test'].split(' '));
		}
		print('** r{Test exec}: g{'+cmds.join(' '))+'}';
		ChildProcess.exec(cmds.join(' '), {"maxBuffer": 5000*1024}, function(err, stdout, stderr){
			var out = (stderr || stdout)+'';
			console.log(print.border(out).replace(/^/mg, '  '));
			if (temp_file){
				ChildProcess.execSync('rm -rf '+temp_file);
			}
			tea.exit();
		});
	}else {
		if (!tea.argv['--out']){
			console.log(ctx.rewriter.text);
		}
		tea.exit();
	}
}