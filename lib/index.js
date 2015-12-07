#!/usr/bin/env node
var ctx;
var Tea = require("./tea.js");
var ChildProcess = require("child_process");
if (!module.parent){
	tea.argv.parse(process.argv);
	if (tea.argv['--tab']){
		tea.tabSize(tea.argv['--tab']);
	}
	if (tea.argv['--help']){
		tea.argv.showHelp();
		tea.exit();
	}
	if (!tea.argv['--file'] && !tea.argv['--path'] && !tea.argv['--eval']){
		if (process.argv.length > 2){
			print('* g{Are you r{NongShaLei}!!}');
		}
		tea.argv.showHelp();
		tea.exit();
	}
	if (tea.argv['--define']){
		var define_file = tea.checkFile(tea.argv['--define']);
		if (!define_file){
			print('* g{Cant find define file as r{"'+tea.argv['--define']+'"}!!}');
			tea.exit();
		}
		tea.preprocess.setDefault(define_file);
	}
	if (tea.argv['--debug']){
		debug.enable(tea.argv['--debug'] === true ? 'all' : tea.argv['--debug']);
	}else if (tea.argv['--verbose']){
		debug.enable('log');
	}
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
		print('* r{The parse tokens}');
		console.log(print.toText(ctx.source).replace(/^/mg, '\t'));
		print('* r{The parse source}');
		console.log(print.border(ctx.source.join()).replace(/^/mg, '\t'));
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
		if (tea.argv['--map']){
			ctx.echo(tea.argv.out, tea.argv['--map']);
			if (debug.log){
				debug.log('* g{Output and source map to} : "'+tea.argv.out+'"');
			}
		}else {
			ctx.echo(tea.argv.out);
			if (debug.log){
				debug.log('* g{Output to} : "'+tea.argv.out+'"');
			}
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
		ChildProcess.exec(cmds.join(' '), {"maxBuffer": 50000*1024}, function(err, stdout, stderr){
			var out = stdout+''+stderr;
			console.log(out.replace(/^/mg, '  | '));
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