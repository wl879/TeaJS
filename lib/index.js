#!/usr/bin/env node
require("./tea.js");
if (!module.parent){
	(function(){
		var files, ctx;
		Tea.argv.parse(process.argv);
		if (Tea.argv['--help']){
			print(Tea.argv.help());
			Tea.exit();
		}
		if (Tea.argv['--tab']){
			Tea.tabsize(parseInt(Tea.argv['--tab']));
		}
		if (Tea.argv['--define']){
			files = resolvePath(Tea.argv['--define'], Tea.argv['--path']);
			if (!files){
				print('* <g:Cant find define file as <r:"'+Tea.argv['--define']+'":>!!:>');
				Tea.exit();
			}
			Tea.define('sugar', files);
		}
		if (Tea.argv['--eval'] && Tea.argv['--eval'].length){
			ctx = Tea.create(null, Tea.argv['--eval']);
			nextStep(ctx);
			return;
		}
		if (Tea.argv['--file'] || Tea.argv['--path']){
			checkDefine(Tea.argv['--path'] || Fp.dirName(Tea.argv['--file']));
			files = resolvePath(Tea.argv['--file'], Tea.argv['--path']);
			if (!files){
				print('* <g:Cant find file as <r:"'+Tea.argv['--file']+'":>!!:>');
				Tea.exit();
			}
			for (var file, i = 0; i < files.length; i++){
				file = files[i];
				ctx = Tea.create(file);
				nextStep(ctx);
			}
			return;
		}
		Tea.argv.pipe(function(chunk){
			if (!chunk){
				print('\n* Are you <g:NongShaLei??????:>\n');
				print(Tea.argv.help());
				Tea.exit();
			}
			ctx = Tea.create(null, chunk);
			nextStep(ctx);
			return;
		});
	})();
	function nextStep(ctx){
		var out;
		Tea.log('* <g:Load:>  : '+(ctx.fileName || 'by stdin'));
		if (Tea.argv['--token']){
			print(ctx.fileName);
			print(ctx.source);
		}
		if (Tea.argv['--ast']){
			print(ctx.fileName);
			print(ctx.nodeTree);
		}
		if (Tea.argv['--ast'] || Tea.argv['--token']){
			return;
		}
		if (Tea.argv['--out']){
			out = checkOut(Tea.argv['--out'], Tea.argv['--path'], ctx.fileName);
			ctx.output(out, Tea.argv['--map']);
			Tea.log('* <g:Output:>: '+out);
		}
		if (Tea.argv['--test']){
			runTest(ctx);
		}else if (!Tea.argv['--out']){
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
	function resolvePath(file, path, out){
		var files, file_list, temp;
		path = path && Fp.resolve(path);
		if (file){
			files = [];
			file_list = [];
			if (Array.isArray(file)){
				for (var i = 0; i < file.length; i++){
					file_list.push(Fp.resolve(path, file[i]));
				}
			}else {
				file_list.push(Fp.resolve(path, file));
			}
			for (var file, i = 0; i < file_list.length; i++){
				file = file_list[i];
				if (/[^\w\/]/.test(file) || Fp.isDir(file)){
					temp = Fp.checkFiles(file, null, ['.tea', 'index.tea']);
					files.push.apply(files, temp);
				}else if (Fp.isFile(file)){
					files.push(file);
				}else if (Fp.isFile(file+'.tea')){
					files.push(file+'.tea');
				}
			}
		}else if (path){
			files = Fp.scanFile(path, /\.tea/, 100);
		}
		for (var file, i = files.length - 1; i >= 0; i--){
			file = files[i];
			if (/(__define\.tea)$/.test(file)){
				files.splice(i, 1);
			}
		}
		return files.length && files;
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
		switch (Tea.argv['--std']){
			case 'es5':case 'es6':
			default:
				return '.js';
		}
	};
	function checkDefine(path){
		var file;
		file = Fp.join(Fp.resolve(path), '__define.tea');
		if (Fp.isFile(file)){
			Tea.define('sugar', file);
		}
	};
}