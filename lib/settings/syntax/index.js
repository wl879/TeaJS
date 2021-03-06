module.exports = {
	"Root": require("./root.js"),
	"BlockNode": require("./block.js"),
	"ForConditionExpr": require("./for_condition.js"),
	"Block": "#BlockNode | #Statement@:BlockStam",
	"Statement": "#caller_is(Class) → [#Control #ConstructorDecl #MethodDecl] | #LabelStam | [#sugar_box(stam), #Control, #Execute, #Declare]\\n ((?=CLOSE) | #SeleteLeft@@SeleteStam | END∅∆1101) | #Sequence\\n ((?=CLOSE) | ..@@LinkStam → #before(Value) #LinkPatt+ | [#SeleteLeft #SeleteRight]@@SeleteStam | END∅∆1101) | \\{ → #BlockNode",
	"Declare": "[var → #VarDecl, let → #LetDecl, const → #ConstDecl, function → #FunctionDecl, class → #Class, export → #ExportDecl, static → #StaticDecl, get → #GetterDecl, set → #SetterDecl, constructor → #ConstructorDecl, import → #ImportDecl] | #MethodDecl",
	"Control": "[if → #IfStam, while → #WhileStam, do → #DoWhileStam, with → #WithStam, try → #TryStam, switch → #SwitchStam, for → #ForStam]",
	"Execute": "[return → #ReturnStam, break → #BreakStam, continue → #ContinueStam, throw → #ThrowStam, debugger → #DebuggerStam, yield → #YieldStam]",
	"Sequence": "#Express (,∅ #Express∆1125)*@@SequenceExpr",
	"Express": "class → #Class(ClassExpr) | \\.\\.\\. → #SpreadExpr | #Binary (\\?@@TernaryExpr [#Execute #Express] (: [#Execute #Express])? | #ParamsExpr@@CallExpr)?",
	"Ternary": "#Logic (\\?@@TernaryExpr [#Execute #Express] (: [#Execute #Express])?)?",
	"Binary": "#Assign | #Logic",
	"Assign": "\\[ → #ArrayDest | \\{ → #JsonDest | #Value ASSIGN → #before(Access, SliceExpr)∆1130 (\\=@@AssignExpr | ASSIGN@@AssignPatt) #Express∆1107",
	"Unary": "not #Express@@NotExpr | PREFIX #Value@@PrefixExpr #before(Access)∆1128 | new #Value@@NewExpr | UNARY #Unary@@UnaryExpr | #Value POSTFIX?@@PostfixExpr → #before(-2, Access)∆1129",
	"Value": "[super → #SuperExpr, require → #RequireExpr, \\@ → #AtExpr, #Object] (\\( → #ParamsExpr@~CallExpr | #Member@~AccessExpr)* #Slice?@~SliceExpr",
	"Access": "#Variable (#Member@~AccessExpr)*",
	"Object": "#ArrowExpr | [\\( → #GroupExpr, \\[ → #ArrayExpr, \\{ → #JsonExpr, function → #FunctionExpr, #sugar_box(expr), #Const, #Variable]",
	"Variable": "IDENTIFIER@:VariableExpr",
	"Const": "[CONST, REGEXP, STRING, TAG]",
	"COMMENT": "#is_token(COMMENT) | \\/\\*...\\*\\/ | \\/\\/ **?\\n (?=[LF EOT])",
	"REGEXP": "[\\/ \\/=] → \\/=\\|\\/...\\*\\/\\|\\/ [[g i m y u]*]",
	"STRING": "QUOTE → *...*",
	"TAG": "# → #+ [IDENTIFIER KEYWORD]",
	"SpreadExpr": "#caller_is(-1, ArrayExpr, ParamsSub )∆1116 \\.\\.\\. #Express",
	"ArrayExpr": "\\[∅ (\\]∅ | #Express (,?∅ #Express)* ,*∅ \\]∆1124∅)",
	"JsonExpr": "\\{∅ (\\}∅ | #JsonItem (,?∅ #JsonItem)* ,*∅ \\}∅)",
	"JsonItem": "set→ #SetterDecl | get→ #GetterDecl | #NameExpr → (#is_token(+1, \\() → #MethodDecl | #NameExpr (: #Express)?@@PropertyInit) | [NUMBER STRING] : #Express@@PropertyInit",
	"AtExpr": "@ [IDENTIFIER KEYWORD]?",
	"SuperExpr": "super #Member? #ParamsExpr?",
	"GroupExpr": "\\(∅ #Sequence@:SequenceExpr \\)∅∆1126",
	"Member": "[ . → `. [IDENTIFIER KEYWORD]∆1108`, \\[ → `\\\\[ Sequence@:SequenceExpr \\\\]`, :: → `:: [IDENTIFIER KEYWORD]?`]@@MemberExpr",
	"ParamsExpr": "\\(∅ (\\)∅ | ,* #ParamsSub \\)∅∆1104) | #is_token(--1, BLANK) → #not_token(--2, END) → #before(before, Access, Variable, IDENTIFIER, KEYWORD) → #ParamsSub",
	"ParamsSub": "(#Express (\\, (?=[\\, \\)]))*) (\\,∅ #Express (, (?=[\\, \\)]))*)*",
	"Slice": "\\[∅ (\\]∅ | (#Compute? : #Compute?) \\]∆1109∅)@@SlicePatt",
	"Compute_H": "#Unary (PREC0 #Unary@~ComputeExpr)*",
	"Compute_M": "#Compute_H (PREC1 #Compute_H@~ComputeExpr)*",
	"Compute_L": "#Compute_M (PREC2 #Compute_M@~ComputeExpr)*",
	"Compare_H": "#Compute_L (PREC3 #Compute_L@~CompareExpr)*",
	"Compare": "#Compare_H (PREC4 #Compare_H@~CompareExpr)*",
	"Compute": "#Compare (PREC5 #Compare@~ComputeExpr)*",
	"Logic": "#Compute (PREC6 [#Execute #Assign #Compute]@~LogicExpr)*",
	"ArrayDest": "#ArrayPatt = #Express",
	"JsonDest": "#JsonPatt = #Express",
	"Rest": "\\.\\.\\.∅@@RestPatt IDENTIFIER | IDENTIFIER (= #Express | as IDENTIFIER)?@@PropertyInit",
	"ArrayPatt": "\\[∅ (#Rest (\\,∅ #Rest)*) \\]∅",
	"JsonPatt": "\\{∅ (#Rest (\\,∅ #Rest)*) \\}∅",
	"NameExpr": "IDENTIFIER | KEYWORD #has_param(id)!∆1006",
	"ArgusExpr": "\\(∅ (\\)∅ | #ArgusItem (,∅ #ArgusItem)* \\)∅)",
	"ArgusItem": "[\\.\\.\\. → #Rest, `#Variable (= #Express)?@@AssignExpr`]",
	"SequenceDecl": "#SequenceItem (,∅ #SequenceItem)*",
	"SequenceItem": "[\\[ → #ArrayDest, \\{ → #JsonDest, `#Variable (= #Express)?@@AssignExpr`]",
	"LabelStam": "IDENTIFIER : #Statement",
	"SeleteLeft": "(<- | if\\n) #Sequence∆1127",
	"SeleteRight": "[->] #Statement∆1127",
	"LinkPatt": "..∅ (#Access [\\( → #ParamsExpr]?|#GroupExpr)",
	"VarDecl": "var∅ #SequenceDecl@=VarDecl∆1007",
	"LetDecl": "let∅ #SequenceDecl@=LetDecl∆1009",
	"ConstDecl": "const∅ #SequenceDecl@=ConstDecl∆1010",
	"ReturnStam": "return\\n #Sequence?@:SequenceExpr",
	"BreakStam": "break\\n IDENTIFIER?",
	"ContinueStam": "continue\\n IDENTIFIER?",
	"ThrowStam": "throw\\n #Sequence?@:SequenceExpr",
	"DebuggerStam": "debugger",
	"YieldStam": "yield #Express",
	"ImportDecl": "import∅ ((#Variable@:DefaultSpecifiers)? ,?∅ ((\\* as #Variable)@:All | \\{ → #JsonPatt)?@:Specifiers (from∅ STRING)@:From | STRING@:From)∆1134",
	"RequireExpr": "require@@VariableExpr #ParamsExpr?@@RequireExpr",
	"ExportDecl": "export∅ (default∅@@ExportDefaultDecl [function → #FunctionExpr, #Express] | \\*∅@@ExportAllDecl (from∅ #Express)@:From | \\{ → #JsonPatt (from∅ #Express)?@:From | [#Declare #SequenceDecl])∆1011",
	"FunctionExpr": "function \\*?@@GeneratorExpr #NameExpr(id)?@@FunctionDecl #ArgusExpr∆1025 #BlockNode",
	"FunctionDecl": "function \\*?@@GeneratorDecl #NameExpr(id)∆1024 #ArgusExpr∆1025 #BlockNode",
	"MethodDecl": "#NameExpr #ArgusExpr [\\{ :] → #BlockNode∆1106",
	"ArrowExpr": "(#ArgusExpr | IDENTIFIER@:ArgusExpr) =>∅ [\\{ → #BlockNode, #ReturnStam, #ThrowStam, #Express]",
	"Class": "class@@ClassExpr (extends! → #NameExpr(id)?@@ClassDecl) #ExtendsExpr? #BlockNode",
	"ExtendsExpr": "extends (mix∅@@ExtendsMix #ParamsExpr | #ParamsExpr)",
	"GetterDecl": "get∅ #NameExpr #ArgusExpr?@!ArgusExpr #BlockNode",
	"SetterDecl": "set∅ #NameExpr #ArgusExpr #BlockNode",
	"StaticDecl": "static∅ [#MethodDecl #SequenceDecl]",
	"ConstructorDecl": "constructor@:NameExpr #ArgusExpr [\\{ :] → #BlockNode∆1106",
	"IfStam": "#IfPatt (#check_indent #ElsePatt)*",
	"IfPatt": "if #ConditionExpr #Block∆1012",
	"ElsePatt": "else (if∅ #ConditionExpr@@ElseIfPatt | #ConditionExpr [\\{ :]→@@ElseIfPatt)? #Block∆1019",
	"TryStam": "#TryPatt (#check_indent #CatchPatt)? (#check_indent #FinallyPatt)?",
	"TryPatt": "try #Block∆1016",
	"CatchPatt": "catch #ConditionExpr #Block",
	"FinallyPatt": "finally #Block",
	"WhileStam": "while #ConditionExpr #Block∆1013",
	"DoWhileStam": "do #Block∆1015 (#check_indent while #ConditionExpr)?",
	"WithStam": "with #ConditionExpr #Block∆1014",
	"SwitchStam": "switch #ConditionExpr (\\:∅ (#check_indent(in) #Case(indent))* | \\{∅ #Case* \\}∅∆1110)@:SwitchNode∆1017",
	"Case": "(case@@CaseStam #Sequence@:SequenceExpr | default@@DefaultStam) \\:∅∆1020 [indent → `#BlockNode(indent, case, default)`, `#BlockNode(brace, case, default)`]?",
	"ForStam": "for #ForConditionExpr∆1022 #Block∆1106",
	"ConditionExpr": "(\\(...\\) JOINT!) → \\(∅ #Sequence \\)∅ | #Sequence",
	"ForCondition": "(\\(...\\) JOINT!) → \\(∅ #ForConditionSub \\)∅ | #ForConditionSub",
	"ForConditionSub": "((?=;) | var∅ #SequenceDecl@=VarDecl | let∅ #SequenceDecl@=LetDecl | #SequenceDecl@=InitPatt) (;∅ ((?=;) | #Sequence) ;∆1022∅ #Sequence? | [in of -> => <- <= \\> \\< >= ...] #Sequence ) | #Sequence@:SequenceExpr (\\.\\.\\. #Sequence)?"};