module.exports = function(heap, src, params){
	switch (params && params[0]){
		case 'brace':
			params = params.slice(1);
			params.push('}');
			return checkBraceBlock.call(this, src, params);
		case 'indent':
			return checkIndentBlock.call(this, src, params.slice(1));
		case 'line':
			return checkLineBlock.call(this, src, params.slice(1));
	}
	switch (src.current.text){
		case '{':
			return checkBraceBlock.call(this, src, params);
		case ':':
			return checkIndentBlock.call(this, src, params) || this.node('BlockNode');
		case ';':
			Tea.error(1111, src.current.text, src.current);
			break;
	}
};
function checkLineBlock(src, params){
	var node, ends, step_index, ref;
	node = this.node('BlockNode');
	ends = ['\n', ';', '}', ']', ']', 'else', 'while', 'catch', 'finally'];
	if (params && params.length){
		ends.push.apply(ends, params);
	}
	step_index = src.index;
	while (src.index < src.length){
		if (src.current.text == ';'){
			step_index = src.index;
			src.next();
			if (src.current.text == ','){
				break;
			}
		}
		if (src.current.type == 'EOT'){
			step_index = src.index;
			break;
		}
		if (ends.indexOf(src.current.text) != -1){
			break;
		}
		if (ref = this.parse('Statement')){
			step_index = src.index;
			node.add(ref);
			src.next();
			continue;
		}
		break;
	}
	src.index = step_index;
	if (node.length){
		return node;
	}
};
function checkIndentBlock(src, params){
	var node, step_index, the_indent, ends, ref;
	node = this.node('BlockNode');
	step_index = src.current.text == ':' ? src.index : src.prevIndex(src.index, true);
	the_indent = src.lineIndent(step_index);
	if (src[step_index].text == ':'){
		step_index = src.nextIndex(step_index);
		if (!src[step_index].is('LF')){
			src.index = step_index;
			node = checkLineBlock.call(this, src, params);
			if (src[src.nextIndex(src.index)].is('LF')){
				step_index = src.index;
			}else {
				return node;
			}
		}
	}
	src.index = step_index;
	src.next(1);
	ends = ['}', ')', ']'];
	if (params && params.length){
		ends.push.apply(ends, params);
	}
	while (src.index < src.length){
		if (src.current.type == 'EOT'){
			src.index = step_index;
			break;
		}
		if (ends.indexOf(src.current.text) != -1 || src.lineIndent() <= the_indent){
			if (src[step_index].is('LF')){
				step_index = step_index-1;
			}
			src.index = step_index;
			break;
		}
		if (src.current.is('BREAK', 'BLANK', 'COMMENT', 'COMM')){
			step_index = src.index;
			src.next(1);
			continue;
		}
		if (ref = this.parse('Statement')){
			step_index = src.index;
			node.add(ref);
			src.next(1);
			continue;
		}
		return this.throw(1100, src.current);
	}
	if (node.length == 0 && src.current.text != ':'){
		return false;
	}
	return node;
};
function checkBraceBlock(src, ends){
	var node, check_brace, step_index, ref;
	node = this.node('BlockNode');
	check_brace = false;
	if (src.current.text == '{'){
		if (src.next(1).current.text == '}')
			return node;
		check_brace = true;
	}
	step_index = src.index;
	while (src.index < src.length){
		if (src.current.type == 'EOT'){
			if (check_brace){
				return this.throw(1110);
			}
			break;
		}
		if (src.current.is('BREAK', 'BLANK', 'COMMENT')){
			step_index = src.index;
			src.next(1);
			continue;
		}
		if (ends && ends.indexOf(src.current.text) != -1){
			src.index = step_index;
			break;
		}
		if (check_brace && src.current.text == '}'){
			break;
		}
		if (ref = this.parse('Statement')){
			step_index = src.index;
			node.add(ref);
			src.next(1);
			continue;
		}
		return this.throw(1100, src.current);
	}
	if (!check_brace && node.length == 0){
		return false;
	}
	return node;
};