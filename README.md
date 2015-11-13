
## Tea Js

它的诞生确实因为 coffee script，本是一个工具，却各有主义，tea 把原本的清水，加了一点点点缀，让人可以静下心来享受，所以享用一杯 tea 时，它不是去附加更多，而是慢速，品味，调整自身。

思绪有点错乱，简单说，就是 coffee script 为什么与 js 语法完全不同，那可好，就把 coffee script 优点拿出来，与 js 可以混编吧。还有，js 现在是越来越流行，也越来越强大，所以它也开始须要预处理的功能也加上，既然加了预处理，能就在处理时也可以自定义语法糖，加上。加了很多，但它还是 js 的语法，这比较重要，就不重复三遍了！！

---

### 简介

* 把 tea 编译为 javascript
* 支持 javascript 语法，可以混合编写你的代码 
* 加入类似 C 语言的宏定义，预编译功能
* 自己定义语法糖，定义常用代码块
* 自动声明 "忘记" 声明的变量
* 使用类似 python 代码缩进语法


### 参数
---

> ##### 命令行参数

```

	-f,--file  <file>                  输入文件
	-p,--path  <file dir>              项目目录
	-o,--out   <out file>              输出文件 或 目标目录
	-e,--eval  <tea script snippet>    编译一段 tea script 文本
	-j,--join                          合并 require 文件
	-h,--help                          显示帮助
	-v,--verbose                       显示编译信息
	-r,--run                           执行输入件
	-d,--define                        宏定义文件
	-s,--safe                          只编译，不会对变量自动声名等
	--test                             测试代码
	--clear                            清理注释
	--tab <number>                     设置 tab size
	--token                            输出编译的 token 解析
	--ast                              输出 ast 结构
	--debug [log/prep/all]             显示调试信息

```


### 预编译
---

> ##### 逻辑控制语句

```c
    
    #if -ios
        
        console.log( 'Yes, I am Siri' );
            
    #elif -android
    
        console.log( 'Aha, I am Google' )
                
    #endif

```
    
 * `if -main`              //返回编译文件是否为根文件
 * `if -root`              //返回根文件路径
 * `if -file`              //返回当前文件路径
 * `if -argv_name`         //返回运行命令中参数的值
 * `if global_variable`    //返回运行命令中的全局参数
 * `if condition_exp`      //返回条件表达式的返回值，例：-file == 'a.js'
 * `ifdef macro_anme `     //返回宏是否被定义

> ##### 动态设置命令参数

```c

    #argv -name value

```
 
 * `-test` 为参数名
 * `value` 为参数值，默认为 `true`
 


> ##### 动态运行脚本

```javascript
    
    #run
    
        for(var i=0; i<100; i++){
            write 'num_'+i+' = '+i;
        }
        
    #endrun

```
 
 * `write` 方法可以向编译文件中写入一段代码
 


> ##### 取源文件中的行号

```javascript

    console.log('The source line number is '+#line)

```
    
> ##### 引入文件

```c

    #include a/b/c.js
        
    #include "a/b/c.js"
        
    #include a/b/c.js, "d/e/f.js"

```


### 宏定义
---

> ##### 定义

```c
    
    // 宏声名
    #define PI 3.1415926
        
    // 宏函数声名
    #define DEG(rad) rad*(180/3.14)
        
    // 多行宏声名
    #define RAD(deg)
    """"
        deg*(PI/180)
    """"
    
    // 可执行宏声名
    #define RAD(deg)
    """"
        #script
            console.log('macro RAD return'+deg*(PI/180));
            write deg*(PI/180)
        #end
    """"
    
```
    
 * `""""` 可定义多行
 * `#scritp` `#end` 可运行 js 脚本，内部变量 `arguments`/`source`/`context`/`self`
 * `write` 为输出语句


> ##### 定义 Token

```c
    #token type value1,value2

```

> ##### 定义语法糖

```c
    #expr name `grammar pattern` writer
    #stat name `grammar pattern` writer

```

### 语法糖
---


> ##### 字符串:

```js


    "string support ${variable}
      and support multline type
      but not hold format
    "
     // "string support "+variable+"\n and support multline type\n but not hold format\n"
    
 
     """string support multline type
          like this
          and hold format
     """
     // "string support multline type\n\
     //     like this\n\
     //     and hold format\n"
     
     
     '''like [""""] type
          but not support ${variable}
     '''
     // 'like [""""] type\n\
     //     but not support ${variable}\n'
     
     
     """"code type text""""
     
     ''''code type text''''
     
     `code type text` 
```

 * 支持换行格式，双引号支持嵌入变量
 * `"` `'` 支持换行格式，不保留与原 js 处理一致。
 * `"""` `'''` 支持换行格式，并保留换行符。
 * `""""` `''''` ``` ` ``` 代码块模式，转义内容使输入与书写的内容一致

> ##### tea 保留字符

```js
    a as b                  // a instanceof b;
    a as "b"                // typeof a == "b";
    a in b                  // b && b.hasOwnProperty(a);
    a in [47, 92, 13]       // a == 47 || a == 92 || a == 13;
    b of a                  // Array.prototype.indexOf.call(a, b) >= 0;
    a is b                  // a === b;
    a not is b              // a !== b;
    a and b                 // a && b;
    a or b                  // a || b;
    not a && b              // !(a && b);
    a ** b                  // Math.pow(a, b);
    a \ b                   // Math.floor(a/b);
    @.member                // this.member;
    object::={}             // object.prototype = {};
    object::name            // object.prototype.name;
    object..name            // object.constructor.name;
```

> ##### 数组与字符串切分简写

```js
    string[3:-2]            // string.slice(3, -2);
    arr[-2:]                // arr.slice(-2);
    arr[:1]                 // arr.slice(0, 1);
    arr[]                   // arr.slice();
    arr[-1]                 // arr[arr.length-1];
```

> ##### 支持声明语句的逻辑表达式

```js
    a && b = c || d         // a && (b = c || d);
    a && a = b              // a && (a = b);
    a && continue           // if(a) continue;
```

> ##### 增强的赋值语句

```js
    a[1:-1] = b             // a.splice.apply(a, [1, a.length-1-1].concat(b));
    a[] = b                 // a.push(b);
    a |= b                  // a || (a = b);
    a ?= b                  // if(!a && a!=0) a = b;
    [a, b] = c()            // _ref = c(), a = _ref[0], b = _ref[1];
```

> ##### 2.5 元表达式

```js
    a if b                  // if(b) a;
    a && b ? c              // if (a && b) c;
    a = b+1 ? c             // a = ((_ref = b+1) != null ? _ref : c);
    var a = b ? c, e = 2;   // var a = (b != null ? b : c), e = 2;
    return a ? b            // return (a != null ? a : b);
    a == b -> return c      // if (a == b) return c;
    var a = 2 <- a && b     // if(a && b) var a = 2;
    a ? break : continue    // if (a) break; else continue;
```

> ##### 函数调用的省略括号

```js    
    fn a, b                 // fn(a, b);
    arr.map(b, (a, b):a-b)  // arr.map(b, function(a, b){return a-b});
    fn(, ,a)                // fn(undefined, undefined,a);
```

> ##### 函数声明简写
    
```js
    function(a, b=2){}          // function(a, b){  if (b == null) b = 2; }
    fn = (a, b): return a > b;  // fn = function(a, b){return a > b};
```

> ##### json 声明

```js
  {                                        // {
    a:1,                                   //     a : 1,
    set name():                            //     set name(){},
    ,                                      //     b : 2,
    b:2,                                   //     "set" : function (a){
    set(a):                                //         console.log('what is set!!');
        console.log('what is set!!');      //     }
  }                                        // };  
```

> ##### if / while / do / break / continue 语句
    
```js
    if a && b:                   // if (a && b){
        block1                   //     block1;
    else if not a && b:          // }else if (!(a && b)){
        block2                   //     block2;
    else c && d:                 // }else if (c && d){
        block3                   //     block3;
                                 // }
    while a and b:               // while (a && b){
        block4                   //     block4;
                                 // }
    do:                          // do{
        block5                   //     block5;
    while a and b;               // }while (a && b);
    do:                          // do{
        block6                   //     block6;
                                 //     break;
                                 // }while (true);
```
    
> ##### for 语句

```js
    
    for i, item -> arr:          // for(var i, item; i<arr.lenght; i++){
                                 //    item = arr[i];
                                 // }
    for i, item <- arr:          // for(var i=arr.length-1; i>=0; i--){
                                 //    item = arr[i];
                                 // }
    for item of obj:             // for(var _k in obj){
    for k, item => obj:          //    if(!obj.hasOwnProperty(_k)) continue;
    for k, itme in obj:          //    item = obj[_k];
                                 // }
    
```

> ##### switch 语句

```js
    switch a:                       // switch (a){   
        case 'a','b','c':           //     case 'a':case 'b':case 'c': 
            block1;                 //         block1;  
        case 'd':                   //     break;      
            block2;                 //     case 'd':   
            continue;               //         block2;     
        case ( a < 3):              //     default:
            block3;                 //         if ((a < 3)){ 
        case (a > 10):              //             block3;
            block4;                 //             break;
        default:                    //         }else if ((a > 10)){ 
            block5;                 //             block4;
                                    //             break; 
                                    //         }
                                    //         block5;           
                                    //     break;
                                    // }
```

> ##### class/pacage/exports 语句

```js
    class Person:                            // var Person = (function(){
        constructor(sex="man"):              //     var total;
            this.sex = sex;                  //     function Person(sex){
                                             //         if (sex == null) sex = "man";
        set name(name):                      //         this.sex = sex;
            @._name = name;                  //     }
                                             //     Person.prototype.__defineSetter__("name", function (name){
        say(word):                           //         this._name = name;
            console.log(word);               //     });
                                             //     Person.prototype.say = function (word){
        static total = 0;                    //         console.log(word);
                                             //     }
                                             //     total = 0
                                             //     Person.__defineGetter__("total", function(){return total});
                                             //     Person.__defineSetter__("total", function(_value_){return total = _value_});
                                             //     return Person;
                                             // })();
    class Girl extends Person:               //  var Girl = (function(){
        constructor():                       //      var create;
            super('female');                 //      function Girl(){
            Person.total ++;                 //          this.__super__.constructor.call(this,'female');
        static create():                     //          Person.total++;
            return new Girl();               //      }
        @.create()                           //      Girl.prototype = new Person();
                                             //      Girl.prototype.constructor = Girl;
                                             //      Girl.prototype.__super__ = Person.prototype;
                                             //      Girl.create = create = function (){
                                             //          return new Girl();
                                             //      }
                                             //      Girl.create();
                                             //      return Girl;
                                             //  })();
    package($=jQurey):                       //  (function($){
        conaole.log(123);                    //      conaole.log(123);
                                             //  })(jQurey);
```

> ##### require 声明

```js
  require "./*.js";
  require "a_file", "b_file";
```

-
### 自定认语法匹配模式
---
 
#### 定义解析规则

> ##### IdentifierTok (={ig} ExprStam{err:error_msg})?

```
    #expr `IdentifierTok ( ={ig} #ExprStam{err:error_msg} )?`
                           ①    ⑤ ③⑥        ②        ④    
```
     
 * ① 大写字段, 化表 token 类型
 
 * ② #EXPRESSION 加#号的段字代表解析器
 
 * ③ 字符串(特殊字符如：空格、引号、等，使用 \\ 转义)
 
 > * 使用字符相等的方式匹配
 > * `/regeaq text/` 使有正则匹配 source lexeme 内容
 
 * ④ `[?*+]` 匹配模式. `?`:有1个或没有. `*`: 有多个或没有. `+`: 至少有1个
 
 * ⑤ `()` 子匹配表达式
 
 > * (:name) 强制当前子节点名 | (::name) 当匹配为多个时设置节点名 | (:::name) 改变父节点名
 > * (?=) (?!) (?:) (?) 忽略匹配

 * ⑥ `{e,ig,n:name,lf}` 附加参数

 > * `e ` 当匹配失败时 throw 错误信息
 > * `ig` 忽略匹配结果
 > * `n ` 设置匹配结果为节点，值为节点名
 > * `lf` 此匹配字段以LF为结束



#### 定义输出规则









