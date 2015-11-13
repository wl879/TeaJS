

"
if(\"true\" && \"ab\" == \'\\n\'){
	ok = ${val+1}
}
"
'
if(\"true\" && \"ab\" == \'\n\'){
	ok = ${val}
}
'
"""
if(\"true\" && \"ab\" == \'\\n\'){
	ok = $valslfjslj+1
}
"""
'''
	if("true" && "ab" == '\\n'){
		ok 
	}
'''
""""
	if("true" && "\n" == '\\n'){
		ok = ${val}
	}
""""
''''
	if("true" && "\n" == '\\n'){
		ok = ${val}
	}
''''
`
if("true" && "\n" == '\\n'){
	ok = val
}
`

`	function(${args.join(',')){
		var __write = '', write = function(){
			for i => arguments:
				__write += arguments[i];
		};
		${script};
		return __write;
	}(${param.join(',')})`