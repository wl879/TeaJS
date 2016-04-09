module.exports = function(msg, loc){
	if (loc){
		msg += ' <60> '+loc.fileName+':'+loc.lineNumber;
	}
	print(msg.replace(/^/mg, '  '));
};