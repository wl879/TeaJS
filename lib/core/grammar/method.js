function SUGAR(src, params){
	var map, node;
	if (!this.prepor){
		return;
	}
	if (!(map = this.prepor[params[0]])){
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
function ROUTE(src, params){
	var token, text, patt, res;
	if (params.length){
		for (var item, i = 0; i < params.length; i++){
			item = params[i];
			item = item.replace(/\s*→\s*/, '→').split('→');
			if (item.length == 2){
				params[item[0]] = item[1];
			}else {
				params['default'] = item[0];
			}
		}
		params.length = 0;
	}
	token = src.current;
	text = token.text;
	patt = params.hasOwnProperty(text) ? params[text] : params['default'];
	if (patt){
		if (text == patt){
			return token;
		}
		if (this.parser(patt)){
			return this.parser(patt, src);
		}
		if (res = this.pattern(patt, src)){
			return res;
		}
	}
};
module.exports.ROUTE = ROUTE;
function ISPARAM(src, argus){
	var params;
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
module.exports.ISPARAM = ISPARAM;
function IS(src, params){
	var index, yes, no, ref, token, text, types, res;
	ref = checkIsMethodArgus(params, src), index = ref[0], yes = ref[1], no = ref[2];
	if (!(token = src[index])){
		return !yes && no ? true : false;
	}
	text = token.text;
	types = token.types;
	if (yes){
		for (var name, i = 0; i < yes.length; i++){
			name = yes[i];
			if (res = this.parser(name, src, null, true)){
				return res;
			}
			if (types.indexOf(name) != -1 || name == text){
				if (!no || (!token.is.apply(token, no) && name != text)){
					return token;
				}
			}
		}
	}else if (no){
		if (!token.is.apply(token, no) && name != text){
			return token;
		}
	}else {
		throw Error.create('params error', token, new Error());
	}
	return false;
};
module.exports.IS = IS;
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
function checkIsMethodArgus(argus, src){
	var mode, vals, lf, m, temp, yes, no, index, num;
	if (argus.length == 1){
		mode = null, vals = argus[0], lf = argus[1];
	}else {
		mode = argus[0], vals = argus[1], lf = argus[2];
	}
	if (typeof mode == 'string'){
		if (!(m = mode.trim().match(/([\+\-]{1,2})(\d+)/))){
			throw Error.create('"" pattern error', new Error());
		}
		mode = [m[1], parseInt(m[2])];
	}
	if (typeof vals == 'string'){
		temp = vals.split(' ');
		yes = [];
		no = [];
		for (var item, i = 0; i < temp.length; i++){
			item = temp[i];
			if (item[0] == '!'){
				no.push(item.substr(1));
			}else {
				yes.push(item);
			}
		}
		vals = {"yes": yes.length && yes, "no": no.length && no};
		argus[0] = mode;
		argus[1] = vals;
	}
	index = src.index;
	if (mode){
		num = mode[1];
		while (--num >= 0){
			switch (mode[0]){
				case '++':
					index++;
					break;
				case '+':
				default:
					index = src.nextIndex(index, !lf);
					break;
				case '--':
					index--;
					break;
				case '-':
					index = src.prevIndex(index, !lf);
					break;
			}
		}
	}
	return [index, vals.yes, vals.no];
};