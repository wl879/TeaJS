module.exports = function(heap, src, params){
	var node, comment, ref;
	node = this.node('Root');
	if (comment = this.parse('COMMENT')){
		src.next(1);
		if (comment.text[0] == '#'){
			node.add(comment);
		}
	}
	while (src.index < src.length){
		if (src.current.type == 'EOT'){
			break;
		}
		if (src.current.is('BREAK', 'BLANK', 'COMMENT', 'COMM')){
			src.next(1);
			continue;
		}
		if (ref = this.parse('Statement')){
			node.add(ref);
			src.next(1);
			continue;
		}
		return this.throw(1100, src.current);
	}
	return node;
};