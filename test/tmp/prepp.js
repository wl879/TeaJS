

#!/usr/bin/env node
/\(...\)\I\D/
// test token
#token IDENTIFIER,SB who is sb
// eeee
#expr SBPatt `SB ParamsStam?`
""""
  console.log(#1)
""""

// test who is sb xiaoming, lili = who is sb(xiaoming, lili);
// who is sb xiaoming, lili;

// test argv
#argv -os 'android'
// test run
#run
if (tea.argv['-os'] == 'android') {
write "console.log('This is Android os')";
}else:
  write "console.log('This is iOS')";
#end

//test include
    #include "./include.js";

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
  {{
    write '"'+tea.argv['--file']+'"'
  }}
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
#end

// test line
console.log('the line number is '+#line)

#test
console.log('test ok');
#end
console.log('end');