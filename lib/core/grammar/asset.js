var Asset = (function(){
	var Token = require("../token.js");
	var Methods = require("./method.js");
	var Pattern = null;
	var cache = Jsop();
	var conf_pack = {
			"@@=": "rename pattern",
			"@@": "pattern name",
			"@=": "rename pack",
			"@?": "check pack",
			"@~": "package matched",
			"@:": "package node",
			"@!": "check empty"};
	var conf_set = {
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
	var conf_re = new RegExp('(\\.{3}|\\\\*)?(?:('+SText.re(Object.keys(conf_set))+')|∆(\\d*)|'+'('+SText.re(Object.keys(conf_pack))+')([A-Za-z]{3,}))$');
	function Asset(str){
		!Pattern && (Pattern = require("./pattern.js"));
		this.config = {"mode": ''};
		this.type = null;
		this.value = null;
		this.params = null;
		this.string = str;
		if (str){
			str = checkConfig(this, str);
			if (str == '*'){
				this.type = '*';
				this.value = str;
			}else {
				checkPairAsset(this, str) || checkCharAsset(this, str) || checkSetAsset(this, str) || checkMethodAsset(this, str) || checkGroupAsset(this, str) || checkNodeAsset(this, str) || checkCodeAsset(this, str);
			}
		}
	};
	Asset.prototype.exec = function (handle, src){
		var start_index, ref;
		start_index = src.index;
		if (start_index >= src.length){
			return false;
		}
		switch (this.type){
			case '*':
				ref = src.current;
				break;
			case 'Code Test':
				return this.value == src.current.text ? src.current : false;
			case 'Char Test':
				ref = parseCharAsset(handle, this, src);
				break;
			case 'Codes Test':
				ref = parseCodeAsset(handle, this, src);
				break;
			case 'Pair Test':
				ref = parsePairAsset(handle, this, src);
				break;
			case 'Method Test':
				ref = parseMethodAsset(handle, this, src);
				break;
			case 'Node Test':
				ref = parseNodeAsset(handle, this, src);
				break;
			case 'Set Test':
				ref = parseSetAsset(handle, this, src);
				break;
			case 'Group':
				ref = this.value.exec(handle, src);
				break;
		}
		// DEBUG LOG
		if (this.type != 'Group'){
			handle.heap.log([this, ref, start_index, src.index]);
		}
		// DEBUG OVER
		if (ref){
			if (ref.isNode || ref.isToken || ref.length || ref.matched){
				return ref;
			}
			return true;
		}
		src.index = start_index;
		return false;
	};
	Asset.prototype.isAsset = true;
	Asset.compile = function(str){
		if (!cache[str]){
			return cache[str] = new Asset(str);
		}
		return cache[str];
	};
	// compile asset 
	function checkConfig(self, str){
		var config, m, val, spilth, symbol, err, pack, name, type;
		config = self.config;
		while (m = str.match(conf_re)){
			val = m[0], spilth = m[1], symbol = m[2], err = m[3], pack = m[4], name = m[5];
			if (spilth){
				if (spilth.length%2 == 0){
					m.index += spilth.length;
				}else if (symbol.length > 1){
					m.index += spilth.length+1;
					symbol = symbol.substr(1);
				}else {
					break;
				}
			}
			if (m.index == 0){
				break;
			}
			if (symbol){
				type = conf_set[symbol];
				if ('smallest mode' == type){
					config.smallest = true;
					config.mode = symbol[0];
				}else {
					config[type] = symbol;
				}
			}else if (err){
				config.error = parseInt(err);
			}else if (pack){
				config.packMode = conf_pack[pack];
				config.packName = name;
			}
			str = str.substr(0, m.index);
		}
		return str;
	};
	function checkPairAsset(self, str){
		var m;
		if (m = str.match(/^([^\. ]*)\.\.\.([^\. ]*)$/)){
			self.type = 'Pair Test';
			self.value = [SText.cleanESC(m[1]), SText.cleanESC(m[2])];
			return true;
		}
	};
	function checkMethodAsset(self, str){
		var m;
		if (m = str.match(/^#(\w+)(?:\((.*?)\))?$/)){
			self.type = 'Method Test';
			self.value = m[1];
			self.params = m[2] ? SText.split(m[2], ',', 'params', true) : [];
			return true;
		}
	};
	function checkGroupAsset(self, str){
		var m, group, _asset;
		if (str[0] == '(' && str[str.length-1] == ')'){
			str = str.slice(1, -1);
			if (m = str.match(/^(\?\!|\?\=|\?\:)/)){
				switch (m[1]){
					case '?:':
						self.config.ig = '?:';
						break;
					case '?!':
						self.config.mode = '!';
						break;
					case '?=':
						self.config.test = '?=';
						break;
				}
				str = str.substr(m[0].length);
			}
			group = Pattern.compile(str);
			if (group.length == 1 && m){
				_asset = group[0];
				Jsop.extend(group[0].config, self.config);
				Jsop.extend(self, group[0]);
				return true;
			}
			self.type = 'Group';
			self.value = group;
			return true;
		}
	};
	function checkNodeAsset(self, str){
		if (/^[A-Z]\w+$/.test(str)){
			self.type = 'Node Test';
			self.value = str;
			return true;
		}
	};
	function checkCodeAsset(self, str){
		var token_list;
		str = SText.cleanESC(str);
		if (/^\w+$|\W/.test(str)){
			self.type = 'Code Test';
			self.value = str;
			return true;
		}
		token_list = tokenize(str);
		if (token_list.length == 1){
			self.type = 'Code Test';
			self.value = token_listp[0];
		}else {
			self.type = 'Codes Test';
			self.value = token_list;
		}
		return true;
	};
	function checkCharAsset(self, str){
		var m;
		if (m = str.match(/^\[\[(.*?)\]([\*\?\+]?)\]$/)){
			self.type = 'Char Test';
			self.value = new RegExp('^('+SText.split(m[1], ' ', true, true).join('|')+')'+(m[2] || '')+'$');
			return true;
		}
	};
	function checkSetAsset(self, str){
		var m, list, value, temp;
		if (m = str.match(/^\[(.*?)\]$/)){
			list = /[^\\],/.test(str) ? SText.split(m[1], ',', 'params', true) : SText.split(m[1], ' ', true, true);
			value = {"__HasKey__": false, "__Defaults__": []};
			for (var patt, i = 0; i < list.length; i++){
				patt = list[i];
				temp = SText.split(patt, '→', true);
				if (temp.length == 2){
					value.__HasKey__ = true;
					value[temp[0]] = checkPatt(temp[1]);
				}else {
					value.__Defaults__.push(checkPatt(patt));
				}
			}
			self.type = 'Set Test';
			self.value = value;
			return true;
		}
	};
	function checkPatt(patt){
		var data;
		data = {
			"value": patt,
			"__TestNode__": false,
			"__TestPatt__": false,
			"__TestMethod__": false};
		if (/^`.+`$/.test(patt)){
			data.value = Pattern.compile(patt.slice(1, -1));
			data.__TestPatt__ = true;
		}else if (/^#(\w+)(?:\((.*?)\))?$/.test(patt)){
			data.value = RegExp.$1;
			data.params = RegExp.$2 ? SText.split(RegExp.$2, ',', 'params', true) : [];
			data.__TestMethod__ = true;
		}else if (/^[A-Z][A-Za-z]+$/.test(patt)){
			data.__TestNode__ = true;
		}else if (/[a-z]+/i.test(patt) && /\W+/.test(patt)){
			data.__TestPatt__ = true;
		}
		return data;
	};
	function tokenize(text, index){
		var list, len, tokn;
		if (index == null) index = 0;
		list = [], len = text.length;
		while (index < len){
			if (tokn = Token.create(text, index)){
				list.push(tokn.text);
				index += tokn.text.length;
			}else {
				break;
			}
		}
		return list;
	};
	/**
	     * 
	     */
	function parseSetAsset(handle, asset, src){
		var token, text, types, value, params, defaults, ref;
		token = src.current;
		text = token.text;
		types = token.types;
		value = asset.value;
		params = handle.getHeap('params');
		defaults = null;
		if (value.__HasKey__){
			if (value.hasOwnProperty(text)){
				defaults = [value[text]];
			}else {
				for (var type, i = 0; i < types.length; i++){
					type = types[i];
					if (value.hasOwnProperty(type)){
						defaults = [value[type]];
						break;
					}
				}
				if (!defaults && params && params.length){
					for (var name, i = 0; i < params.length; i++){
						name = params[i];
						if (value.hasOwnProperty(name)){
							if (defaults){
								defaults.push(value[name]);
							}else {
								defaults = [value[name]];
							}
						}
					}
				}
			}
		}
		if (!defaults){
			defaults = value.__Defaults__;
		}
		for (var data, i = 0; i < defaults.length; i++){
			data = defaults[i];
			if (data.__TestMethod__){
				if (ref = parseMethodAsset(handle, data, src)){
					return ref;
				}
				continue;
			}
			if (data.__TestPatt__){
				if (ref = data.value.exec(handle, src)){
					return ref;
				}
				continue;
			}
			if (data.__TestNode__){
				if (ref = parseNodeAsset(handle, data, src)){
					return ref;
				}
				continue;
			}
			if (types.indexOf(data.value) != -1){
				return token;
			}
			if (text == data.value){
				return token;
			}
		}
	};
	function parsePairAsset(handle, asset, src){
		var s1, s2, ab, list;
		s1 = asset.value[0], s2 = asset.value[1];
		s1 = s1 == '*' ? src.current.text : s1;
		s2 = s2 == '*' ? src.current.text : s2;
		if (ab = src.indexPair(s1, s2, src.index, true)){
			if (ab[0] == src.index){
				list = Jsop.toArray(src, ab[0], ab[1]+1);
				src.index = ab[1];
				return list;
			}
		}
		return false;
	};
	function parseCharAsset(handle, asset, src){
		var token;
		token = src.current;
		if (asset.value.test(token.text)){
			return token;
		}
		return false;
	};
	function parseCodeAsset(handle, asset, src){
		var code_list, index, list, token;
		code_list = asset.value;
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
	function parseNodeAsset(handle, asset, src){
		var name, token, syntax, ref;
		name = asset.value;
		token = src.current;
		if (token.types.indexOf(name) != -1){
			return token;
		}
		if (syntax = handle.__grammar__[name]){
			if (ref = handle.parse(syntax, asset.params)){
				return ref;
			}
		}
		if (name == token.text){
			return token;
		}
		return false;
	};
	function parseMethodAsset(handle, asset, src){
		var name, syntax;
		name = asset.value;
		if (Methods.hasOwnProperty(name)){
			return Methods[name].call(handle, handle.heap, src, asset.params, asset.config);
		}
		if (syntax = handle.__grammar__[name]){
			return handle.parse(syntax, asset.params);
		}
	};
	return Asset;
})();
module.exports = Asset;