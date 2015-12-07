var NodeBase = require("./base.js");
var Node = (function(){
	function Node(type){
		this.type = type;
		this.length = 0;
		this.isnode = true;
		this._scope = null;
		if (arguments.length > 1){
			this.add.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}
	Node.prototype = new NodeBase();
	Node.prototype.constructor = Node;
	Node.prototype.__super__ = NodeBase.prototype;
	Node.prototype.__defineGetter__("text", function(){
		var tokens, texts;
		tokens = this.tokens;
		texts = [];
		for (var _i=0, tk; _i < tokens.length; _i++){
			tk = tokens[_i];
			texts.push(tk.text);
		}
		return texts.join('');
	});
	Node.prototype.add = function (){
		for (var i=0, node; i < arguments.length; i++){
			node = arguments[i];
			if (!node){
				continue;
			}
			if (node.isnode || node.istoken){
				node.parent = this;
				this[this.length++] = node;
			}else if (isArray(node)){
				this.add.apply(this, node);
			}else {
				throw tea.error(new Error(), null);
			}
		}
		return this;
	}
	Node.prototype.tokens = function (index){
		var tokens = [];
		for (var i=0; i < this.length; i++){
			if (this[i].istoken){
				tokens.push(this[i]);
			}else {
				tokens.push.apply(tokens, this[i].tokens());
			}
			if (index === 0){
				return tokens[0];
			}
		}
		if (typeof index == 'number'){
			return tokens[index < 0 ? tokens.length+index : index];
		}
		return tokens;
	}
	Node.prototype.clone = function (){
		var node = new Node(this.type);
		for (var i=0; i < this.length; i++){
			node[node.length++] = this[i];
		}
		node.parent = this.parent;
		return node;
	}
	return Node;
})();
module.exports = Node;