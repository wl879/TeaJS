var Processor, Gatherer, Template, Source, bases;
Processor = require("./prepor");
Gatherer = require("./gatherer");
Template = require("./template.js");
Source = require("../core/source.js");
bases = new Processor();
function create(something){
	var prepor;
	prepor = new Processor();
	prepor.extend(bases);
	if (something){
		if (something.isSource){
			gather(something, prepor);
		}else {
			prepor.extend(something);
			prepor.parent = something;
		}
	}
	return prepor;
};
module.exports.create = create;
function gather(src, prepor){
	!prepor && (prepor = new Processor());
	for (var token, i = 0; i < src.length; i++){
		token = src[i];
		if (!token){
			continue;
		}
		if (Gatherer[token.type]){
			i = Gatherer[token.type](prepor, src, i) || i;
		}
	}
	src.refresh(0);
	return prepor;
};
module.exports.gather = gather;
function concatModule(main, list){
	return Template.concatModule(main, list);
};
module.exports.concatModule = concatModule;
function load(files){
	var src, prepor;
	if (typeof files == 'string'){
		files = [files];
	}
	for (var file, i = 0; i < files.length; i++){
		file = files[i];
		if (src = new Source(null, file)){
			if (prepor = gather(src)){
				extend(prepor);
			}
		}
	}
	return bases;
};
module.exports.load = load;
function extend(prepor){
	bases.extend(prepor);
	return bases;
};
module.exports.extend = extend;