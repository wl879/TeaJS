
# TeaJS

-


又一种新的预编译 javascript 脚本语言，用一种友好的方式开发面向客户端的 javascript 程序。


-


### 介绍

-

> #### 命令行参数


```console
    -h, --help                           显示帮助
    -f, --file    <file path>            编译文件路径
    -p, --path    <project dir>          项目目录
    -o, --out     <output path>          输出文件 或 目标目录
    -e, --eval    <Tea script snippet>   编译一段字符串
    -d, --define  <file path>            宏定义文件路径，默认加载项目下的 __define.tea 文件
    -m, --map     [source output path]   生成 source map 文件
    -c, --concat                         合并文件
    -v, --verbose                        显示编译信息
    -s, --safe                           安全模式编译
        --clear                          清理注释
        --tab     <number>               设置 tab size
        --token                          输出 token 解析
        --ast                            输出 ast 解析
        --nopp                           不进行预编译
        --test                           编译后运行
    ... 自定义参数，用于预编译时判断与读取(使用Argv['--name']读取)
``` 


### 预编译

-

此功能基本与 C 语言中的预编译相似，可以定义宏，逻辑控制。同时还扩展了 模板功能，语法糖自定义功能


> #### 宏定义


```c
    
    // 宏
    #define PI 3.1415926
        
    // 宏函数
    #define DEG(rad) rad*(180/3.14)
        
    // 多行模式
    #define RAD(deg)
    {
        deg*(PI/180)
    }
    
    // 宏模板
    #define FILE(deg)
    {
        #script
            // write 或 echo 方法输出内容
            write readFile(__filename)
        #end
    }
    
    #undef RAD
    
```



> #### 定义语法糖


```c
    // 定义语句声名，独立的一段代码，以分号或换行结束，例如: var/if 等语句
    #stam name <grammar pattern> standard pattern

    // 定义表达式，可以做为值返回代码，例如: a = 10, a + 100;
    #expr name <grammar pattern> standard pattern 
```

* [grammar pattern](#user-content-GrammarPattern)  定义语法解析
* [standard pattern](#user-content-StandardPattern) 定义输出解析


> #### 逻辑控制语句

```c
    #if --ios
        
        console.log( 'Yes, I am Apple' );
            
    #elif --android
    
        console.log( 'Aha, I am Google' )
                
    #endif
```
    
 * `__main`              //返回编译文件是否为根文件
 * `__root`              //返回根文件路径
 * `__file`              //返回当前文件路径
 * `__version`           //返回当前文件路径


> #### 动态设置命令参数

```c
    #argv --name value
```
 
 * `--name` 为参数名
 * `value` 为参数值，默认为 `true`
 


> #### 动态运行脚本

```javascript
    #script
    
        for(var i=0; i<100; i++){
            write 'num_'+i+' = '+i;
        }
        
    #end
```

    
> #### 引入文件


仅引入文件代码，不解析引入文件内的路径关系


```c
    #include "a/b/c.js"
```


### 语法

-

> #### 字符串:

支持换行格式，双引号支持嵌入变量
 
```js
    // 不保留换行符，输出为单行。
    "abc" 'abc'
    
    // 保留换行格式，输出为多行, 对字符转义。
    """abc""" '''abc'''
    
    // 支持换行格式，保留换行符, 输出为单行。
    """"abc"""" ''''abc''''
    
    // 保留换行符, 输出为单行, 对字符转义。
    `abc` 
```


> #### 链式操作

```js
    object::={}                 // object.prototype = {};
    object::name                // object.prototype.name;
    object..up()..down()        // object.up();
                                // object.down();
```

> #### tea 保留字符

```js
    a as b                       // a instanceof b;
    a as "b"                     // typeof a == "b";
    a in b                       // b && b.hasOwnProperty(a);
    a in [47, 92, 13]            // a == 47 || a == 92 || a == 13;
    b of a                       // Array.prototype.indexOf.call(a, b) >= 0;
    a is b                       // a === b;
    a not is b                   // a !== b;
    a and b                      // a && b;
    a or b                       // a || b;
    not a && b                   // !(a && b);
    a ** b                       // Math.pow(a, b);
    a \ b                        // Math.floor(a/b);
```

> #### 数组与字符串切分简写

```js
    arr[3:-2]                    // arr.slice(3, -2);
    arr[]                        // arr.slice();
    arr[-1]                      // arr[arr.length-1];
```

> #### 支持声明语句的逻辑表达式

```js
    a && b = c || d              // a && (b = c || d);
    a && a = b                   // a && (a = b);
    a && continue                // if(a) continue;
```

> #### 增强的赋值语句

```js
    a[1:-1] = b                  // a.splice.apply(a, [1, a.length-1-1].concat(b));
    a[] = b                      // a.push(b);
    a |= b                       // a || (a = b);
    a ?= b                       // if(!a && a!=0) a = b;
    [a, b] = c()                 // _ref = c(), a = _ref[0], b = _ref[1];
```

> #### 2.5 元表达式

```js
    a if b                       // if(b) a;
    a && b ? c                   // if (a && b) c;
    a = b+1 ? c                  // a = ((_ref = b+1) != null ? _ref : c);
    var a = b ? c, e = 2;        // var a = (b != null ? b : c), e = 2;
    return a ? b                 // return (a != null ? a : b);
    a == b -> return c           // if (a == b) return c;
    var a = 2 <- a && b          // if(a && b) var a = 2;
    a ? break : continue         // if (a) break; else continue;
```

> #### 函数声明简写

* 支持箭头函数声明
* 支持声明带缺省的函数参数
    
```js
    function(a, b=2){}           // function(a, b){  if (b == null) b = 2; }
    fn = (a, b) => a > b;        // fn = function(a, b){return a > b};
```


> #### if / while / do 语句

* 支持缩进的代码块
* `if`、`while`、`do` 等语句扩号可以省略
* `else if` 语句可以简写成 else
    
```js
    if a && b:                   // if (a && b){
        block1                   //     block1;
    else if not a && b:          // }else if (!(a && b)){
        block2                   //     block2;
    else c && d:                 // }else if (c && d){
        block3                   //     block3;
                                 // }
```
    
> #### for 语句

```js
    
    for i, item -> arr:          // for(var i, item; i<arr.lenght; i++){
                                 //    item = arr[i];
                                 // }
                                 
    for i, item <- arr:          // for(var i=arr.length-1; i>=0; i--){
                                 //    item = arr[i];
                                 // }
                                 
    for item => arr:             // for(var _i=0, item; _i<arr.length; _i++){
                                 //     item = arr[_i];
                                 // }
                                 
    for item of obj:             // for(var _k in obj){
                                 //    if(!obj.hasOwnProperty(_k)) continue;
                                 //    item = obj[_k];
                                 // }
                                 
    for key, item in obj         // for(var key in obj){
                                 //    if(!obj.hasOwnProperty(key)) continue;
                                 //    item = obj[key];
                                 // }
    
```

> #### switch 语句

* `break` 设为默值，当结尾为 `continue` 时，break 无效 
* `case` 语句可以设多个值用逗号分隔

```js
    switch a:                       // switch (a){   
        case 'a','b','c':           //     case 'a':case 'b':case 'c': 
            console.log('abc')      //         console.log('abc')
        case 'd':                   //     break;      
            console.log('d')        //     case 'd':   
            continue;               //         console.log('d')
        default:                    //     default 
            console.log('efg')      //         console.log('efg')
                                    // }
```

> #### class/pacage/exports 语句



> #### require 声明

```js
  require "./*.js";
  require "a_file", "b_file";
```

-

 
### GrammarPattern

> 示例

下面示例中，可以获取到类似 JSX 中的 <> 语法
 

```js
#expr SyntaxPatt <\<...\>>
{
	#script
		text = node.text;
		text = '"'+SText(text, '"')+'"';
		return new Card('STRING', text);
	#end
}

```

> 字段

* `()` 子匹配
	* `?:` 忽略匹配结果
	* `?!` 测试匹配，如果匹配成功则算为失败匹配，反之则继续匹配
	* `?=` 测试匹配，不匹配结果
* `[case → pattern]`    路由格式
* `[pattern pattern]`   “或” 格式的快捷调用
* `&==[type]`           判断最后匹配节点类型 
* `#method(arguments)`  调用方法

> 匹配设置:


* `?`          匹配 1 个或 0 个
* `+`          匹配至少 1 个
* `*`          匹配 0 个或多个
* `+?` `*?`    非贪婪匹配
* `!`          测试匹配，如果匹配成功则算为失败匹配，反之则继续匹配
* `\n`         匹配换行符
* `∆err_code`  匹配失败抛出错误信息
* `∅`          忽略匹配结果
* `→`          测试匹配，不匹配结果



> 命名

* `@@=` 替换 表达式的返回节点名称
* `@@`  设置 表达式的返回节点名称
* `@=`  替换 表达式 字段 匹配的节点名称 
* `@?`  检测匹配的结果，为数组时打包为节点
* `@~`  将以匹配的结果打包为节点
* `@:`  设置 表达式 字段 匹配的节点名称 


> 内部方法

* `#INDENT` 无参数，检查缩进层级
* `#CONCAT(a, b, types)` 搜索 a 与 b 之间的 token，将其合并为一个 token，types 定义其类型，多个用空格分隔


### StandardPattern

```
    
```