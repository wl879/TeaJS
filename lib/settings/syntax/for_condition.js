module.exports = function(heap, src, params){
	var ref, exp1, exp2, exp3, temp;
	ref = this.parse('ForCondition');
	if (Array.isArray(ref)){
		exp1 = ref[0], exp2 = ref[1], exp3 = ref[2];
	}else {
		exp1 = ref;
	}
	if (exp1 && !exp2 && !exp3){
		temp = exp1;
		do {
			if (temp.is('CompareExpr') && temp[1] && temp[1].isToken && ['<=', 'in', 'of', '...', '>', '<', '>='].indexOf(temp[1].text)>=0){
				exp2 = temp[1];
				exp3 = temp[2];
				if (temp == exp1){
					exp1 = temp[0];
				}else {
					temp[0].parent = temp.parent;
					temp.parent[temp.parent.length-1] = temp[0];
				}
				break;
			}
		} while (temp = temp[temp.length-1])
	}
	return this.node('ForConditionExpr', exp1, exp2, exp3);
};