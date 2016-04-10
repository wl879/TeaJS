var Variable = 'VariableExpr ArrayPatt JsonPatt RestExpr';
var Assign = 'AssignExpr[0] AssignPatt[0] ArrayAssignExpr[0] JsonAssignExpr[0]';
module.exports = [
	"ClassDecl                                      -> NameExpr -> class",
	"FunctionDecl ConstructorDecl                   -> NameExpr -> function",
	"Class      <- GetterDecl SetterDecl MethodDecl -> NameExpr -> proto",
	"Root                             -> MethodDecl -> NameExpr -> function",
	"ExportDecl -> GetterDecl SetterDecl MethodDecl -> NameExpr -> function",
	"!JsonExpr StaticDecl              -> MethodDecl -> NameExpr -> static",
	"ProtoDecl PropertyDecl           -> MethodDecl -> NameExpr -> proto",
	"                            MethodDecl -> NameExpr -> function",
	"ProtoDecl PropertyDecl ->< "+Assign+" -> "+Variable+" -> proto",
	"!JsonExpr StaticDecl    ->< "+Assign+" -> "+Variable+" -> static",
	"VarStam ConstStam VarPatt    ->< "+Assign+" -> "+Variable+" -> defined",
	"LetStam LetPatt               ->< "+Assign+" -> "+Variable+" -> let",
	"ExportDecl             ->< "+Assign+" -> "+Variable+" -> undefined",
	"                           "+Assign+" -> "+Variable+" -> undefined",
	"                           BlockNode -> VariableExpr -> unknow",
	"                                        VariableExpr -> unknow",
	"ArgusExpr ->< "+Assign+" -> "+Variable+" -> argument"];