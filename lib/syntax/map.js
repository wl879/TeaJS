var token,
	node,
	token_map = {'LF' : '\n',
		'BlankTokn' : '\r  \t  \f  \ ',
		'CommDecl' : '//  /*  */  #!',
		'SymbolTokn Instruction' : '#',
		'ConstTokn Boolean' : 'true  false',
		'ConstTokn Null' : 'null  undefined  Infinity',
		'Keyword' : 'this  instanceof  in  extends  null  undefined  Infinity  true  false  '+'if  while  with  catch  for  switch  case  default  else  try  do  finally  '+'new  typeof  delete  void  return  break  continue  throw  var  function  '+'let  enum  const  import  export  debugger  super  yield  class',
		'IdentifierTokn' : 'eval  arguments  extends  import  export  get  set  static  as  of  and  or  not  is  require  let  enum  const  debugger  super  yield  class',
		'Restricted' : 'instanceof  in  Infinity  '+'if  while  with  catch  for  switch  case  default  else  try  do  finally  '+'new  typeof  delete  void  return  break  continue  throw',
		'SymbolTokn' : ';  ,  .  :  ?  \\  [  ]  {  }  (  )  //  /*  */  #!  '+'=  +=  -=  *=  /=  %=  &=  >>=  <<=  >>>=  '+'>  <  >=  <=  !=  !==  ==  ===  ++  --  '+'!  ~  +  -  *  /  %  &  |  ^  >>  <<  >>>  &&  ||  '+'**  ::  |=  ?=  @  ->  <-  >>  <<  >>>  <<<  =>  <=  ..  ...',
		'SymbolTokn Quote' : '\'  "  """  \'\'\'  """"  \'\'\'\'  `',
		'Controler' : 'if  while  with  catch  for  switch  case  default  else  try  do  finally',
		'Declaration' : 'function  require  class  package  static  get  set  import  export',
		'Clauses' : 'let  enum  const  var  return  break  continue  throw  debugger',
		'Expression IdentifierTokn' : 'super  this  @',
		'ClassRestricted' : 'static  get  set  extends',
		'Unary' : 'new  typeof  yield  delete  void  not  !  ~  -  +  ++  --',
		'Prefix Postfix' : '++  --',
		'Binary Compute' : '+  -  *  /  %  &  |  ^  >>  <<  >>>  **  \\',
		'Binary Compare' : 'instanceof  in  of  as  extends  is  not is  >  <  >=  <=  !=  !==  ==  ===',
		'Binary Logic' : 'and  or  &&  ||',
		'Binary Assign' : '=  +=  -=  *=  /=  %=  &=  |=  >>=  <<=  >>>=  ?=  |=',
		'Ternary' : '?',
		'Member' : '.  ::  ..  [',
		'Comma' : ',',
		'Open' : '{  (  [',
		'Close' : '}  ]  )',
		'BlockBreakTokn BlockBreak' : ';  \n',
		'BlockStart' : ':  {',
		'Contextual' : 'Binary  Member  Comma  in  as  of  ->  <-  =>  <=  ...',
		'EndTokn' : 'BlockBreakTokn  Close  /*  //',
		'IGLF' : 'Unary  Binary  Ternary  Member  Assign  Comma  Open  Contextual'},
	node_map = {'Token' : 'ConstTokn IdentifierTokn NumTokn StringTokn RegexpTokn SymbolTokn TmlTokn BlockBreakTokn',
		'DataPatt' : 'Token ArrayExpr JsonExpr UnaryExpr IdentifierExpr PrefixExpr PostfixExpr NotExpr',
		'AccessorExpr' : 'DataPatt CompelExpr',
		'ValueExpr' : 'AccessorExpr CallExpr',
		'LogicExpr' : 'CompareExpr ComputeExpr ValueExpr',
		'BinaryExpr' : 'LogicExpr',
		'FunctionExpr' : 'FunctionDecl ClassExpr GetterDecl SetterDecl MethodDecl PackageExpr LambdaExpr',
		'ExprStam' : 'SuperExpr ThisExpr AtExpr TernaryExpr Ternary2.5Expr BinaryExpr FunctionExpr RequireStam CommDecl ImportExpr ExtendsExpr',
		'ClausesStam' : 'LetDecl ConstDecl VarDecl ReturnStam BreakStam ContinueStam ThrowStam DebuggerStam ExportDecl',
		'ControlStam' : 'IfPatt ElseIfPatt ElsePatt WhileStam DoWhileStam WithStam ForStam SwitchStam CaseStam DefaultStam TryPatt CatchPatt FinallyPatt',
		'ConditionPatt' : 'ForPConditionPatt ForPConditionPatt ForPConditionPatt',
		'BlockStam' : 'LineBlockStam IndentBlockStam StamBlockStam',
		'StatementStam' : 'ControlStam ClausesStam AssignmentExpr CommaExpr SeleteStam BlockStam ExprStam',
		'NodeStam' : 'BlockStam',
		'ScopeNode' : 'Root FunctionExpr',
		'IgSemicolon' : 'LabelStam IfStam ElseIfStam ElseStam WhileStam WithStam ForStam WitchStam TryStam CatchStam FinallyStam FunctionExpr GetterDecl SetterDecl ClassExpr MethodDecl ExportDecl StaticDecl PackageExpr CommDecl BlockBreakTokn'};
token = {"types": {},
	"literals": {},
	"complexs": [],
	"complexre": null,
	"define": function(types, literals){
		var literal_re, tmp;
		if (arguments.length == 1){
			if (isJson(types)){
				for (var i in types){
					if (!types.hasOwnProperty(i)) continue;
					this.define(i, types[i]);
				}
			}
			return;
		}
		types = isArray(types) ? types : types.split(' ');
		literals = isArray(literals) ? literals : literals.split('  ');
		for (var _i=0, literal; _i < literals.length; _i++){
			literal = literals[_i];
			if (this.types.hasOwnProperty(literal) && /^[A-Z]\w+$/.test(literal)){
				this.define(types, this.types[literal]);
				continue;
			}
			if (/\w\W|\W\w/.test(literal)){
				literal_re = literal.replace(/(\W)/g, '\\$1');
				if (this.complexs.indexOf(literal_re) == -1){
					this.complexs.push(literal_re);
				}
			}
			for (var _j=0, type; _j < types.length; _j++){
				type = types[_j];
				if (!this.types[type]) this.types[type] = [];
				if (this.types[type].indexOf(literal) == -1){
					this.types[type].push(literal);
				}
			}
			if (tmp = this.literals[literal]){
				for (var _j=0, type; _j < types.length; _j++){
					type = types[_j];
					if (tmp.indexOf(type) == -1){
						tmp.push(type);
					}
				}
			}else {
				this.literals[literal] = types.slice();
			}
		}
		if (this.complexs.length){
			this.complexs.sort(function(a, b){return b.length-a.length});
			this.complexre = new RegExp('^(?:'+this.complexs.join('|')+')(?!\\w)', 'g');
		}
	}};
node = {"map": {},
	"all": [],
	"test": function(name, type){
		if (!type){
			if (this.map['Expr'].indexOf(name) != -1){
				return 'Expr';
			}
			if (this.map['Decl'].indexOf(name) != -1){
				return 'Decl';
			}
			if (this.map['Stam'].indexOf(name) != -1){
				return 'Stam';
			}
			return false;
		}
		return name == type || this.map[type] && this.map[type].indexOf(name) != -1;
	},
	"define": function(types, names){
		if (arguments.length == 1){
			if (isJson(types)){
				for (var i in types){
					if (!types.hasOwnProperty(i)) continue;
					this.define(i, types[i]);
				}
			}
			return;
		}
		types = isArray(types) ? types : types.split(' ');
		names = isArray(names) ? names : names.split(' ');
		for (var _i=0, name; _i < names.length; _i++){
			name = names[_i];
			if (this.map.hasOwnProperty(name)){
				this.define(types, this.map[name]);
			}
			for (var _j=0, type; _j < types.length; _j++){
				type = types[_j];
				if (!this.map[type]) this.map[type] = [];
				if (this.map[type].indexOf(name) == -1) this.map[type].push(name);
				if (this.all.indexOf(name) == -1) this.all.push(name);
			}
		}
	}};
token.define(token_map);
node.define(node_map);
module.exports.token = token;
module.exports.node = node;