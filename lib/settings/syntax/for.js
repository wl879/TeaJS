var Syntax;
Syntax = require("../../core/syntax.js");
var patt = "(; → | var∅ Argus@=VarPatt | let∅ Argus@=LetPatt | Argus@:InitPatt)\n            (;∅ (;→ | Comma) ;∆1022∅ Comma? | [in of -> => <- <= ...] Comma ) |\n            CommaExpr (... Comma)?";
module.exports = function(src, params){
	var start_index, ref, exp1, exp2, exp3, temp;
	start_index = src.index;
	if (src.current.text == '('){
		if (!src.get(src.nextIndex(src.indexPair('(', ')', start_index)[1], true)).is('JOINT')){
			ref = matchCondition(this, this.next(src, 1));
			if (this.next(src, 1).current.text != ')'){
				throw Error.create(1023, src.current, new Error());
			}
		}
	}
	if (!ref){
		ref = matchCondition(this, src);
	}
	exp1 = ref[0], exp2 = ref[1], exp3 = ref[2];
	if (exp1 && !exp2 && !exp3){
		temp = exp1;
		do {
			if (temp.is('CompareExpr') && temp[1] && temp[1].isToken && ['<=', 'in', 'of', '...'].indexOf(temp[1].text)>=0){
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
	return new Syntax('ForCondition', exp1, exp2, exp3);
};
function matchCondition(grammar, src){
	var ref;
	if (!(ref = grammar.pattern(patt, src))){
		throw Error.create(1022, src.current, new Error());
	}
	return ref;
};