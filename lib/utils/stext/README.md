## sText

----

 这个模块主要是扩展了一些 string 对象的方法，使其在处理类似脚本文本时更为方便

----

**示例**

sText(something)

> ```
sText('a\'')
  => "a\\'"	
```

sText.cleanESC(text)

> ```
sText.cleanESC("Hello\\ world")
  => "Hello world"
```

sText.trim(text)

> ```
sText.trim("\t Hello world\\\n\n\n")
  => "Hello world\\\n"
```

sText.split(text, separator, _trim, _cesc, _pair)

> ```js
sText.split("max(1, 2) + 3", " ");
  => ['max(1, 2)', '+', '3'] 
```

sText.indexOf(text, target, pos)

> ```js
sText.indexOf("this\\ is\\ one this\\ is\\ tow", " ");
  => 13
```

sText.indexPair(text, left, right, pos, _esc)

> ```js
sText.indexPair("max(1, abs(num));", "(", ")");
  => [ 3, 15 ]  // "(1, abs(num))"
```

sText.indexLine(text, pos)

> ```js
sText.indexLine("line 1\n line 2", "10");
  => //line text, line num, at line col
  => [' line 2', 2, 3] 
```

sText.clip(text, _tabsize)

> ```js
sText.clip("  \n  abc\n  123  ");
  => "abc\n123" 
```

sText.width(text, _tabsize)

> ```js
sText.width("\t1234", '    ');
  => 8
```

sText.toUnicode(text)

> ```js
sText.toUnicode("你好");
  => "\u4f60\u597d" 
```

sText.readFile(file, encoding)
sText.writeFile(text, file, encoding)

----
此项目基于 [TeaJs](https://github.com/wl879/TeaJS.git)