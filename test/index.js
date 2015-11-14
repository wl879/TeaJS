require("../lib/tea.js");
var argv = process.argv.slice();
while (argv[0] && Path.basename(argv[0]) != Path.basename(__filename)){
	argv.shift();
}
if (argv.length){
	argv.shift();
}else {
	argv = process.argv.slice();
}
function start(file){
	var m,
		c_src,
		text = Text.readFile(file),
		ctx = tea.context({"file": file}),
		src = ctx.source,
		res = {},
		last = src.length,
		is_split = false,
		n = 0;
	for (var i=src.length-1; i >= 0; i--){
		if (src[i].type == 'CommDecl'){
			is_split = true;
			if (m = src[i].text.match(/\/\/\s*#:(\w+)?/)){
				c_src = src.clone(i+2, last);
				res[m[1] || n++] = {"title": src[i].text, "src": c_src, "ctx": tea.context({"source": c_src})};
				last = i-1;
			}
		}
	}
	res['all'] = {"src": src, "ctx": ctx, "title": file};
	return res;
}
try {
	switch (argv[0]){
		case 'tmp':
			var res = start(Path.resolve('./test/tmp/tmp.js'));
			break;
		case 'syntax':
			debug.enable('log+syntax');
			var res = start(Path.resolve('./test/tmp/source.js'));
			for (var i in res){
				if (!res.hasOwnProperty(i)) continue;
				var item = res[i];
				if (i == 'all'){
					continue;
				}
				print(item.title);
				print(item.src);
				print(item.ctx.ast);
				print(item.ctx.scope);
				console.log(item.ctx.rewriter.text);
				break;
			}
			break;
		case 'prepp':case 'token':
			debug.enable('log+prep');
			var res = start(Path.resolve('./test/tmp/prepp.js'));
			print(res.all.src);
			print('====');
			console.log(res.all.ctx.rewriter.text);
			break;
		case 'writer':
			debug.enable('log+write');
			// var ctx = tea.context({file:'./src/rewriter/reader.tea'});
			// // print ctx.ast;
			// print ctx.rewriter;
			debug.enable('log+syntax');
			var res = start(Path.resolve('./test/tmp/source.js'));
			for (var i in res){
				if (!res.hasOwnProperty(i)) continue;
				var item = res[i];
				if (i == 'all'){
					continue;
				}
				print(item.title);
				print.cellText(item.src.join(), item.ctx.rewriter.text, ' --> ');
				print(item.ctx.ast);
				// break;
			}
			break;
	}
}catch (e) {
	console.log(e.stack);
}