module.exports = function(heap, node, params){
	node.text = node.text.replace(/\n\s*/g, '');
};