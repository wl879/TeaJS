var Standard = (function(){
	var Pattern = require("./pattern.js");
	var cache = Jsop();
	Standard.prototype.isStandard = true;
	function Standard(data){
		var m;
		if (typeof data == 'function'){
			this.callback = data;
		}else {
			if (m = data.match(/^\(\?(debug)\)/)){
				this.debug = true;
				data = data.substr(m[0].length);
			}
			this.string = data;
			this.branch = [];
			compileStandar(this, data);
			trimStandar(this);
			this.debug && print(this);
		}
	};
	Standard.compile = function(patt){
		if (!cache[patt]){
			cache[patt] = new Standard(patt);
		}
		return cache[patt];
	};
	function compileStandar(trunk, patt){
		var list, up_cache, indent, item;
		list = SText.clip(patt.replace(/^\s*\n/mg, '')).split('\n');
		up_cache = [];
		indent = -1;
		for (var line, i = 0; i < list.length; i++){
			line = list[i];
			item = compileBranch(line);
			if (indent == -1){
				trunk.indent = indent = item.indent;
			}
			if (item.indent > indent){
				if (trunk.branch[trunk.branch.length-1].branch){
					up_cache.push(trunk);
					trunk = trunk.branch[trunk.branch.length-1];
					trunk.indent = indent = item.indent;
				}
			}else if (item.indent < indent){
				while (item.indent < trunk.indent){
					trunk = up_cache.pop();
				}
				indent = item.indent;
			}
			if ((item.control == 'case' || item.control == 'default') && trunk.control != 'switch'){
				Tea.error(5009, data);
			}
			if (Array.isArray(item)){
				trunk.branch.push.apply(trunk.branch, item);
			}else {
				trunk.branch.push(item);
			}
		}
	};
	function compileBranch(patt){
		var indent, keyword, cond, ref, data, params;
		ref = splitControlPattern(patt), indent = ref[0], keyword = ref[1], cond = ref[2], patt = ref[3];
		if (!keyword){
			return createPatternList(patt, indent);
		}
		data = {"control": keyword, "condition": null, "branch": [], "indent": indent};
		switch (keyword){
			case 'if':case 'else if':case 'switch':
				data.condition = '#{'+cond+'}';
				break;
			case 'each':
				params = SText.split(cond, ',', true, true);
				data.condition = {
					"target": '#{'+params.shift()+'}',
					"index": /^\d$/.test(params[0]) ? parseInt(params.shift()) : 0,
					"join": params[0] ? params[0].replace(/^(\`|\"|\')([\w\W]*?)\1$/, '$2') : ''};
				break;
			case 'case':
				data.condition = SText.split(cond, ',', true, true);
				break;
		}
		if (patt){
			data.branch.push.apply(data.branch, createPatternList(patt, indent));
		}
		return data;
	};
	function splitControlPattern(patt){
		var m, indent, keyword, b, cond, ab;
		m = patt.match(/^(\s*)(else if|else|if|each|switch|case|default)?\s*/);
		indent = m[1].length || 0;
		keyword = m[2];
		if (keyword){
			patt = patt.substr(m[0].length);
			if (keyword != 'else' && keyword != 'default'){
				if (keyword == 'case'){
					b = patt.match(/[^\\]:/).index+1;
					cond = patt.substr(0, b).trim();
					patt = patt.substr(b+1);
				}else {
					ab = SText.indexPair(patt, '(', ')');
					if (!ab || ab[0] != 0){
						Tea.error(5008, m.input);
					}
					cond = patt.substr(1, ab[1]-1).trim();
					patt = patt.substr(ab[1]+1);
				}
			}
			patt = patt.replace(/^\s*:/, '');
		}
		return [indent, keyword, cond, patt.trim()];
	};
	function createPatternList(patt, indent){
		var list;
		list = SText.split(patt, ';', true, true);
		for (var i = 0; i < list.length; i++){
			list[i] = {"pattern": list[i]};
		}
		list.indent = indent;
		return list;
	};
	function trimStandar(data){
		var branch, group;
		branch = data.branch;
		for (var sub, i = 0; i < branch.length; i++){
			sub = branch[i];
			if (sub.branch){
				trimStandar(sub);
				if (sub.control == 'if'){
					group = {"control": 'if group', "branch": [sub]};
					branch.splice(i, 1, group);
					continue;
				}else if (sub.control == 'else if' || sub.control == 'else'){
					if (!group){
						Tea.error(5008);
					}
					group.branch.push(sub);
					branch.splice(i--, 1);
					continue;
				}
			}
			group = null;
		}
	};
	/**
	     * parser
	     */
	Standard.prototype.exec = function (handle, node, params, __not_init){
		var scope, heap, result, block_cache, head_card, foot_card, heads, let_undefines, undefines, foots;
		scope = node.scope;
		if (!__not_init && handle.heap.target != node){
			handle.initHeap(node.type, {"target": node});
			if (scope.target == node){
				handle.heap.set('scope-heap', scope.type);
				if (scope.type == 'FunctionScope' || scope.type == 'ClassScope'){
					if (heap = handle.heap.find('block-cache')){
						result = handle.card('Cache');
						heap.cache('block-cache', [handle.heap, this, node, params, result]);
						handle.heap = handle.heap.parent;
						return result;
					}
				}
			}
			if (/root|block/i.test(node.type)){
				handle.heap.set('block-cache', []);
			}
		}
		heap = handle.heap;
		result = checkStandard(handle, this, node, params);
		if (block_cache = heap.get('block-cache', true)){
			for (var data, i = 0; i < block_cache.length; i++){
				data = block_cache[i];
				handle.heap = data[0];
				data[4].copy(data[1].exec(handle, data[2], data[3], true));
				handle.heap = heap;
			}
		}
		if (heap.get('scope-heap')){
			head_card = heap.get('HeadNode');
			foot_card = heap.get('FootNode');
			if (heads = heap.get('heads', true)){
				head_card.insert(0, heads);
			}
			if (!handle.argv('--safe')){
				if (scope.type == 'LetScope'){
					heap.cache('let-undefines', [head_card, scope], 'scope-heap', scope.valid.type);
				}else {
					if (let_undefines = heap.get('let-undefines', true)){
						for (var data, i = 0; i < let_undefines.length; i++){
							data = let_undefines[i];
							undefines = data[1].undefineds();
							if (undefines.length){
								data[0].insert(0, handle.card('VarDecl', 'var ', Jsop.join(undefines, ',')));
							}
						}
					}
					undefines = scope.undefineds();
					if (undefines.length){
						head_card.insert(0, handle.card('VarDecl', 'var ', Jsop.join(undefines, ',')));
					}
				}
			}
			if (foots = heap.get('foots', true)){
				foot_card.add(foots);
			}
		}
		return handle.didHeap(result);
	};
	function checkStandard(handle, std, node, params){
		var ref, card;
		if (std.callback){
			ref = std.callback.call(handle, handle.heap, node, params);
			if (ref && typeof ref == 'string'){
				ref = Pattern.exec(handle, ref, node);
			}
		}else {
			ref = checkBranch(handle, std.branch, node);
			if (Array.isArray(ref) && ref.length == 1){
				ref = ref[0];
			}
		}
		if (ref){
			if (!ref.isCard && ref !== true){
				card = handle.card(node.type);
				for (var item, i = 0; i < ref.length; i++){
					item = ref[i];
					card.add(card.type == item.type ? Jsop.toArray(item) : item);
				}
				ref = card;
			}
		}
		return ref;
	};
	function checkBranch(handle, branch, node, pack_name){
		var list, ref;
		list = [];
		for (var item, i = 0; i < branch.length; i++){
			item = branch[i];
			if (item.pattern){
				if (!item.pattern.isTransformPattern){
					item.pattern = Pattern.compile(item.pattern);
				}
				ref = Pattern.exec(handle, item.pattern, node, pack_name);
				if (item.pattern.type == 'Logic'){
					continue;
				}
			}else {
				switch (item.control){
					case 'if group':
						ref = checkIfBranch(handle, item.branch, node);
						break;
					case 'switch':
						ref = checkSwitchBranch(handle, item.condition, item.branch, node);
						break;
					case 'each':
						ref = checkEachBranch(handle, item.condition, item.branch, node);
						break;
					default:
						Tea.error(5008);
						break;
				}
			}
			if (ref && ref !== true){
				if (Array.isArray(ref)){
					list.push.apply(list, ref);
				}else {
					list.push(ref);
				}
			}
		}
		if (list.length){
			return list;
		}
	};
	function checkIfBranch(handle, branch, node){
		for (var item, i = 0; i < branch.length; i++){
			item = branch[i];
			if (item.control == 'if' || item.control == 'else if'){
				if (!item.condition.isTransformPattern){
					item.condition = Pattern.compile(item.condition);
				}
				if (Pattern.exec(handle, item.condition, node)){
					return checkBranch(handle, item.branch, node);
				}
			}else if (item.control == 'else'){
				return checkBranch(handle, item.branch, node);
			}
		}
	};
	function checkSwitchBranch(handle, cond, branch, node){
		var tar, def;
		tar = Pattern.exec(handle, cond, node);
		for (var item, i = 0; i < branch.length; i++){
			item = branch[i];
			if (item.control == 'default'){
				def = item;
				continue;
			}
			if (item.control == 'case'){
				if (tar.is && tar.is.apply(tar, item.condition) || item.condition.indexOf(tar.text || tar) != -1){
					return checkBranch(handle, item.branch, node);
				}
			}
		}
		if (def){
			return checkBranch(handle, def.branch, node);
		}
	};
	function checkEachBranch(handle, cond, branch, node){
		var target, index, join, list, ref;
		target = cond.target ? Pattern.exec(handle, cond.target, node) : node;
		index = cond.index || 0;
		join = cond.join;
		list = [];
		for (var sub, i = index; i < target.length; i++){
			sub = target[i];
			handle.heap.variable('eachIndex', i);
			if (ref = checkBranch(handle, branch, sub, target.type)){
				list.push.apply(list, ref);
			}
		}
		if (join){
			Jsop.join(list, join);
		}
		if (list.length){
			return handle.card(node.type, list);
		}
	};
	return Standard;
})();
module.exports = Standard;