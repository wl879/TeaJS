var Script = (function(){
	function Script(script, args){
		this.fragment = Script.create(script, args);
	};
	Script.prototype.value = function (){
		var value;
		value = '';
		for (var item, i = 0; i < this.fragment.length; i++){
			item = this.fragment[i];
			if (typeof item == 'function'){
				item = item.apply(this, arguments);
			}
			if (typeof item == 'string'){
				value += item;
			}else if (item){
				return item;
			}
		}
		return value;
	};
	Script.create = function(text, args){
		var temps, a, ab, b, script;
		temps = [];
		if (text.indexOf('#script') != -1){
			while ((a = text.indexOf('#script')) != -1){
				if (ab = SText.indexPair(text, '#script', '#end', a)){
					b = ab[1];
				}else {
					b = text.length;
				}
				if (a){
					temps.push(text.substr(0, a));
				}
				if (script = Script.createScript(text.slice(a+7, b), args)){
					temps.push(script);
				}
				text = text.substr(b+4);
			}
			if (text){
				temps.push(text);
			}
		}else {
			temps = [text];
		}
		return temps;
	};
	Script.createScript = function(script, args, sugarBox){
		var temp;
		if (args == null) args = [];
		script = Tea.compile(script, sugarBox);
		temp = "(function("+(args.join(','))+"){var __output__  = '', echo = write;function write(){for(var i=0; i<arguments.length; i++)__output__ += arguments[i];}"+script+";return __output__;})";
		return eval(temp);
	};
	return Script;
})();
module.exports = Script;