var Node = (function(){
	var array;
	array = Array.prototype;
	function Node(){};
	Node.prototype.__defineGetter__("index", function(){
		return !this.parent ? -1 : array.indexOf.call(this.parent, this);
	});
	Node.prototype.__defineGetter__("root", function(){
		var p, circular;
		p = this;
		circular = [];
		while (p.parent){
			if (circular.indexOf(p.parent) != -1){
				throw Error.create(3, p, new Error());
			}
			p = p.parent;
			circular.push(p);
		}
		return p;
	});
	Node.prototype.find = function (type){
		var list, _list;
		list = [];
		for (var node, i = 0; i < this.length; i++){
			node = this[i];
			if (node.type == type){
				list.push(node);
			}else if (node.isSyntax){
				if (_list = node.find(type)){
					list.push.apply(list, _list);
				}
			}
		}
		if (list.length){
			return list;
		}
	};
	Node.prototype.query = function (type){
		var p;
		p = this.parent;
		while (p && !p.is.apply(p, arguments)){
			if (p.is('Block')){
				return;
			}
			p = p.parent;
		}
		return p;
	};
	Node.prototype.tokens = function (index){
		if (this.isToken){
			return index ? null : (index == 0 ? this : [this]);
		}
		var tokens = [];
		for (var i = 0; i < this.length; i++){
			if (!this[i]){
				continue;
			}
			if (this[i].isToken){
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
	};
	Node.prototype.each = function (fn, __that, __indexs){
		var that, ref;
		if (__indexs == null) __indexs = [];
		that = __that || this;
		if (this.isToken){
			fn.call(that, this, __indexs.concat(0));
		}else {
			for (var node, i = 0; i < this.length; i++){
				node = this[i];
				if (node){
					ref = fn.call(that, node, __indexs.concat(i));
					if (ref === 0){
						continue;
					}
					if (ref === false){
						return __that ? false : this;
					}
					if (node.isSyntax && node.each(fn, that, __indexs.concat(i)) === false){
						return __that ? false : this;
					}
				}
			}
		}
		return this;
	};
	Node.prototype.is = function (){
		var types;
		types = this.types || [this.type];
		for (var item, i = 0; i < arguments.length; i++){
			item = arguments[i];
			if (item == 'HEAD' && this.indent >= 0){
				return item;
			}else if (types.indexOf(item) != -1){
				return item;
			}else if (Node.isType(types[0], item)){
				return item;
			}
		}
		return false;
	};
	Node.map = {};
	Node.define = function(types, names){
		var node_map;
		node_map = Node.map;
		for (var name, i = 0; i < names.length; i++){
			name = names[i];
			if (node_map.hasOwnProperty(name)){
				Node.define(types, node_map[name]);
			}
			for (var type, j = 0; j < types.length; j++){
				type = types[j];
				!node_map[type] && (node_map[type] = []);
				if (node_map[type].indexOf(name) == -1) node_map[type].push(name);
			}
		}
	};
	Node.isType = function(name, type){
		var node_map;
		node_map = Node.map;
		if (!type){
			if (node_map['Expression'].indexOf(name) != -1){
				return 'Expression';
			}
			if (node_map['Declaration'].indexOf(name) != -1){
				return 'Declaration';
			}
			if (node_map['Statement'].indexOf(name) != -1){
				return 'Statement';
			}
			return false;
		}
		return name == type || node_map[type] && node_map[type].indexOf(name) != -1;
	};
	Node.prototype.isNode = true;
	return Node;
})();
module.exports = Node;