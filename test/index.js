var argv, source_file, ref, param, m, file_keys, target, test_map, temp;
require("../lib/tea.js");
Tea.argv['--verbose'] = true;
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
for (var ref = Fp.scanFile(__dirname+'/source'), file, i = 0; i < ref.length; i++){
	file = ref[i];
	if (/\.tea/.test(file)){
		source_file[Fp.name(file)] = file;
	}
}
if (argv[0]){
	param = argv[0];
	if (m = param.match(/src\/(\w+(\/\w+)*)\//)){
		file_keys = Object.keys(source_file);
		target = m[1];
		test_map = {
			'core/grammar': ['pre-p'],
			'preprocess/gatherer': ['pre-p'],
			'preprocess/prepor': ['pre-p'],
			'preprocess': ['pre-p'],
			'string': ['string'],
			'settings': ['pre-p' || file_keys[Math.floor(Math.random()*1000)%file_keys.length]]};
		if (test_map[target]){
			temp = {};
			for (var name, i = 0; i < test_map[target].length; i++){
				name = test_map[target][i];
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
for (var name in source_file){
	if (!source_file.hasOwnProperty(name)) continue;
	var file = source_file[name];
	runTest(file);
}
// runTest(source_file['try'])
function runTest(file, text){
	var ctx;
	print("<-->");
	console.log('[Test source file] '+file);
	ctx = Tea.context(file, text);
	print(ctx.source);
	print(ctx.AST);
	// print ctx.CAST;
	print.bd(ctx.output());
};