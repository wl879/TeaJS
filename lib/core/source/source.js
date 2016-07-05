var Source = (function(){
	var Token = require("../token.js");
	var Lexer = require("./lexer.js");
	var Sugar = require("../sugar");
	var EOT = new Token('\4', ['EOT', 'END']);
	var pair_cache = {};
	function Source(text, file){
		this.id = Tea.ID();
		this.index = 0;
		this.length = 0;
		this.sugarBox = Sugar.box();
		if (file || text){
			[].push.apply(this, Lexer(text, file, this.sugarBox));
			this.refresh(0);
		}
	};
	Source.prototype.__defineGetter__("current", function(){
		return this[this.index] || EOT;
	});
	Source.prototype.__defineGetter__("text", function(){
		return this.join();
	});
	Source.prototype.add = function (token){
		this[this.length++] = token;
		return this;
	};
	Source.prototype.back = function (opt, catch_comm){
		while (opt > 1){
			this.index = this.prevIndex(this.index, opt--, catch_comm);
		}
		this.index = this.prevIndex(this.index, opt, catch_comm);
		return this;
	};
	Source.prototype.next = function (opt, catch_comm){
		while (opt > 1){
			this.index = this.nextIndex(this.index, opt--, catch_comm);
		}
		this.index = this.nextIndex(this.index, opt, catch_comm);
		return this;
	};
	Source.prototype.nextIndex = function (index, ig_lf, catch_comm){
		return countIndex(1, this, index, ig_lf, catch_comm);
	};
	Source.prototype.prevIndex = function (index, ig_lf, catch_comm){
		return countIndex(-1, this, index, ig_lf, catch_comm);
	};
	Source.prototype.delete = function (a, b){
		if (b == null) b = a;
		for (var i=a; i <= b; i++){
			this[i] = null;
		}
		return this;
	};
	Source.prototype.insert = function (pos, value, del_len){
		var args, indent, head_token;
		if (pos == null) pos = 0;
		if (del_len == null) del_len = 0;
		if (typeof value == 'string'){
			value = Lexer(value, 'preprocess/insert', this.sugarBox);
		}else if (value.isToken){
			value = [value];
		}
		args = [pos, del_len];
		indent = SText.copy(' ', this.lineIndent(pos)) || '';
		for (var token, i = 0; i < value.length; i++){
			token = value[i];
			if (!token || token.type == 'EOT'){
				continue;
			}
			if (i && indent && token.indent >= 0){
				if (token.is('BLANK')){
					token.text += indent;
					token.indent = token.text.length;
				}else {
					token.indent = null;
					head_token = token.clone(indent, ['BLANK']);
					head_token.indent = indent.length;
					args.push(head_token);
				}
			}
			args.push(token);
		}
		[].splice.apply(this, args);
		return this;
	};
	/**
	     * xxx
	     */
	Source.prototype.indexPair = function (s1, s2, index, not_throw_error){
		var text;
		var p1 = pair_cache[s1] || (pair_cache[s1] = new RegExp('^('+SText.re(s1)+')$')),
			p2 = pair_cache[s2] || (pair_cache[s2] = new RegExp('^('+SText.re(s2)+')$'));
		var a = -1, b = index != null ? index : this.index, len = this.length, keep = 0;
		while (b < len){
			if (this[b]){
				text = this[b].text;
				if (text == '\\'){
					b += 2;
					continue;
				}
				if (p1.test(text)){
					if (a == -1){
						a = b;
					}else if (s1 == s2 || p2.test(text)){
						return [a, b];
					}else {
						keep += 1;
					}
				}else if (p2.test(text) && a != -1){
					if (keep == 0){
						return [a, b];
					}
					keep -= 1;
				}
			}
			b += 1;
		}
		if (!not_throw_error){
			Tea.error(1004, s2, this[b]);
		}
	};
	Source.prototype.lineIndent = function (index){
		index = index != null ? index : this.index;
		while (index >= 0){
			if (this[index] && this[index].indent >= 0){
				return this[index].indent;
			}
			index--;
		}
		return -1;
	};
	Source.prototype.refresh = function (index){
		if (typeof index == 'number'){
			this.index = index;
		}
		return cleanSource(this);
	};
	Source.prototype.join = function (a, b){
		if (Array.isArray(a)){
			b = a[1], a = a[0];
		}
		a = a < 0 ? this.length+a : (a || 0), b = b < 0 ? this.length+b : (b || b === 0 ? b : this.length);
		var texts = [];
		for (var i=a; i <= b; i++){
			if (this[i] && this[i].text != '\4') texts.push(this[i].text);
		}
		return texts.join('');
	};
	Source.prototype.isSource = true;
	function countIndex(ori, src, index, ig_lf, catch_comm){
		var len = src.length-1, type;
		while ((index += ori) >= 0 && index <= len){
			type = src[index] && src[index].type;
			if (!type || type == 'BLANK' || (!catch_comm && type == 'COMMENT') || (ig_lf && type == 'LF')){
				continue;
			}
			return index;
		}
		if (ori > 0){
			return index > len ? len : index;
		}
		return index < 0 ? 0 : index;
	};
	function cleanSource(src){
		var len, b, a, token, list;
		len = src.length;
		for (var i=len-1; i >= 0; i--){
			if (!src[i]){
				continue;
			}
			if (src[i].type == 'EOT'){
				src[i] = null;
				continue;
			}
			if (src[i].type == 'LF'){
				b = i;
				a = i-1;
				while (a >= -1){
					if (b === 0 || src[a].type == 'LF'){
						src.delete(a+1, b);
						break;
					}
					if (!src[a] || src[a].type == 'BLANK'){
						a -= 1;
						continue;
					}
					break;
				}
				if (token = src[b+1]){
					if (token.type == 'BLANK'){
						token.text = SText.spaceTab(token.text);
						token.indent = token.text.length;
					}else {
						token.indent = 0;
					}
				}
			}
		}
		list = [];
		for (var token, i = 0; i < src.length; i++){
			token = src[i];
			if (token){
				list.push(token);
			}
			src[i] = null;
		}
		src.length = 0;
		[].push.apply(src, list);
		return src.add(EOT);
	};
	return Source;
})();
module.exports = Source;