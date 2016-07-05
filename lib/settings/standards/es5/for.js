module.exports = function(heap, node){
	var card, cond;
	card = this.card('ForStam');
	card.add(node[0]);
	cond = node[1];
	if (cond[1]){
		switch (cond[1].isToken && cond[1].text){
			case 'of':case 'in':
				card.add(parseForIn.call(this, heap, cond));
				break;
			case '->':case '=>':case '<=':case '<-':case '>':case '<':case '>=':
				card.add(parseForEach.call(this, heap, cond));
				break;
			case '...':
				card.add(parseForRange.call(this, heap, cond));
				break;
			default:
				card.add(this.transform('(@0; @1; @2)', cond));
				break;
		}
	}else {
		card.add(parseForRange.call(this, heap, cond));
	}
	card.add(this.transform(node[2]));
	return card;
};
function parseForIn(heap, node){
	var scope, $i, $temp, patt;
	scope = node.scope;
	$i = node[0][0];
	$temp = node[0][1];
	if (!$temp && node[1].text == 'of'){
		$temp = $i;
		$i = scope.createVariable('i', 'unknow');
	}else {
		if (node[0].type == 'InitPatt'){
			scope.define('unknow', $i, scope.createVariable($i || 'i', 'unknow', false));
			if ($temp){
				scope.define('unknow', $temp, scope.createVariable($temp, 'unknow', false));
			}
		}
	}
	heap.variable('i', $i);
	patt = '(var @i in #ref(@2, ref, up undefined))';
	patt += '#head("if (!@ref.hasOwnProperty(@i)) continue", LetScope)';
	if ($temp){
		heap.variable('temp', $temp);
		patt += '#head("var @temp = @ref[@i]", LetScope)';
	}
	return this.transform(patt, node);
};
function parseForEach(heap, node){
	var scope, $i, $temp, $oper, $target, $def, init, patt;
	scope = node.scope;
	$i = node[0][0];
	$temp = node[0][1];
	$oper = node[1].text;
	$target = node[2];
	if (!$temp && ($oper == '=>' || $oper == '<=')){
		$temp = $i;
		$i = scope.createVariable('i', 'unknow');
	}else {
		if ($i.type == 'AssignExpr'){
			$def = $i[2].text;
			$i = $i[0];
		}
		if (node[0].type == 'InitPatt'){
			if (!$def && scope.state($i)[0]){
				$def = scope.alias($i)[0] || $i.text;
			}
			scope.define('unknow', $i, scope.createVariable($i || 'i', 'unknow', false));
		}
	}
	init = [];
	heap.variable('i', $i);
	if ($target.is('Variable', 'NUMBER', 'STRING')){
		heap.variable('target', $target);
	}else {
		heap.variable('target', scope.createVariable('ref', 'unknow'));
		init.push('@target = #group(@[2])');
	}
	if ($temp){
		if (!$temp.is('Variable')){
			Tea.error(1022, $temp);
		}
		if (node[0].type == 'InitPatt'){
			scope.define('unknow', $temp, scope.createVariable($temp || 'temp', 'unknow', false));
		}
		heap.variable('temp', $temp);
		init.push('@temp');
	}
	switch ($oper){
		case '<=':case '<-':
			init.push('@i = '+($def || '@target.length-1'));
			patt = "(var "+(init.join(', '))+"; @i >= 0; @i--)";
			break;
		case '=>':case '->':
			init.push('@i = '+($def || '0'));
			patt = "(var "+(init.join(', '))+"; @i < @target.length; @i++)";
			break;
		case '<':case '>':case '>=':
			init.push('@i = '+($def || '0'));
			patt = "(var "+(init.join(', '))+"; @i @1 @target; @i++)";
			if ($temp){
				Tea.error(1022, $temp);
			}
			break;
		default:
			Tea.error(1022, node[1]);
			break;
	}
	if ($temp){
		patt += "#head(`@temp = @target[@i]`, LetScope )";
	}
	return this.transform(patt, node);
};
function parseForRange(heap, node){
	var scope;
	scope = node.scope;
	heap.variable('i', scope.createVariable('i', 'unknow'));
	if (node[1]){
		if (node[0][0].type == 'NUMBER' && node[2].type == 'NUMBER' && parseInt(node[0][0].text) > parseInt(node[2].text)){
			return this.transform("(var @i = @2; @i >= @0; @i--)", node);
		}
		return this.transform("(var @i = @0; @i <= @2; @i++)", node);
	}
	node = node[0][0];
	if (node.type == 'NUMBER'){
		return this.transform("(var @i = 0; @i < @; @i++)", node);
	}
	if (node.is('Variable')){
		return this.transform("(var @i = 0; @i < @.length; @i++)", node);
	}
	return this.transform("(var @i = 0, #ref(@, ref, let of for); @i < @ref.length; @i++)", node);
};