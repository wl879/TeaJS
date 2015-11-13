var Echo = require("./echo.js");
var Writer = (function(){
	function Writer(reader, type){
		this.length = 0;
		this.type = type && type.type || type;
		this.reader = reader;
		this.iswriter = true;
	}
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
	Writer.prototype.body = function (left, right, not_indent){
		var body = this.reader.new('Body');
		if (left){
			this.read(left);
		}
		this.add(body);
		if (right){
			this.read(right);
		}
		body.notIndent = not_indent;
		return body;
	}
	Writer.prototype.__defineGetter__("text", function(){
		return this.toText();
	});
	Writer.prototype.toText = function (){
		var text = Echo.toText(this);
		return text;
	}
	return Writer;
})();
module.exports = Writer;