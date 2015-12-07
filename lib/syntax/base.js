var Scope = require("./scope.js");
var NodeBase = (function(){
	function NodeBase(){}
	var nodemap = require("./map.js").node;
	NodeBase.prototype.__defineGetter__("root", function(){
		var root = this;
		while (root.parent){
			root = root.parent;
		}
		return root;
	});
	NodeBase.prototype.__defineGetter__("offsetParent", function(){
		var parent = this.parent;
		while (parent && (['ArgumentsDecl', 'NodeStam', 'CommaExpr'].indexOf(parent.type) != -1)){
			parent = parent.parent;
		}
		return parent;
	});
	NodeBase.prototype.__defineGetter__("scopeParent", function(){
		if (this.type == 'Root'){
			return this;
		}
		var parent = this.parent;
		while (parent && !parent.is('ScopeNode')){
			parent = parent.parent;
		}
		return parent;
	});
	NodeBase.prototype.__defineGetter__("parent", function(){
		return this._parent;
	});
	NodeBase.prototype.__defineSetter__("parent", function(parent){
		this._scope = null;
		return this._parent = parent;
	});
	NodeBase.prototype.__defineGetter__("nextSibling", function(){
		var index = this.index;
		if (index >= 0){
			return this.parent[index+1];
		}
	});
	NodeBase.prototype.__defineGetter__("prevSibling", function(){
		var index = this.index;
		if (index-1 >= 0){
			return this.parent[index-1];
		}
	});
	NodeBase.prototype.__defineGetter__("index", function(){
		return !this.parent ? -1 : Array.prototype.indexOf.call(this.parent, this);
	});
	NodeBase.prototype.__defineGetter__("scope", function(){
		if (!this._scope){
			if (this.parent){
				this._scope = this.parent.scope;
			}else {
				this._scope = new Scope(this);
			}
		}
		return this._scope;
	});
	NodeBase.prototype.__defineSetter__("scope", function(scope){
		return this._scope = scope;
	});
	NodeBase.prototype.__defineGetter__("offsetScope", function(){
		var scope = this.scope;
		if (scope.isLetScope){
			return scope.parent;
		}
		return scope;
	});
	NodeBase.prototype.queryParent = function (type){
		var p = this.parent;
		while (p && p.type != type){
			p = p.parent;
		}
		return p;
	}
	NodeBase.prototype.is = function (){
		var list, types;
		list = arguments.length > 1 ? arguments : arguments[0].split(' '), types = this.types || [this.type];
		for (var i=0; i < list.length; i++){
			if (types.indexOf(list[i]) != -1){
				return list[i];
			}else if (nodemap.test(types[0], list[i])){
				return list[i];
			}
		}
		return false;
	}
	NodeBase.prototype.eq = function (){
		var text, list;
		if (this.isnode){
			if (this.length == 1 && this[0].istoken){
				text = this[0].text;
			}else {
				return false;
			}
		}else {
			text = this.text;
		}
		list = arguments.length > 1 ? arguments : arguments[0].split(' ');
		for (var i=0; i < list.length; i++){
			if (list[i] == text){
				return text;
			}
		}
		return false;
	}
	return NodeBase;
})();
module.exports = NodeBase;