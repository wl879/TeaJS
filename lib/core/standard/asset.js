var Asset = (function(){
	var Method, cache, asset_re;
	Method = require("./method.js");
	cache = Jsop.data();
	asset_re = /#(\w*)(\()?|@(\w+)|@\[(.*?)\]|@|(--\w+\b)/;
	function Asset(str){
		var match;
		if (!(typeof str == 'string')){
			match = str;
			str = match[0];
		}else {
			match = Asset.test(str);
		}
		this.string = str;
		checkAssetType(this, match);
	};
	Asset.prototype.parse = function (){
		switch (this.type){
			case 'Acc':
				return parseAccAsset.apply(this, arguments);
			case 'Call':
				return parseCallAsset.apply(this, arguments);
			case 'Cache':
				return parseCacheAsset.apply(this, arguments);
			case 'Argv':
				return Argv[this.name];
			case 'Logic':
				return parseLogicAsset.apply(this, arguments);
		}
	};
	Asset.prototype.isAsset = true;
	Asset.compile = function(match, logic){
		var str;
		if (typeof match == 'string'){
			if (cache[match]){
				return cache[match];
			}
			if (logic){
				match = [match, null, match];
			}else {
				match = Asset.test(match);
			}
		}
		str = match[0];
		if (!cache[str]){
			cache[str] = new Asset(match);
		}
		return cache[str];
	};
	Asset.test = function(text, is_all){
		var m, ab;
		if (m = text.match(asset_re)){
			if (m[2]){
				if (ab = SText.indexPair(text, '(', ')', m.index+m[1].length)){
					m[2] = text.slice(ab[0]+1, ab[1]);
					m[0] = text.slice(m.index, ab[1]+1);
				}
			}
			if (is_all){
				if (m[0] != text){
					return;
				}
			}
		}
		return m;
	};
	Asset.parse = function(asset, node, std){
		if (!asset.isAsset){
			asset = Asset.compile(asset);
		}
		return asset.parse(node, std);
	};
	// compile asset
	function checkAssetType(self, match){
		var m;
		if (match[1]){
			checkCallAsset(self, match[1], match[2]);
			return true;
		}
		if (match[2]){
			if (m = Asset.test(match[2], true)){
				return checkAssetType(self, m);
			}
			checkLogicAsset(self, match[2]);
			return true;
		}
		if (match[3]){
			self.type = 'Cache';
			self.name = match[3];
			if (/^\d+$/.test(self.name)){
				self.quick = true;
			}
			return true;
		}
		if (match[5]){
			self.type = 'Argv';
			self.name = match[5];
			return true;
		}
		checkAccAsset(self, match[4]);
		return true;
	};
	function checkCallAsset(self, name, params){
		self.type = 'Call';
		self.name = name;
		if (params){
			params = SText.split(params, ',', true);
			for (var item, i = 0; i < params.length; i++){
				item = params[i];
				if (i == 0 && /^@(\w+|\[.*?\])?$/.test(item)){
					params[i] = Asset.compile(item);
				}else if (/^\`([\w\W]*?)\`$/.test(item)){
					params[i] = item.slice(1, -1).trim();
				}
			}
		}
		self.params = params || [];
		return true;
	};
	function checkAccAsset(self, params){
		self.type = 'Acc';
		if (params){
			params = params.split('.');
			for (var item, i = 0; i < params.length; i++){
				item = params[i];
				params[i] = /^-?\d+$/.test(item) ? parseInt(item) : item;
			}
		}
		self.params = params || [];
		return true;
	};
	function checkLogicAsset(self, text){
		var slice, temp, item;
		self.type = 'Logic';
		self.length = 0;
		slice = SText.split(text, /\&\&|\|\|/, false);
		for (var str, i = 0; i < slice.length; i++){
			str = slice[i];
			str = str.trim();
			temp = SText.split(str, / (?:\=\=\=|\!\=\=|\=\=|\!\=|\=|\>\=|\<\=|\>|\<) /, false);
			if (temp.length > 3){
				throw Error.create(5006, str, new Error());
			}
			item = {
				"left": checkLogicCompute(temp[0]),
				"right": checkLogicCompute(temp[2]),
				"oper": temp[1] && temp[1].trim(),
				"string": str,
				"and": slice[++i] == '&&'};
			self[self.length++] = item;
		}
		return self;
	};
	function checkLogicCompute(text){
		var list, slice, m;
		if (text){
			list = [];
			slice = SText.split(text.trim(), /(?:^| )(?:\+|\-) |!/, false);
			for (var str, i = 0; i < slice.length; i++){
				str = slice[i];
				str = str.trim();
				if (/^\[.*\]$/.test(str)){
					list.push(SText.split(str.slice(1, -1), ' ', true, true));
				}else {
					if (m = Asset.test(str, true)){
						list.push(Asset.compile(m));
					}else if (str){
						list.push(SText.cleanESC(str));
					}
				}
			}
			return list;
		}
	};
	// parse asset
	function parseAccAsset(node, std){
		var list, len, ref;
		if (list = this.params){
			for (var acc, i = 0; i < list.length; i++){
				acc = list[i];
				if (!node){
					return;
				}
				if (acc < 0){
					len = node.length;
					if (/block/i.test(node.type)){
						while (acc++ < 0){
							len -= 1;
							while (node[len] && node[len].is('COMMENT')){
								len -= 1;
							}
						}
						node = node[len];
					}else {
						node = node[len+acc];
					}
					continue;
				}
				if (acc == '@'){
					node = node.parent;
					continue;
				}
				if (ref = checkQuick(acc, node, std)){
					node = ref;
					continue;
				}
				node = node[acc];
			}
		}
		return node;
	};
	function parseCallAsset(node, std){
		var params, name, ref;
		params = this.params;
		name = this.name;
		if (params && params.length){
			if (params[0].isAsset && (params[0].type == 'Acc' || params[0].type == 'Cache')){
				node = params[0].parse(node, std);
				params = params.slice(1);
			}
		}
		ref = std.parser(name, node, params, true);
		if (ref != null){
			return ref;
		}
		return callMethod(name, node, params, std);
	};
	function parseCacheAsset(node, std){
		var vars, ref;
		if (this.quick){
			return node[this.name];
		}
		vars = std.handle.variables;
		if (vars.hasOwnProperty(this.name)){
			return vars[this.name];
		}
		if (ref = checkQuick(this.name, node, std)){
			return ref;
		}
		// if @.name == 'ref' || @.name == 'i':
		// 	return callMethod('VAR', node, ['let', @.name], std);
		return '';
	};
	function checkQuick(name, node, std){
		var scope;
		switch (name){
			case 'ref':
				return callMethod('VAR', node, ['undefined ref', name], std);
			case 'i':
				return callMethod('VAR', node, [name], std);
			case 'name':
				return node.isScope ? node.valid.name : node.scope.valid.name;
			case 'super':
				scope = (node.isScope ? node : node.scope).query('Class');
				return scope && scope.super;
			case 'Class':case 'Function':case 'Root':
				return node.isScope ? node.query(name) : node.scope.query(name);
		}
	};
	function parseLogicAsset(node, std){
		var ref;
		ref = false;
		for (var item, i = 0; i < this.length; i++){
			item = this[i];
			ref = parseLogicCompare(item, node, std);
			if (ref){
				if (!item.and){
					return true;
				}
			}else if (item.and){
				return false;
			}
		}
		return false;
	};
	function parseLogicCompare(item, node, std){
		var oper, asset, left, right;
		oper = item.oper;
		if (!oper){
			return parseLogicCompute(item.left, node, std);
		}
		if (oper == '='){
			if (item.left.length == 1){
				asset = item.left[0];
				if (asset.isAsset && asset.type == 'Cache'){
					std.handle.variables[asset.name] = parseLogicCompute(item.right, node, std);
					return true;
				}
			}
			return false;
		}
		left = parseLogicCompute(item.left, node, std);
		right = parseLogicCompute(item.right, node, std);
		switch (oper){
			case '===':case '!==':case '==':case '!=':
				if (typeof right == 'string'){
					right = [right];
				}
				if (left){
					if (left.text && right.indexOf(left.text) != -1){
						return oper[0] == '!' ? false : true;
					}
					if (oper.length == 3){
						if (left.type && right.indexOf(left.type) != -1){
							return oper[0] == '!' ? false : true;
						}
					}else {
						if (left.is && left.is.apply(left, right)){
							return oper == '!=' ? false : true;
						}
					}
				}
				if (right.indexOf(left) != -1){
					return oper[0] == '!' ? false : true;
				}
				return oper[0] == '!' ? true : false;
			case '>=':
				return left >= right;
			case '<=':
				return left <= right;
			case '>':
				return left > right;
			case '<':
				return left < right;
		}
	};
	function parseLogicCompute(exps, node, std){
		var list, _not;
		if (!exps || !exps.length){
			return null;
		}
		list = [];
		for (var exp, i = 0; i < exps.length; i++){
			exp = exps[i];
			if (exp.isAsset){
				exp = exp.parse(node, std);
			}else if (exp == '!'){
				_not = true;
				continue;
			}
			list.push(_not ? !exp : exp);
			_not = false;
		}
		if (list.length == 1){
			return list[0];
		}
		for (var i = 0; i < list.length; i++){
			if (list[i].isToken || list[i].isSyntax || list[i].isCard){
				list[i] = list[i].text;
			}
		}
		return eval(list.join(''));
	};
	function callMethod(name, node, params, std){
		if (!(Method.hasOwnProperty(name))){
			throw Error.create(5002, name, std, node, new Error());
		}
		return Method[name].call(std, node, params);
	};
	return Asset;
})();
module.exports = Asset;