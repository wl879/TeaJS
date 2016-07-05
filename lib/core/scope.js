var Scope = (function(){
	var Node = require("./node.js");
	var scope_name_map = {};
	var scope_state_map = {};
	var scope_tar_map = {};
	var decl_types = ["function", 'class', "static", "proto", 'argument'];
	function Scope(type, node, parent){
		this.type = type;
		this.target = node;
		this.name = null;
		this.variables = {};
		this.undefines = {};
		this.subs = [];
		if (this.type == 'ClassScope'){
			this.protos = {};
			this.statics = {};
		}
		if (parent){
			this.upper = parent;
		}
	};
	Scope.prototype.__defineGetter__("upper", function(){
		return this.__upper__;
	});
	Scope.prototype.__defineSetter__("upper", function(parent){
		this.__upper__ = parent;
		if (parent.subs.indexOf(this) == -1){
			parent.subs.push(this);
		}
		return this.__upper__;
	});
	Scope.prototype.__defineGetter__("valid", function(){
		var scope;
		scope = this;
		while (scope.type == 'LetScope'){
			scope = scope.upper;
		}
		return scope;
	});
	Scope.prototype.__defineGetter__("parent", function(){
		var upper;
		upper = this;
		while (upper = upper.upper){
			if (upper.type == 'LetScope'){
				continue;
			}
			break;
		}
		return upper;
	});
	Scope.prototype.query = function (name){
		var scope;
		scope = this;
		while (scope && (scope.type != name && scope.name != name)){
			scope = scope.upper;
		}
		return scope;
	};
	Scope.prototype.define = function (state, target, alias){
		var ids, scope;
		if (state.isNode || state.isToken){
			alias = target, target = state, state = null;
		}
		ids = formatIdArray(target);
		if (!(state = state || checkStateMep(ids))) return;
		switch (state){
			case 'function':case 'class':
				this.name = ids[0].text;
				defineState(this.parent, ids, state, alias);
				break;
			case 'proto':case 'static':
				scope = this.valid;
				if (scope.type != 'ClassScope'){
					scope = scope.parent;
				}
				if (scope.type != 'ClassScope'){
					Tea.error(1002, state, ids);
				}
				defineState(scope, ids, state, alias);
				break;
			case 'let':
				defineState(this, ids, state, alias);
				break;
			case 'const':case 'var':case 'argument':
				defineState(this.valid, ids, state, alias);
				break;
			case 'undefined':case 'unknow':
				if (ids[0].parent && ids[0].parent.query('ConditionExpr')){
					defineState(this.upper, ids, state, alias);
				}else {
					defineState(this, ids, state, alias);
				}
				break;
			default:
				if (/\blet\b/.test(state)){
					defineState(this, ids, state, alias);
				}else {
					defineState(this.valid, ids, state, alias);
				}
				break;
		}
		return state;
	};
	Scope.prototype.check = function (target, level){
		var ids, state, stop, uns, _state;
		if (level == null) level = 0;
		ids = formatIdArray(target);
		state = checkStateMep(ids);
		if (state && /class|function|proto|static|const|var|let|argument/.test(state)){
			this.define(state, ids);
			return this;
		}
		if (level.isScope){
			stop = level;
			level = 0;
		}
		uns = [];
		for (var id, i = 0; i < ids.length; i++){
			id = ids[i];
			if (_state = checkState(this, id, level, stop)){
				this.variables[id.text] = [/undefined|var/.test(_state[0]) ? 'unknow' : _state[0], _state[1]];
			}else {
				uns.push(id);
			}
		}
		if (uns.length){
			state = state || 'unknow';
			uns.type = ids.type;
			this.define(state, uns);
		}
		return this;
	};
	Scope.prototype.state = function (target, level){
		var ids, states, stop, _state;
		if (level == null) level = 0;
		ids = formatIdArray(target);
		states = [];
		if (level.isScope){
			stop = level;
			level = 0;
		}
		for (var id, i = 0; i < ids.length; i++){
			id = ids[i];
			if (_state = checkState(this, id, level, stop)){
				states.push(_state[0]);
			}else {
				states.push(null);
			}
		}
		if (target.isToken || typeof target == 'string'){
			return states[0];
		}
		return states;
	};
	Scope.prototype.alias = function (target, level){
		var ids, alias, stop, _state;
		if (level == null) level = 0;
		ids = formatIdArray(target);
		alias = [];
		if (level.isScope){
			stop = level;
			level = 0;
		}
		for (var id, i = 0; i < ids.length; i++){
			id = ids[i];
			id.alias = null;
			if (_state = checkState(this, id, level, stop)){
				alias.push(_state[1]);
				if (_state[1]){
					id.alias = _state[1];
				}
			}else {
				alias.push(null);
			}
		}
		if (target.isToken || typeof target == 'string'){
			return alias[0];
		}
		return alias;
	};
	Scope.prototype.member = function (target){
		var class_scope, ids, types;
		if (class_scope = this.query('ClassScope')){
			ids = formatIdArray(target);
			types = [];
			for (var id, i = 0; i < ids.length; i++){
				id = ids[i];
				if (class_scope.protos.hasOwnProperty(id.text)){
					types.push('proto');
				}else if (class_scope.statics.hasOwnProperty(id.text)){
					types.push('static');
				}
			}
			if (target.isToken || typeof target == 'string'){
				return types[0];
			}
			return types;
		}
	};
	Scope.prototype.undefineds = function (check){
		var unds, upper;
		for (var sub, i = 0; i < this.subs.length; i++){
			sub = this.subs[i];
			if (sub.type == 'LetScope'){
				sub.undefineds(true);
			}
		}
		if (this.type == 'LetScope'){
			unds = this.undefines;
			for (var name in unds){
				if (!unds.hasOwnProperty(name)) continue;
				if (upper = checkStateScope(this.upper, {"text": name}, 1)){
					upper.undefines[name] = unds[name];
					delete unds[name];
				}
			}
		}
		return check ? this.undefines : Jsop.toArray(this.undefines);
	};
	Scope.prototype.createVariable = function (name, state, deep){
		var name_dic, i, _name;
		if (name == null) name = 'i';
		if (deep == null) deep = true;
		if (name.isNode || name.isToken){
			if (deep){
				deep = [name];
			}
			name = name.text;
		}
		if (name.length == 1){
			name_dic = 'abcdefghijklmnopqrstuvwxyz';
			i = [].indexOf.call(name_dic, name);
		}else {
			i = 0;
		}
		_name = name;
		while (checkVariableName(_name, this, deep)){
			if (name_dic){
				_name = name_dic[++i];
			}else {
				_name = name+'_'+(i++);
			}
		}
		if (state){
			this.define(state || 'undefined', _name);
		}
		return _name;
	};
	Scope.prototype.isScope = true;
	Scope.init = function(node){
		return initScope(node);
	};
	Scope.test = function(node){
		return !!scope_state_map[node.type];
	};
	Scope.state = function(node){
		var state;
		state = node.scope && node.scope.state(node);
		if (state && state.length){
			return state;
		}
		return checkStateMep(node);
	};
	Scope.define = function(name, value){
		var list, r_list;
		if (/\w+Scope$/.test(name)){
			scope_name_map[name] = value.trim().split(/ +/);
			return;
		}
		list = SText.split(value, /<-*/, false);
		if (list.length > 1){
			value = list[list.length-1];
			r_list = list.slice(0, -1);
		}
		list = SText.split(value, /-*>/, false);
		if (r_list){
			r_list.push(list[0]);
			r_list.reverse();
			scope_tar_map[name] = {};
			setTargetMep(r_list, scope_tar_map[name]);
		}
		setStateMep(list, scope_state_map, name);
	};
	/**
	     * 
	     */
	function setStateMep(list, map, name){
		var mark, parents, types, m;
		if (!list.length){
			return map.name = name;
		}
		list = list.slice();
		mark = list.shift();
		if (/-*>/.test(mark)){
			parents = map['parents'] || (map['parents'] = {});
			types = list.shift().trim().split(/ +/);
		}else {
			types = mark.trim().split(/ +/);
			mark = null;
			parents = map;
		}
		for (var type, i = 0; i < types.length; i++){
			type = types[i];
			if (m = type.match(/\[(\d)\]$/)){
				type = type.substr(0, type.length-m[0].length);
			}
			if (Node.map[type]){
				for (var sub, j = 0; j < Node.map[type].length; j++){
					sub = Node.map[type][j];
					types.push(sub+(m && m[0] || ''));
				}
				continue;
			}
			!parents[type] && (parents[type] = {});
			if (m) parents[type].testIndex = m[1];
			if (mark == '-->'){
				!map.tops && (map.tops = []);
				map.tops.push(type);
			}else if (mark == '>'){
				setStateMep(list, map, name);
			}
			setStateMep(list, parents[type], name);
		}
	};
	function setTargetMep(list, map, test){
		var mark, children, types, m;
		if (!list.length){
			return map.test = test || false;
		}
		list = list.slice();
		mark = list.shift();
		if (/<-*/.test(mark)){
			children = map['children'] || (map['children'] = {});
			types = list.shift().trim().split(/ +/);
		}else {
			types = mark.trim().split(/ +/);
			mark = null;
			children = map;
		}
		for (var type, i = 0; i < types.length; i++){
			type = types[i];
			if (m = type.match(/\[(\d)\]$/)){
				type = type.substr(0, type.length-m[0].length);
			}
			if (Node.map[type]){
				for (var sub, j = 0; j < Node.map[type].length; j++){
					sub = Node.map[type][j];
					types.push(sub+(m && m[0] || ''));
				}
				continue;
			}
			!children[type] && (children[type] = {});
			if (m) children[type].getIndex = m[1];
			if (mark == '<'){
				setTargetMep(list, map, true);
			}
			setTargetMep(list, children[type]);
		}
	};
	/**
	     * 
	     */
	function checkScopeMap(node){
		var type;
		type = node.type || node;
		for (var key in scope_name_map){
			if (!scope_name_map.hasOwnProperty(key)) continue;
			if (scope_name_map[key].indexOf(type) != -1){
				return key;
			}
		}
	};
	function checkStateMep(node, map){
		var sub, type, parent, ref;
		if (!map){
			if (sub = scope_state_map[node.type]){
				type = checkStateMep(node, sub);
				return type;
			}
			return;
		}
		if (!(parent = node.parent)){
			return map.name;
		}
		while (/sequence/i.test(parent.type)){
			parent = parent.parent;
		}
		if (map.parents && (sub = map.parents[parent.type])){
			if (!sub.testIndex || node.index == sub.testIndex){
				ref = checkStateMep(parent, sub);
				return ref;
			}
		}
		if (map.tops){
			return checkMapInTop(node, map);
		}
		if (map.name){
			return map.name;
		}
	};
	function checkMapInTop(node, map){
		var tops, parent, type;
		tops = map.tops;
		parent = node.parent;
		while (parent){
			if (type = parent.is.apply(parent, tops)){
				return checkStateMep(parent, map.parents[type]);
			}
			if (type = checkScopeMap(parent) && type != 'LetScope'){
				break;
			}
			parent = parent.parent;
		}
		if (map.name){
			return map.name;
		}
	};
	function checkTargetMep(node, map){
		var children, tars;
		if (children = map.children){
			tars = [];
			for (var sub, i = 0; i < node.length; i++){
				sub = node[i];
				if (children[sub.type]){
					tars.push(checkTargetMep(sub, children[sub.type]));
				}else if (map.test){
					tars.push(sub);
				}
			}
			return tars;
		}else {
			if (map.getIndex){
				return map.getIndex ? node[map.getIndex] : null;
			}
			return map.test ? node : null;
		}
	};
	/**
	     * 
	     */
	function initScope(node, scope){
		var type;
		if (!scope){
			// print(scope_state_map);
			scope = new Scope(checkScopeMap(node) || 'RootScope', node);
			node.scope = scope;
		}
		for (var sub, i = 0; i < node.length; i++){
			sub = node[i];
			if (type = checkScopeMap(sub)){
				sub.scope = new Scope(type, sub, scope);
				initScope(sub, sub.scope);
			}else {
				sub.scope = scope;
				if (scope_state_map[sub.type]){
					if (type = checkStateMep(sub, scope_state_map[sub.type])){
						if (decl_types.indexOf(type) != -1){
							scope.define(type, sub);
						}
					}
				}
				if (sub.isNode){
					initScope(sub, scope);
				}
			}
		}
		return node.scope;
	};
	function formatIdArray(ids){
		if (ids.isNode || Array.isArray(ids)){
			return ids;
		}
		if (ids.isToken){
			return ids.parent;
		}
		return [{"text": ids}];
	};
	function defineState(scope, ids, state, alias){
		var variables, name, exist, _alias;
		switch (state){
			case 'proto':
				variables = scope.protos;
				break;
			case 'static':
				variables = scope.statics;
				break;
			default:
				variables = scope.variables;
				break;
		}
		if (scope_tar_map[state] && scope_tar_map[state][ids.type]){
			if (!(ids = checkTargetMep(ids, scope_tar_map[state][ids.type]))){
				return;
			}
		}
		for (var id, i = 0; i < ids.length; i++){
			id = ids[i];
			if (!id){
				continue;
			}
			name = id.text;
			if (variables.hasOwnProperty(name)){
				exist = variables[name];
				if (exist[0] == 'const'){
					Tea.error(1003, vars);
				}
				if (state == 'undefined' || state == 'unknow' || exist[0] == state){
					continue;
				}
			}else if (state.indexOf('undefined') != -1){
				scope.undefines[name] = id.isToken ? id : name;
			}
			_alias = alias ? alias.replace(/\$/g, name) : (state == 'let' ? scope.createVariable(id, 'let random') : null);
			variables[name] = [state, _alias];
		}
	};
	/**
	     * 
	     */
	function checkStateScope(scope, id, level, stop){
		while (scope){
			if (scope.variables.hasOwnProperty(id.text)){
				return scope;
			}
			scope = scope.upper;
			if (scope && (scope.type == 'LetScope' || scope != stop || --level)){
				continue;
			}
			break;
		}
	};
	function checkState(scope, id, level, stop){
		if (scope = checkStateScope(scope, id, level, stop)){
			return scope.variables[id.text];
		}
	};
	function checkVariableName(name, scope, deep){
		var state, node;
		if (!(state = scope.state(name))){
			if (deep && (node = scope.target)){
				!Array.isArray(deep) && (deep = null);
				node.each(function(target, indexs){
					var type;
					if (deep && deep.indexOf(target) != -1){
						return 0;
					}
					type = target.type;
					if (target.scope.type == 'FunctionScope' || type == 'MemberExpr'){
						return 0;
					}
					if (type == 'IDENTIFIER' || type == 'KEYWORD'){
						if (target.text == name){
							state = 'unknow';
							return false;
						}
					}
				});
			}
		}
		if (state == 'let undefined ref'){
			return false;
		}
		return state;
	};
	return Scope;
})();
module.exports = Scope;