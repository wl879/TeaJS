var Resolver = (function(){
	var Card = require("../card.js");
	var Scope = require("../scope.js");
	var Pattern = require("./pattern.js");
	var Standard = require("./standard.js");
	var _standards = {};
	var standard_base = 'es5';
	function Resolver(parent, sugarBox){
		this.target = null;
		this.id = null;
		this.version = standard_base;
		this.sugarBox = null;
		this.variables = {};
		this.params = null;
		this.blockCache = null;
		this.scopeType = null;
		this.scopeCache = null;
		if (typeof parent == 'string'){
			this.version = parent;
			this.sugarBox = sugarBox;
		}else if (parent){
			this.parent = parent;
			this.sugarBox = sugarBox || parent.sugarBox;
			this.version = parent.version;
		}else {
			this.sugarBox = sugarBox;
		}
	};
	Resolver.prototype.cache = function (name, value, types){
		var handle, key, cache;
		handle = this;
		key = name == 'blocks' ? 'blockCache' : 'scopeCache';
		if (types && !isArray(types)){
			types = [types];
		}
		while (!(cache = handle[key]) || (types && types.indexOf(handle.scopeType) == -1)){
			if (handle = handle.parent){
				continue;
			}
			return;
		}
		if (cache){
			if (value){
				!cache[name] && (cache[name] = []);
				if (cache[name].indexOf(value) == -1){
					cache[name].push(value);
				}
			}
			return name ? cache[name] : cache;
		}
	};
	Resolver.prototype.callback = function (fn, params){
		this.__callbacks__ = fn;
		this.__params__ = params;
	};
	Resolver.prototype.find = function (target){
		var handle, key, args;
		handle = this;
		key = target.isNode ? 'target' : 'id';
		args = Jsop.toArray(arguments);
		while (args.indexOf(handle[key]) == -1){
			if (handle = handle.parent){
				continue;
			}
			return;
		}
		return handle;
	};
	Resolver.prototype.transform = function (node, do_each){
		var scope, ref;
		if (!node || (!node.isNode && !node.isToken)){
			return node;
		}
		scope = node.scope;
		if (!do_each){
			if (Scope.test(node)){
				scope.check(node).alias(node);
			}
			ref = this.standard(node.type, node);
		}
		if (ref == null && node.isNode){
			ref = new Card(node.type);
			for (var sub, i = 0; i < node.length; i++){
				sub = node[i];
				sub && ref.add(this.transform(sub));
			}
		}
		return ref != null ? ref : node;
	};
	Resolver.prototype.parse = function (patt, node, params){
		if (patt.isStandard){
			return Standard.exec(this, patt, node, params);
		}
		return Pattern.exec(this, patt, node, params);
	};
	Resolver.prototype.standard = function (name, node, params){
		var ref, std;
		if (/^[a-z]+$/i.test(name)){
			if (this.sugarBox && this.sugarBox.transform[name]){
				ref = this.sugarBox.transform[name].parse(this, node, params);
			}
			if (ref == null){
				if (std = _standards[this.version].standards[name]){
					ref = this.parse(std, node, params);
				}
				if (ref == null && this.version != standard_base){
					if (std = _standards[standard_base].standards[name]){
						ref = this.parse(std, node, params);
					}
				}
			}
		}else {
			std = Standard.compile(name);
			ref = this.parse(std, node, params);
		}
		if (ref && ref.isNode){
			ref = ref != node ? this.transform(ref) : null;
		}
		return ref;
	};
	Resolver.prototype.card = function (){
		return Jsop.newClass(Card, arguments);
	};
	Resolver.prototype.create = function (){
		return new Resolver(this);
	};
	Resolver.prototype.isResolver = true;
	Resolver.standards = _standards;
	return Resolver;
})();
module.exports = Resolver;