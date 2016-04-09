/*
#内部变量
    @ref @i                          生成一个随机的标识符名称
    @name @[name]					 等于 node.scope.valid.name
    @super @[super]                  等于 node.scope.query( 'Class' ).super
    @[Clase] @[Function] @[Root]     等于 node.scope.query( ... )

#存取表达式
    @                                带表传入的对象
    @[@]                             带表传入的对象的父节点
    @[0.1]
 */
module.exports = {
	"Root Block BlockStam": require("./block.js"),
	"BlockNode": "{#Block}",
	"RequireExpr": require("./require.js"),
	"TestPatt": {"--test": "@"},
	"REGEXP": require("./regexp.js"),
	"STRING": require("./string.js"),
	"ArrayExpr": "[#COMMA]",
	"JsonExpr": "{#COMMA}",
	"CommaExpr": "#COMMA",
	"CompelExpr": "(#COMMA)",
	"VarStam ConstStam LetStam": "var #COMMA(@0)",
	"DebuggerStam": "@0",
	"LabelStam": "@0 @1 @2",
	"ArgusExpr": require("./argus.js"),
	"PrefixExpr PostfixExpr": '@0@1',
	"FunctionDecl": "@0 @1@2@3",
	"FunctionExpr": "@0@1@2",
	"GeneratorDecl": {"default": {"error": 1121}},
	"GeneratorExpr": {"default": {"error": 1121}},
	"ParamsExpr": "(#COMMA( `, --> null` ))",
	"VariableExpr": "#ALIAS",
	"NewExpr": "@0 @1",
	"NotExpr": {"@1 == [Object Access]": '!@1', "default": '!(@1)'},
	"UnaryExpr": {"@0 === [+]": "Math.abs(@1)", "@0 == SYMBOL": "@0@1", "default": "@0 @1"},
	"ArrayAssignExpr": {"#CHECK(@0)": require("./arrayassign.js")},
	"JsonAssignExpr": {"#CHECK(@0)": require("./jsonassign.js")},
	"AssignPatt": {
		"@1 === [?=]": "@[0] == null && (@[0] = @[2])",
		"@1 === [=?]": "#VALUE(@[2], ref) != null && (@[0] = @ref)",
		"@1 === [|=]": "!@[0] && (@[0] = @[2])",
		"@1 === [=|]": "#VALUE(@[2], ref) && (@[0] = @ref)",
		"default": "@0 @1 @2"},
	"AssignExpr": {
		"@0 == SliceExpr": {
			"@[0.1.2]": "[].splice.apply(@[0.0], [@[0.1.0], @[0.1.2]].concat(@2))",
			"@[0.1.1]": {
				"@[0.1.1] === :": "[].splice.apply(@[0.0], [@[0.1.0], 0].concat(@2))",
				"default": "[].splice.apply(@[0.0], [0, @[0.1.1]].concat(@2))"},
			"default": "@[0.0][@[0.0].length + 1] = @2"},
		"@[@] == JsonExpr": "#STR(@0): @2",
		"default": "@0 @1 @2"},
	"SliceExpr": {
		"@[1.2]": "@0.slice(@[1.0], @[1.2])",
		"@[1.1]": {"@[1.1] === :": "@0.slice(@[1.0])", "default": "@0.slice(0, @[1.1])"},
		"default": "@0.slice()"},
	"ComputeExpr": {
		"@1 === **": "Math.pow(@0, @2)",
		"@1 === \\\\\\\\": "Math.floor(@0, @2)",
		"default": "@0@1@2"},
	"CompareExpr": {
		"@0 == CompareExpr": "@0 && @[0.2] @1 @2",
		"@1 === [as @]": {"@2 == STRING": "typeof @0 == @2", "default": "@0 instanceof @2"},
		"@1 === in": {"@2 == ArrayExpr": "@2.indexOf(@0)>=0", "default": "@2.hasOwnProperty(@0)"},
		"@1 === of": {"@2 == ArrayExpr": "@2.indexOf(@0)>=0", "default": "[].indexOf.call(@0, @2)>=0"},
		"@1 === is": "@0 === @2",
		"@1 === not\\ is": "@0 !== @2",
		"default": "@0 @1 @2"},
	"LogicExpr": {
		"@m = @1": {"@1 == or && @m = \\|\\|": undefined, "@1 == and && @m = \\&\\&": undefined},
		"@2 == Expression": "@0 @m #VALUE(@2)",
		"@m == \\|\\|": "if (!#VALUE(@0)) @2",
		"default": 'if (@0) @2'},
	"TernaryExpr": {
		"@3": {
			"@2 == Expression && @4 == Expression": "#VALUE(@0) @1 #VALUE(@2) @3 #VALUE(@4)",
			"default": "if (@0) @2; else @4"},
		"@2 == Expression": "#VALUE(@0, ref) != null ? @ref : @2",
		"default": "if (@0) @2"},
	"SeleteStam": {
		"@1 === [if <-]": "if (@2) @0",
		"@1 === [or \\|\\|]": "if (!#VALUE(@0)) @2",
		"default": "if (@0) @2"},
	"ExportDecl": {
		"@0 === default": {
			"@1 == [FunctionDecl MethodDecl] && #HEAD(module.exports = @[1.name])": '@1',
			"@1 == [ClassDecl]": '#LIST(`@[1]`, `module.exports = @[1.name]`)',
			"@1 == [Value Binary Ternary]": 'module.exports = #VALUE(@1)',
			"@[1.0] == ArgusStam": "#LIST(`@[1]`, `module.exports = @[1.0.-1.0]`)",
			"default": "#LIST(`@[1]`, `module.exports = @[1.-1.0]`)"},
		"@0 == [GetterDecl SetterDecl]": '@0',
		"@0 == [FunctionDecl MethodDecl ClassDecl]": '#LIST(`@[0]`, `module.exports.@[0.name] = @[0.name]`)',
		"@0 == VarStam": "#LIST(`@[0]`, #EACH( @[0.0], `module.exports.@[0] = #VALUE(@[0])` ))",
		"@0 == ArgusStam": "#EACH(@0, `exports.@[0] = #VALUE(@)` )",
		"default": {"error": 1103}},
	"MemberExpr": {
		"@0 === [": {"@[1.-1] === UnaryExpr &&  @[1.-1.0] === [-]": "@0@[@.0].length@1@2"},
		"@0 === ::": {"@1": ".prototype.@1", "default": ".prototype"},
		"default": "@"},
	"LinkStam": {"@[@] === AssignExpr": "(#COMMA( 1 ))", "default": "#COMMA( 1 )"},
	"LinkPatt": {"@0 == CompelExpr": "(@[@.0].#COMMA(@0))", "default": "@[@.0].@"},
	"ArrowExpr": {
		"@1 == Expression": "function@0{return @1}",
		"@1 == BlockNode": "function@0@1",
		"default": "function@0{@1}"},
	"ReturnStam BreakStam ContinueStam ThrowStam": '@0 @1',
	"ConditionExpr": "(@0)",
	"IfPatt WhileStam WithStam": "@0 @1@2",
	"ElseIfPatt": "@0 if @1@2",
	"ElsePatt": "@0 @1",
	"DoWhileStam": {"@2": "@0 @1 @2 @3", "default": "@0 {#Block(@1, break)} while(true)"},
	"TryStam": {"@1": "@", "default": "@ catch (_e){}"},
	'CatchPatt': "@0 @1 @2",
	"TryPatt FinallyPatt": "@0 @1",
	"SwitchStam": "@0 @1@2",
	"CaseStam": {
		"@[2.-1] == [ReturnStam BreakStam] ||\n         @[2.-1] == ContinueStam && #DEL(@[2.-1])": '#EACH(@1, `case @:`)#Block(@2)',
		"default": "#EACH(@1, `case @:`)#Block(@2, break)"},
	"DefaultStam": {
		"@[1.-1] == [ReturnStam BreakStam] ||\n         @[1.-1] == ContinueStam && #DEL(@[1.-1])": '@0:#Block(@1)',
		"default": "@0:#Block(@1, break)"},
	"ForStam": "@0 (@1)@2",
	"ForCondition": require("./for.js"),
	"ClassExpr ClassDecl": require("./class.js"),
	"AtExpr": require("./at.js"),
	"SuperExpr": {
		"!@super": {"error": 1115},
		"@1 == SuperMember": {"@2 == ParamsExpr": "@super@1.call(this, #COMMA(@2))", "default": "@super@1"},
		"@1 == ParamsExpr": "@super.@[name].call(this, #COMMA(@1))",
		"default": "@super.@[name]"},
	"MethodDecl": {
		"@[@] == JsonExpr": "\"@0\": function@1@2",
		"@[scope.parent.type] === Class": "@[scope.parent.name].prototype.@0 = function @1@2",
		"default": "function @0@1@2"},
	"SetterDecl": {
		"@[@] == JsonExpr": 'set @0@1@2',
		"@[@] == ExportDecl": "module.exports.__defineSetter__(\"@0\", function@1@2)",
		"@[scope.parent.type] == Class": "@[Class.name].prototype.__defineSetter__(\"@0\", function@1@2)",
		"default": {"error": 1114}},
	"GetterDecl": {
		"@[@] == JsonExpr": "get @0@1@2",
		"@[@] == ExportDecl": "module.exports.__defineGetter__(\"@0\", function@1@2)",
		"@[scope.parent.type] == Class": "@[Class.name].prototype.__defineGetter__(\"@0\", function@1@2)",
		"default": {"error": 1113}},
	"StaticDecl": {
		"@[scope.valid.type] == Class": {
			"@0 == MethodDecl": "@[Class.name].@[0.0] = function@[0.1]@[0.2]",
			"@0 == ArgusStam": "#COMMA( `@[Class.name].@` )"},
		"default": {"error": 1112}},
	"ProtoDecl": {
		"@[scope.valid.type] == Class": {
			"@0 == MethodDecl": "@[Class.name].prototype.@[0.0] = function@[0.1]@[0.2]",
			"@0 == ArgusStam": "#COMMA( `@[Class.name].prototype.@` )"},
		"default": {"error": 1116}},
	"PropertyDecl": {
		"@[scope.valid.type] == Class": {
			"@0 == MethodDecl": "#INSERT( @0, propertys, `this.@[0] = function@[1]@[2]`, Class )",
			"@0 == ArgusStam": "#INSERT( propertys, `#COMMA( `this.@` )`, Class )"},
		"default": {"error": 1117}},
	"ConstructorDecl": {
		"@[scope.parent.type] === Class": "#INSERT( constructors, @, Class )",
		"default": "function @0@1@2"}};