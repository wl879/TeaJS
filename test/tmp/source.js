// #: test
	function start(file):
		aaa;
// #: tea 保留字符
a as b
a as "b"
a in b
a in [47, 92, 13]
b of a
a is b
a not is b
a and b
a or b
not a && b
a ** b
a \ b
@member
object::={}
object::name

// #: 数组与字符串切分简写
string[3:-2]
arr[-2:]
arr[:1]
arr[]
arr[-1]

// #: 支持声明语句的逻辑表达式
a && b = c || d
a && a = b
a && continue

// #: 增强的赋值语句
a[1:-1] = b
a[] = b
a |= b
a ?= b
[a, b] = c()

// #: 2.5 元表达式

a if b
a && b ? c
a = b+1 ? c
var a = b ? c, e = 2;
return a ? b
a == b -> return c
var a = 2 <- a && b
a =1 <- b
a ? break : continue

// #: 函数调用的省略括号
fn a, b
arr.map(b, (a, b) -> a-b)
fn(, ,a)


// #: 函数声明简写
(a,function(a, b=2){})
fn = (a, b) -> return a > b;

// #: json 声明
{}

// #: if / while / do / break / continue 语句

if a && b:
	block1
else if not a && b:
	block2
else c && d:
	block3
while a and b:
	block4
do:
	block5
while a and b;
do:
	block6

// #: for 语句

for var i; i<10; i++:
for var i in obj1:
for i, b in obj2:
for i <- arr1:
for item <= arr2:
for var i = 5, item <- arr3:
for i = 3 -> arr5:
for i, item -> arr6:
for i in obj3:
for item => arr7:
for [1,2,3,4]:

// #: switch 语句

switch de:
	case 'a','b','c':
		block1;
	case 'd':
		block2;
		continue;
	case ( a < 3):
		block3;
	case (a > 10):
		block4;
	default:
		block5;

// #: class/pacage/exports 语句
class Person:
	constructor(sex="man"):
		this.sex = sex;
	set name(name):
		@._name = name;
	say(word):
		console.log(word);
	static total = 0;
class Girl extends Person:
	constructor():
		super('female');
		Person.total ++;
	static create():
		return new Girl();
	@.create()
package($=jQurey):
	conaole.log(123);

// #: require 声明
  var a = require ("./*.js").b;
  require "a_file", "b_file";

// #: test scope
var a = {}, b, [c, d] = [f, g];
function h(i=0, j, k=9):
	@.aa = {}, @.bb = {};
	for var l = m => n:
		n[l];
	for o = 9, p => q:
		q[o];
		if true:
			o;
			zzz;
	o = 0;
	for w => x:
		xxx;
// #: test scope
delete(a, b = a):
		for i=a; i <= b; i++:
			@[i] = null;
		return @;