var argv, source_file, param, m, file_keys, target, test_map, temp;
require("../lib/tea.js");
argv = process.argv.slice();
while (argv[0] && Fp.baseName(argv[0]) != Fp.baseName(__filename)){
	argv.shift();
}
if (argv.length){
	argv.shift();
}else {
	argv = process.argv.slice();
}
source_file = {};
for (var i_ref = Fp.scanFile(__dirname+'/source'), i=0, file; i < i_ref.length; i++){
	file = i_ref[i];
	source_file[Fp.name(file)] = file;
}
if (argv[0]){
	param = argv[0];
	if (m = param.match(/src\/(\w+)\//)){
		file_keys = Object.keys(source_file);
		target = m[1];
		test_map = {'preprocess' : ['pre-p'],
			'string' : ['string'],
			'settings' : ['pre-p' || file_keys[Math.floor(Math.random()*1000)%file_keys.length]]};
		if (0 && test_map[target]){
			temp = {};
			for (var _i=0, name; _i < test_map[target].length; _i++){
				name = test_map[target][_i];
				temp[name] = source_file[name];
			}
			source_file = temp;
		}
	}else if (source_file[param]){
		temp = {};
		temp[param] = source_file[param];
		source_file = temp;
	}
}
source_file = {'require' : source_file['try']};
for (var name in source_file){
	if (!source_file.hasOwnProperty(name)) continue;
	var file = source_file[name];
	runTest(file);
}
function runTest(file, text){
	var ctx;
	print("<-->");
	console.log('[Test source file] '+file);
	ctx = Tea.context(file, text);
	print(ctx.source);
	// print '<-->'
	print(ctx.AST);
	// print ctx.CAST;
	print(ctx.scope);
	print.bd(ctx.output());
}