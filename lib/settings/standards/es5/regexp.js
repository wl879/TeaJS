module.exports = function(node, params){
	node.text = node.text.replace(/\n\s*/g, '');
	if (Tea.argv['--const']){
		return "#CONST";
	}
};