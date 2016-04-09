var Card;
Card = require("../../../core/card.js");
module.exports = function(node, params){
	var block, scope, cache, start, undefines;
	if (!node){
		return '';
	}
	block = this.read(node, true);
	block.type = 'Block';
	scope = node.scope;
	cache = scope.cache;
	start = 0;
	while (block[start] && /COMMENT/.test(block[start].type)){
		start += 1;
	}
	if (cache.head){
		block.insert(start, cache.head);
		cache.head = null;
	}
	if (!Argv['--safe']){
		undefines = Jsop.toArray(scope.undefines);
		if (undefines.length){
			block.insert(start, this.pattern('#CARD(var)', undefines));
		}
	}
	if (params && params.length){
		for (var insert, i = 0; i < params.length; i++){
			insert = params[i];
			if (/@|#/.test(insert)){
				block.add(this.pattern(insert, node));
			}else {
				block.add(insert);
			}
		}
	}
	if (cache.end){
		block.add(cache.end);
		cache.end = null;
	}
	if (node.type == 'BlockStam' && block.length > 1){
		block = new Card('BlockNode', '{', block, '}');
	}else if (node.type == 'Root'){
		block.type = 'Root';
	}
	return block;
};