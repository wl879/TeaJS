var Beautify = require("./beautify.js");
var Writer = (function(){
	function Writer(reader, type){
		this.length = 0;
		this.type = type && type.type || type;
		this.reader = reader;
		this.iswriter = true;
	}
	Writer.prototype.__defineGetter__("text", function(){
		return Writer.listToText(Beautify(this));
	});
	Writer.prototype.__defineGetter__("lastText", function(){
		var last = this;
		while (true){
			if (last.istoken){
				return last.text;
			}
			if (typeof last == 'string' || typeof last == 'number'){
				return last;
			}
			if (last = last[last.length-1]){
				continue;
			}
			return null;
		}
	});
	Writer.prototype.insert = function (pos){
		var argus = [pos, 0];
		for (var i=1, item; i < arguments.length; i++){
			item = arguments[i];
			if (item.istoken || item.isnode){
				item = this.reader.read(item);
			}
			if (item){
				if (isArray(item)){
					argus.push.apply(argus, item);
				}else {
					argus.push(item);
				}
			}
		}
		Array.prototype.splice.apply(this, argus);
		return this;
	}
	Writer.prototype.add = function (){
		for (var i=0, item; i < arguments.length; i++){
			item = arguments[i];
			if (item){
				this[this.length++] = item;
			}
		}
		return this;
	}
	Writer.prototype.delete = function (a, b){
		if (b == null) b = a;
		Array.prototype.splice.call(this, a, b-a+1);
		return this;
	}
	Writer.prototype.read = function (test_patt){
		if (typeof test_patt == 'string' && /#/.test(test_patt)){
			this.reader.patt(test_patt, arguments[1], this);
		}else {
			for (var i=0, item; i < arguments.length; i++){
				item = arguments[i];
				if (!item){
					continue;
				}
				if (item.istoken || item.isnode){
					item = this.reader.read(item);
				}else if (isArray(item)){
					this.read.apply(this, item);
					continue;
				}
				if (item){
					this[this.length++] = item;
				}
			}
		}
		return this;
	}
	Writer.prototype.toList = function (not_beautify){
		if (!not_beautify){
			return Beautify(this);
		}
		var list = [];
		for (var _i=0, item; _i < this.length; _i++){
			item = this[_i];
			if (!item) continue;
			if (item.iswriter){
				list.push.apply(list, item.toList(true));
			}else {
				list.push(item);
			}
		}
		return list;
	}
	Writer.listToText = function(list){
		var texts = [];
		for (var _i=0, item; _i < list.length; _i++){
			item = list[_i];
			if (item.istoken){
				texts.push(item.text);
			}else if (item.iswriter || isArray(item)){
				texts.push(Writer.listToText(item));
			}else {
				texts.push(item);
			}
		}
		return texts.join('');
	};
	return Writer;
})();
module.exports = Writer;