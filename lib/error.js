var helper = require("./tools/helper.js");
var TeaError = (function(){
	function TeaError(err, msg, target, name, err_shift){
		var sub, stacks;
		if (msg instanceof Error){
			err = msg, msg = target, target = name, name = err_shift, err_shift = arguments[5];
		}
		if (!(err instanceof Error)){
			name = target, target = msg, msg = err, err = new Error(), err_shift = 2;
		}
		if (err.type == 'TeaError'){
			sub = err, err = new Error(), err_shift = 2;
		}
		if (typeof msg == 'object'){
			err_shift = name, name = target, target = msg, msg = '';
		}
		stacks = debug.stacks(err, err_shift);
		name = '['+(name && name[0].toUpperCase()+name.substr(1) || 'Tea error')+']';
		if (typeof msg == 'number') msg = err_code[msg];
		msg = msg ? msg[0].toUpperCase()+msg.substr(1) : stacks.message;
		var error = new Error(msg);
		error.type = 'TeaError';
		error.name = print.toText(name);
		error.target = target;
		error.stacks = stacks;
		error.__defineGetter__('text', toString);
		error.__defineGetter__('stack', printError);
		if (sub){
			sub.top = error;
			return sub;
		}
		return error;
	}
	var err_code = {101 : 'Array expression miss right "]" token!',
			102 : 'Json expression miss right "}" token!',
			103 : 'Compel expression miss right ")" token!',
			104 : 'member expression miss right "]" token',
			105 : 'params expression miss right ")" token',
			106 : 'switch expression miss right "}" token',
			107 : 'for expression miss right "}" token',
			108 : 'for expression miss right expression',
			109 : 'export expression right expression syntax error',
			110 : 'block statement miss right "}" token',
			201 : 'unexpected dot expression',
			202 : 'unexpected params expression',
			203 : 'unexpected json expression assign',
			204 : 'unexpected assignment declaration expression',
			208 : 'unexpected assignment expression',
			205 : 'unexpected comma expression',
			206 : 'unexpected selete right pattern expression',
			207 : 'unexpected selete left pattern expression',
			208 : 'unexpected control Clauses',
			209 : 'unexpected token ILLEGAL',
			210 : 'unexpected break expression',
			211 : 'unexpected continue expression',
			212 : 'unexpected token ILLEGAL',
			213 : 'unexpected for condition expression left token',
			214 : 'unexpected compel expression',
			215 : 'unexpected expression',
			301 : 'getter or setter statement syntax error',
			302 : 'method statement syntax error',
			303 : 'if statement syntax error',
			304 : 'while statement syntax error',
			305 : 'with statement syntax error',
			306 : 'do while statement syntax error',
			307 : 'try while statement syntax error',
			308 : 'switch while statement syntax error',
			309 : 'for statement syntax error',
			311 : 'condition statement syntax error',
			312 : 'switch case or default statement syntax error',
			313 : 'case or default expression syntax error',
			314 : 'extends expression syntax error',
			315 : 'array pattern assignment declaration syntax error',
			316 : 'var declaration statement syntax error',
			317 : 'let declaration statement syntax error',
			318 : 'const declaration statement syntax error',
			319 : 'arguments statement syntax error',
			320 : 'indent illegal',
			321 : 'class declaration statement syntax error! miss name',
			322 : 'get declaration statement illegal',
			323 : 'set declaration statement illegal',
			324 : 'static declaration statement illegal',
			325 : '*proto declaration statement illegal',
			326 : '*init declaration statement illegal',
			402 : 'block statement illegal',
			401 : 'const declaration not supported',
			403 : 'yield declaration not supported',
			501 : 'define token statement illegal'};
	TeaError.code = err_code;
	function toString(){
		var texts = [], stacks = [];
		texts.push(this.name);
		stacks.push(debug.stacksToText(this.stacks));
		if (this.target){
			var bug_pot = helper.errorPot(this.target);
			texts.push(('\n'+bug_pot+'\n->  '+this.message+'\n').replace(/^/mg, '\t'));
		}else {
			texts.push(this.message);
		}
		var top = this.top, top_texts = [];
		while (top){
			top_texts.push('   '+top.name);
			if (top.target){
				var bug_pot = helper.errorPot(top.target);
				top_texts.push((bug_pot+'\n->  '+top.message).replace(/^/mg, '\t'));
			}else {
				top_texts.push(top.message);
			}
			texts.push(top_texts.join('\n'));
			stacks.push(debug.stacksToText(top.stacks, false));
			top = top.top;
		}
		texts.push('----', stacks.join('\n'));
		return texts.join('\n');
	}
	function printError(){
		print(this.text);
		process.exit(1);
	}
	return TeaError;
})();
module.exports = TeaError;