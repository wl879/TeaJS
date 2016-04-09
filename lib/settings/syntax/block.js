var Syntax;
Syntax = require("../../core/syntax.js");
module.exports = function(src, params){
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
			return checkIndentBlock.call(this, src, params) || new Syntax('BlockNode');
		case ';':
			throw Error.create(1111, src.current.text, src.current, new Error());
			break;
	}
};
function checkLineBlock(src, params){
	var node, ends, back_index, ref;
	node = new Syntax('BlockNode');
	ends = ['\n', ';', '}', ']', ']', 'else', 'while', 'catch', 'finally'];
	if (params && params.length){
		ends.push.apply(ends, params);
	}
	back_index = src.index;
	while (src.index < src.length){
		if (src.current.text == ';'){
			back_index = src.index;
			this.next(src);
			if (src.current.text == ','){
				break;
			}
		}
		if (src.current.type == 'EOT'){
			back_index = src.index;
			break;
		}
		if (ends.indexOf(src.current.text) != -1){
			break;
		}
		if (ref = this.parser('Statement', src)){
			node.add(ref);
			back_index = src.index;
			this.next(src);
			continue;
		}
		break;
	}
	src.index = back_index;
	if (node.length){
		return node;
	}
};
function checkIndentBlock(src, params){
	var handle, back_index, step_index, the_indent, node, ends, ref;
	handle = this.handle;
	back_index = src.index;
	step_index = src.current.text == ':' ? src.index : src.prevIndex(back_index, true);
	the_indent = src.lineIndent(step_index);
	node = new Syntax('BlockNode');
	node.subType = 'IndentBlock';
	node.theIndent = the_indent;
	// 
	if (src[step_index].text == ':'){
		step_index = src.nextIndex(step_index);
		if (!src[step_index].is('LF')){
			src.index = step_index;
			node = checkLineBlock.call(this, src, params);
			if (src[src.nextIndex(src.index)].is('LF')){
				step_index = back_index = src.index;
			}else {
				return node;
			}
		}
	}
	src.index = step_index;
	this.next(src, 1);
	step_index = src.index;
	ends = ['}', ')', ']'];
	if (params && params.length){
		ends.push.apply(ends, params);
	}
	while (src.index < src.length){
		if (src.current.type == 'EOT'){
			return node;
		}
		step_index = src.index;
		if (ends.indexOf(src.current.text) == -1){
			if (src.lineIndent(step_index) > the_indent){
				if (src.current.is('BLOCKBREAK', 'BLANK')){
					back_index = src.index;
					this.next(src, 1);
					continue;
				}
				if (ref = this.parser('Statement', src)){
					if (handle.comms && handle.comms.length){
						node.add(handle.comms);
						handle.comms.length = 0;
					}
					node.add(ref);
					back_index = src.index;
					this.next(src, 1);
					continue;
				}
			}
		}
		break;
	}
	if (src[back_index].is('LF')){
		back_index = back_index-1;
	}
	src.index = back_index;
	if (node.length == 0 && src.current.text != ':'){
		return;
	}
	return node;
};
function checkBraceBlock(src, ends){
	var check_brace, node, step_index, handle, ref;
	check_brace = false;
	node = new Syntax('BlockNode');
	if (src.current.text == '{'){
		if (this.next(src, 1).current.text == '}')
			return node;
		check_brace = true;
	}
	step_index = src.index;
	handle = this.handle;
	while (src.index < src.length){
		if (src.current.type == 'EOT'){
			if (check_brace){
				return this.error(1110);
			}
			break;
		}
		if (src.current.is('BLOCKBREAK', 'BLANK')){
			step_index = src.index;
			this.next(src, 1);
			continue;
		}
		if (ends && ends.indexOf(src.current.text) != -1){
			src.index = step_index;
			break;
		}
		if (check_brace && src.current.text == '}'){
			break;
		}
		if (ref = this.parser('Statement', src)){
			if (handle.comms && handle.comms.length){
				node.add(handle.comms);
				handle.comms.length = 0;
			}
			node.add(ref);
			step_index = src.index;
			this.next(src, 1);
			continue;
		}
		return this.error(1100, src.current);
	}
	if (!check_brace && node.length == 0){
		return false;
	}
	return node;
};