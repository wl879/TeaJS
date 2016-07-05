module.exports = function(heap, node, params){
	var result;
	result = this.transform('#head#body#foot', node);
	return result;
};