var Asset = (function(){
	var cache = Jsop();
	var asset_re = /#(\w+)(\()?|#\{(.*?)\}|@(\w+)|@\[(.*?)\]|@/;
	Asset.prototype.isAsset = true;
	function Asset(match){
		if (typeof match == 'string'){
			match = Asset.test(match);
		}
		this.string = match[0];
		if (match[1]){
			return checkCallAsset(this, match[1], match[2]);
		}
		if (match[3]){
			return checkLogicAsset(this, match[3]);
		}
		if (match[4]){
			return checkCacheAsset(this, match[4]);
		}
		checkAccAsset(this, match[5]);
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
	Asset.compile = function(match){
		var str;
		if (typeof match == 'string'){
			if (cache[match]){
				return cache[match];
			}
			match = Asset.test(match);
		}
		str = match[0];
		if (!cache[str]){
			cache[str] = new Asset(match);
		}
		return cache[str];
	};
	function checkLogicAsset(self, text){
		var slice, expr, item;
		self.type = 'Logic';
		self.exprs = [];
		slice = SText.split(text, /\&\&|\|\|/, false);
		for (var str, i = 0; i < slice.length; i++){
			str = slice[i];
			str = str.trim();
			expr = SText.split(str, / (?:\=\=\=|\!\=\=|\=\=|\!\=|\=|\-\=|\+\=|\>\=|\<\=|\>|\<) /, false);
			if (expr.length > 3){
				Tea.error(5006, str);
			}
			item = {
				"left": checkLogicHand(expr[0]),
				"right": checkLogicHand(expr[2]),
				"oper": expr[1] && expr[1].trim(),
				"string": str,
				"and": slice[++i] == '&&'};
			if (item.oper == '='){
				if (item.left.length != 1 || item.left[0].type != 'Cache'){
					Tea.error(5006, str);
				}
				item.left = item.left[0];
			}
			self.exprs.push(item);
		}
		return self;
	};
	function checkLogicHand(text){
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
	function checkCallAsset(self, name, params){
		self.type = 'Call';
		self.name = name;
		if (params){
			params = SText.split(params, ',', true);
			for (var item, i = 0; i < params.length; i++){
				item = params[i];
				if (i == 0 && /^@(\w+|\[.*?\])?$/.test(item)){
					params[i] = Asset.compile(item);
				}else if (/^(\`|\"|\')([\w\W]*?)\1$/.test(item)){
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
	function checkCacheAsset(self, name){
		self.type = 'Cache';
		self.name = name;
		if (/^\d+$/.test(self.name)){
			self.quick = true;
		}
	};
	return Asset;
})();
module.exports = Asset;