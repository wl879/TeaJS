var Tokens = module.exports,
	Location = require("./location.js"),
	Token = require("./token.js"),
	token_types = {},
	token_complex = [],
	token_literals = {},
	token_re = null,
	token_complex_re = null,
	token_complex_rre = null;
Tokens.token = function(text, types, indent, location){
	if (!types){
		if (text == '\4'){
			types = ['EOT', 'BlockBreakTokn', 'BlockBreak', 'EndTokn'];
		}else if (token_literals.hasOwnProperty(text)){
			types = token_literals[text];
		}else if (text){
			types = ['UNKNOW'];
		}else {
			types = ['EMPTY'];
		}
	}
	return new Token(text, types, indent, location);
};
Tokens.location = function(file, source, code, start, end, line, column){
	return new Location(file, source, code, start, end, line, column);
};
Tokens.define = function(types, literals){
	var literal_re, tmp;
	if (arguments.length == 1){
		if (isJson(types)){
			for (i in types){
				if (!types.hasOwnProperty(i)) continue;
				Tokens.define(i, types[i]);
			}
		}
		return;
	}
	types = isArray(types) ? types : types.split(' ');
	literals = isArray(literals) ? literals : literals.split('  ');
	for (var _i=0, literal; _i < literals.length; _i++){
		literal = literals[_i];
		if (token_types.hasOwnProperty(literal) && /^[A-Z]\w+$/.test(literal)){
			Tokens.define(types, token_types[literal]);
			continue;
		}
		if (/\w\W|\W\w/.test(literal)){
			literal_re = literal.replace(/(\W)/g, '\\$1');
			if (token_complex.indexOf(literal_re) == -1){
				token_complex.push(literal_re);
			}
		}
		for (var _j=0, type; _j < types.length; _j++){
			type = types[_j];
			if (!token_types[type]) token_types[type] = [];
			if (token_types[type].indexOf(literal) == -1){
				token_types[type].push(literal);
			}
		}
		if (tmp = token_literals[literal]){
			for (var _j=0, type; _j < types.length; _j++){
				type = types[_j];
				if (tmp.indexOf(type) == -1){
					tmp.push(type);
				}
			}
		}else {
			token_literals[literal] = types.slice();
		}
	}
	if (token_complex.length){
		token_complex.sort(function(a, b){return b.length-a.length});
		token_complex_re = new RegExp('^(?:'+token_complex.join('|')+')(?!\\w)', 'g');
		token_complex_rre = new RegExp('(?:'+token_complex.join('|')+')$', 'g');
	}
};
Tokens.parse = function(source, pos){
	var text, match, code, b, prev;
	if (!(text = pos === 0 && source || source.substr(pos))){
		return;
	}
	if (token_complex_re && (match = text.match(token_complex_re))){
		if (token_literals.hasOwnProperty(match[0])){
			return new Token(match[0], token_literals[match[0]]);
		}
	}
	if (match = text.match(/^\n/)){
		return new Token(match[0], token_literals[match[0]]);
	}
	if (match = text.match(/^[\r\t\f\ ]+/)){
		return new Token(match[0], ['BlankTokn']);
	}
	if (match = text.match(/^(0[xX][0-9a-fA-F]+|(?:\.\d+|\d+(?:\.\d+)?)(?:e\-?\d+)?)/)){
		return new Token(match[0], ['NumTokn', 'ConstTokn']);
	}
	if (match = text.match(/^([\$a-zA-Z_][\w\$]*)/)){
		if (token_literals.hasOwnProperty(match[0])){
			return new Token(match[0], token_literals[match[0]]);
		}
		return new Token(match[0], ['IdentifierTokn']);
	}
	if (!(match = text.match(/^[^\w\_\s]+/))){
		return 'tokenize parse error! unexpected token like as "'+text.slice(0, 5)+'"';
	}
	code = match[0];
	while (code && token_types.SymbolTokn.indexOf(code) == -1){
		code = code.slice(0, -1);
	}
	switch (code){
		case '"':case '"""':case '""""':case '`':case "'":case "'''":case "''''":
			if ((b = indexOfRightPair(text, code, code)) === false){
				return 'tokenize string pattern error! miss right token';
			}
			return new Token(text.slice(0, b+1), ['StringTokn', 'ConstTokn']);
		case '#':
			if (match = text.match(/^(\#[\$A-Za-z_][\w\$]*)/)){
				return new Token(match[0], ['InstructionExpr']);
			}
		case '//':case '#!':
			if ((b = text.indexOf('\n')) == -1){
				b = text.length;
			}
			return new Token(text.slice(0, b), ['CommDecl', 'LineComm']);
		case '/*':
			if ((b = indexOfRightPair(text, '/*', '*/')) === false){
				return 'tokenize comment pattern error! miss right token';
			}
			return new Token(text.slice(0, b+1), ['CommDecl', 'MultiLineComm']);
		case '/':
			// Do get a previous lexeme
			if (pos && (prev = rtokenize(source, pos-1, true, true)) && !(typeof prev == 'string')){
				if (/^(\+\+|\-\-\@|\]|\)|\})$|\"$|\'$/.test(prev[0])) break;
				if (/^[\w\$]+$/.test(prev[0]) && token_types.Keyword.indexOf(prev[0]) == -1) break;
			}
			if ((b = indexOfRightPair(text, '/', '/')) === false){
				return 'tokenize regexp pattern error! miss right token';
			}
			if (match = text.substr(b+1).match(/^[gimy]+/)){
				b = b+match[0].length;
			}
			code = text.slice(0, b+1);
			return new Token(code, /\n/.test(code) ? ['RegExpDecl', 'ConstTokn', 'MultiLineRegExp'] : ['RegExpDecl', 'ConstTokn']);
	}
	if (token_literals.hasOwnProperty(code)){
		return new Token(code, token_literals[code]);
	}
	return 'tokenize parse error! undefined token "'+code+'"';
};
Tokens.tokenize = function(text, opt){
	var token;
	if (typeof opt == 'number'){
		return Tokens.parse(text, opt);
	}
	var list = [], pos = 0;
	while (token = Tokens.parse(text, pos)){
		list.push(opt == 'code list' ? token.text : token);
		pos += token.text.length;
	}
	return list;
};
Tokens.endToken = Tokens.token('\4');
Tokens.types = token_types;
/**
 * defined token table
 */
Tokens.define({'LF' : '\n',
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
	'Binary Compare' : 'instanceof  in  of  as  extends  is  >  <  >=  <=  !=  !==  ==  ===  not is',
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
	'IGLF' : 'Unary  Binary  Ternary  Member  Assign  Comma  Open  Contextual'});
function indexOfRightPair(text, s1, s2){
	var a_b = Text.indexPair(text, 0, s1, s2, true);
	return !a_b || a_b[0] !== 0 ? false : a_b[1]+s2.length-1;
}
function rtokenize(source, pos, ig_blank, ig_comm){
	var text, match, code;
	text = pos && source.slice(0, pos+1) || source;
	while (text){
		if (match = text.match(/\s+$/)){
			if (!ig_blank){
				return [match[0], match.index];
			}
			text = text.slice(0, match.index);
			continue;
		}
		if (match = text.match(/(\/\*[\s\w\W]*?\*\/|\/\*)$/) || text.match(/(\/\/|\#\W).*$/)){
			if (!ig_comm){
				return [match[0], match.index];
			}
			text = text.slice(0, match.index);
			continue;
		}
		if (match = (token_complex_rre && text.match(token_complex_rre)) || text.match(/(0[xX][0-9a-fA-F]+|(?:\.\d+|\d+(?:\.\d+)?)(?:e\-?\d+)?)$/) || text.match(/([\$a-zA-Z_][\w\$]*)$/)){
			return [match[0], match.index];
		}
		if (!(match = text.match(/[^\w\_\s]+$/))){
			return 'reverse tokenize parse error! unexpected token like as "'+text.slice(-5)+'"';
		}
		code = match[0];
		while (code && token_types.SymbolTokn.indexOf(code) == -1){
			code = code.slice(0, -1);
		}
		if (/'|"/.test(code)){
			var str_rre = new RegExp(code+'(?:\\\\\\\\|'+code.replace(/(.)/g, '\\\\$1')+'|[\\s\\w\\W])*?'+code+'$');
			if (match = text.match(str_rre)){
				return [match[0], match.index];
			}else {
				text = text.slice(0, -code.length);
				continue;
			}
		}
		return [code, match.index];
	}
}