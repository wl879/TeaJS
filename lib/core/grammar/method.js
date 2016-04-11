function SUGAR(src, params){
	var map, sugar, node;
	if (!this.prepor){
		return;
	}
	if (!(map = this.prepor[params[0]])){
		if (sugar = this.prepor.check(params[0])){
			if (node = sugar.parse(this, src)){
				return node;
			}
		}
		return;
	}
	for (var name in map){
		if (!map.hasOwnProperty(name)) continue;
		var sugar = map[name];
		if (node = sugar.parse(this, src)){
			return node;
		}
	}
};
module.exports.SUGAR = SUGAR;
function CHECK(src, params, config){
	var left, mark, right, last;
	if (!config.test){
		params[2] = params[2].split(' ');
		config.test = true;
	}
	left = params[0];
	mark = params[1];
	right = params[2];
	switch (left){
		case 'last':
			last = this.handle.cache;
			while (isArray(last)){
				last = last[last.length-1];
			}
			break;
		default:
			last = this.handle.cache[left];
			break;
	}
	if (last && last.is){
		switch (mark){
			case "==":
				return !!last.is.apply(last, right);
			case "===":
				return right.indexOf(last.type) != -1 || right.indexOf(last.text) != -1;
			case "!=":
				return !last.is.apply(last, right);
			case "!==":
				return right.indexOf(last.type) == -1;
		}
	}
	return false;
};
module.exports.CHECK = CHECK;
function ARGU(src, argus, config){
	var params;
	config.test = true;
	params = this.handle.params;
	if (params && argus){
		for (var item, i = 0; i < argus.length; i++){
			item = argus[i];
			if (params.indexOf(item) != -1){
				return true;
			}
		}
	}
	return false;
};
module.exports.ARGU = ARGU;
function IS(src, params, config){
	var m, index, token;
	if (!params.mode){
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
module.exports.IS = IS;
function NOT(src, params, config){
	var m, index, token;
	if (!params.mode){
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
module.exports.NOT = NOT;
function INDENT(src, params){
	var cache, last, check_indent;
	cache = this.handle.cache;
	while (last = cache[cache.length-1]){
		if (last.type == 'BlockNode'){
			if (last.subType == 'IndentBlock')
				check_indent = last.theIndent;
			break;
		}
		cache = last;
	}
	if (check_indent != null && check_indent != src.lineIndent()){
		return false;
	}
	return true;
};
module.exports.INDENT = INDENT;
function CONCAT(src, params){
	var a, b, patt, temp, ab, types, token;
	a = params[0] || src.current.text;
	b = params[1];
	if (a && a.isToken){
		a = a.text;
	}
	if (b && b.isToken){
		b = b.text;
	}
	if (typeof a == 'string'){
		if (/\.{3}|\|| /.test(a) && a.length > 2){
			patt = a;
			a = src.index;
			if (temp = this.pattern(patt, src, null, 'Temp')){
				b = src.index;
			}else {
				return false;
			}
		}else if ((ab = src.indexPair(a, b || a, src.index, true)) && ab[0] == src.index){
			a = ab[0];
			b = ab[1];
		}else {
			return false;
		}
	}
	if (a < b){
		types = params[2] && params[2].split(' ') || src.current.types.slice();
		src.index = b;
		token = src[a].clone(src.join(a, b), types);
		token.location.code = token.text;
		token.location.end = src[b].location.end;
		return token;
	}
	return false;
};
module.exports.CONCAT = CONCAT;
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