function caller_is(heap, src, params, config){
	var level, caller;
	if (!config.inited){
		config.test = true;
		config.inited = true;
		params.level = /-\d+/.test(params[0]) ? parseInt(params.shift()) : 0;
	}
	level = params.level;
	caller = heap.get('parent');
	while (caller && level++){
		while (/block|comma/i.test(caller.id)){
			caller = caller.parent;
		}
		caller = caller.parent;
	}
	return params.indexOf(caller.id) != -1;
};
module.exports.caller_is = caller_is;
function has_param(heap, src, params, config){
	var argus;
	config.test = true;
	argus = heap.get('params');
	if (params && argus){
		for (var item, i = 0; i < params.length; i++){
			item = params[i];
			if (argus.indexOf(item) != -1){
				return true;
			}
		}
	}
	return false;
};
module.exports.has_param = has_param;
function is_token(heap, src, params, config){
	var m, index, token;
	if (!config.inited){
		config.inited = true;
		if (m = params[0].match(/^([\+\-]{1,2})(\d+)/)){
			params.mode = [m[1], parseInt(m[2]), 0];
			params.shift();
		}else {
			params.mode = [0, 0, 0];
		}
		if (params.mode[1]){
			config.test = true;
		}
	}
	index = moveIndex(src, params.mode);
	if (!(token = src[index])){
		return false;
	}
	if (params.indexOf(token.text) != -1){
		return token;
	}
	if (token.is.apply(token, params)){
		return token;
	}
	return false;
};
module.exports.is_token = is_token;
function not_token(heap, src, params, config){
	var m, index, token;
	if (!config.inited){
		config.inited = true;
		if (m = params[0].match(/^([\+\-]{1,2})(\d+)/)){
			params.mode = [m[1], parseInt(m[2]), 0];
			params.shift();
		}else {
			params.mode = [0, 0, 0];
		}
		if (params.mode[1]){
			config.test = true;
		}
	}
	index = moveIndex(src, params.mode);
	if (!(token = src[index])){
		return false;
	}
	if (params.indexOf(token.text) != -1){
		return false;
	}
	if (token.is.apply(token, params)){
		return false;
	}
	return token;
};
module.exports.not_token = not_token;
function before(heap, src, params, config){
	var asss, left;
	if (!config.inited){
		config.inited = true;
		config.test = true;
		if (/(parent|before|last|-?\d+)/.test(params[0])){
			params[1] = params.slice(1);
			params[0] = params[0].split('.').map(function($){return parseInt($) || $});
		}else {
			params[1] = params.slice();
			params[0] = ['last'];
		}
	}
	asss = params[0];
	for (var item, i = 0; i < asss.length; i++){
		item = asss[i];
		switch (item){
			case 'parent':
				heap = heap.parent;
				if (heap && i == asss.length-1){
					left = heap.matchcache[heap.matchcache.length-1];
				}
				break;
			case 'before':
				left = heap.parent && heap.parent.matchcache[heap.parent.matchcache.length-1];
				break;
			case 'last':
				left = heap.matchcache[heap.matchcache.length-1];
				break;
			default:
				left = heap.matchcache[item < 0 ? heap.matchcache.length+item : item];
				break;
		}
	}
	if (left && left.is){
		return !!left.is.apply(left, params[1]);
	}
	return false;
};
module.exports.before = before;
function sugar_box(heap, src, params, config){
	// TODO: check point
	var sugarBox, name, map, node, sugar;
	if (!(sugarBox = this.sugarBox || !(name = params[0]))){
		return false;
	}
	if (map = sugarBox[name]){
		for (var i in map){
			if (!map.hasOwnProperty(i)) continue;
			var sugar = map[i];
			if (node = this.parse(sugar, params)){
				return node;
			}
		}
		return false;
	}
	if (sugar = sugarBox.get(params[0])){
		if (node = this.parse(sugar, params)){
			return node;
		}
	}
	return false;
};
module.exports.sugar_box = sugar_box;
function check_indent(heap, src, params, config){
	var start_indent;
	start_indent = heap.get('startIndent');
	if (start_indent == null){
		start_indent = heap.set('startIndent', src.lineIndent(heap.get('startIndex')));
	}
	switch (params[0]){
		case 'in':
			return start_indent < src.lineIndent();
		case 'out':
			return start_indent > src.lineIndent();
		default:
			return start_indent == src.lineIndent();
	}
	return false;
};
module.exports.check_indent = check_indent;
function moveIndex(src, data){
	var index, num;
	index = src.index;
	if (data){
		num = data[1];
		while (--num >= 0){
			switch (data[0]){
				case '++':
					index++;
					break;
				case '+':
				default:
					index = src.nextIndex(index, !data.lf);
					break;
				case '--':
					index--;
					break;
				case '-':
					index = src.prevIndex(index, !data.lf);
					break;
			}
		}
	}
	return index;
};