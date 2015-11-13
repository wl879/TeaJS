var Parser = require("./parser.js"),
	Source = require("./source.js"),
	Template = require("./template.js");
var PreProcessor = (function(){
	function PreProcessor(extend){
		this.macro = {"map": []};
		this.macrofun = {"map": []};
		this.statement = {"map": []};
		this.expression = {"map": []};
		this.tests = [];
		if (extend){
			this.extends(extend);
		}
	}
	PreProcessor.prototype.__defineGetter__("length", function(){
		return this.macro.map.length+this.macrofun.map.length+this.statement.map.length+this.expression.map.length;
	});
	PreProcessor.prototype.parse = function (src, not_compile){
		var m, macro, val;
		if (typeof src == 'string'){
			src = Source.parse(src);
		}
		for (var i=0, token; i < src.length; i++){
			token = src[i];
			if (!token){
				continue;
			}
			switch (token.type){
				case 'InstructionExpr':
					Parser.instruction.call(this, src, i, token);
					break;
				case 'IdentifierTokn':
					if (!not_compile){
						Parser.compileMacro.call(this, src, i, token);
					}
					break;
				case 'StringTokn':
					var text = token.text, re = /([^\\]|^)(\#\{(\w+)(.*?)\})/g;
					if (!not_compile){
						while (m = re.exec(text)){
							if (macro = m[4] ? this.get(m[3], 'macrofun') : this.get(m[3], 'macro')){
								if (val = macro.getValue(m[4])){
									text = text.slice(0, m.index+(m[1] ? 1 : 0))+val+text.substr(re.lastIndex);
									re.lastIndex = m.index;
								}
							}
						}
					}
					token.text = Template.parseString(text);
					break;
				case 'RegExpDecl':
					token.text = Template.parseRegExp(token.text);
					break;
			}
		}
		src.index = 0;
		src.refresh();
		return src;
	}
	PreProcessor.prototype.undef = function (name){
		var i;
		for (var _i_ref = ['macrofun', 'macro', 'statement', 'expression'], _i=0, type; _i < _i_ref.length; _i++){
			type = _i_ref[_i];
			if ((i = this[type].map.indexOf(name)) >= 0){
				this[type].map.splice(i, 1);
				delete this[type][name];
			}
		}
	}
	PreProcessor.prototype.add = function (something){
		if (typeof something == 'string'){
			if (something == 'expression' || something == 'statement'){
				something = new SyntacticSugar(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
			}else {
				something = new Macro(arguments[0], arguments[1], arguments[2]);
			}
		}
		var key = something.name, type = something.type;
		this[type][key] = something;
		if (this[type].map.indexOf(key) == -1){
			this[type].map.push(key);
		}
		return something;
	}
	PreProcessor.prototype.get = function (key){
		if (!(this.length)) return;
		var limits = arguments.length > 1 ? Hash.slice(arguments, 1) : ['macrofun', 'macro', 'statement', 'expression'];
		for (var _i=0, type; _i < limits.length; _i++){
			type = limits[_i];
			if (this[type].map.indexOf(key) != -1){
				return this[type][key];
			}
		}
	}
	PreProcessor.prototype.extends = function (extend){
		for (var _i_ref = ['macrofun', 'macro', 'statement', 'expression'], _i=0, type; _i < _i_ref.length; _i++){
			type = _i_ref[_i];
			for (var _j=0, key; _j < extend[type].map.length; _j++){
				key = extend[type].map[_j];
				this.add(extend[type][key]);
			}
		}
	}
	PreProcessor.prototype.matchNode = function (type, src, opt){
		var exp;
		if (!(this[type])) return;
		var map = this[type].map, _index = src.index;
		for (var i=0, name; i < map.length; i++){
			name = map[i];
			src.index = _index;
			if (exp = this[type][name].parse(src, opt)){
				if (debug.prep){
					debug.prep('[Prep '+type+': '+name+' matched]', src[_index]);
				}
				return exp;
			}
		}
	}
	return PreProcessor;
})();
var Macro = (function(){
	function Macro(name, params, body){
		this.name = name;
		var params_key = params && params.join('').trim() || '', key = params_key+body;
		if (cache[key]){
			this.type = cache[key].type;
			this.params = cache[key].params;
			this.body = cache[key].body;
			this.script = cache[key].script;
		}else {
			this.type = params ? 'macrofun' : 'macro';
			this.params = params_key ? params : [];
			this.body = body;
			if ((/#script/).test(body)){
				try {
					var script = Template.textScript(body, params);
					this.script = eval('('+script+')');
				}catch (e) {
					this.error = e;
				}
			}
			cache[key] = this;
		}
	}
	var cache = {}, Template = require("./template.js");
	Macro.prototype.getValue = function (params, src){
		var value;
		if (params){
			params = Text.split(params.replace(/^\((.*)\)$/g, '$1'), ',', 'trim');
		}
		if (this.script){
			value = this.script.apply({"self": this, "src": src}, params || []);
		}else {
			value = this.body;
		}
		value = replaceParam(value, this.params || [], params || []);
		return Text.trimIndent(value);
	}
	function replaceParam(value, keys, params){
		var keys_join = keys.join('|'),
			re = new RegExp('(#*?)('+(keys_join ? '\\b(?:'+keys_join+')\\b|' : '')+'#(\\d+)|\\bARGR\\.\\.\\.)(##)?', 'g'),
			m,
			hash,
			unhash,
			key,
			num,
			arg,
			val,
			insert = [],
			id;
		while (m = re.exec(value)){
			hash = m[1], key = m[2], num = m[3], unhash = m[4];
			num = num || keys.indexOf(key);
			if (key == 'ARGR...'){
				val = params.slice(keys.length).join(', ');
			}else if (params[num]){
				val = params[num];
			}
			id = '$$$'+ID()+'$$$';
			insert.push([id, (val ? hash%2 ? '"'+val+'"' : val : '')]);
			value = value.slice(0, m.index)+id+value.substr(re.lastIndex);
			re.lastIndex = m.index+id.length;
		}
		for (var i=0; i < insert.length; i++){
			value = value.replace(insert[i][0], insert[i][1]);
		}
		return value;
	}
	return Macro;
})();
var SyntacticSugar = (function(){
	function SyntacticSugar(type, name, pattern, writer, parser){
		this.type = type;
		this.name = name;
		this.stxre = Syntax.regexp(pattern);
		this.parser = parser;
		this.writer = writer;
	}
	var Syntax = require("../syntax");
	SyntacticSugar.prototype.parse = function (src, opt){
		var node = Syntax.matchNode(this.name, this.stxre, src, 'ret node');
		if (node && this.parser){
			return this.parser.call(this, node, src, opt);
		}
		return node;
	}
	SyntacticSugar.prototype.read = function (reader, node){
		var write = reader.new(this.name);
		if (typeof this.writer == 'string'){
			write.read(this.writer, node);
		}else {
			write = this.writer(node, write) || write;
		}
		return write;
	}
	return SyntacticSugar;
})();
module.exports = PreProcessor;