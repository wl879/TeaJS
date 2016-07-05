var NodeObj = (function(){
	var array = Array.prototype;
	function NodeObj(){};
	NodeObj.prototype.__defineGetter__("index", function(){
		return !this.parent ? -1 : array.indexOf.call(this.parent, this);
	});
	NodeObj.prototype.find = function (type){
		var list;
		list = [];
		for (var node, i = 0; i < this.length; i++){
			node = this[i];
			if (node.type == type){
				list.push(node);
			}else if (node.isNode){
				list.push.apply(list, node.find(type));
			}
		}
		return list;
	};
	NodeObj.prototype.query = function (){
		var node;
		node = this;
		while (node && !node.is.apply(node, arguments)){
			node = node.parent;
		}
		return node;
	};
	NodeObj.prototype.insert = function (pos){
		var args, len;
		args = Jsop.toArray(arguments, 1);
		len = this.length;
		if (pos < 0){
			pos = len+pos;
		}
		for (var i=pos; i < len; i++){
			args.push(this[i]);
		}
		this.length = pos;
		this.add.apply(this, args);
		return this;
	};
	NodeObj.prototype.delete = function (a, b){
		if (b == null) b = a;
		array.splice.call(this, a, b-a+1);
		return this;
	};
	NodeObj.prototype.toList = function (index){
		var list;
		if (this.isToken){
			return index ? null : (index == 0 ? this : [this]);
		}
		list = [];
		for (var item, i = 0; i < this.length; i++){
			item = this[i];
			if (!item){
				continue;
			}
			if (item.toList && item.length != null){
				list.push.apply(list, item.toList());
			}else {
				list.push(item);
			}
			if (index === 0){
				return list[0];
			}
		}
		if (typeof index == 'number'){
			return list[index < 0 ? list.length+index : index];
		}
		return list;
	};
	NodeObj.prototype.is = function (){
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
	NodeObj.prototype.each = function (fn, __that, __indexs){
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
					if (node.isNode && node.each(fn, that, __indexs.concat(i)) === false){
						return __that ? false : this;
					}
				}
			}
		}
		return this;
	};
	return NodeObj;
})();
var Node = (function(){
	function Node(type){
		this.type = type;
		// @.subType     = null;
		this.length = 0;
		if (arguments.length > 1){
			this.add.apply(this, Jsop.toArray(arguments, 1));
		}
	};
	Node.prototype = Object.create(NodeObj.prototype);
	Node.prototype.__super__ = NodeObj.prototype;
	Node.prototype.constructor = Node;
	Node.prototype.__defineGetter__("text", function(){
		var texts, list;
		texts = [];
		list = this.toList();
		for (var token, i = 0; i < list.length; i++){
			token = list[i];
			texts.push(token.text);
		}
		return texts.join('');
	});
	Node.prototype.add = function (){
		for (var item, i = 0; i < arguments.length; i++){
			item = arguments[i];
			if (!item){
				continue;
			}
			if (item.isNode || item.isToken){
				item.parent = this;
				this[this.length++] = item;
			}else if (Array.isArray(item)){
				if (item.length){
					this.add.apply(this, item);
				}
			}else {
				Tea.error('Node Object add medtch params error!');
			}
		}
		return this;
	};
	Node.prototype.clone = function (){
		var node = new Node(this.type);
		for (var i = 0; i < this.length; i++){
			node[node.length++] = this[i];
		}
		node.parent = this.parent;
		node.scope = this.scope;
		return node;
	};
	Node.prototype.isNode = true;
	Node.NodeObj = NodeObj;
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
			if (node_map['Express'].indexOf(name) != -1){
				return 'Express';
			}
			if (node_map['Declare'].indexOf(name) != -1){
				return 'Declare';
			}
			if (node_map['Statement'].indexOf(name) != -1){
				return 'Statement';
			}
			return false;
		}
		return name == type || node_map[type] && node_map[type].indexOf(name) != -1;
	};
	return Node;
})();
module.exports = Node;