exports['#include'] = function(prepor, src, index){
	var token, a, b, dir, files, ab, list;
	token = src[index];
	a = index;
	b = src.nextIndex(a);
	dir = Fp.dirName(src[a].fileName);
	files = [];
	while (src[b].is("QUOTE")){
		ab = src.indexPair(src[b].text, src[b].text, b);
		if (ab[0] = b){
			files.push(src.join(ab[0], ab[1]));
			b = src.nextIndex(ab[1], true);
			if (src[b].text == ','){
				b = src.nextIndex(b, true);
				continue;
			}else {
				b = ab[1];
			}
		}
		break;
	}
	src.delete(a, b);
	for (var path, i = files.length - 1; i >= 0; i--){
		path = files[i];
		list = Fp.checkFiles(path, dir, ['index.tea', 'index.js']);
		if (list.error){
			throw Error.create(2001, list.error.path, src[index], new Error());
		}
		for (var file, j = list.length - 1; j >= 0; j--){
			file = list[j];
			src.insert(a, SText.readFile(file));
			src.insert(a, token.clone('/* Include '+Fp.relative(dir, file)+' */', ['COMMENT']));
			// debug log
			Tea.log('#Include     : '+file, token.location);
		}
	}
};