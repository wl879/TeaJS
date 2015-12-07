var Scope = (function(){
	function Scope(node){
		// @.id        = ID();
		this.name = null;
		if (node && (node.isnode || node.istoken)){
			this.node = node;
			this.type = node.type;
			this.node.scope = this;
			// @.node.scopeID = @.id;
		}else {
			this.type = node || '?';
		}
		this.variables = {};
		this.lets = {};
		this.consts = [];
		this.exports = [];
		this.argumentsDefine = [];
		this.sub = [];
		switch (this.type){
			case 'ClassExpr':
				this.construct = null;
				this.inits = [];
				this.protos = [];
				this.statics = [];
				break;
			case 'Root':
				this.requires = {"length": 0};
				break;
		}
	}
	var global_scope = new Scope();
	global_scope.type = 'Global';
	global_scope.top = null;
	Scope.prototype.__defineGetter__("top", function(){
		if (!this._top_){
			var scopeParent = this.node && this.node.scopeParent;
			this._top_ = scopeParent && scopeParent.scope || global_scope;
		}
		return this._top_;
	});
	Scope.prototype.__defineSetter__("top", function(scope){
		scope.addSub(this);
		return this._top_ = scope;
	});
	Scope.prototype.__defineGetter__("parent", function(){
		var top = this.top;
		while (top.isLetScope){
			top = top.top;
		}
		return top;
	});
	Scope.prototype.__defineGetter__("root", function(){
		var rot = this;
		while (rot && rot.type != 'Root'){
			rot = rot.top;
		}
		return rot || global_scope;
	});
	Scope.prototype.queryParent = function (type){
		var p = this;
		while (p && p.type != type){
			if (p.type == 'Root' || p.type == 'Global'){
				return;
			}
			p = p.top;
		}
		return p;
	}
	Scope.prototype.addSub = function (scope){
		if (this.sub.indexOf(scope) == -1){
			this.sub.push(scope);
		}
		return this;
	}
	Scope.prototype.set = function (type, name, force){
		var names = typeof name == 'string' ? [name] : name;
		for (var i=0, name; i < names.length; i++){
			name = names[i];
			if (this.hasOwnProperty(type) && isArray(this[type])){
				if (this[type].indexOf(name) == -1){
					this[type].push(name);
				}
				return this;
			}
			var variables = this.variables;
			if (force || !(variables.hasOwnProperty(name))){
				variables[name] = type;
			}
		}
		return this;
	}
	Scope.prototype.get = function (type){
		var variables = this.variables, list = [];
		for (var name in variables){
			if (!variables.hasOwnProperty(name)) continue;
			if (variables[name] == type){
				list.push(name);
			}
		}
		return list;
	}
	Scope.prototype.setLet = function (name, rename){
		this.set('let', name);
		if (rename){
			this.lets[name] = rename;
		}
	}
	Scope.prototype.getLet = function (name){
		var scope = this.isDefined(name, 'let', 100, true);
		if (scope){
			return scope.lets[name] || name;
		}
	}
	Scope.prototype.isDefined = function (name, type, level, ret_scope){
		var variables, scope = this, _scope;
		if (!level) level = 100;
		while (scope && scope != _scope && level--){
			_scope = scope;
			variables = scope.variables;
			if (variables.hasOwnProperty(name)){
				type = type ? variables[name] == type : variables[name];
				if (ret_scope && type){
					return scope;
				}
				return type;
			}
			if (type == 'let' && !scope.isLetScope){
				break;
			}
			scope = scope.top;
		}
		return false;
	}
	Scope.prototype.create = function (node, let_type){
		var scope = new Scope(node);
		scope.top = this;
		if (let_type){
			scope.isLetScope = true;
		}
		return scope;
	}
	Scope.prototype.addRequire = function (file){
		if (!Path.isFile(file)){
			throw tea.error(new Error(), 'join the "'+file+'" file not exist');
		}
		if (this.requires.hasOwnProperty(file)){
			return this.requires[file];
		}
		var key = Path.join('./', Path.relative(tea.argv.outdir || '', file));
		this.requires[file] = key;
		this.requires.length++;
		return key;
	}
	Scope.parse = function(node, __scope, __let_scope){
		if (!__scope) __scope = node.scope || global_scope;
		switch (node.is('ScopeNode', 'ControlStam')){
			case 'ScopeNode':
				__scope = __scope.create(node);
				__let_scope = null;
				break;
			case 'ControlStam':
				__let_scope = (__let_scope || __scope).create(node, 'let');
				break;
			default:
				node.scope = __let_scope || __scope;
				break;
		}
		for (var i=0, item; i < node.length; i++){
			item = node[i];
			item.scope = __let_scope || __scope;
			if (item.type == 'IdentifierTokn'){
				checkIdentifier(node, item, __scope, __let_scope);
			}
			if (item.isnode){
				Scope.parse(item, __scope, __let_scope);
			}
		}
		return __scope;
	};
	function createScope(node, parent_scope){
		var scope = new Scope(node);
		scope.top = parent_scope;
		return scope;
	}
	function checkIdentifier(parent, id, scope, let_scope){
		var idexpr, ass_expr, argu_expr, arr_patt, expr, p = parent;
		do {
			if (p.type == 'IdentifierExpr'){
				idexpr = p;
				continue;
			}
			if (p.type == 'ArrayPatt'){
				arr_patt = p;
				continue;
			}
			if (p.type == 'AssignmentDecl' || p.type == 'AssignmentExpr'){
				ass_expr = p;
				continue;
			}
			if (p.type == 'ArgumentsDecl' || p.type == 'ArgumentsExpr'){
				argu_expr = p;
				continue;
			}
			if (p.type == 'CommaExpr' || p.type == 'CommaStam' || p.type == 'NodeStam'){
				continue;
			}
			expr = p;
			break;
		} while (p = p.parent);
		if (!idexpr){
			if (argu_expr){
				if (let_scope && let_scope.type == 'ForStam' && expr.type == 'VarDecl' && /ForPConditionPatt|ForInConditionPatt/.test(expr.parent.type)){
					checkArguments('LetDecl', ass_expr, id, scope, let_scope);
				}else {
					checkArguments(expr.type, ass_expr, id, scope, let_scope);
				}
			}else if (expr.is('FunctionDecl', 'GetterDecl', 'SetterDecl', 'MethodDecl', 'ClassExpr', 'ClassExpr')){
				checkFunctionName(parent, id, scope);
			}else if (ass_expr && arr_patt){
				checkIdentifierExpr(expr, ass_expr, arr_patt, id, scope, let_scope);
			}else if (/AtExpr/.test(parent.parent.type) && parent.index == 1){
				checkAt(parent.parent, id);
			}
		}else {
			checkIdentifierExpr(expr, ass_expr, idexpr, id, scope, let_scope);
		}
		return;
	}
	function checkAt(parent, id){
		var scope, top_scope;
		if (parent.length == 2 && parent.parent.type == 'AssignmentExpr'){
			scope = parent.offsetScope;
			if (scope.type == 'ClassExpr'){
				scope.set('statics', id.text);
				scope.set('static', id.text);
				return;
			}
			top_scope = scope.parent;
			if (top_scope.type == 'ClassExpr'){
				if (top_scope.protos.indexOf(scope.name) != -1){
					top_scope.set('protos', id.text);
					top_scope.set('proto', id.text, true);
				}else if (top_scope.statics.indexOf(scope.name) != -1){
					top_scope.set('statics', id.text);
					top_scope.set('static', id.text);
				}
			}
		}
	}
	function checkArguments(expr_type, ass_expr, id, scope, let_scope){
		var root;
		switch (expr_type){
			case 'LetDecl':
				if (let_scope){
					let_scope.set('let', id.text);
				}else {
					scope.set('let', id.text);
				}
				break;
			case 'ConstDecl':
				if (root = scope.root){
					root.set('undefined', id.text);
					root.set('consts', id.text);
				}
				scope.set('const', id.text);
				break;
			case 'VarDecl':
				scope.set('defined', id.text);
				break;
			case 'ExportDecl':
				if (!scope.isDefined(id.text)){
					scope.set('undefined', id.text);
				}
				scope.set('exports', id.text);
				break;
			case 'ProtoDecl':case 'InitDecl':
				scope.set('protos', id.text);
				scope.set('proto', id.text, true);
				break;
			case 'StaticDecl':
				scope.set('statics', id.text);
				scope.set('static', id.text);
				break;
			case 'FunctionExpr':case 'FunctionDecl':case 'GetterDecl':case 'SetterDecl':case 'MethodDecl':case 'LambdaExpr':
				scope.set('argument', id.text);
				if (ass_expr){
					scope.argumentsDefine.push(ass_expr.clone());
				}
				break;
		}
	}
	function checkFunctionName(parent, id, scope){
		var expr_type = parent.parent.type;
		if (expr_type == 'JsonExpr'){
			return;
		}
		var top_scope = scope.parent;
		if (expr_type == 'ExportDecl'){
			top_scope.set('exports', id.text);
		}
		switch (parent.type){
			case 'GetterDecl':
				top_scope.set('getter', id.text);
				break;
			case 'SetterDecl':
				top_scope.set('setter', id.text);
				break;
			case 'ClassExpr':
				top_scope.set('class', id.text);
				break;
			case 'FunctionDecl':
				top_scope.set('function', id.text);
				break;
			case 'MethodDecl':
				switch (expr_type){
					case 'StaticDecl':
						top_scope.set('statics', id.text);
						top_scope.set('static', id.text);
						break;
					case 'ProtoDecl':case 'ClassExpr':case 'InitDecl':
						top_scope.set('protos', id.text);
						top_scope.set('proto', id.text);
						break;
					default:
						if (top_scope.type == 'ClassExpr'){
							top_scope.set('protos', id.text);
							top_scope.set('proto', id.text);
						}else {
							top_scope.set('function', id.text);
						}
						break;
				}
				break;
			default:
				return;
		}
		scope.name = id.text;
	}
	function checkIdentifierExpr(expr, ass, idexpr, id, scope, let_scope){
		if (let_scope && let_scope.isDefined(id.text, 'let')){
			return;
		}
		var forstam = let_scope && let_scope.type == 'ForStam' && /ForPConditionPatt|ForInConditionPatt/.test(expr.type);
		if (ass && idexpr.index == 0){
			if (forstam && ass.parent.index == 0){
				let_scope.set('let', id.text);
			}else {
				if (scope.isDefined(id.text, null, 1) == 'unknow'){
					scope.set('modfiy', id.text, true);
				}else if (!/defined/.test(scope.isDefined(id.text))){
					scope.set('undefined', id.text);
				}
			}
		}else if (!scope.isDefined(id.text, null, 1)){
			if (forstam && idexpr.parent.index == 0){
				let_scope.set('let', id.text);
			}else {
				scope.set('unknow', id.text);
			}
		}
	}
	return Scope;
})();
module.exports = Scope;