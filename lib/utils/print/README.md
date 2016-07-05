## print

---

对 nodejs 输出扩展

---

### print.stdout(text)
> 无换行输出

### print.register(name, printer)

> 注册一个对象的输出方法

### print.toText()

> 将传入的参数转换为文本格式

### print.refresh( name, value | data )

> 刷新输出内容

### print.clear()

> 清空输出内容

### print.format(text)
 
> ```
<r:text:>         light red color
<b:text:>         light blue color
<g:text:>         light green color
<c:text:>         cyan color
<d:text:>         dark grey color
<w:text:>         light grey color
<ct:text:>        algin center text
<bd:text:>        draw border on text round
<cp:str number:>  copy text
<-->            draw line
<>              fill blank
<$:name value:>   create a variable
<debug> <code> <fragment> <stack>
                echo debug info
```
