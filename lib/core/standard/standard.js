var Standard = (function(){
	var base;
	function Standard(version, prepor){
		this.prepor = prepor;
		if (typeof version == 'Object'){
			this.standard = version;
			this.version = '';
		}else {
			this.standard = Standard[version];
			this.version = version;
		}
		this.handle = {};
	};
	var Card = require("../card.js");
	var Pattern = require("./pattern.js");
	var Scope = require("../scope.js");
	base = {};
	Standard.prototype.read = function (node, loop, __read){
		var ref, _handle;
		if (!node || (!node.isSyntax && !node.isToken)){
			return node;
		}
		// cache block
		if (!loop && !__read && node.type == 'BlockNode'){
			if (ref = cacheBlockNode(this, node)){
				return ref;
			}
		}
		_handle = this.handle;
		if (_handle.target != node){
			this.handle = {"target": node, "up": _handle, "variables": {}};
		}
		if (!loop){
			if (Scope.test(node)){
				node.scope.check(node);
			}
			if (ref = checkStandard(this, node.type, node)){
				if (ref.isSyntax){
					ref = this.read(ref, ref == node);
				}
			}
		}
		if (ref == null && node.isSyntax){
			ref = new Card(node.type);
			for (var item, i = 0; i < node.length; i++){
				item = node[i];
				if (item){
					ref.add(this.read(item));
				}
			}
		}
		checkBlockNode(this, node, ref, loop);
		this.handle = _handle;
		return ref != null ? ref : node;
	};
	Standard.prototype.parser = function (name, node, params, __try){
		if (this.standard[name] || base[name]){
			return checkStandard(this, name, node, params);
		}else if (!__try){
			throw Error.create(5003, name, node, new Error());
		}
	};
	Standard.prototype.pattern = function (patt, node, type){
		var card;
		if (/#|@/.test(patt)){
			card = Pattern.parse(this, patt, node);
			if (type){
				card.type = type;
			}
			return card;
		}
		if (type){
			return new Card(type, patt);
		}
		return patt;
	};
	Standard.es5 = base;
	function cacheBlockNode(std, node){
		var scope, parent, card;
		scope = node.scope;
		if (scope.type == 'Function' || scope.type == 'Class'){
			parent = scope.parent;
			card = new Card('Cache');
			parent.cachePush('blocks', [card, node, std.handle]);
			return card;
		}
	};
	function checkBlockNode(std, node){
		// if ref:
		// 	if ref.type == 'Root' || ref.type == 'Block':
		// 		block = ref;
		// 	else if ref[1] && ref[1].type == 'Block':
		// 		block = ref[1];		
		// 	if block:
		// 		console.log('?????????', ref.type, loop)
		var scope, blocks, card;
		scope = node.scope;
		if (scope.target != node){
			return;
		}
		if (blocks = scope.cache.blocks){
			if (blocks.length){
				for (var data, i = 0; i < blocks.length; i++){
					data = blocks[i];
					card = data[0];
					node = data[1];
					std.handle = data[2];
					card.add(std.read(node, false, true));
					checkBlockNode(std, node.scope.target);
				}
				blocks.length = 0;
			}
		}
	};
	function checkStandard(std, name, node, params){
		var ref, sub_std;
		ref = null;
		setHandle(std.handle, 'standard', name);
		if (std.prepor && std.prepor.standards[name]){
			ref = std.prepor.standards[name].parse(std, node);
		}
		// 	std_conds = std.prepor.get(name, 'statement', 'expression'):
		// 	if std_conds.read:
		// 		ref = std_conds.read(std, node);
		// ref = checkPattern(std, ref, node, params);
		if (!ref){
			if (sub_std = std.standard[name]){
				setHandle(std.handle, 'version', std.version);
				ref = checkCondition(std, sub_std, node, params);
			}
			if (ref === undefined && std.standard != base){
				if (sub_std = base[name]){
					setHandle(std.handle, 'version', 'base');
					ref = checkCondition(std, sub_std, node, params);
				}
			}
		}
		if (ref === undefined){
			if (!sub_std){
				return node;
			}
		}
		return ref;
	};
	function checkCondition(std, sub_std, node, params){
		var list, ref;
		if (sub_std.isStandard === 'list'){
			list = [];
			for (var i = 0; i < sub_std.length; i++){
				if (ref = checkCondition(std, sub_std[i], node, params)){
					list.push(ref);
				}
			}
			return list.length ? list : "";
		}
		for (var cond in sub_std){
			if (!sub_std.hasOwnProperty(cond)) continue;
			if (['isStandard', 'default'].indexOf(cond)>=0){
				continue;
			}
			setHandle(std.handle, 'condition', cond);
			setHandle(std.handle, 'pattern', sub_std[cond]);
			if (parseCondition(std, cond, node)){
				if ((ref = checkPattern(std, sub_std[cond], node, params)) == undefined){
					continue;
				}
				break;
			}
		}
		if (ref == undefined){
			if (sub_std['default']){
				ref = checkPattern(std, sub_std['default'], node, params);
			}
		}
		return ref;
	};
	function checkPattern(std, patt, node, params){
		if (patt && patt.error){
			throw Error.create(patt.error, node, new Error());
		}
		if (patt && patt.isStandard){
			return checkCondition(std, patt, node, params);
		}
		if (patt && typeof patt == 'function'){
			patt = patt.call(std, node, params);
		}
		if (patt && typeof patt == 'string'){
			patt = Pattern.parse(std, patt, node);
		}
		return patt;
	};
	function parseCondition(std, text, node){
		return Pattern.parse(std, Pattern.compile(text, 'Logic'), node);
	};
	function setHandle(handle, name, value){
		if (!/standard|version|condition|pattern/.test(name)){
			handle.variables[name] = value;
		}else {
			handle[name] = value;
			switch (name){
				case 'standard':
					handle.version = null;
				case 'version':
					handle.condition = null;
				case 'condition':
					handle.pattern = null;
					break;
			}
		}
		return value;
	};
	return Standard;
})();
module.exports = Standard;