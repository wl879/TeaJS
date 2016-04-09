var Scope = (function(){
	var scope_map, decl_types;
	scope_map = {};
	decl_types = ["function", "static", "proto", "name", 'class', 'argument'];
	function Scope(type, node, parent){
		this.type = type;
		this.target = node;
		this.name = null;
		this.variables = {};
		this.undefines = {};
		this.cache = {};
		if (this.type == 'Class'){
			this.protos = {};
			this.statics = {};
		}
		if (parent){
			this.upper = parent;
			!parent.subs && (parent.subs = []);
			parent.subs.push(this);
		}
	};
	Scope.prototype.__defineGetter__("valid", function(){
		var scope;
		scope = this;
		while (scope.type == 'Let'){
			scope = scope.upper;
		}
		return scope;
	});
	Scope.prototype.__defineGetter__("parent", function(){
		var upper;
		upper = this.upper;
		while (upper.type == 'Let'){
			upper = upper.upper;
		}
		return upper;
	});
	Scope.prototype.__defineGetter__("root", function(){
		var rot;
		rot = this;
		while (rot && rot.type != 'Root'){
			rot = rot.upper;
		}
		return rot;
	});
	Scope.prototype.query = function (name){
		var scope;
		scope = this;
		while (scope && (scope.type != name && scope.name != name)){
			if (scope.type == 'Root' || scope.type == 'Global'){
				return;
			}
			scope = scope.upper;
		}
		return scope;
	};
	Scope.prototype.define = function (state, id, alias){
		var scope;
		if (state.isToken || state.isSyntax){
			alias = id, id = state, state = null;
		}
		if (id.isToken){
			id = id.parent;
		}
		if (!state){
			state = checkScopeMap(id);
			if (!alias && state == 'let'){
				alias = 'l_$';
			}
		}
		if (!state){
			return;
		}
		if (id.type == 'NameExpr'){
			this.name = id[0].text;
		}
		switch (state){
			case 'name':
				this.name = id[0].text;
				break;
			case 'function':case 'class':
				setDefine(this.parent, id, state, alias);
				break;
			case 'proto':case 'static':
				if (!(scope = this.query('Class'))){
					throw Error.create(1002, id, new Error());
				}
				setDefine(scope, id, state, alias);
				break;
			case 'for_let':
				setDefine(this, id, state, alias);
				break;
			case 'let':
				if (!alias && id.parent && id.query('LetStam')){
					alias = 'l_$';
				}
				setDefine(this, id, state, alias);
				break;
			default:
				setDefine(this.valid, id, state, alias);
				break;
		}
		return state;
	};
	function setDefine(scope, ids, state, alias){
		var variables, text, exist;
		variables = scope[state+'s'] || scope.variables;
		if (typeof ids == 'string'){
			ids = [{"text": ids}];
		}
		for (var id, i = 0; i < ids.length; i++){
			id = ids[i];
			text = id.text;
			if (variables.hasOwnProperty(text)){
				exist = variables[text];
				if (exist[0] == 'const'){
					throw Error.create(1003, vars, new Error());
				}
				if (state == 'undefined' || state == 'unknow'){
					continue;
				}
			}else if (state == 'undefined' || state.indexOf('undefined') != -1){
				scope.undefines[text] = id.isToken ? id : text;
			}
			!variables[text] && (variables[text] = [undefined]);
			variables[text][0] = state;
			if (alias){
				variables[text][1] = alias.replace(/\$/g, text);
			}
		}
	};
	Scope.prototype.state = function (target, level){
		var state;
		if (level == null) level = 0;
		if (state = this.check(target, level, true)){
			return state[0];
		}
	};
	Scope.prototype.alias = function (target, level){
		var state;
		if (level == null) level = 0;
		if (state = this.check(target, level, true)){
			return state[1];
		}
	};
	Scope.prototype.check = function (target, level, not_define){
		var name, ref, scope, state, stop, _scope;
		if (level == null) level = 0;
		ref = checkTarget(target), target = ref[0], name = ref[1];
		scope = this;
		if (scope.variables.hasOwnProperty(name)){
			return scope.variables[name];
		}
		while (scope.type == 'Let'){
			scope = scope.upper;
			if (scope.variables.hasOwnProperty(name)){
				return scope.variables[name];
			}
		}
		if (level !== 1){
			if (target && !not_define){
				state = checkScopeMap(target);
				if (state && state != 'undefined' && state != 'unknow'){
					return [this.define(state, target)];
				}
			}
			if (level.isScope){
				stop = level;
				level = 0;
			}
			_scope = null;
			while (scope = scope.upper){
				if (scope == stop && scope != _scope && --level){
					break;
				}
				_scope = scope;
				if (scope.variables.hasOwnProperty(name)){
					state = scope.variables[name];
					this.variables[name] = [/undefined|defined|name/.test(state[0]) ? 'unknow' : state[0], state[1]];
					return scope.variables[name];
				}
			}
			if (state){
				return [this.define(state, target)];
			}
		}
	};
	Scope.prototype.member = function (target){
		var name, ref, cls;
		ref = checkTarget(target), target = ref[0], name = ref[1];
		if (cls = this.query('Class')){
			if (cls.protos.hasOwnProperty(name)){
				return 'proto';
			}
			if (cls.statics.hasOwnProperty(name)){
				return 'static';
			}
		}
	};
	Scope.prototype.cachePush = function (name, something){
		var cache;
		cache = this.cache;
		!cache[name] && (cache[name] = []);
		cache[name].push(something);
		return cache[name];
	};
	Scope.prototype.isScope = true;
	Scope.init = function(ast, check_define, __scope){
		var type;
		if (!__scope){
			__scope = new Scope(ast.is('Let', 'Class', 'Function', 'Root') || 'Root', ast);
			ast.scope = __scope;
		}
		for (var node, i = 0; i < ast.length; i++){
			node = ast[i];
			if (type = node.is('Let', 'Class', 'Function', 'Root')){
				node.scope = new Scope(type, node, __scope);
				Scope.init(node, check_define, node.scope);
			}else {
				node.scope = __scope;
				if (scope_map[node.type]){
					if (type = checkScopeMap(node, scope_map[node.type])){
						if (decl_types.indexOf(type) != -1){
							__scope.define(type, node);
						}
					}
				}
				if (node.isSyntax){
					Scope.init(node, check_define, __scope);
				}
			}
		}
		return ast.scope;
	};
	Scope.defineScope = function(patt){
		var slices;
		slices = SText.split(patt, '->', true);
		compileScopeMap(slices.pop(), slices.reverse(), 0, scope_map);
	};
	Scope.test = function(node){
		return !!scope_map[node.type];
	};
	function compileScopeMap(type, patt, index, __sub){
		var names, test, top, ref, m, testIndex, sub, sub2;
		names = patt[index];
		if (names[0] == '<'){
			names = names.substr(1).trim();
			test = true;
		}else if (/\<\-/.test(names)){
			ref = names.split('<-'), top = ref[0], names = ref[1];
			top = top.trim().split(' ');
		}
		names = names.trim().split(' ');
		for (var name, i = 0; i < names.length; i++){
			name = names[i];
			if (m = name.match(/^(\w+)\[(\d+)\]$/)){
				name = m[1];
				testIndex = m[2];
			}
			sub = sub2 = null;
			if (test){
				__sub[name] = __sub[name] || {};
				sub = __sub;
				if (testIndex){
					__sub[name].testIndex = true;
					sub2 = __sub[name][testIndex] = __sub[name][testIndex] || {};
				}else {
					sub2 = __sub[name].subs = __sub[name].subs || {};
				}
			}else {
				sub = __sub[name] = __sub[name] || {};
				if (testIndex){
					__sub[name].testIndex = true;
					sub = __sub[name][testIndex] = __sub[name][testIndex] || {};
				}
			}
			if (top){
				__sub[name].tops = top;
				top.default = type;
			}
			if (index < patt.length-1){
				compileScopeMap(type, patt, index+1, sub);
				if (sub2){
					compileScopeMap(type, patt, index+1, sub2);
				}
			}else if (!top){
				__sub[name].default = type;
			}
		}
	};
	function checkScopeMap(node, _map, _not_def){
		var parent, map, index, ref;
		if (!_map){
			if (scope_map[node.type]){
				return checkScopeMap(node, scope_map[node.type]);
			}
			return;
		}
		if (parent = node.parent){
			if (parent.type == 'ArgusStam'){
				parent = parent.parent;
			}
			if (parent && (map = _map[parent.type])){
				if (map.testIndex){
					index = node.index;
					if (map[index]){
						if (ref = checkScopeMap(parent, map[index], true) || map.default){
							return ref;
						}
					}
					return checkScopeMap(parent, map, true) || _map.default;
				}
				return checkScopeMap(parent, map);
			}
			if (_map.tops){
				if (parent.scope && _map.tops.indexOf(parent.scope.valid.type) != -1){
					return _map.tops.default;
				}
			}
		}
		if (_map.subs){
			return checkScopeMap(node, _map.subs);
		}
		if (!_not_def && _map.default){
			return _map.default;
		}
	};
	function checkTarget(target){
		var name;
		if (target.isSyntax || target.isToken){
			name = target.text;
			if (target.isToken){
				target = target.parent;
			}
		}else {
			name = target;
			target = null;
		}
		return [target, name];
	};
	return Scope;
})();
module.exports = Scope;