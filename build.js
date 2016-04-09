#!/usr/bin/env node

var child_process, binVers, binIndex;
require("./bin/tea.js");
child_process = require('child_process');
binVers = [
	['test', './lib/index.js'],
	['beta', './bin/tea.js']
];
binIndex = 0;
function Exec(cmd, callback){
	child_process.exec(cmd, {"maxBuffer": 10000*1024}, function(err, stdout, stderr){
		if (err){
			print((err+'').replace(/^/mg, '|  # [err] '));
			console.log(stdout);
		}else {
			console.log(stdout);
		}
		if (callback){
			callback.call(this, err, stdout, stderr);
		}
	});
}
function Build(ver, succeed){
	print('# Tea '+ver[0]+' version: '+ver[2]);
	Exec(ver[2], function(err, stdout, stderr){
		if (err){
			print('# The '+ver[0]+' version build fail!!');
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
	var root = Fp.dirName(__filename), argv = process.argv.slice();
	while (argv[0] && Fp.baseName(argv[0]) != Fp.baseName(__filename)){
		argv.shift();
	}
	if (argv.length){
		argv.shift();
	}else {
		argv = process.argv.slice();
	}
	var tea_argv = '', succeed = null;
	switch (argv[0]){
		case 'install':
			// switch (argv[1]){
			// 	case 'subl':case 'shell':
			// 		console.log('w');
			// 		break;
			// }
			break;

		case 'lib':
			tea_argv += '-f '+argv[1]+' -p ./src -o ./lib/ -v';
			break;

		case 'util':
			tea_argv += '-f '+argv[1]+' -p ./src/utils -o ./utils/ -v';
			break;

		case 'packaging':
			Exec( 'node '+root+'/lib/index.js -f '+root+'/src/index.tea -o '+root+'/bin/tea.tmp.js -c -v', function(err){
				if(!err){
					console.log( 'Remove old : ./bin/tea.js > ./bin/tea.'+Tea.version+'.js');
					child_process.execSync('mv '+root+'/bin/tea.js '+root+'/bin/tea.'+Tea.version+'.js');
					child_process.execSync('mv '+root+'/bin/tea.tmp.js '+root+'/bin/tea.js');
				}
			});
			break;
		default:
			tea_argv += '-f '+argv[0]+' --debug';
			break;
	}
	if (tea_argv){
		Run(tea_argv+' '+argv.slice(1).join(' ').trim(), succeed);
	}
}