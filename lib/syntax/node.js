var Scope = require("./scope.js");
var NodeBase = (function(){
	function NodeBase(){}
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
	NodeBase.prototype.queryParent = function (type){
		var p = this.parent;
		while (p && p.type != type){
			p = p.parent;
		}
		return p;
	}
	return NodeBase;
})();
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
	var NodeMap = {"all": []};
	Node.prototype.is = function (){
		var list = arguments.length > 1 ? Hash.slice(arguments) : arguments[0].split(' ');
		if (list.indexOf(this.type) != -1){
			return this.type;
		}
		for (var i=0; i < list.length; i++){
			if (Node.isNode(this.type, list[i])){
				return list[i];
			}
		}
		return false;
	}
	Node.prototype.eq = function (){
		if (this.length == 1 && this[0].istoken){
			return this[0].eq.apply(this[0], arguments);
		}
		return false;
	}
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
				throw tea.error(new Error(), 'Node can only add object of "Node" or "Code" and "NaN" types ! >> '+node);
			}
		}
		return this;
	}
	Node.prototype.tokens = function (index){
		var tokens = [];
		for (var i_ref = this, i=0; i < i_ref.length; i++){
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
		for (var i_ref = this, i=0; i < i_ref.length; i++){
			node[node.length++] = this[i];
		}
		node.parent = this.parent;
		return node;
	}
	Node.isNode = function(name, type){
		if (!type){
			if (NodeMap['Expr'].indexOf(name) != -1){
				return 'Expr';
			}
			if (NodeMap['Decl'].indexOf(name) != -1){
				return 'Decl';
			}
			if (NodeMap['Stam'].indexOf(name) != -1){
				return 'Stam';
			}
			return false;
		}
		return name == type || NodeMap[type] && NodeMap[type].indexOf(name) != -1;
	};
	Node.define = function(types, names){
		if (arguments.length == 1){
			if (isJson(types)){
				for (var i in types){
					if (!types.hasOwnProperty(i)) continue;
					Node.define(i, types[i]);
				}
			}
			return;
		}
		types = isArray(types) ? types : types.split(' ');
		names = isArray(names) ? names : names.split(' ');
		for (var _i=0, name; _i < names.length; _i++){
			name = names[_i];
			if (NodeMap.hasOwnProperty(name)){
				Node.define(types, NodeMap[name]);
				// NodeMap[name].top = (NodeMap[name].top||[]).concat(types);
			}
			for (var _j=0, type; _j < types.length; _j++){
				type = types[_j];
				if (!NodeMap[type]) NodeMap[type] = [];
				if (NodeMap[type].indexOf(name) == -1) NodeMap[type].push(name);
				if (NodeMap['all'].indexOf(name) == -1) NodeMap['all'].push(name);
			}
		}
	};
	Node.define({'Token' : 'ConstTokn IdentifierTokn NumTokn StringTokn RegexpTokn SymbolTokn TmlTokn BlockBreakTokn',
		'DataPatt' : 'Token ArrayExpr JsonExpr UnaryExpr IdentifierExpr PrefixExpr PostfixExpr NotExpr',
		'AccessorExpr' : 'DataPatt CompelExpr',
		'ValueExpr' : 'AccessorExpr CallExpr',
		'LogicExpr' : 'CompareExpr ComputeExpr ValueExpr',
		'BinaryExpr' : 'LogicExpr',
		'FunctionExpr' : 'FunctionDecl ClassExpr GetterDecl SetterDecl MethodDecl PackageExpr LambdaExpr',
		'ExprStam' : 'SuperExpr ThisExpr AtExpr TernaryExpr Ternary2.5Expr BinaryExpr FunctionExpr RequireStam CommDecl ImportExpr ExtendsExpr',
		'ClausesStam' : 'LetDecl ConstDecl VarDecl ReturnStam BreakStam ContinueStam ThrowStam DebuggerStam ExportDecl',
		'ControlStam' : 'IfPatt ElseIfPatt ElsePatt WhileStam DoWhileStam WithStam ForStam SwitchStam CaseStam DefaultStam TryPatt CatchPatt FinallyPatt',
		'ConditionPatt' : 'ForPConditionPatt ForPConditionPatt ForPConditionPatt',
		'BlockStam' : 'LineBlockStam IndentBlockStam StamBlockStam',
		'StatementStam' : 'ControlStam ClausesStam AssignmentExpr CommaExpr SeleteStam BlockStam ExprStam',
		'NodeStam' : 'BlockStam',
		'ScopeNode' : 'Root FunctionExpr',
		'IgSemicolon' : 'LabelStam IfStam ElseIfStam ElseStam WhileStam WithStam ForStam WitchStam TryStam CatchStam FinallyStam FunctionExpr GetterDecl SetterDecl ClassExpr MethodDecl ExportDecl StaticDecl PackageExpr CommDecl BlockBreakTokn'});
	return Node;
})();
module.exports = Node;
module.exports.NodeBase = NodeBase;