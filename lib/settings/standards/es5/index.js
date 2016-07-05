/**
 * 存取变量 与 节点
 * 以 @ 为开头的字段为存取表达式
 *     @            代表当前节点
 *     @0 @[0]      代表当前节点中的第 0 个子节点
 *     @name        存取当点解析表达式中的 name 变量
 *     @[@.0.1.1]   依次取(节点或变量)中的成员或属性, @ 代表 parent
 *     @[Class] @[Functin] @[Let] 查找当前节点的作用域
 *     @[name]      取当前节点的作用域名称
 *     @[#name]     取变量的值作为取成员或属性的名称
 *     @[?0]        取节点的成员或属性，如果存在则取得，不存在则返回原节点
 * 
 */
module.exports = {
	"GeneratorDecl": "#error(1121)",
	"GeneratorExpr": "#error(1121)",
	"TAG": '#error(2015)',
	"TestPatt": "if(#argv(--test)): @",
	"Root": require("./root.js"),
	"REGEXP": require("./regexp.js"),
	"STRING": require("./string.js"),
	"ForStam": require("./for.js"),
	"ImportDecl": require("./import.js"),
	"RequireExpr": require("./require.js"),
	"ExportDecl ExportDefaultDecl ExportAllDecl": require("./export.js"),
	"SpreadExpr": require("./spread.js"),
	"ClassExpr ClassDecl ConstructorDecl SetterDecl GetterDecl StaticDecl SuperExpr AtExpr": require("./class.js"),
	"BlockNode BlockStam": "if(@[@] == [CaseStam DefaultStam])        : #head#body#foot\nelse                                      : {#head#body#foot}",
	"ArrayExpr": "[#join]",
	"SequenceExpr": "#join",
	"GroupExpr": "(#join)",
	"VarDecl ConstDecl LetDecl": "var #join(@)",
	"DebuggerStam": "@0",
	"LabelStam": "@0 @1 @2",
	"PrefixExpr PostfixExpr": "@0@1",
	"FunctionDecl": "@0 @1@2@3",
	"FunctionExpr": "@0@1@2",
	"CallExpr": "@",
	"ParamsExpr": "(#join)",
	"VariableExpr": "@0",
	"NewExpr ReturnStam BreakStam ContinueStam ThrowStam": "@0 @1",
	"ConditionExpr": "(@0)",
	"IfPatt WhileStam WithStam": "@0 @1@2",
	"ElseIfPatt": "@0 if @1@2",
	"ElsePatt": "@0 @1",
	"CatchPatt": "@0 @1 @2",
	"TryPatt FinallyPatt": "@0 @1",
	"SwitchStam": "@0 @1{@2}",
	"ArgusExpr": "(\neach(@, \",\"):\n    if(@ == RestPatt):\n        if(@[index] < @[@.length] - 1): #error(1131)\n        @0\n        #head(\"@0 = [].slice.call(arguments, @[index])\")\n    else if(@ == AssignExpr): @0\n        #head(\"if (@0 == null) @\")\n    else: @\n)",
	"JsonExpr": "{\neach(@, \",\"):\n    switch(@):\n        case GetterDecl      : get @0@1@2\n        case SetterDecl      : set @0@1@2\n        case MethodDecl      : @\n        case NameExpr        : \"@\": @\n        case PropertyInit      : \n            if(@0 == STRING) : @0: @2\n            else             : \"@0\": @2\n        default              : #error(1122)\n}",
	"RestPatt": "if(@[index] == @[@.length] - 1)  : @0\nelse                             : #error(1131)",
	"ArrayDest": "if(@2 == ArrayExpr):\n    #{@right = @2}\n    each(#check(@0), \",\"):\n        switch(#alias(@)):\n            case RestPatt        : @ = [#join(@[#right], @eachIndex)]\n            case PropertyInit    : @ = @[#right.#eachIndex] == null ? @2 : @[#right.#eachIndex]\n            default              : @ = @[#right.#eachIndex]\nelse:\n    if(@2 != Variable)           : @ref = @2, #{@right = @ref}\n    else                         : #{@right = @2}\n    each(#check(@0), \",\"):\n        switch(#alias(@)):\n            case RestPatt        : @ = [].slice.call(@right, @eachIndex)\n            case PropertyInit    : @0 = @right[@eachIndex] == null ? @2 : @right[@eachIndex]\n            default              : @ = @right[@eachIndex]",
	"JsonDest": "if(@2 != Variable)           : @ref = @2, #{@right = @ref}\nelse                         : #{@right = @2}\neach(#check(@0), \",\"):\n    switch(#alias(@)):\n        case RestPatt        : @ = (function(o, m, _){_={};for(var k in o)if(m.indexOf(k)==-1&&o.hasOwnProperty(k))_[k]=o[k];return _})(@right, [#join(@[@], 0, @eachIndex, \"\\\"@[?0]\\\"\")]) \n        case PropertyInit    : @0 = @right[\"@0\"] == null ? @2 : @right[\"@0\"]\n        default              : @ = @right[\"@\"]",
	"NotExpr": "if(@1 == [Value]) : !@1\nelse : !(@1)",
	"UnaryExpr": "switch(@0):\n    case +      : Math.abs(@1)\n    case SYMBOL : @0@1\n    default     : @0 @1",
	"AssignPatt": "switch(@1):\n    case ?=  : @[0] == null && (@[0] = @[2])\n    case =?  : #ref(@2) != null && (@[0] = @ref)\n    case |=  : (@[0] || (@[0] = @[2]))\n    case =|  : #ref(@2) && (@[0] = @ref)\n    default  : @0 @1 @2",
	"AssignExpr": "if(@0 == SliceExpr):\n    if(@[0.1.2])           : [].splice.apply(@[0.0], [@[0.1.0], @[0.1.2]].concat(@2))\n    else if(@[0.1.1]):\n        if(@[0.1.1] === :) : [].splice.apply(@[0.0], [@[0.1.0], 0].concat(@2))\n        else               : [].splice.apply(@[0.0], [0, @[0.1.1]].concat(@2))\n    else                   : @[0.0][@[0.0].length + 1] = @2\nelse                       : @0 @1 @2",
	"SliceExpr": "if(@[1.2])           : @0.slice(@[1.0], @[1.2])\nelse if(@[1.1]):\n    if(@[1.1] === :) : @0.slice(@[1.0])\n    else             : @0.slice(0, @[1.1])\nelse                 : @0.slice()",
	"ComputeExpr": "if(@1 === **)        : Math.pow(@0, @2)\nelse                 : @0@1@2",
	"CompareExpr": "if(@0 == CompareExpr)           : @0 && @[0.2] @1 @2\nelse:\n    switch(@1):\n        case as, ~=:\n            if(@2 == STRING) :\n                if(@2 == [\"array\"] )                                : Array.isArray(@0)\n                else                                                : typeof @0 == @2\n            else if(@2 == [undefined boolean object string number]) : typeof @0 == \"@2\"\n            else if(@2 == array)                                    : Array.isArray(\"@0\")\n            else                                                    : @0 instanceof @2\n        case in:\n            if(@2 == ArrayExpr) : @2.indexOf(@0)>=0\n            else                : @2.hasOwnProperty(@0)\n        case of:\n            if(@2 == ArrayExpr) : @2.indexOf(@0)>=0\n            else                : [].indexOf.call(@0, @2)>=0\n        case is                 : @0 === @2\n        case not\\ is            : @0 !== @2\n        default                 : @0 @1 @2",
	"LogicExpr": "if(@m = @1):\n    if(@1 == or)       : #{@m = \\|\\|}\n    else if(@1 == and) : #{@m = \\&\\&}\nif(@2 == Express)      : @0 @m #group(@2)\nelse if(@m == \\|\\|)    : if (!#group(@0)) @2\nelse                   : if (@0) @2",
	"TernaryExpr": "if(@3):\n    if(@2 == Express && @4 == Express) : #group(@0) ? #group(@2) : #group(@4)\n    else                               : if (@0) @2\\; else @4\nelse if(@2 == Express)                 : #ref(@0) != null ? @ref : @2\nelse                                   : if (@0) @2",
	"SeleteStam": "if(@1 === [if <-])        : if (@2) @0\nelse if(@1 === [or \\|\\|]) : if (!#group(@0)) @2\nelse                      : if (@0) @2",
	"MemberExpr": "if(@0 === [):\n    if(@[1.-1] === UnaryExpr &&  @[1.-1.0] === [-]) : @0@[@.0].length@1@2\nelse if(@0 === ::):\n    if(@1)                                          : .prototype.@1\n    else                                            : .prototype\nelse                                                : @",
	"LinkStam": "if(@[@] === AssignExpr) : (#join( 1 ))\nelse                    : #join( 1 )",
	"LinkPatt": "if(@0 == GroupExpr)    : (@[@.0].#join(@0))\nelse                    : @[@.0].@",
	"ArrowExpr": "if(@1 == Express)        : function@0{return @1}\nelse if(@1 == BlockNode) : function@0@1\nelse                     : function@0{@1}",
	"DoWhileStam": "if(@2) : @0 @1 @2 @3\nelse   : @0 @1#foot(break) while(true)",
	"TryStam": "if(@1) : @\nelse   : @ catch (_e) {}",
	"CaseStam": "each(@1): case @:\nif(@2 && @[2.length]):\n    if(@[2.-1] == ContinueStam)                : #del(@[2.-1]); @2\n    else if(@[2.-1] == [ReturnStam BreakStam]) : @2\n    else                                       : @2#foot(break)",
	"DefaultStam": "@0:\nif(@1 && @[1.length]) :\n    if(@[1.-1] == ContinueStam)                : #del(@[1.-1]); @1\n    else if(@[1.-1] == [ReturnStam BreakStam]) : @1\n    else                                       : @1#foot(break)",
	"MethodDecl": "if(@[@] == JsonExpr)                         : \"@0\": function@1@2\nelse if(@[@] == StaticDecl)                  : @[Class.name].@0 = function@1@2\nelse if(@[scope.parent.type] === ClassScope) : @[Class.name].prototype.@0 = function @1@2\nelse                                    : function @0@1@2"};