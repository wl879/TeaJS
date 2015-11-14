var Writer = require("./writer.js");
var Reader = (function(){
	function Reader(preprocessor){
		if (this.constructor != Reader){
			return new Reader(preprocessor);
		}
		this.preProcessor = preprocessor;
	}
	var pattern_cache = {}, pattern_map = {};
	Reader.prototype.new = function (type){
		var write = new Writer(this, type);
		if (arguments.length > 1){
			write.read.apply(write, Hash.slice(arguments, 1));
		}
		return write;
	}
	Reader.prototype.read = function (node, do_each){
		var stx_ptn;
		if (!node){
			return;
		}
		if (!node.istoken && !node.isnode){
			return node;
		}
		var res;
		if (!do_each && pattern_map.hasOwnProperty(node.type)){
			res = pattern_map[node.type];
		}else if (!do_each && Reader.prototype.hasOwnProperty(node.type)){
			var write = this.new(node.type), res = this[node.type](node, write) || write;
		}else if (!do_each && this.preProcessor && (stx_ptn = this.preProcessor.get(node.type, 'statement', 'expression'))){
			res = stx_ptn.read(this, node);
		}else if (node.isnode){
			var write = this.new(node.type);
			for (var i=0, item; i < node.length; i++){
				item = node[i];
				write.read(item);
			}
			return write;
		}else if (node.istoken){
			res = node;
		}
		if (res){
			if (typeof res == 'string'){
				return this.patt(res, node);
			}else if (res.isnode){
				return this.read(res, true);
			}
			return res;
		}
	}
	Reader.prototype.patt = function (patt_str, node, write){
		var res, patt = getPattern(patt_str, node);
		if (!patt){
			return;
		}
		if (!write) write = this.new(patt.name || node.type);
		var patt_list = patt.list;
		for (var i=0, chip; i < patt_list.length; i++){
			chip = patt_list[i];
			if (chip.ispattern){
				if (res = parsePatternAccessor.call(this, chip, node)){
					if (res.type == write.type){
						for (var j=0; j < res.length; j++){
							write.read(res[j]);
						}
					}else {
						write.read(res);
					}
				}else if (res === null && typeof patt_list[i-1] == 'string'){
					Array.prototype.pop.call(write);
				}
			}else if (chip){
				write.read(chip);
			}
		}
		return write;
	}
	Reader.define = function(map){
		for (var name in map){
			if (!map.hasOwnProperty(name)) continue;
			var ptn = map[name];
			Reader.compilePattern(ptn);
			for (var _i_ref = name.split(' '), _i=0, n; _i < _i_ref.length; _i++){
				n = _i_ref[_i];
				pattern_map[n] = ptn;
			}
		}
	};
	Reader.compilePattern = function(source){
		var m;
		if (pattern_cache[source]){
			return pattern_cache[source];
		}
		var chips = source.replace(/ ?\| ?/g, '|').split('|'), patt = [];
		for (var i=0, chip; i < chips.length; i++){
			chip = chips[i];
			var ptn = {"condition": '', "list": [], "name": '', "source": chip};
			if (m = chip.match(/^\(\:(\w+)\)\ ?/)){
				ptn.name = m[1];
				chip = chip.substr(m[0].length);
			}
			if (m = chip.match(/^\(\?(.*?)\)\ ?/)){
				ptn.condition = compilePatternCondition(m[1]);
				chip = chip.substr(m[0].length);
			}
			while (m = chip.match(/\b([A-Z]\w+[A-Z]\w+)\(#(\d+(?:\.\d+)*)?\)|#(\d+(?:\.\d+)*)?/)){
				ptn.list.push(chip.slice(0, m.index));
				ptn.list.push(compilePatternAccessor(m, ptn.source));
				chip = chip.substr(m.index+m[0].length);
			}
			if (chip){
				ptn.list.push(chip);
			}
			patt.push(ptn);
		}
		return pattern_cache[source] = patt;
	};
	function compilePatternCondition(text){
		var m, list = [];
		while (m = text.match(/^\ *#(\d+(?:\.\d+)*)? (is|eq) (.*?)(\&\&|\|\||$)/)){
			list.push({"fn": m[2],
				"indexs": m[1] && m[1].split('.'),
				"param": m[3].trim().split(','),
				"logic": m[4]});
			if (m[4]){
				text = text.substr(m[0].length);
				continue;
			}
			break;
		}
		return list;
	}
	function compilePatternAccessor(match, source){
		var fn, index, param;
		if (fn = match[1]){
			index = match[2];
		}else {
			index = match[3];
		}
		if (index){
			index = index.split('.');
		}
		return {"fn": fn, "indexs": index, "param": param, "ispattern": true, "source": source};
	}
	function getPattern(key, node){
		var item, patt = Reader.compilePattern(key);
		for (var i=0; i < patt.length; i++){
			if (!patt[i].condition){
				return patt[i];
			}
			var conds = patt[i].condition;
			for (var j=0, cond; j < conds.length; j++){
				cond = conds[j];
				item = getNodeItem(node, cond.indexs, true);
				if (item && item[cond.fn].apply(item, cond.param)){
					if (cond.logic != '&&'){
						return patt[i];
					}
				}else if (cond.logic != '||'){
					break;
				}
			}
		}
	}
	function getNodeItem(node, indexs, strict){
		var item = node;
		if (indexs){
			for (var _i=0, i; _i < indexs.length; _i++){
				i = indexs[_i];
				if (item[i]){
					item = item[i];
				}else {
					if (strict){
						return null;
					}
					break;
				}
			}
			if (item == node || !item){
				return null;
			}
		}
		return item;
	}
	function parsePatternAccessor(patt, node){
		var item = getNodeItem(node, patt.indexs);
		if (!item){
			return null;
		}
		var write;
		if (!patt.fn){
			write = item.istoken || item.isnode ? this.read(item, node == item) : item;
		}else if (this[patt.fn]){
			if (/^[A-Z]+$/.test(patt.fn)){
				write = item.isnode || item.istoken ? this.read(item, node == item) : item;
				this[patt.fn](write);
			}else {
				write = this.new(patt.name || patt.fn);
				var res = this[patt.fn](item, write);
				if (typeof res == 'string'){
					this.patt(res, item, write);
				}
			}
		}else {
			throw tea.error(new Error(), 'writer patt has undefined function', [patt.source, -1, patt.fn]);
		}
		return write;
	}
	return Reader;
})();
Reader.define({'CommaExpr CommaStam ArgumentsDecl' : 'COMMA(#)',
	'ArgumentsExpr CompelExpr ConditionStam' : '\(COMMA(#)\)',
	'ParamsStam ParamsExpr' : '\(ParamsPatt(#)\)',
	'ArrayExpr' : '\[COMMA(#)\]',
	'JsonExpr' : '\{COMMA(#)\}',
	'PrefixExpr PostfixExpr' : '#0#1',
	'ReturnStam BreakStam ContinueStam ThrowStam' : '#0 #1',
	'DotExpr' : '.#0',
	'DebuggerStam' : '#0',
	'FunctionDecl' : '#0 #1#2#3',
	'FunctionExpr' : '#0#1#2',
	'ExportDecl' : '#1',
	'IfPatt' : '#0 #1#2',
	'ElseIfPatt' : '#0 if #1#2',
	'ElsePatt' : '#0 #1',
	'WhileStam' : '#0 #1#2',
	'WithStam' : '#0 #1#2',
	'TryPatt' : '#0 #1',
	'CatchPatt' : '#0 #1 #2',
	'FinallyPatt' : '#0 #1',
	'ThisExpr' : 'this#1',
	'LabelStam' : '#0#1 #2',
	'ForBaseConditionPatt' : '(#0; #1; #2)',
	'ForInConditionPatt' : '(#0 #1 #2)',
	'UnaryExpr' : '(? #0 eq +) Math.abs(#1) | (? #0 is SymbolTokn) #0#1 | #0 #1',
	'NotExpr' : '(? #1 is ValueExpr) !#0 | !(#1)',
	'TernaryExpr' : '(? #2 is ExprStam && #4 is ExprStam) #0 #1 #2 #3 #4 | if (#0) #2; else #4',
	'LambdaExpr' : '(? #1 is ReturnStam) function#0{#1} | function#0{return #1}',
	'Root' : 'NodeStam(#0)',
	'BlockStam IndentBlockStam LineBlockStam StamBlockStam' : '{NodeStam(#)}'});
Reader.prototype.TestPatt = function(node, __write){
	if (tea.argv['--test']){
		__write.add(node);
	}
};
Reader.prototype.CommDecl = function(node, __write){
	if (!tea.argv['--clear'] || node.text[0] == '#'){
		__write.add(node);
	}
};
Reader.prototype.IdentifierExpr = function(node, __write){
	var let_name, id = node[0], scope = node.scope;
	if (let_name = scope.getLet(id.text)){
		id.text = let_name;
	}else if (this.class_scope){
		switch (scope.isDefined(id.text)){
			case 'static':case 'unknow':
				if (this.class_scope.variables[id.text] == 'static'){
					id.text = this.class_scope.name+'.'+id.text;
				}
				break;
		}
	}
	__write.read(id);
};
Reader.prototype.ComputeExpr = function(node, __write){
	var list = [];
	for (var i=0; i < node.length; i++){
		switch (node[i].istoken && node[i].text){
			case '**':
				list.push('Math.pow(', list.pop(), ', ', node[++i], ')');
				break;
			case '\\':
				list.push('Math.floor(', list.pop(), '/', node[++i], ')');
				break;
			default:
				list.push(node[i]);
				break;
		}
	}
	__write.read(list);
};
Reader.prototype.CompareExpr = function(node, __write){
	var list = [];
	if (node.length == 5 && node[3].eq('<', '>', '>=', '<=')){
		return '#0 #1 #2 && #2 #3 #4';
	}
	for (var i=0; i < node.length; i++){
		switch (i%2 && node[i].text){
			case 'as':
				if (node[i+1].type == 'StringTokn'){
					list.push('typeof ', list.pop(), ' == ', node[++i]);
				}else {
					list.push(' instanceof ', node[++i]);
				}
				break;
			case 'in':
				if (node[i+1].type == 'ArrayExpr'){
					list.push(node[++i], '.indexOf(', list.pop(), ')>=0');
				}else {
					list.push(node[++i], '.hasOwnProperty(', list.pop(), ')');
				}
				break;
			case 'of':
				list.push('[].indexOf.call(', node[++i], ', ', list.pop(), ')>=0');
				break;
			case 'is':
				node[i].text = ' === ';
				list.push(node[i]);
				break;
			case 'not is':
				node[i].text = ' !== ';
				list.push(node[i]);
				break;
			default:
				if (i%2){
					node[i].text = ' '+node[i].text+' ';
				}
				list.push(node[i]);
				break;
		}
	}
	__write.read(list);
};
Reader.prototype.LogicExpr = function(node, __write){
	var i;
	for (i = 1; i < node.length; i += 2){
		switch (node[i].text){
			case 'and':
				node[i].text = '&&';
				break;
			case 'or':
				node[i].text = '||';
				break;
		}
	}
	if (node.length == 3){
		if (node[2].is('ExprStam')){
			return '#0 #1 #2';
		}
		if (node.parent.is('NodeStam')){
			if (node[1].text == '||'){
				if (node[0].is('ValueExpr')){
					return 'if (!#0) #2';
				}
				return 'if (!(#0)) #2';
			}
			return 'if (#0) #2';
		}
		return '#0 #1 (#2)';
	}
	__write.read(this.JOIN(Hash.slice(node), ' '));
};
Reader.prototype['Ternary2.5Expr'] = function(node, __write){
	if (node.parent.is('NodeStam')){
		return 'if (#0) #2';
	}else {
		if (!node[0].is('ValueExpr')){
			var ref = AllocateRefName(node.scope);
			return '(('+ref+' = #0) != null ? '+ref+' : #2)';
		}
	}
	return '(#0 != null ? #0 : #2)';
};
Reader.prototype.SeleteStam = function(node, __write){
	switch (node[1].text){
		case 'if':case '<-':
			return 'if (#2) #0';
		case 'or':case '||':
			if (node[0].is('ValueExpr')){
				return 'if (!#0) #2';
			}
			return 'if (!(#0)) #2';
		default:
			return 'if (#0) #2';
	}
};
Reader.prototype.AssignmentExpr = function(node, __write){
	var left = node[0], right = node[2];
	if (left.type == 'ArrayPatt'){
		return AssignmentArrayPatt.call(this, __write, left, right, node);
	}else if (left.type == 'AccessorPatt' && left[left.length-1].type == 'SlicePatt'){
		return AssignmentSlicePatt.call(this, __write, left, right, node);
	}else if (node.parent.type == 'ArgumentsExpr'){
		return left;
	}else {
		switch (node[1].text){
			case '?=':
				if (node.parent && node.parent.is('NodeStam')){
					return 'if (#0 == null) #0 = #2';
				}
				return '(#0 == null && (#0 = #2))';
			case '|=':
				if (node.parent && node.parent.is('NodeStam')){
					return 'if (!#0) #0 = #2';
				}
				return '(!#0 && (#0 = #2))';
		}
	}
	if (node.parent.type == 'JsonExpr'){
		if (node[0].is('IdentifierTokn')){
			return '"#0"#1 #2';
		}
	}
	return '#0 #1 #2';
};
Reader.prototype.AssignmentDecl = Reader.prototype.AssignmentExpr;
Reader.prototype.ParamsPatt = function(node, __write){
	for (var i=0, item; i < node.length; i++){
		item = node[i];
		if (item.istoken && item.text == ','){
			__write.add('null');
		}else {
			__write.read(item);
		}
	}
	this.COMMA(__write);
};
Reader.prototype.SlicePatt = function(node, __write){
	var ab = AccessorSlicePatt.call(this, node);
	if (!ab[1]){
		__write.read('.slice(', ab[0] || '', ')');
	}else {
		__write.read('.slice(', ab[0] || '0', ', ', ab[1], ')');
	}
};
Reader.prototype.MemberExpr = function(node, __write){
	if (node[0].type == 'UnaryExpr' && node[0][0].text == '-'){
		var parent = node.parent.clone();
		parent.length = node.index;
		if (parent){
			__write.read('[#0.length#1]', [parent, node[0]]);
		}
	}else {
		__write.read('[', node[0], ']');
	}
};
Reader.prototype.MemberPatt = function(node, __write){
	switch (node[0].text){
		case '::':
			node[0].text = '.prototype';
			break;
		case '..':
			node[0].text = '.constructor';
			break;
	}
	return '#0.#1';
};
Reader.prototype.LetDecl = function(node, __write){
	node[0].text = 'var';
	ResetDefineVariableDecl(node[1], node.scope, 'let', 'let_');
	return '#0 #1';
};
Reader.prototype.VarDecl = function(node, __write){
	ResetDefineVariableDecl(node[1], node.scope, 'defined');
	return '#0 #1';
};
Reader.prototype.DoWhileStam = function(node, __write){
	if (node[2]){
		return '#0 #1 #2 #3';
	}else {
		return '#0{NodeStam(#1)break;} while (true)';
	}
};
Reader.prototype.TryStam = function(node, __write){
	if (node.length > 1){
		return '#';
	}else {
		return '# catch (_e){}';
	}
};
Reader.prototype.SwitchStam = function(node, __write){
	var block = node[2],
		block_body = this.new('NodeStam'),
		exp_cache = [],
		case_write,
		sub_block;
	for (var _i=0, item; _i < block.length; _i++){
		item = block[_i];
		if (!case_write) case_write = this.new(item.type);
		if (item.type == 'CaseStam'){
			for (var _j=0, key; _j < item[1].length; _j++){
				key = item[1][_j];
				case_write.read(item[0], ' ', key, ':');
			}
			sub_block = item[3];
		}else {
			case_write.read(item[0], ':');
			sub_block = item[2];
		}
		if (sub_block){
			var sub_write = this.SwitchCaseBlock(sub_block, this.new('NodeStam'));
			block_body.read(case_write.read(sub_write));
			case_write = null, sub_block = null;
		}
	}
	__write.read(node[0], ' ', node[1], this.new(block.type, '{', block_body, '}'));
};
Reader.prototype.SwitchCaseBlock = function(node, __write){
	var last = node.length-1;
	while (node[last] && node[last].is('CommDecl')){
		last -= 1;
	}
	var insert_break = true;
	if (node[last] && node[last].is('ReturnStam', 'BreakStam', 'ContinueStam')){
		if (node[last].type == 'ContinueStam'){
			node[last] = null;
		}
		insert_break = false;
	}
	this.NodeStam(node, __write);
	if (insert_break){
		__write.read('\nbreak;');
	}
	return __write;
};
Reader.prototype.forCondition = function(node, __write){
	var scope = node.scope,
		exp1 = node[0],
		exp2 = node[1],
		exp3 = node[2],
		$mark = exp2 && exp2.text || '->',
		$var,
		$i,
		$i_text,
		$def,
		$temp,
		$len,
		$tar,
		$tar_exp;
	if (exp1.type == 'VarDecl'){
		$var = true, exp1 = exp1[1];
	}
	if (!exp3){
		exp3 = exp1, exp1 = null;
	}
	if (exp1){
		switch (exp1.type){
			case 'CommaExpr':case 'ArgumentsDecl':
				$i = exp1[0], $temp = exp1[1];
				break;
			default:
				$i = exp1;
				break;
		}
	}
	if ($i){
		if ($i.type == 'AssignmentDecl' || $i.type == 'AssignmentExpr'){
			$def = $i[2], $i = $i[0];
		}else if ($i.type == 'ConstTokn'){
			$def = $i, $i = null;
		}
		if ($i){
			if ($i.type == 'IdentifierExpr'){
				$i = $i[0];
			}
			if ($i.type != 'IdentifierTokn'){
				tea.throw('for condition(3) statiment syntax error!', $i);
			}
			if (/\=|of/.test($mark)){
				$temp = $i, $i = null;
			}
		}
	}
	if (!$i){
		$var = true, $i = AllocateVarName(scope);
	}
	$i_text = $i.text || $i;
	var def_type = scope.isDefined($i_text);
	$var = $var || !def_type || def_type == 'let';
	if (exp3.type == 'CommaExpr' && exp3.length == 1){
		exp3 = exp3[0];
	}
	switch (exp3.is('ArrayExpr', 'JsonExpr', 'AccessorExpr', 'IdentifierExpr', 'AtExpr', 'NumTokn')){
		case 'AccessorExpr':case 'IdentifierExpr':case 'AtExpr':
			$tar = exp3;
			break;
		case 'NumTokn':
			$len = this.new('NumTokn').read(exp3);
			break;
		default:
			$tar = $i_text+'_ref';
			$tar_exp = this.new('AssignmentExpr').read($tar, ' = ', exp3);
			break;
	}
	$len = $len || this.new('AssignmentExpr').read($tar, '.length');
	$tar = this.new('IdentifierExpr').read($tar);
	$i = this.new('IdentifierExpr').read($i);
	return [$mark, $var, $i, $def, $temp, $len, $tar, $tar_exp];
};
Reader.prototype.ForStam = function(node, __write){
	var block_body, condition = node[1];
	if (condition.type == 'ForBaseConditionPatt'){
		// condition.type == 'ForInConditionPatt':
		return '#0 #1#2';
	}
	var scope = node.scope,
		_ref = this.forCondition(condition), $mark = _ref[0], $var = _ref[1], $i = _ref[2], $def = _ref[3], $temp = _ref[4], $len = _ref[5], $tar = _ref[6], $tar_exp = _ref[7];
	scope.setLet('__length', $len.text);
	scope.setLet('__index', $i.text);
	scope.setLet('__target', $tar.text);
	var cond_body = this.new('ConditionBody');
	block_body = this.new('NodeStam');
	if (/in|of/.test($mark)){
		cond_body.read($var ? 'var ' : '', $i, ' in ', $tar);
		if ($tar_exp){
			__write.read(this.VAR($tar_exp), ';\n');
		}
		block_body.add(this.new('IfStam', 'if (!#0.hasOwnProperty(#1)) continue;\n', [$tar, $i]));
		if ($temp){
			block_body.add(this.new('AssignmentExpr', 'var #0 = #1[#2];\n', [$temp, $tar, $i]));
		}
	}else {
		if ($mark[0] == '<'){
			if ($def = $def || [$tar, '.length-1']){
				$def = [$i, '=', $def];
			}
			cond_body.read('#0; #1 >= #2; #1--', [this.VAR($tar_exp, $def, $temp), $i, '0']);
		}else {
			if ($def = $def || $var && '0'){
				$def = [$i, '=', $def];
			}
			cond_body.read('#0; #1 < #2; #1++', [this.VAR($tar_exp, $def, $temp), $i, $len]);
		}
		if ($temp){
			block_body.add(this.new('AssignmentExpr', '#0 = #1[#2];\n', [$temp, $tar, $i]));
		}
	}
	this.NodeStam(node[2], block_body);
	__write.add(node[0], ' ', this.new('ForConditionPatt', '(', cond_body, ')'), this.new(node[2].type, '{', block_body, '}'));
};
Reader.prototype.PackageExpr = function(node, __write){
	if (node.length == 2){
		return '(function()#1)()';
	}
	var params = this.new('ParamsExpr'),
		argus = this.new('ArgumentsExpr'),
		has_ass = false;
	if (node[1].length){
		ResetDefineVariableDecl(node[1], node.scope, 'argument');
		for (var i=0, item; i < node[1].length; i++){
			item = node[1][i];
			if (item.type == 'AssignmentDecl'){
				has_ass = true;
				argus.read(item[0]);
				params.read(item[2]);
			}else {
				argus.read('_'+i);
				params.read(item);
			}
		}
	}
	__write.read('(function(#0)#1)(#2)', [this.COMMA(argus), node[2], this.COMMA(params)]);
};
/*******************************************/
Reader.prototype.ClassExpr = function(node, __write){
	var _i = 1, scope = node.scope, name, extend, block, is_ass = false;
	if (node[_i].type == 'IdentifierTokn'){
		name = node[_i++];
	}
	if (node[_i].type == 'ExtendsExpr'){
		extend = node[_i++];
	}
	if (!name){
		if (node.parent.type == 'AssignmentDecl'){
			is_ass = true;
			name = node.parent[0];
		}else if (node.parent.type == 'AssignmentExpr'){
			is_ass = true;
			name = node.parent[0][0];
		}
	}
	if (!name){
		throw tea.error(new Error(), 321, node[0]);
	}
	scope.name = name.text;
	block = node[_i];
	var old_scope = this.class_scope;
	this.class_scope = scope;
	var block_write = this.new('NodeStam');
	this.NodeStam(block, block_write);
	if (extend){
		block_write.insert(0, this.ExtendsExpr(extend));
	}
	var construct_write = this.new('ConstructorStam'),
		construct_body = this.new('NodeStam');
	if (scope.inits.length){
		construct_body.read(scope.inits);
	}
	if (scope.construct){
		this.NodeStam(scope.construct[2], construct_body);
		construct_write.read('function #0#1{#2}\n', [name, scope.construct[1], construct_body]);
	}else {
		construct_write.read('function #0(){#1}\n', [name, construct_body]);
	}
	block_write.insert(0, construct_write);
	block_write.read('\nreturn #0;', [name]);
	if (is_ass){
		__write.read('(function(){#0})()', [block_write]);
	}else {
		__write.read('var #1 = (function(){#0})()', [block_write, name]);
	}
	this.class_scope = old_scope;
};
Reader.prototype.ExtendsExpr = function(node, __write){
	if (!__write) __write = this.new('ExtendsExpr');
	var scope = node.scope, name = scope.name, list = node[1];
	__write.read('#0.prototype = new #1();\n#0.prototype.constructor = #0;\n#0.prototype.__super__ = #1.prototype;\n', [name, list[0]]);
	if (list.length > 1){
		__write.read('#0.__extends = function(){\n    for (var i=0; i<arguments.length; i++){\n        var _super = arguments[i].prototype;\n        for (var name in _super)\n            if (_super[name].hasOwnProperty(name))\n                this.prototype[name] = _super[name];\n    }\n};\n#0.__extends(COMMA(#1));\n', [name, Hash.slice(list, 1)]);
	}
	return __write;
};
Reader.prototype.SuperExpr = function(node, __write){
	var acc = node[0], pam = node[1], supe = acc[0];
	supe.text = 'this.__super__';
	if (acc.length == 1){
		supe.text += '.'+(node.scope.name || 'constructor');
	}
	if (pam){
		var pam_write = this.read(pam);
		pam_write[1].insert(0, 'this', ', ');
		__write.read(acc, '.call', pam_write);
	}else {
		return '#0.call(this, arguments)';
	}
};
Reader.prototype.AtExpr = function(node, __write){
	var scope = node.scope;
	if (scope.type == 'ClassExpr'){
		node[0].text = scope.name;
	}else {
		scope = scope.queryParent('ClassExpr');
		if (scope && ClassStaticAtSymbol(scope, node)){
			node[0].text = scope.name;
		}else {
			node[0].text = 'this';
		}
	}
	return '#';
};
Reader.prototype.SetterDecl = function(node, __write){
	if (node.parent.type == 'JsonExpr'){
		return '#0 #1#2#3';
	}
	var class_scope = node.scope.parent;
	if (class_scope.type == 'ClassExpr'){
		var type = node.type == 'SetterDecl' ? '__defineSetter__' : '__defineGetter__';
		if (node.length < 4){
			__write.read('#0.prototype.'+type+'("#1", function()#2)', [class_scope.name, node[1], node[2]]);
		}else {
			__write.read('#0.prototype.'+type+'("#1", function#2#3)', [class_scope.name, node[1], node[2], node[3]]);
		}
	}
};
Reader.prototype.GetterDecl = Reader.prototype.SetterDecl;
Reader.prototype.MethodDecl = function(node, __write){
	if (node.parent.type == 'JsonExpr'){
		return '"#0": function#1#2';
	}
	var scope = node.scope, class_scope = scope.parent;
	switch (class_scope.type){
		case 'ClassExpr':
			var class_name = class_scope.name;
			if (scope.name == 'constructor'){
				class_scope.construct = node;
				return '';
			}else {
				__write.read('#0.prototype.#1 = function #2#3', [class_name, node[0], node[1], node[2]]);
			}
			break;
		default:
			return 'function #0#1#2';
	}
};
Reader.prototype.StaticDecl = function(node, __write){
	var class_scope = node.scope;
	if (class_scope.type != 'ClassExpr'){
		class_scope = class_scope.parent;
	}
	var exp = node[1];
	if (exp.type == 'ArgumentsDecl'){
		for (var i=0, item; i < exp.length; i++){
			item = exp[i];
			if (item.type == 'AssignmentDecl'){
				__write.read('#0.#1 #2 #3;', [class_scope.name, item[0], item[1], item[2]]);
			}else {
				__write.read('#0.#1 = null;', [class_scope.name, item]);
			}
			if (i < exp.length-1){
				__write.add('\n');
			}
		}
	}else {
		__write.read('#0.#1 = function#2#3;', [class_scope.name, exp[0], exp[1], exp[2]]);
	}
};
Reader.prototype.ProtoDecl = function(node, __write){
	var class_scope = node.scope.queryParent('ClassExpr');
	if (!class_scope){
		throw tea.error(new Error(), 325, node[0]);
	}
	var exp = node[1], class_name = class_scope.name;
	if (exp.type == 'ArgumentsDecl'){
		for (var i=0, item; i < exp.length; i++){
			item = exp[i];
			if (item.type == 'AssignmentDecl'){
				__write.read('#0.prototype.#1 #2 #3;', [class_name, item[0], item[1], item[2]]);
			}else {
				__write.read('#0.prototype.#1 = null;', [class_name, item]);
			}
			if (i < exp.length-1){
				__write.add('\n');
			}
		}
	}else {
		__write.read('#0.prototype.#1 = function#2#3;', [class_name, exp[0], exp[1], exp[2]]);
	}
};
Reader.prototype.InitDecl = function(node, __write){
	var class_scope = node.scope;
	if (class_scope.type != 'ClassExpr'){
		throw tea.error(new Error(), 326, node[0]);
	}
	var exp = node[1], write = this.new('InitDecl');
	if (exp.type == 'ArgumentsDecl'){
		for (var i=0, item; i < exp.length; i++){
			item = exp[i];
			if (item.type == 'AssignmentDecl'){
				write.read('this.#0 #1 #2;\n', item);
			}else {
				write.read('this.# = null;\n', item);
			}
		}
	}else {
		write.read('this.#0 = function#1#2;\n', exp);
	}
	class_scope.inits.push(write);
	return '';
};
/*******************************************/
Reader.prototype.RequireStam = function(node, __write){
	var format,
		type,
		write,
		_format,
		argv = tea.argv || {},
		root_scope = argv['--join'] ? node.scope.root : null,
		params = ParseRequireFile(node[1], root_scope);
	if (params.length > 1){
		if (node.parent.is('AssignmentDecl', 'AssignmentExpr')){
			if (node.parent[0].type == 'ArrayExpr'){
				format = '#0(#1)';
				type = 'arr';
				write = this.new('ArrayExpr');
			}else {
				format = '"#2": #0(#1)';
				type = 'json';
				write = this.new('JsonExpr');
			}
		}else {
			format = 'var #2 = #0(#1)';
			type = 'var';
			write = this.new('VarExpr');
		}
	}else {
		write = __write;
		format = '#0(#1)';
	}
	for (var i=0; i < params.length; i++){
		_format = params[i].name ? format : '#0(#1)';
		if (params[i].file && root_scope){
			write.read(this.new('RequireExpr', _format, ['__require', '"'+root_scope.joinRequire(params[i].file)+'"', params[i].name]));
		}else {
			write.read(this.new('RequireExpr', _format, [node[0], params[i].expr, params[i].name]));
		}
	}
	switch (type){
		case 'var':
			__write.read(this.JOIN(write, ';\n'));
			break;
		case 'json':
			__write.read('{', this.JOIN(write, ', '), '}');
			break;
		case 'arr':
			__write.read('[', this.JOIN(write, ', '), ']');
			break;
	}
};
Reader.prototype.NodeStam = function(node, __write){
	var res;
	if (!__write) __write = this.new('NodeStam');
	var len = node.length-1;
	for (var i=0, item; i < node.length; i++){
		item = node[i];
		res = this.read(item);
		if (res && (res.istoken || res.length)){
			__write.add(res);
			if (item.type != 'CommDecl' && (item.is('AssignmentExpr', 'ClausesStam', 'CommaStam') || !/(\}|;)$/.test(res.lastText))){
				__write.add(';');
			}
			if (i < len){
				__write.add('\n');
			}
		}
	}
	NodeStamUnDefined.call(this, node, __write);
	return __write;
};
Reader.prototype.COMMA = function(write){
	return this.JOIN(write, ',');
};
Reader.prototype.JOIN = function(write, separator){
	if (separator == null) separator = ' ';
	for (var i = write.length-1; i >= 1; i--){
		Array.prototype.splice.call(write, i, 0, separator);
	}
	return write;
};
Reader.prototype.VAR = function(){
	var list = [];
	for (var i=0; i < arguments.length; i++){
		if (arguments[i]){
			list.push(this.read(arguments[i]));
		}
	}
	if (list.length){
		this.COMMA(list);
		var write = this.new('VarDecl', 'var #0', [list]);
		return write;
	}
};
function NodeStamUnDefined(node, __write){
	var argv = tea.argv || {}, scope = node.scope, a = 0;
	while (__write[a] && (__write[a].type == 'CommDecl' || __write[a] == '\n')){
		a += 1;
	}
	if (!argv['--safe']){
		var un_defineds = scope.get('undefined');
		if (un_defineds && un_defineds.length){
			__write.insert(a, this.VAR.apply(this, un_defineds), ';\n');
		}
	}
	var argus = scope.argumentsDefine;
	if (argus && argus.length){
		var write = this.new('ArgumentsStam');
		for (var i=0; i < argus.length; i++){
			write.read('if (#0 == null) #0 #1 #2;\n', argus[i]);
		}
		__write.insert(0, write);
	}
	var exts = scope.exports;
	if (exts && exts.length){
		var write = this.new('ExportStam');
		for (var i=0; i < exts.length; i++){
			write.add('\nmodule.exports.'+exts[i]+' = '+exts[i]+';');
		}
		__write.add(write);
	}
	// if !node.parent.is('ScopeNode'):
	// 	var lets = scope.get('let');
	// 	if lets && lets.length:		
	// 		for i in lets:
	// 			lets[i] = scope.lets[lets[i]] || lets[i];
	// 		var write = @.new('DeleteLetStam').read(lets, 'undefined');
	// 		__write.read('\n', @.JOIN(write, ' = '), ';');
}
function AssignmentSlicePatt(__write, left, right, node){
	left.length -= 1;
	if (left[left.length].length == 0){
		__write.read('#0.push(#1)', [left, right]);
	}else {
		var ab = AccessorSlicePatt.call(this, left[left.length], true);
		__write.read('#0.splice.apply(#0, [#1, #2].concat(#3))', [left, ab[0], ab[1], right]);
	}
}
function AssignmentArrayPatt(__write, left, right, node){
	if (right.type == 'ArrayExpr'){
		for (var i=0; i < left.length; i++){
			if (i > 0){
				__write.add(', ');
			}
			if (right[i]){
				__write.read('#0 #1 #2', [left[i], node[1], right[i]]);
			}else {
				throw tea.error(new Error(), 'array pattern assignment declaration syntax error', right[i-1]);
			}
		}
	}else {
		var ref = AllocateRefName(node.scope);
		if (node.parent.parent.type == 'VarDecl'){
			node.scope.set('defined', ref, true);
		}
		__write.read('#0 = #1', [ref, right]);
		for (var i=0; i < left.length; i++){
			__write.read(', #0 #1 #2[#3]', [left[i], node[1], ref, i+'']);
		}
	}
}
function AccessorSlicePatt(node, count_b){
	var a, b;
	if (node.length == 3){
		a = node[0], b = node[2];
	}else if (node.length == 2){
		if (node[0].text == ':'){
			a = 0, b = node[1];
		}else {
			a = node[0], b = 0;
		}
	}else if (node.length >= 1){
		a = 0, b = 0;
	}
	if (count_b){
		var parent = node.parent, write = this.new('AccessorExpr');
		if (b){
			write.type = 'ComputeExpr';
			if (b[0] && b[0].text == '-'){
				write.read(parent, '.length', b);
			}else {
				write.read(b, '-', a);
			}
			b = write;
		}else {
			b = write.read(parent, '.length');
		}
	}
	return [a, b];
}
function ResetDefineVariableDecl(decl_list, scope, type, prefix){
	for (var i=0, left; i < decl_list.length; i++){
		left = decl_list[i];
		if (left.type == 'AssignmentDecl'){
			left = left[0];
		}
		if (left.type == 'ArrayPatt'){
			for (var _i=0, item; _i < left.length; _i++){
				item = left[_i];
				item.text = ResetDefine(scope, type, item.text, prefix);
			}
		}else if (left.istoken){
			left.text = ResetDefine(scope, type, left.text, prefix);
		}else {
			decl_list[i] = ResetDefine(scope, type, decl_list[i], prefix);
		}
	}
}
function ResetDefine(scope, type, name, prefix){
	scope.set(type, name, true);
	if (prefix){
		if (type == 'let'){
			scope.lets[name] = prefix+name;
		}
		return prefix+name;
	}
	return name;
}
function AllocateVarName(scope){
	var keymap = 'ijklmnopqrstuvwxyz';
	for (var i=0; i < keymap.length; i++){
		if (!scope.isDefined('_'+keymap[i])){
			var key = '_'+keymap[i];
			scope.set('let', key);
			return key;
		}
	}
	return '__i';
}
function AllocateRefName(scope){
	var i = 0, name = '_ref', stat = scope.isDefined(name, null, 1);
	while (true){
		if (!stat || stat == 'let'){
			scope.set('undefined', name);
			return name;
		}
		name += i++;
		stat = scope.isDefined(name, null, 1);
	}
}
function ClassStaticAtSymbol(clas_scope, node){
	if (clas_scope.type = 'ClassExpr'){
		if (node.length > 1 && node[1].type == 'DotExpr'){
			var member = node[1][0];
			if (member.type == 'IdentifierTokn' && clas_scope.statics.indexOf(member.text) != -1){
				var name = member.text;
				if (clas_scope.protos.indexOf(name) == -1){
					return name;
				}
			}
		}
	}
	return false;
}
function ParseRequireFile(node, join){
	var list = [], tar_dir = node.root.filePath || '';
	// console.log(node.root.fileName, tea.countOutput(node.root.fileName));
	for (var i=0, item; i < node.length; i++){
		item = node[i];
		if (item.is('StringTokn')){
			if (join && Path.isPathText(item.text)){
				var files = Path.parseFile(item.text, tar_dir, ['.js', '.tea']);
				if (!files.error){
					if (files.length == 1){
						list.push({"name": RequireModuleName(file), "expr": item, "file": files[0]});
						continue;
					}
					for (var _i=0, file; _i < files.length; _i++){
						file = files[_i];
						list.push({"name": RequireModuleName(file),
							"expr": item.clone('"'+file+'"'),
							"file": file});
					}
					continue;
				}
				if (debug.log){
					debug.log('** [Require: Can not join file: '+item.text+']');
				}
			}
			list.push({"name": RequireModuleName(item.text), "expr": item, "file": ''});
		}else {
			list.push({"name": '', "expr": item, "file": ''});
		}
	}
	return list;
}
function RequireModuleName(file){
	// if Path.isFile(file):
	// 	var text = Text.readFile(file),
	// 		m = text.match(/exports\s*=(\s*[\w\$][\w\$\d]*)/g);
	// 	if m:
	// 		return m[1];
	return Text.getName(file);
}
module.exports = Reader;