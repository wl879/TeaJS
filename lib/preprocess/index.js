var Source = require("./source.js"),
	PreProcessor = require("./preprocessor.js"),
	Template = require("./template.js");
exports.new = function(extend){
	var prepor = new PreProcessor();
	for (var i=0; i < arguments.length; i++){
		if (arguments[i]){
			prepor.extends(arguments[i]);
		}
	}
	return prepor;
};
exports.source = function(text, file, prepor){
	var src = Source.parse(text, file);
	prepor = exports.parse(src, prepor);
	src.preProcessor = prepor;
	return src;
};
exports.parse = function(src, prepor){
	if (prepor == null) prepor = new PreProcessor();
	prepor.parse(src);
	return prepor;
};
exports.parseByFile = function(file, prepor){
	var src = Source.parse(null, file);
	if (prepor == null) prepor = new PreProcessor();
	prepor.parse(src, true);
	return prepor;
};
exports.template = Template;