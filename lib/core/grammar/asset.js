var Asset = (function(){
	var Method, Token, cache, conf_pack, conf_set, logic_symbol, conf_re;
	Method = require("./method.js");
	Token = require("../token.js");
	cache = Jsop.data();
	conf_pack = {
		"@@=": "rename pattern",
		"@@": "pattern name",
		"@=": "rename response",
		"@?": "check response",
		"@~": "packing matched",
		"@:": "response name",
		"@!": "check empty"};
	conf_set = {
		"\\n": "lf",
		"∆": "error",
		"∅": "ig",
		"→": "test",
		"+?": "smallest mode",
		"*?": "smallest mode",
		"+": "mode",
		"*": "mode",
		"?": "mode",
		"!": "mode"};
	logic_symbol = /^&(==|===|!=|!==)\[(.*?)\]$/;
	conf_re = new RegExp('(?:('+SText.re(Object.keys(conf_set))+'|∆(\\d*))|'+'('+SText.re(Object.keys(conf_pack))+')([A-Za-z]{3,}))$');
	function Asset(str){
		this.config = {"mode": ''};
		this.type = null;
		this.content = null;
		this.param = null;
		this.string = str;
		if (str){
			str = checkConfig(this, str);
			if (str == '*'){
				this.type = '*';
				this.content = str;
			}else {
				checkPairAsset(this, str) || checkMethodAsset(this, str) || checkLogicAsset(this, str) || checkSubAsset(this, str) || checkNodeAsset(this, str) || checkCodeAsset(this, str);
			}
		}
	};
	Asset.prototype.parse = function (src, grm){
		switch (this.type){
			case '*':
				return src.current;
			case 'Codes Test':case 'Code Test':
				return parseCodeAsset.call(this, src, grm);
			case 'Pair Test':
				return parsePairAsset.call(this, src, grm);
			case 'Method Test':
				return parseMethodAsset.call(this, src, grm);
			case 'Node Test':
				return parseNodeAsset.call(this, src, grm);
			case 'Logic':
				return parseLogicAsset.call(this, src, grm);
			case 'Sub':
				return;
		}
	};
	Asset.prototype.isAsset = true;
	Asset.compile = function(str){
		if (!cache[str]){
			return cache[str] = new Asset(str);
		}
		return cache[str];
	};
	Asset.parse = function(asset, src, grm){
		if (!asset.isAsset){
			asset = Asset.compile(asset);
		}
		return asset.parse(src, grm);
	};
	// compile asset 
	function checkConfig(self, str){
		var config, m, name;
		config = self.config;
		while (m = str.match(conf_re)){
			if (m.index == 0){
				break;
			}
			if (m.index === 1 && str[0] === '\\'){
				if (m[0].length > 1 && m[1] && !m[2]){
					m.index += 1;
					m[1] = m[1].substr(1);
				}else {
					break;
				}
			}
			if (m[1]){
				if (m[2]){
					config.error = parseInt(m[2]);
				}else {
					name = conf_set[m[1]];
					if (name == 'smallest mode'){
						config.smallest = true;
						config.mode = m[1][0];
					}else {
						config[name] = m[1];
					}
				}
			}else if (m[3]){
				config.pack = conf_pack[m[3]];
				config.name = m[4];
			}
			str = str.substr(0, m.index);
		}
		return str;
	};
	function checkPairAsset(self, str){
		var m;
		if (m = str.match(/^([^\. \(]+?)\.\.\.([^\. ]+)$/)){
			self.type = 'Pair Test';
			self.content = [SText.cleanESC(m[1]), SText.cleanESC(m[2])];
			return true;
		}
	};
	function checkMethodAsset(self, str){
		var m;
		if (m = str.match(/^\[(.*?)\]$/)){
			self.type = 'Method Test';
			self.content = /→/.test(m[1]) ? 'ROUTE' : 'IS';
			self.param = SText.split(m[1], ',', 'params', true);
			return true;
		}
		if (m = str.match(/^#(\w+)(?:\((.*?)\))?$/)){
			self.type = 'Method Test';
			self.content = m[1];
			self.param = m[2] ? SText.split(m[2], ',', 'params', true) : [];
			return true;
		}
		if (m = str.match(/^\{(\w+)\}$/)){
			self.type = 'Method Test';
			self.content = 'ISPARAM';
			self.param = [m[1]];
			self.config.test = true;
			return true;
		}
	};
	function checkLogicAsset(self, str){
		var m;
		if (m = str.match(logic_symbol)){
			self.type = 'Logic';
			self.content = m[1];
			self.param = SText.split(m[2], ',', 'trim', true);
			self.config.test = true;
			return true;
		}
	};
	function checkSubAsset(self, str){
		var m;
		if (str[0] == '(' && str[str.length-1] == ')'){
			str = str.slice(1, -1);
			if (m = str.match(/^(\?\!|\?\=|\?\:)/)){
				switch (m[1]){
					case '?:':
						self.config.ig = true;
						break;
					case '?!':
						self.config.mode = '!';
						break;
					case '?=':
						self.config.test = true;
						break;
				}
				str = str.substr(m[0].length);
			}
			self.type = 'Sub';
			self.content = str;
			return true;
		}
	};
	function checkNodeAsset(self, str){
		if (/^[A-Z]\w+$/.test(str)){
			self.type = 'Node Test';
			self.content = str;
			return true;
		}
	};
	function checkCodeAsset(self, str){
		var token_list;
		str = SText.cleanESC(str);
		if (/^\w+$|\W/.test(str)){
			self.type = 'Code Test';
			self.content = str;
			return true;
		}
		token_list = Token.tokenize(str, 0, 'code list');
		if (token_list.length == 1){
			self.type = 'Code Test';
			self.content = token_listp[0];
		}else {
			self.type = 'Codes Test';
			self.content = token_list;
		}
		return true;
	};
	// parse asset
	function parsePairAsset(src, grm){
		var s1, s2, ref, ab, list;
		ref = this.content, s1 = ref[0], s2 = ref[1];
		if (ab = src.indexPair(s1, s2, src.index, true)){
			if (ab[0] == src.index){
				list = Jsop.toArray(src, ab[0], ab[1]+1);
				src.index = ab[1];
				return list;
			}
		}
		return false;
	};
	function parseCodeAsset(src, grm){
		var code_list, index, list, token;
		if (this.type == 'Code Test'){
			return this.content == src.current.text ? src.current : false;
		}
		code_list = this.content;
		index = src.index-1;
		list = [];
		for (var code, i = 0; i < code_list.length; i++){
			code = code_list[i];
			token = src[++index];
			if (!token || (code != token.text && (!token.is('BLANK') || !/^\s+$/.test(code)))){
				return false;
			}
			list.push(token);
		}
		if (list.length){
			src.index = index;
			return list;
		}
		return false;
	};
	function parseLogicAsset(src, grm){
		var type, last, params;
		switch (type = this.content){
			case "==":case "===":case "!=":case "!==":
				last = grm.handle.cache;
				while (isArray(last)){
					last = last[last.length-1];
				}
				if (last && last.is){
					params = this.param;
					switch (type){
						case "==":
							return !!last.is.apply(last, params);
						case "===":
							return params.indexOf(last.type) != -1 || params.indexOf(last.text) != -1;
						case "!=":
							return !last.is.apply(last, params);
						case "!==":
							return params.indexOf(last.type) == -1;
					}
				}
				break;
		}
		return false;
	};
	function parseNodeAsset(src, grm){
		var name, token, ref;
		name = this.content;
		token = src.current;
		if (token.types.indexOf(name) != -1){
			return token;
		}
		if (grm.prepor && (ref = grm.prepor.check(name, null, src, grm))){
			return ref;
		}
		if (grm.parser(name)){
			return grm.parser(name, src, this.param);
		}
		if (name == token.text){
			return token;
		}
		return false;
	};
	function parseMethodAsset(src, grm){
		var name;
		name = this.content;
		if (Method.hasOwnProperty(name)){
			return Method[name].call(grm, src, this.param);
		}
		if (grm.parser(name)){
			return grm.parser(name, src, this.param);
		}
		throw Error.create(4002, name, grm.handle.name, new Error());
	};
	return Asset;
})();
module.exports = Asset;