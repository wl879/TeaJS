var Node;
Node = require("./node.js");
var Syntax = (function(){
	function Syntax(type){
		this.type = type;
		// @.subType     = null;
		this.length = 0;
		if (arguments.length > 1){
			this.add.apply(this, Jsop.toArray(arguments, 1));
		}
	};
	Syntax.prototype = Object.create(Node.prototype);
	Syntax.prototype.__super__ = Node.prototype;
	Syntax.prototype.constructor = Syntax;
	Syntax.prototype.__defineGetter__("text", function(){
		var tokens, texts;
		tokens = this.tokens();
		texts = [];
		for (var tk, i = 0; i < tokens.length; i++){
			tk = tokens[i];
			texts.push(tk.text);
		}
		return texts.join('');
	});
	Syntax.prototype.add = function (){
		for (var item, i = 0; i < arguments.length; i++){
			item = arguments[i];
			if (!item){
				continue;
			}
			if (item.isSyntax || item.isToken){
				item.parent = this;
				this[this.length++] = item;
			}else if (isArray(item)){
				if (item.length){
					this.add.apply(this, item);
				}
			}else {
				throw Error.create('Syntax can only add object of "Syntax" or "Code" and "NaN" types ! >> '+item, new Error());
			}
		}
		return this;
	};
	Syntax.prototype.insert = function (pos){
		var args;
		args = Jsop.toArray(arguments, 1);
		for (var i = pos; i < this.length; i++){
			args.push(this[i]);
		}
		this.length = pos;
		this.add.apply(this, args);
		return this;
	};
	Syntax.prototype.clone = function (){
		var node = new Syntax(this.type);
		for (var i = 0; i < this.length; i++){
			node[node.length++] = this[i];
		}
		node.parent = this.parent;
		node.scope = this.scope;
		return node;
	};
	Syntax.prototype.isSyntax = true;
	return Syntax;
})();
module.exports = Syntax;