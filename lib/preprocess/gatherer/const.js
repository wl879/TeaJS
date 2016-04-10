var SYMBOL;
exports['TAG'] = function(prepor, src, index){
	var token;
	token = src[index];
	src.index = index;
	if (this[token.text]){
		return this[token.text](prepor, src, index);
	}
	prepor.check(token.text, 'macro', src);
};
exports['IDENTIFIER'] = function(prepor, src, index){
	var token;
	token = src[index];
	src.index = index;
	prepor.check(token.text, 'macro', src);
};
exports['SYMBOL'] = function(prepor, src, index){
	var token, text, type;
	token = src[index];
	text = token.text;
	if (SYMBOL[text]){
		return SYMBOL[text].call(this, prepor, src, index);
	}
	type = token.types[1];
	if (this[type]){
		return this[type](prepor, src, index);
	}
};
exports["COMM"] = function(prepor, src, index){
	var token, ab;
	token = src[index];
	switch (token.text){
		case '/*':
			ab = src.indexPair('/*', '*/', index, true);
			break;
		case '#!':
			if (index > 0){
				throw Error.create(1119, src.current, new Error());
			}
		case '//':
			ab = src.indexPair(token.text, '\n', src.index, true) || [index, src.length-1];
			ab[1] = ab[1]-1;
			break;
	}
	if (ab && ab[0] == index){
		token.text = src.join(ab[0], ab[1]);
		token.types = ['COMMENT', 'CONST', 'COMM'];
		token.location.code = token.text;
		token.location.end = src[ab[1]].location.end;
		src.delete(ab[0]+1, ab[1]);
	}
};
exports["QUOTE"] = function(prepor, src, index){
	var token, ab;
	token = src[index];
	ab = src.indexPair(token.text, token.text, index);
	if (ab && ab[0] == index){
		token.text = checkMarco(src.clone(ab[0], ab[1]), prepor);
		token.types = ['STRING', 'CONST'];
		token.location.code = token.text;
		token.location.end = src[ab[1]].location.end;
		src.delete(ab[0]+1, ab[1]);
	}
};
// else:
// 	Err 1111, token;
SYMBOL = {};
SYMBOL['/'] = function(prepor, src, index){
	var token, ab;
	if (!testValue(src, src.prevIndex(index, true))){
		token = src[index];
		ab = src.indexPair(token.text, /\*\/|\//, index, true);
		if (ab && ab[0] == index){
			if (/^[gimy]+$/.test(src[ab[1]+1].text)){
				ab[1] += 1;
			}
			token.text = checkMarco(src.clone(ab[0], ab[1]), prepor);
			token.types = ['REGEXP', 'CONST'];
			token.location.code = token.text;
			token.location.end = src[ab[1]].location.end;
			src.delete(ab[0]+1, ab[1]);
		}
	}
};
// else:
// 	Err 1111, token;
SYMBOL['/='] = SYMBOL['/'];
function testValue(src, index){
	var token;
	if (token = src[index]){
		if (token.is('CONST', 'CLOSE', 'POSTFIX')){
			return true;
		}
		if (token.is('IDENTIFIER')){
			if (!token.is('BINARY', 'UNARY')){
				return true;
			}
		}else if (!token.is('KEYWORD')){
			return false;
		}
		token = src[src.prevIndex(index, true)];
		if (token && token.is('LINK')){
			return true;
		}
	}
	return false;
};
function checkMarco(src, prepor){
	var text;
	for (var token, i = 0; i < src.length; i++){
		token = src[i];
		if (token && token.type == 'IDENTIFIER'){
			src.index = i;
			prepor.check(token.text, 'macro', src);
		}
	}
	text = src.join();
	return text;
};