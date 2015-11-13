#!/usr/bin/env node
var TEA_HELP = """"
**** g{Tea} script help *************************************
  # parameter:
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
  --tab <number>                     设置 tab size
  --token                            输出编译的 token 解析
  --ast                              输出 ast 结构
  --nopp                             不进行预编译
  --debug                            显示调试信息 log/prep/syntax/write/all
"""";

// test token
#token IDENTIFIER,SB who is sb
// eeee
#expr SB `SB ParamsStam?`
""""
  _who_is_sb#1
""""

// test who is sb xiaoming, lili = who is sb(xiaoming, lili);
who is sb xiaoming, lili;

// test argv
#argv -os 'android'
// test run
#run
if tea.argv['-os'] == 'android'{
write "console.log('This is Android os')";
}else:
  write "console.log('This is iOS')";
#endrun

//test include
    #include "./include.js"

// test dfine macro
#define PI 3.14
#define ADDPI +3.14
#define DEG(rad) rad*180/PI
#define RAD(deg) """"
  #ifdef PI
  deg*PI/180
  #else
  deg*Math.PI/180
  #endif
""""
#define FILE
""""
  #script
    write '"'+tea.argv['--file']+'"'
  #end
""""
#define ABC(a, b, c)\
(a+b+c)
/*
----
*/
// console.log('PI =='+PI)
console.log('#{PI} ==', PI)
console.log('#PI ==', #PI)
console.log('"\#{PI}" == #{PI}')
// console.log('DEG((4*100)) =='+DEG((4*100)));
console.log('DEG((4*100)) ==', DEG((4*100)));
// console.log('ABC 1, 2, 3 == '+ABC 1, 2, 3);
console.log('ABC 1, 2, 3 == ', ABC 1, 2, 3);
// test undef
#undef DEG
console.log('DEG(5) ==', DEG(5))




// test control
#ifdef FILE
console.log('the file is '+FILE);
#else
console.log('the file is ???');
#endif

// test line
console.log('the line number is '+#line)

#test
console.log('test ok');
#end
console.log('end');