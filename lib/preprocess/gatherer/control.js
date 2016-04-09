var Template;
Template = require("../template.js");
exports['#if'] = exports['#ifdef'] = function(prepor, src, index){
	var blocks, status, pos, tag, token, cond, trimIndent;
	blocks = matchControlBlock(src, index);
	status = false;
	for (var item, i = 0; i < blocks.length; i++){
		item = blocks[i];
		pos = item[1];
		tag = item[0];
		token = src[pos[0]];
		cond = src.join(pos[0]+1, pos[2]).trim();
		status = tag == '#else' || evalCondition(tag, cond, prepor, src, pos[0]);
		if (status){
			if (/:\s*$/.test(cond)){
				trimIndent = src.lineIndent(pos[2]+1)-src.lineIndent(pos[0]);
				if (trimIndent){
					src.trimIndent(pos[2]+1, pos[1]-1, trimIndent);
				}
			}
			src.delete(pos[0], pos[2]);
			src.delete(pos[1], blocks[blocks.length-1][1][3]);
			// debug log
			if (token){
				Tea.log(tag+' '+cond+': true', token.location);
			}
			break;
		}else {
			src.delete(pos[0], pos[1]-1);
			// debug log
			if (token){
				Tea.log(tag+' '+cond+': false', token.location);
			}
		}
	}
};
exports['#script'] = function(prepor, src, index){
	var token, a_b, block;
	token = src[index];
	a_b = matchBlock(src, index);
	block = src.clone(a_b[2]+1, a_b[1]-1);
	try {
		var token, a_b, block, output;
		output = Template.runScript(block, {"source": src, "index": index, "prepor": prepor}, prepor);
		src.delete(a_b[0], a_b[3]);
		if (output){
			src.insert(index+1, output);
		}
		// debug log
		Tea.log('#script runed: '+output.substr(0, 20)+'...', token.location);
	}catch (e) {
		var token, a_b, block, output;
		throw Error.create(2004, e.message, token, new Error());
	};
};
exports['#elif'] = exports['#elifdef'] = exports['#else'] = exports['#endif'] = function(prepor, src, index){
	throw Error.create(2002, src[index], new Error());
};
function matchControlBlock(src, index, _ret_last){
	var blocks, _index, a_b, next;
	blocks = [];
	_index = index;
	while (true){
		if (a_b = matchBlock(src, _index)){
			blocks.push([src[a_b[0]].text, a_b]);
			next = src[a_b[1]].text;
			if (/#else|#elif|#elifdef/.test(next)){
				_index = a_b[1];
				continue;
			}
			if (next == '#end' || (next = '#endif')){
				blocks.push(['#endif', [a_b[1], a_b[3], a_b[3], a_b[3]]]);
			}
		}
		break;
	}
	if (_ret_last){
		return blocks[blocks.length-1][1][3];
	}
	return blocks;
};
function matchBlock(src, index){
	var a, l, _a, b, _b;
	a = src.indexOf(/^(#if|#ifdef|#elif|#elifdef|#else|#script|#test)$/, index);
	l = src.length-1;
	if (a >= 0){
		_a = src.indexOf('\n', a+1);
		if (!_a){
			return [a, l, l, l];
		}
		b = _a;
		while (true){
			b = b < l && src.indexOf(/^#\w+$/, b+1);
			if (!b){
				return [a, l, _a, l];
			}
			switch (src[b].text){
				case '#if':case '#ifdef':
					b = matchControlBlock(src, b, true);
					if (!b){
						return [a, l, _a, l];
					}
					break;
				case '#script':case '#test':
					b = matchBlock(src, b)[1];
					break;
				case '#else':case '#elif':case '#elifdef':case '#endif':
					if (/^(#script|#test)$/.test(src[a].text)){
						return [a, b-1, _a, b-1];
					}
				case '#end':
					_b = src.indexOf('\n', b+1) || l;
					return [a, b, _a, _b];
			}
		}
	}
};
function evalCondition(tag, cond, prepor, src, index){
	var is_def, token, the_file, root_file, exp;
	cond = cond.replace(/\:\s*$|\;\s*$/g, '').trim();
	if (!cond){
		return false;
	}
	is_def = tag.indexOf('def') != -1;
	token = src[index];
	the_file = token.fileName;
	root_file = Argv.file;
	exp = cond.replace(/((-{0,2})[\$a-zA-Z_][\w]*)\b/g, function($0, $1, $2){
		var res;
		if ($2){
			res = Argv[$1];
		}else if (is_def){
			return !!prepor.check($3);
		}else {
			switch ($1){
				case '__main':
					return root_file == the_file;
				case '__root':
					return '"'+root_file+'"';
				case '__file':
					return '"'+the_file+'"';
				case '__version':
					return '"'+Tea.version+'"';
				default:
					if (global.hasOwnProperty($1)){
						res = global[$1];
					}else if (Argv.hasOwnProperty($1)){
						res = Argv[$1];
					}else {
						return $1;
					}
					break;
			}
		}
		return typeof res == 'string' ? '"'+res.replace(/\"/g, '\\"')+'"' : res;
	});
	try {
		var is_def, token, the_file, root_file, exp;
		return exp && eval('!!('+exp+')') || tag == '#else';
	}catch (e) {
		var is_def, token, the_file, root_file, exp;
		throw Error.create(e, new Error());
	};
};