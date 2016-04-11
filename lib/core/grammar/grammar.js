var Grammar = (function(){
	function Grammar(prepor){
		this.prepor = prepor;
		this.handle = {};
	};
	var Syntax = require("../syntax.js");
	var Pattern = require("./pattern.js");
	Grammar.prototype.next = function (src, ig_lf){
		src.next(ig_lf, true);
		if (this.parser('COMMENT', src, null, false, true)){
			this.next(src, ig_lf);
		}
		return src;
	};
	Grammar.prototype.parser = function (name, src, params, __try, __inherit_handle){
		var parser, _handle, ref;
		if (arguments.length == 1){
			return Grammar.hasOwnProperty(name);
		}
		if (!(Grammar.hasOwnProperty(name))){
			if (__try) return;
			throw Error.create(4001, name, new Error());
		}
		parser = Grammar[name];
		_handle = this.handle;
		if (!__inherit_handle){
			this.handle = {"name": name, "debug": parser.debug, "up": _handle, "start": src.index};
		}
		if (parser.fn){
			ref = parser.fn.call(this, src, params);
		}else {
			this.handle.pattern = parser.pattern;
			ref = this.pattern(parser.pattern, src, params);
		}
		if (this.handle.error){
			return errorResponse(this.handle.error, src, this);
		}
		if (ref){
			ref = packResponse(ref, parser.name, parser.mode, this.handle);
			if (_handle != this.handle){
				!_handle.subs && (_handle.subs = []);
				_handle.subs.push(this.handle);
			}
		}
		this.handle.end = src.index;
		this.handle = _handle;
		return ref;
	};
	Grammar.prototype.pattern = function (patt, src, params, packname){
		var _handle, ref;
		if (!patt.isPattern){
			patt = Pattern.compile(patt);
			if (!src){
				return patt;
			}
		}
		if (packname){
			_handle = this.handle;
			this.handle = {"name": packname, "pattern": patt, "up": _handle};
		}
		if (ref = patt.parse(this, src, params)){
			if (ref.error){
				return errorResponse(ref.error, src, this);
			}
			if (packname){
				ref = packResponse(ref, packname, 'ret node', this.handle);
			}
		}
		if (packname){
			if (_handle != this.handle){
				!_handle.subs && (_handle.subs = []);
				_handle.subs.push(this.handle);
			}
			this.handle = _handle;
		}
		return ref;
	};
	Grammar.prototype.stack = function (check){
		var ref, text, list, m;
		if (this.handle.subs){
			ref = getSubsStack(this.handle);
		}else {
			ref = getUpStack(this.handle);
		}
		ref.className = 'GrammarStack';
		if (check == 'loop'){
			text = print.toText(ref);
			list = text.replace(/^\s*\| \*.*$/mg, '').replace(/[\s\-\*\>]+/g, '-').replace(/(\[|\]|\(|\))/g, '\\$1').split('-');
			for (var i = 0; i < list.length; i++){
				if (list[i]){
					if (m = list.slice(i+1).join('-').match(new RegExp(list[i]+'.*?'+list[i], 'g'))){
						if (m.length > 5){
							return list[i]+' ∞ '+m[0];
						}
					}
				}
			}
			return text;
		}
		return ref;
	};
	Grammar.prototype.error = function (msg, target){
		if (this.handle.try){
			return;
		}
		if (msg){
			this.handle.error = {"message": msg, "target": target};
		}
	};
	function packResponse(res, name, mode, handle){
		switch (mode){
			case 'not check':
				return res;
			case 'ret node':
				if (!res.isSyntax || (res.type != name && !handle.packName)){
					return new Syntax(name, res);
				}
				break;
			default:
				if (res.isToken || res.isSyntax){
					return res;
				}
				if (res.length == 1){
					console.log('xxxxxxxxxxxxxxxxx');
					return res[0];
				}
				if (res.length > 1){
					return new Syntax(name, res);
				}
				break;
		}
		return res;
	};
	function errorResponse(err, src, grm){
		if (err.message === '∆'){
			err.message = 1100;
		}
		if (err.message == 1100 || err.message == 1101){
			if (Error.code && Error.code[err.target.types[1]]){
				err.message = Error.code[err.target.types[1]];
			}else {
				print(grm.stack());
			}
		}
		throw Error.create(err.message, err.target, new Error());
	};
	function getSubsStack(handle){
		var stack;
		if (!handle.subs){
			return handle.name;
		}
		stack = {"name": handle.name, "subs": []};
		if (stack.name && !Grammar[stack.name]){
			stack.name = '['+stack.name+']';
		}
		if (handle.error){
			stack.name = '∆'+stack.name;
		}
		if (handle.packName){
			stack.name += '('+handle.packName+')';
		}
		for (var sub, i = 0; i < handle.subs.length; i++){
			sub = handle.subs[i];
			stack.subs.push(getSubsStack(sub));
		}
		return stack;
	};
	function getUpStack(handle, __sub){
		var stack;
		stack = {"name": handle.name, "subs": []};
		if (stack.name && !Grammar[stack.name]){
			stack.name = '['+stack.name+']';
		}
		if (handle.error){
			stack.name = '∆'+stack.name;
		}
		if (__sub){
			stack.subs.push(__sub);
		}
		if (handle.up){
			return getUpStack(handle.up, stack);
		}
		return stack;
	};
	return Grammar;
})();
module.exports = Grammar;