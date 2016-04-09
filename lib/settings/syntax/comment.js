module.exports = function(src, params){
	var token, comm_token, ab, handle;
	token = src.current;
	if (token.type == 'COMMENT'){
		comm_token = token;
	}else {
		switch (token.text){
			case '/*':
				ab = src.indexPair('/*', '*/', src.index, true);
				break;
			case '#!':
				throw Error.create(1119, token, new Error());
				break;
			case '//':
				ab = src.indexPair(token.text, '\n', src.index, true) || [src.index, src.length-1];
				ab[1] = ab[1]-1;
				break;
			default:
				return;
		}
		if (ab && ab[0] == src.index){
			src.index = ab[1];
			comm_token = token.clone(src.join(ab[0], ab[1]), ['COMMENT']);
			comm_token.location.code = comm_token.text;
			comm_token.location.end = src[ab[1]].location.end;
		}else {
			throw Error.create(1118, src.current, new Error());
		}
	}
	if (comm_token){
		handle = this.handle;
		if (handle.name == 'Block' || handle.name == 'Root'){
			!handle.comms && (handle.comms = []);
			if (handle.comms.indexOf(comm_token) == -1){
				handle.comms.push(comm_token);
			}
		}
		return comm_token;
	}
};