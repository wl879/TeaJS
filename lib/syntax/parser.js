var Parser = module.exports,
	Node = require("./node.js"),
	SyntaxReg = require("./regexp.js");
Parser.define = function(name, pattern, callback){
	var m;
	if (typeof pattern == 'string'){
		var stx_re = SyntaxReg.compile(pattern), rule = null;
		if (m = name.match(/(\w+):([\-\w]+)/)){
			name = m[1];
			switch (m[2]){
				case '1':
					rule = 'ret node';
					break;
				case '2':
					rule = 'check empty';
					break;
				case '3':
					rule = 'ret list';
					break;
				case '4':
					rule = 'not check';
					break;
				default:
					rule = m[2];
					break;
			}
		}
		Parser[name] = function(src, param){
			var res = SyntaxReg.matchNode(name, stx_re, src, rule);
			if (res && callback){
				return callback(res, src, param);
			}
			return res;
		};
	}else {
		Parser[name] = function(src, param){
			var res = pattern(rc);
			if (res && callback){
				return callback(res, src, param);
			}
			return res;
		};
	}
};
Parser.define('NameExpr', 'is(IdentifierTokn Restricted)');
Parser.define('ConstPatt', '(:UnaryExpr [+|-] NumTokn) | ConstTokn');
Parser.define('UnaryExpr', '(:NotExpr not ExprStam) | (:PrefixExpr is(Prefix) ValuePatt) | (:UnaryExpr is(Unary) ValuePatt)');
Parser.define('JsonPatt\:4', 'eq?(get set) +1is?(IdentifierTokn Restricted) (eq?(set) SetterDecl | GetterDecl){err:301} | '+'is?(IdentifierTokn Restricted) +1eq(\\\() MethodDecl{err:302} | '+'(:AssignmentExpr is(IdentifierTokn NumTokn StringTokn) : ExprStam{err:203})');
Parser.define('JsonExpr\:1', '(?\{) ((?\}) | JsonPatt ((?\,)? JsonPatt)* (?\,)* (?\}{err:102}))');
// Parser.define('ArrayExpr\:1',          '(?\[) CommaPatt? (?\]{err:101})');
Parser.define('ArrayExpr\:1', '(?\[) ((?\]) | ExprStam ((?\,)? ExprStam)* (?\,)* (?\]{err:101}))');
Parser.define('CompelExpr\:1', '(?\\\() CommaExpr{err:214} (?\\\))');
Parser.define('IdentifierExpr\:1', 'IdentifierTokn');
Parser.define('SlicePatt\:2', '(?\[) ( (?\]) | (ComputeExpr? : ComputeExpr? | (:MemberExpr CommaPatt) )? (?\]{err:104}) )');
Parser.define('DotExpr\:1', '(?\.) (NameExpr | (:MemberExpr ConstPatt)){err:201}');
Parser.define('MemberExpr', 'DotExpr | SlicePatt | (:MemberPatt eq?(!.) is(Member) is(IdentifierTokn Restricted)?)');
Parser.define('AccessorExpr', '(Expression() | DataPatt) (is?(Member) MemberExpr)*');
Parser.define('SuperExpr\:1', '(:AccessorExpr super (is?(Member) MemberExpr)*) ParamsExpr?');
Parser.define('ThisExpr\:1', 'this (is?(Member) MemberExpr)*');
Parser.define('AtExpr\:1', '@ (:DotExpr NameExpr)? (is?(Member) MemberExpr)*');
Parser.define('ParamsPatt\:4', '(LambdaExpr | ExprStam) (, (?=\,|\\\)))*');
Parser.define('ParamsExpr\:1', '(?\\\() ((?\\\)) | ,* ParamsPatt ((?\,) ParamsPatt)* (?\\\)){err:105})');
Parser.define('ParamsStam', 'eq?(\\\() ParamsExpr | --1is(BlankTokn !LineHead) is?(!Close !Contextual !BlockBreak !Controler !Clauses) (:ParamsStam ParamsPatt ((?\,) ParamsPatt)*)');
Parser.define('ArgumentsPatt\:3', 'AssignmentDecl ((?\,) AssignmentDecl)*');
Parser.define('ArgumentsExpr\:1', '(?\\\() ArgumentsPatt? (?\\\))');
Parser.define('ArgumentsDecl\:1', 'ArgumentsPatt');
Parser.define('ValueExpr', 'is?(Unary Prefix) UnaryExpr | (::PostfixExpr ValuePatt is(Postfix)?)');
Parser.define('ComputeExpr', 'ValueExpr (is(Compute) ValueExpr)*');
Parser.define('CompareExpr', 'ComputeExpr (is(Compare) ComputeExpr)*');
Parser.define('LogicRightPatt\:4', 'CompareExpr (:::AssignmentExpr is(Assign) (eq?(\\\() LambdaExpr|ExprStam) )?');
Parser.define('LogicExpr', 'CompareExpr (is(Logic) LogicRightPatt)*');
Parser.define('ArrayPatt\:1', '(?\[) IdentifierTokn ((?,) IdentifierTokn)* (?\])');
Parser.define('AssignmentDecl', 'IdentifierTokn ( = (LambdaExpr|ExprStam){err:204})? | eq?(\[) ArrayPatt ={err:315} ExprStam{err:315}');
Parser.define('AssignmentExpr', '(eq?(\[) ArrayPatt | ValueExpr) is(Assign) (eq?(\\\() LambdaExpr|ExprStam){err:208}');
Parser.define('BinaryExpr', 'AssignmentExpr | LogicExpr');
Parser.define('TernaryExpr', 'LogicExpr ((:::Ternary2.5Expr ? (Clauses()|ExprStam)) (:::TernaryExpr : (Clauses()|ExprStam))?)?');
// Expression
Parser.define('LambdaExpr', 'ArgumentsExpr (?->) (ReturnStam|ExprStam)');
Parser.define('CommaPatt\:4', 'ExprStam ((?\,) ExprStam{err:205})*');
Parser.define('CommaExpr\:1', 'CommaPatt');
Parser.define('CommaStam', 'ExprStam ((?\,) ExprStam{err:205})*');
Parser.define('ExprStam\:4', 'Declaration() | AssignmentExpr | TernaryExpr');
// Declaration
Parser.define('FunctionExpr', 'function (:::FunctionDecl IdentifierTokn)? ArgumentsExpr Block()');
Parser.define('FunctionDecl', 'function IdentifierTokn ArgumentsExpr Block()');
Parser.define('PackageExpr', 'package ArgumentsExpr? Block()');
Parser.define('ExtendsExpr\:2', 'extends ParamsStam{err:314}');
Parser.define('ClassExpr\:1', 'class IdentifierTokn? ExtendsExpr? Block(classStatement)');
// class Declaration
Parser.define('GetterDecl', 'get NameExpr ArgumentsExpr? Block()');
Parser.define('SetterDecl', 'set NameExpr ArgumentsExpr Block()');
Parser.define('StaticDecl', 'static (MethodDecl | ArgumentsDecl)');
Parser.define('MethodDecl', 'NameExpr ArgumentsExpr eq?({ :) Block(){err:402}');
Parser.define('ProtoDecl', '(?\*) proto (MethodDecl | ArgumentsDecl)');
Parser.define('InitDecl', '(?\*) init (MethodDecl | ArgumentsDecl)');
// Clauses
Parser.define('VarDecl\:1', 'var ArgumentsDecl{err:306}');
Parser.define('LetDecl\:1', 'let ArgumentsDecl{err:307}');
Parser.define('ConstDecl\:1', 'const ArgumentsDecl{err:308}');
Parser.define('ReturnStam\:1', 'return{lf} CommaExpr?');
Parser.define('BreakStam\:1', 'break{lf} IdentifierTokn?');
Parser.define('ContinueStam\:1', 'continue{lf} IdentifierTokn?');
Parser.define('ThrowStam\:1', 'throw{lf} CommaExpr?');
Parser.define('DebuggerStam\:1', 'debugger');
Parser.define('ExportDecl\:1', 'export (eq?(class) ClassExpr | FunctionDecl | MethodDecl | ArgumentsDecl){err:109}');
Parser.define('RequireStam\:1', 'require ParamsStam');
Parser.define('CallExpr', 'AccessorExpr ParamsStam');
// Controler
Parser.define('ConditionStam\:CompelExpr', 'CommaPatt{err:311}');
Parser.define('IfStam\:1', 'IfPatt ElseIfPatt*');
Parser.define('DoWhileStam\:1', 'do Block(controlStatement){err:306} (while ConditionStam)?');
Parser.define('TryStam\:1', 'TryPatt CatchPatt* FinallyPatt?');
Parser.define('IfPatt\:1', 'if ConditionStam Block(controlStatement){err:303}');
Parser.define('ElseIfPatt', 'else (?if) ConditionStam Block(controlStatement) | '+'(::ElsePatt else Block(controlStatement))', checkElseIfPatt);
Parser.define('WhileStam\:1', 'while ConditionStam Block(controlStatement){err:304}');
Parser.define('WithStam\:1', 'with ConditionStam Block(controlStatement){err:305}');
Parser.define('TryPatt', 'try Block(controlStatement){err:307}');
Parser.define('CatchPatt', 'catch ConditionStam Block(controlStatement)');
Parser.define('FinallyPatt', 'finally Block(controlStatement)');
Parser.define('SwitchStam\:1', 'switch ConditionStam ('+'(:IndentBlockStam (?\\\:) SwitchIndentBlockPatt* ) | '+'(:BlockStam (?\{) SwitchBlockPatt* (?\}){err:106})'+' ){err:308}');
Parser.define('SwitchIndentBlockPatt', '((:::CaseStam case CommaExpr) | (:::DefaultStam default)) :{err:313} IndentBlockStam(end:case,default)?');
Parser.define('SwitchBlockPatt', '((:::CaseStam case CommaExpr) | (:::DefaultStam default)) :{err:313} BlockStam(end:case,default)?');
Parser.define('ForStam\:1', 'for ForCondition() Block(controlStatement){err:402}');
Parser.define('LabelStam', 'IdentifierTokn : StatementStam');
Parser.define('SeleteLeftStam\:3', '(<-|--1is(BlankTokn !LineHead) if) CommaStam{err:207}');
Parser.define('SeleteRightStam\:3', '(&&|\\\|\\\||and|or|->) StatementStam{err:206}');
Parser.define('StatementStam', 'is?(Controler) ControlClauses() | '+'(eq?({) (JsonExpr|Block()) | Clauses() | Statement() | MethodDecl) (:::SeleteStam SeleteLeftStam)? | '+'CommaStam (:::CallExpr if(ValueExpr) ParamsStam)? (:::SeleteStam SeleteLeftStam|SeleteRightStam)?');
Parser.define('ClassStatStam', 'Declaration(classStatement) | StatementStam');
Parser.define('StatementPatt', '(is(CommDecl) | is?(IdentifierTokn) LabelStam | StatementStam){lf} is?(EndTokn){err:215}');
Parser.define('ClassStatementPatt', '(is(CommDecl) | is?(IdentifierTokn) LabelStam | Declaration(classStatement) | StatementStam){lf} is?(EndTokn){err:215}');
Parser.RegExpDecl = function(src, param){
	var a, b, _ref;
	_ref = src.indexPair('/', '/', src.index), a = _ref[0], b = _ref[1];
	while (src[b+1] && /^[gimy]+/.test(src[b+1].text)){
		b += 1;
	}
	src.current.text = src.join(a, b);
	src.current.types = ['RegExpDecl', 'ConstTokn'];
	src.delete(a+1, b);
	return src.current;
};
Parser.DataPatt = function(src, param){
	switch (src.text){
		case '(':
			return Parser.CompelExpr(src, param);
		case '[':
			return Parser.ArrayExpr(src, param);
		case '{':
			return Parser.JsonExpr(src, param);
		case '/':
			return Parser.RegExpDecl(src, param);
	}
	switch (src.current.is('Unary', 'IdentifierTokn', 'ConstTokn')){
		case 'Unary':
			return Parser.UnaryExpr(src, param);
		case 'IdentifierTokn':
			return new Node('IdentifierExpr', src.current);
		case 'ConstTokn':
			return src.current;
	}
};
Parser.ValuePatt = function(src, opt){
	var res, member, param;
	if (res = Parser.AccessorExpr(src, opt)){
		while (true){
			var peek = src.peek, _index = src.index;
			if (peek.is('Member')){
				if (member = Parser.MemberExpr(src.next(1), opt)){
					if (res.type == 'AccessorExpr'){
						res.add(member);
					}else {
						res = new Node('AccessorExpr', res, member);
					}
					continue;
				}
			}else if (peek.text == '(' && (param = Parser.ParamsExpr(src.next(1), opt))){
				res = new Node('CallExpr', res, param);
				continue;
			}
			src.index = _index;
			break;
		}
		return res;
	}
	return false;
};
Parser.ForCondition = function(src, opt){
	var b, res, o_index = src.index;
	if (src.text == '('){
		b = src.nextIndex(src.indexPair('(', ')', src.index)[1], true);
		if (!src[b].is('Contextual')){
			if (res = Parser.ForCondition(src.next(1), opt)){
				if (src.next(1).text == ')'){
					return res;
				}
				throw tea.error(new Error(), 107, src.current);
			}
			throw tea.error(new Error(), 213, src[o_index]);
		}
	}
	var exp1, exp2, exp3, isbreak = false;
	switch (src.text){
		case 'var':
			exp1 = Parser.VarDecl(src, opt);
			break;
		case 'let':
			exp1 = Parser.LetDecl(src, opt);
			break;
		case ';':
			exp1 = new Node('Empty');
			break;
		default:
			exp1 = Parser.CommaExpr(src, opt);
			break;
	}
	if (src.peek.text == ';' || (exp1.type == 'Empty' && src.text == ';')){
		o_index = src.index;
		if (src.text == ';'){
			src.next(1);
		}else {
			src.next(2);
		}
		if (src.text == ';'){
			isbreak = true;
			o_index = src.index;
			if (!(exp3 = Parser.CommaExpr(src.next(1), opt))){
				src.next = o_index;
			}
		}else if ((exp2 = Parser.CommaExpr(src, opt)) && src.next(1).text == ';'){
			isbreak = true;
			o_index = src.index;
			if (!(exp3 = Parser.CommaExpr(src.next(1), opt))){
				src.next = o_index;
			}
		}else {
			isbreak = false;
			src.next = o_index;
		}
		if (isbreak){
			return new Node('ForBaseConditionPatt', exp1, exp2, exp3);
		}
	}
	if (!exp1 || exp1.type == 'Empty'){
		throw tea.error(new Error(), 309, src[o_index]);
	}
	if (src.peek.eq('in', 'of', '=>', '<=', '->', '<-')){
		exp2 = src.next(1).current;
		if (!(exp3 = Parser.CommaExpr(src.next(1), opt))){
			throw tea.error(new Error(), 108, exp2);
		}
		return checkForStamType(exp1, exp2, exp3);
	}else {
		var last = exp1, last_index = exp1.length-1, last_len, last_tmp;
		while ((last_tmp = last[last_index]) && (last_len = last_tmp.length)){
			if (last_tmp.is('CompareExpr') && last_tmp[last_len-2].eq('<=', 'in', 'of', '->', '<-')){
				exp2 = last_tmp[last_len-2];
				exp3 = last_tmp[last_len-1];
				if (last_len > 3){
					last[last_index] = new Node('CompareExpr', Hash.slice(last_tmp, 0, last_len-2));
				}else {
					last[last_index] = last_tmp[0];
					last_tmp[0].parent = last;
				}
				break;
			}else {
				last = last_tmp;
				last_index = last_len-1;
			}
		}
		if (exp2){
			return checkForStamType(exp1, exp2, exp3);
		}else {
			return new Node('ForPConditionPatt', exp1);
		}
	}
};
Parser.Expression = function(src, opt){
	var exp;
	switch (src.text){
		case 'require':
			return Parser.RequireStam(src, opt);
		case 'super':
			return Parser.SuperExpr(src, opt);
		case 'this':
			return Parser.ThisExpr(src, opt);
		case '@':
			return Parser.AtExpr(src, opt);
	}
	if (src.context && (exp = src.context.processor.matchNode('expression', src, opt))){
		return exp;
	}
	return false;
};
Parser.Declaration = function(src, opt){
	var token = src.current, isClassBlock = opt && opt.classStatement;
	switch (token.text){
		case 'function':
			return Parser.FunctionExpr(src, opt);
		case 'package':
			return Parser.PackageExpr(src, opt);
		case 'class':
			return Parser.ClassExpr(src, opt);
		case 'get':
			if (!isClassBlock){
				throw tea.error(new Error(), 322, token);
			}
			if (src.peek.type == 'IdentifierTokn'){
				return Parser.GetterDecl(src, opt);
			}
			break;
		case 'set':
			if (!isClassBlock){
				throw tea.error(new Error(), 323, token);
			}
			if (src.peek.type == 'IdentifierTokn'){
				return Parser.SetterDecl(src, opt);
			}
			break;
		case 'static':
			if (!isClassBlock){
				throw tea.error(new Error(), 324, token);
			}
			if (src.peek.type == 'IdentifierTokn'){
				return Parser.StaticDecl(src, opt);
			}
			break;
		case '*':
			switch (src[src.index+1].text){
				case 'proto':
					if (!isClassBlock){
						throw tea.error(new Error(), 325, token);
					}
					return Parser.ProtoDecl(src, opt);
				case 'init':
					if (!isClassBlock){
						throw tea.error(new Error(), 326, token);
					}
					return Parser.InitDecl(src, opt);
			}
			break;
	}
	return false;
};
Parser.Clauses = function(src, opt){
	var token = src.current;
	switch (token.text){
		case 'var':
			return Parser.VarDecl(src, opt);
		case 'let':
			return Parser.LetDecl(src, opt);
		case 'const':
			throw tea.error(new Error(), 401, token);
			return Parser.ConstDecl(src, opt);
		case 'yield':
			throw tea.error(new Error(), 401, token);
			return Parser.ConstDecl(src, opt);
		case 'return':
			return Parser.ReturnStam(src, opt);
		case 'break':
			return Parser.BreakStam(src, opt);
		case 'continue':
			return Parser.ContinueStam(src, opt);
		case 'throw':
			return Parser.ThrowStam(src, opt);
		case 'debugger':
			return Parser.DebuggerStam(src, opt);
		case 'export':
			return Parser.ExportDecl(src, opt);
	}
	return false;
};
Parser.ControlClauses = function(src, opt){
	var token = src.current;
	switch (token.text){
		case 'if':
			return Parser.IfStam(src, opt);
		case 'while':
			return Parser.WhileStam(src, opt);
		case 'do':
			return Parser.DoWhileStam(src, opt);
		case 'with':
			return Parser.WithStam(src, opt);
		case 'try':
			return Parser.TryStam(src, opt);
		case 'switch':
			return Parser.SwitchStam(src, opt);
		case 'for':
			return Parser.ForStam(src, opt);
	}
	throw tea.error(new Error(), 208, token);
	return false;
};
Parser.Statement = function(src, opt){
	var exp;
	if (src.context && (exp = src.context.processor.matchNode('statement', src, opt))){
		return exp;
	}
	return false;
};
Parser.LineBlockStam = function(src, opt){
	var sta,
		stamfn = src.isClassBlock || opt.classStatement ? 'ClassStatStam' : 'StatementStam',
		node = new Node('LineBlockStam'),
		o_index = src.index,
		not_emtpy,
		end = opt.end ? opt.end.split(',') : [];
	end.push('\n', ';', '}', ']', ']', 'else', 'while', 'catch', 'finally', 'case', 'default');
	while (src.index < src.length){
		if (src.current.text == ';'){
			not_emtpy = true;
			o_index = src.index;
			src.next();
			if (src.current.text == ','){
				break;
			}
		}
		if (src.current.type == 'EOT'){
			return node;
		}
		if (end.indexOf(src.current.text) != -1){
			break;
		}
		if (sta = Parser[stamfn](src, opt)){
			node.add(sta);
			o_index = src.index;
			src.next();
			continue;
		}
		break;
	}
	src.index = o_index;
	return node.length || not_emtpy ? node : false;
};
Parser.IndentBlockStam = function(src, opt){
	var line_block,
		sta,
		stamfn = src.isClassBlock || opt.classStatement ? 'ClassStatStam' : 'StatementStam',
		node = new Node('IndentBlockStam'),
		o_index = src.index,
		b_index = src.prevIndex(o_index, true),
		the_indent = src.lineIndent(b_index),
		line_indent,
		a,
		b,
		c,
		not_emtpy;
	node.indent = the_indent;
	if (src[b_index].text == ':'){
		b_index = src.nextIndex(b_index);
		if (src[b_index].type != 'LF'){
			src.index = b_index;
			if (line_block = Parser.LineBlockStam(src, opt)){
				if (src[src.nextIndex(src.index)].type == 'LF'){
					o_index = src.index;
					src.next(1);
					node = line_block;
					node.type = 'IndentBlockStam';
				}else {
					return line_block;
				}
			}else {
				src.index = o_index;
				return false;
			}
		}
	}
	var end = opt.end ? opt.end.split(',') : [];
	end.push('}', ')', ']');
	if (o_index-b_index > 2){
		if (c = collageComment(node, src, b_index+1, o_index)){
			o_index = c;
		}
	}
	while (src.index < src.length){
		if (src.current.type == 'EOT'){
			return node;
		}
		b_index = src.index;
		if (end.indexOf(src.current.text) == -1){
			if (line_indent == null){
				line_indent = src.lineIndent(b);
			}else if (src.current.indent >= 0){
				line_indent = src.current.indent;
			}else if (src[src.index-1].indent >= 0 && src[src.index-1].type == 'BlankTokn'){
				line_indent = src[src.index-1].indent;
			}
			if (line_indent > the_indent){
				if (src.current.is('BlockBreak')){
					not_emtpy = true;
					o_index = src.index;
					src.next(1);
					continue;
				}
				if (sta = Parser[stamfn](src, opt)){
					collageComment(node, src, o_index+1, b_index);
					node.add(sta);
					o_index = src.index;
					src.next(1);
					continue;
				}
				if (!src.current.is('Close')){
					throw tea.error(new Error(), 320, src.current);
				}
			}
		}
		if (o_index+1 < b_index){
			if (c = collageComment(node, src, o_index+1, b_index, the_indent)){
				o_index = c;
			}
		}
		break;
	}
	src.index = o_index;
	return node.length || not_emtpy ? node : false;
};
Parser.BlockStam = function(src, opt){
	var sta,
		stamfn = src.isClassBlock || opt.classStatement ? 'ClassStatStam' : 'StatementStam',
		node = new Node('BlockStam'),
		o_index = src.index,
		b_index = src.prevIndex(src.index, true),
		end = opt.end ? opt.end.split(',') : [];
	end.push('}');
	while (src.index < src.length){
		while (src.current.is('BlockBreak')){
			b_index = src.index;
			src.next(1, true);
		}
		if (src.current.type == 'EOT'){
			return node;
		}
		if (src.current.type == 'CommDecl'){
			node.add(src.current);
			b_index = src.index;
			src.next(1, true);
			continue;
		}
		if (end.indexOf(src.current.text) != -1){
			src.index = b_index;
			return node;
		}
		if (sta = Parser[stamfn](src, opt)){
			node.add(sta);
			b_index = src.index;
			src.next(1, true);
			continue;
		}
		break;
	}
	return false;
};
Parser.StamBlockStam = function(src, opt){
	var sta,
		stamfn = src.isClassBlock || opt.classStatement ? 'ClassStatStam' : 'StatementStam';
	if (sta = Parser[stamfn](src, opt)){
		if (src.peek.text == ';'){
			src.next(1);
		}
		return new Node('StamBlockStam', sta);
	}
};
Parser.Block = function(src, opt){
	var o_index = src.index, _old_isClassBlock = src.isClassBlock, ref;
	if (!opt.controlStatement){
		src.isClassBlock = opt.classStatement;
	}
	switch (src.text){
		case '{':
			if (src.next(1).current.text == '}'){
				return new Node('BlockStam');
			}
			if (ref = Parser.BlockStam(src, opt)){
				if (src.next(1).text != '}'){
					throw tea.error(new Error(), 110, src.current);
				}
			}
			break;
		case ':':
			if (!(ref = Parser.IndentBlockStam(src.next(1), opt))){
				src.index = o_index;
				return new Node('IndentBlockStam');
			}
			break;
		case ';':
			ref = false;
			break;
		default:
			if (opt.controlStatement){
				ref = Parser.StamBlockStam(src, opt);
			}else {
				ref = false;
			}
			break;
	}
	src.isClassBlock = _old_isClassBlock;
	if (ref){
		return ref;
	}
	if (ref === false){
		return false;
	}
	src.index = o_index;
	return new Node('BlockStam');
};
Parser.Node = function(src, opt){
	var res;
	src.isClassBlock = false;
	var i = src.index, node = new Node('NodeStam'), token;
	while (i < src.length){
		token = src.current;
		if (token.is('BlockBreak', 'BlankTokn')){
			i = src.next(1).index;
			token = src.current;
		}
		if (token.type == 'EOT'){
			break;
		}
		if (res = Parser.StatementPatt(src, opt)){
			node.add(res);
			i = src.next(1, true).index;
		}else {
			throw tea.error(new Error(), 209, src.current);
		}
	}
	return node;
};
function collageComment(node, src, a, b, check){
	var list = [], c;
	for (var i = a; i < b; i++){
		if (src[i].type == 'CommDecl'){
			if (check != null){
				if (src.lineIndent(i) > check){
					c = i;
					list.push(src[i]);
				}else {
					break;
				}
			}else {
				c = i;
				list.push(src[i]);
			}
		}else if (!src[i].is('BlankTokn', 'LF', 'EOT')){
			return;
		}
	}
	if (list.length){
		node.add(list);
	}
	return c;
}
function checkForStamType(exp1, exp2, exp3){
	if (exp2 && exp2.text == 'in' && exp1){
		if (exp1.type == 'VarDecl' ? exp1[1].length == 1 : exp1.length == 1){
			return new Node('ForInConditionPatt', exp1, exp2, exp3);
		}
	}
	return new Node('ForPConditionPatt', exp1, exp2, exp3);
}
function checkElseIfPatt(node, src, param){
	if (node.type == 'ElsePatt' && node[1].type == 'StamBlockStam'){
		var peek = src.peek, block, o_index = src.index;
		if (peek.text == ':' || peek.text == '{'){
			if (block = Parser.Block(src.next(1), param)){
				node[1].type = 'ConditionStam';
				node.type = 'ElseIfPatt';
				node.add(block);
			}else {
				src.index = o_index;
			}
		}
	}
	return node;
}