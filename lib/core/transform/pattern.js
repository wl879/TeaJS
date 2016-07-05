var Pattern = (function(){
	var Asset = require("./asset.js");
	var Method = require("./method.js");
	var cache = Jsop();
	function Pattern(text){
		var m;
		this.length = 0;
		this.string = text;
		text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
		if (m = text.match(/^\(@:([A-Z]\w+)\)\s*/)){
			this.name = m[1];
			text = text.substr(m[0].length);
		}
		while (m = Asset.test(text)){
			if (m.index){
				this.add(text.slice(0, m.index));
			}
			this.add(Asset.compile(m));
			text = text.substr(m.index+m[0].length);
		}
		if (text){
			this.add(text);
		}
		if (this.length == 1 && this[0].type == 'Logic'){
			this.type = 'Logic';
		}
	};
	Pattern.prototype.add = function (){
		for (var asset, i = 0; i < arguments.length; i++){
			asset = arguments[i];
			if (typeof asset == 'string'){
				asset = SText.cleanESC(asset);
			}
			this[this.length++] = asset;
		}
		return this;
	};
	Pattern.prototype.isTransformPattern = true;
	Pattern.test = function(text){
		return !!Asset.test(text);
	};
	Pattern.compile = function(text, type){
		var key;
		key = text+(type || '');
		if (cache[key]){
			return cache[key];
		}
		return cache[key] = new Pattern(text, type);
	};
	/**
	     * parser
	     */
	Pattern.prototype.exec = function (handle, node, name){
		if (this.type == 'Logic'){
			return parseAsset(handle, this[0], node);
		}
		return parsePattern(handle, this, node, name);
	};
	Pattern.exec = function(handle, patt, node, name){
		if (!patt.isTransformPattern){
			if (!Pattern.test(patt)){
				return patt;
			}
			patt = Pattern.compile(patt);
		}
		return patt.exec(handle, node, name);
	};
	function parsePattern(handle, patt, node, name){
		var list, ref;
		list = [];
		for (var asset, i = 0; i < patt.length; i++){
			asset = patt[i];
			if (!asset.isAsset){
				list.push(asset);
				continue;
			}
			ref = parseAsset(handle, asset, node);
			if (ref === true || ref === ''){
				continue;
			}
			if (ref === 0){
				list.push('0');
				continue;
			}
			if (ref){
				if (asset.type == 'Logic'){
					continue;
				}
				if (ref.isNode){
					if (handle.heap.id == node.type && ref == node){
						for (var sub, j = 0; j < ref.length; j++){
							sub = ref[j];
							list.push(handle.transform(sub));
						}
					}else {
						list.push(handle.transform(ref));
					}
					continue;
				}else if (ref.isToken){
					ref = handle.transform(ref);
				}
				list.push(ref);
				continue;
			}
			if (typeof list[list.length-1] == 'string'){
				ref = list[list.length-1].replace(/\s*(\,|\.|\:\:)*\s*$/, '');
				if (!ref){
					list.pop();
				}else {
					list[list.length-1] = ref;
				}
			}
		}
		if (list.length){
			name = name || patt.name || node.type || 'Card';
			if (list.length == 1){
				if (list[0].isCard && list[0].type == name){
					return list[0];
				}
			}
			return handle.card(name, list);
		}
	};
	/**
	     * transform asset parser
	     */
	function parseAsset(handle, asset, node){
		switch (asset.type){
			case 'Cache':
				return parseCacheAsset(handle, asset, node);
			case 'Acc':
				return parseAccAsset(handle, asset, node);
			case 'Call':
				return parseCallAsset(handle, asset, node);
			case 'Logic':
				return parseLogicAsset(handle, asset, node);
		}
	};
	function parseCacheAsset(handle, asset, node){
		var variables;
		if (asset.quick){
			return node[asset.name];
		}
		variables = handle.heap.variables;
		if (variables && variables.hasOwnProperty(asset.name)){
			return variables[asset.name];
		}
		return checkKeyAsset(handle, asset.name, node);
	};
	function parseAccAsset(handle, asset, node){
		var keys, len, ref;
		if (keys = asset.params){
			for (var key, i = 0; i < keys.length; i++){
				key = keys[i];
				if (!node) return;
				if (key < 0){
					len = node.length;
					if (/block/i.test(node.type)){
						while (key++ < 0){
							len -= 1;
							while (node[len] && node[len].is('COMMENT')){
								len -= 1;
							}
						}
						node = node[len];
					}else {
						node = node[len+key];
					}
					continue;
				}
				if (key == '@'){
					node = node.parent;
					continue;
				}
				if (ref = checkKeyAsset(handle, key, node, i)){
					node = ref;
					continue;
				}
				node = node[key];
			}
		}
		return node;
	};
	function parseCallAsset(handle, asset, node){
		var params, name, ref;
		params = asset.params;
		name = asset.name;
		if (params && params.length){
			if (params[0].isAsset && (params[0].type == 'Acc' || params[0].type == 'Cache')){
				node = parseAsset(handle, params[0], node);
				params = params.slice(1);
			}else {
				params = params.slice();
			}
			for (var i = 0; i < params.length; i++){
				if (/^@[a-z_]+$/i.test(params[i])){
					params[i] = handle.heap.variable(params[i].substr(1)) || params[i];
				}
			}
		}
		ref = checkMethod(handle, name, node, params);
		if (ref == null){
			ref = handle.transform(name, node, params);
		}
		return ref;
	};
	function parseLogicAsset(handle, patt, node){
		var exprs, ref;
		exprs = patt.exprs;
		for (var item, i = 0; i < exprs.length; i++){
			item = exprs[i];
			ref = parseLogicExpr(handle, item, node);
			if (ref){
				if (!item.and){
					return ref;
				}
			}else if (item.and){
				return false;
			}
		}
		return false;
	};
	function checkKeyAsset(handle, name, node, is_ass){
		switch (name){
			case 'ref':
				return checkMethod(handle, 'var', node, ['let undefined', name]);
			case 'i':
				return checkMethod(handle, 'var', node, ['let undefined', name]);
			case 'name':
				return node.isScope ? node.valid.name : node.scope.valid.name;
			case 'Class':case 'Function':case 'Root':
				return (node.isScope ? node : node.scope).query(name+'Scope');
			default:
				if (name[0] == '?'){
					return node[name.substr(1)] || node;
				}
				if (name[0] == '#'){
					if (!is_ass){
						return handle.heap.variable(name.substr(1));
					}
					return node[handle.heap.variable(name.substr(1))];
				}
				break;
		}
	};
	function checkMethod(handle, name, node, params){
		if (Method.hasOwnProperty(name)){
			return Method[name](handle, node, params);
		}
	};
	// Tea.error 5002, name, std, node;
	function parseLogicExpr(handle, item, node){
		var oper, left, right;
		oper = item.oper;
		if (oper == '-=' || oper == '+=' || oper == '='){
			left = item.left;
			right = parseLogicHand(handle, item.right, node);
			handle.heap.variable(left.name, parseInt(right) || right, oper);
			return true;
		}
		left = parseLogicHand(handle, item.left, node);
		right = parseLogicHand(handle, item.right, node);
		switch (oper){
			case '===':case '!==':case '==':case '!=':
				if (!(typeof right == 'object')){
					right = [right];
				}
				if (left){
					if (right.indexOf(left.text || left) != -1){
						return oper[0] == '!' ? false : true;
					}
					if (oper.length == 3){
						if (left.type && right.indexOf(left.type) != -1){
							return oper[0] == '!' ? false : true;
						}
					}else {
						if (left.is && left.is.apply(left, right)){
							return oper[0] == '!' ? false : true;
						}
					}
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
			default:
				return left;
		}
	};
	function parseLogicHand(handle, exps, node){
		var list, NOT;
		if (!exps || !exps.length){
			return exps;
		}
		list = [];
		for (var exp, i = 0; i < exps.length; i++){
			exp = exps[i];
			if (exp == '!'){
				NOT = true;
				continue;
			}
			if (exp.isAsset){
				exp = parseAsset(handle, exp, node);
			}
			list.push(NOT ? !exp : exp);
			NOT = false;
		}
		if (list.length == 1){
			return list[0];
		}
		for (var i = 0; i < list.length; i++){
			if (list[i].isNode || list[i].isToken || list[i].isCard){
				list[i] = list[i].text;
			}
		}
		return eval(list.join(''));
	};
	return Pattern;
})();
module.exports = Pattern;