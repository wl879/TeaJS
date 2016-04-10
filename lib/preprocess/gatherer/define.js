exports['#define'] = function(prepor, src, index){
	var token, a, name, args, b, body, ref;
	token = src[index];
	a = src.nextIndex(index);
	if (src[a].is('IDENTIFIER', 'KEYWORD')){
		name = src[a].text;
		if (src[a+1].text == '('){
			args = src.join(a+2, (a = src.indexOf(')', a))-1).split(',');
		}
		ref = checkDefineBody.call(this, src, src.nextIndex(a), prepor), a = ref[0], b = ref[1], body = ref[2];
		prepor.add('macro', name, args, body, token.location);
		src.delete(index, b);
		// debug log
		Tea.log('#define marco: '+name, token.location);
	}
};
exports['#undef'] = function(prepor, src, index){
	var token, b, names;
	token = src[index];
	b = src.indexOf('\n', index) || src.length-1;
	names = src.join(index+1, b-1).trim().split(',');
	prepor.undef.apply(prepor, names);
	src.delete(index, b);
	// debug log
	Tea.log('#undef marco : '+names.join(','), token.location);
};
exports['#expr'] = exports['#stam'] = function(prepor, src, index){
	var token, type, a, name, pattern, b, body, ref;
	token = src[index];
	type = token.text.substr(1);
	a = src.nextIndex(index);
	name = src[a].text;
	a = src.nextIndex(a);
	if (src[a].text == '<'){
		pattern = src.join(a+1, (a = src.indexOf('>', a))-1);
	}
	ref = checkDefineBody.call(this, src, src.nextIndex(a), prepor), a = ref[0], b = ref[1], body = ref[2];
	prepor.add(type, name, pattern, body, token.location);
	src.delete(index, b);
	// debug log
	Tea.log('#define '+type+' : '+name, token.location);
};
exports['#argv'] = function(prepor, src, index){
	var token, b, argv;
	token = src[index];
	b = src.indexOf('\n', index) || src.length-1;
	argv = src.join(index+1, b).trim();
	Tea.argv.parse(argv.split(' '));
	src.delete(index, b);
	// debug log
	Tea.log('#argv        : '+argv, token.location);
};
exports['#line'] = function(prepor, src, index){
	var token;
	token = src[index];
	token.text = token.location.lineNumber+'';
	token.types = ['NUMBER', 'CONST'];
};
function checkDefineBody(src, a, prepor){
	var mark, b, body_src, text;
	mark = src[a];
	if (mark.text == '\n' && src[a+1].text == '{'){
		mark = src[++a];
	}
	if (mark.text == '{'){
		b = src.indexPair('{', '}', a, true)[1];
		body_src = src.clone(a+1, b-1);
		b = src.indexOf('\n', b) || src.length-1;
	}else {
		b = src.indexOf('\n', a) || src.length-1;
		body_src = src.clone(a, b-1);
	}
	for (var token, i = 0; i < body_src.length; i++){
		token = body_src[i];
		if (!token || token.text == '#script'){
			continue;
		}
		if (this[token.type]){
			i = this[token.type](prepor, body_src, i) || i;
		}
	}
	text = body_src.join();
	return [a, b, text, body_src];
};