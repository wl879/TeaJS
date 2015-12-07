#!/usr/bin/env node
var child_process, binVers, binIndex;
require("./lib/tools/utils.js");
require("./lib/tools/printer.js");
child_process = require('child_process');
binVers = [ ['lib', './lib/index.js'], ['beta', './bin/tea.js'], ['0.1.12', './bin/tea.v0.1.12.js']];
binIndex = 0;
function Exec(cmd, callback){
	child_process.exec(cmd, {"maxBuffer": 5000*1024}, function(err, stdout, stderr){
		if (err){
			print((err+'').replace(/^/mg, '|  # [err] '));
			console.log(stdout);
		}else {
			print('----');
			console.log(stdout);
		}
		if (callback){
			callback.call(this, err, stdout, stderr);
		}
	});
}
function Build(ver, succeed){
	print('# Tea g{'+ver[0]+'} version: '+ver[2]);
	Exec(ver[2], function(err, stdout, stderr){
		if (err){
			print('# The r{'+ver[0]+'} version build fail!!');
			print(stdout.replace(/^/mg, '|  # [v.'+ver[0]+'] '));
			print('----\n\n');
			if (binIndex < binVers.length){
				Build(binVers[++binIndex]);
			}
		}else {
			if (succeed){
				succeed(stdout);
			}
		}
	});
}
function Run(argv, succeed){
	for (var i=0, bin; i < binVers.length; i++){
		bin = binVers[i];
		bin[2] = 'node '+bin['1']+' '+argv;
	}
	binIndex = 0;
	Build(binVers[binIndex], succeed);
}
if (!module.parent){
	var root = Path.dirname(__filename), argv = process.argv.slice();
	while (argv[0] && Path.basename(argv[0]) != Path.basename(__filename)){
		argv.shift();
	}
	if (argv.length){
		argv.shift();
	}else {
		argv = process.argv.slice();
	}
	var tea_argv = '-d ./src/define.tea ', succeed = null;
	switch (argv[0]){
		case 'install':
			switch (argv[1]){
				case 'subl':case 'shell':
					console.log('w');
					break;
			}
			return;
		case 'lib':
			tea_argv += '-f '+argv[1]+' -p ./src -o ./lib/ -v';
			break;
		case 'bin':
			var ver_num = Math.floor((parseFloat(binVers[1][0])*100 || 0)+1)/100;
			tea_argv += ' -p ./src -v --clear ';
			if (argv[1]){
				tea_argv += '-f '+argv[1]+' -o ./bin/v'+ver_num+'/';
			}else {
				tea_argv += '-f '+root+'/src/index.tea --join -o ./bin/tea.v'+ver_num+'.js';
			}
			break;
		case 'test':
			tea_argv = null;
			Exec('node ./test/index.js '+argv[1]);
			break;
		default:
			tea_argv += '-f '+argv[0]+' --debug';
			break;
	}
	if (tea_argv){
		Run(tea_argv+' '+argv.slice(1).join(' ').trim(), succeed);
	}
}