module.exports = {
	"Const": ['CONST', 'NUMBER', 'REGEXP', 'STRING', 'TAG'],
	"Variable": ['VariableExpr'],
	"Object": [
		'ArrayExpr',
		'JsonExpr',
		'FunctionExpr',
		'VariableExpr',
		'CONST',
		'NUMBER',
		'REGEXP',
		'STRING',
		'TAG'],
	"Access": ['AtExpr', 'AccessExpr', 'VariableExpr'],
	"Value": [
		'ArrowExpr',
		'GroupExpr',
		'SuperExpr',
		'RequireExpr',
		'CallExpr',
		'AccessExpr',
		'SliceExpr',
		'ArrayExpr',
		'JsonExpr',
		'FunctionExpr',
		'VariableExpr',
		'CONST',
		'NUMBER',
		'REGEXP',
		'STRING',
		'TAG',
		'AtExpr'],
	"Unary": ['NotExpr', 'PrefixExpr', 'NewExpr', 'UnaryExpr', 'PostfixExpr'],
	"Operate": ['LogicExpr', 'ComputeExpr', 'CompareExpr'],
	"Assign": ['ArrayDest', 'JsonDest', 'AssignExpr', 'AssignPatt'],
	"Binary": [
		'LogicExpr',
		'ComputeExpr',
		'CompareExpr',
		'ArrayDest',
		'JsonDest',
		'AssignExpr',
		'AssignPatt'],
	"Ternary": ['TernaryExpr'],
	"Express": [
		'SpreadExpr',
		'TernaryExpr',
		'CallExpr',
		'ArrowExpr',
		'GroupExpr',
		'SuperExpr',
		'RequireExpr',
		'AccessExpr',
		'SliceExpr',
		'ArrayExpr',
		'JsonExpr',
		'FunctionExpr',
		'VariableExpr',
		'CONST',
		'NUMBER',
		'REGEXP',
		'STRING',
		'TAG',
		'AtExpr',
		'NotExpr',
		'PrefixExpr',
		'NewExpr',
		'UnaryExpr',
		'PostfixExpr',
		'LogicExpr',
		'ComputeExpr',
		'CompareExpr',
		'ArrayDest',
		'JsonDest',
		'AssignExpr',
		'AssignPatt'],
	"Declare": [
		'VarDecl',
		'LetDecl',
		'ConstDecl',
		'FunctionDecl',
		'ExportDecl',
		'StaticDecl',
		'GetterDecl',
		'SetterDecl',
		'ConstructorDecl',
		'ImportDecl',
		'MethodDecl',
		'ClassExpr',
		'ClassDecl',
		'ExtendsExpr',
		'BlockNode'],
	"Execute": [
		'ReturnStam',
		'BreakStam',
		'ContinueStam',
		'ThrowStam',
		'DebuggerStam',
		'YieldStam'],
	"Control": [
		'IfStam',
		'WhileStam',
		'DoWhileStam',
		'WithStam',
		'TryStam',
		'SwitchStam',
		'ForStam'],
	"Statement": [
		'ConstructorDecl',
		'MethodDecl',
		'LabelStam',
		'SeleteStam',
		'LinkStam',
		'VarDecl',
		'LetDecl',
		'ConstDecl',
		'FunctionDecl',
		'ExportDecl',
		'StaticDecl',
		'GetterDecl',
		'SetterDecl',
		'ImportDecl',
		'ClassExpr',
		'ClassDecl',
		'ExtendsExpr',
		'BlockNode',
		'ReturnStam',
		'BreakStam',
		'ContinueStam',
		'ThrowStam',
		'DebuggerStam',
		'YieldStam',
		'IfStam',
		'WhileStam',
		'DoWhileStam',
		'WithStam',
		'TryStam',
		'SwitchStam',
		'ForStam'],
	"Block": ['BlockNode', 'BlockStam']};