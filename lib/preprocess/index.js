var Context = require("./context.js");
function context(argv, extend){
	return new Context(argv, extend);
};
function setDefault(){
	Context.defaultProcessor.apply(Context, arguments);
};
module.exports.context = context;
module.exports.setDefault = setDefault;