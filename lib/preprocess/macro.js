var Macro = (function(){
	function Macro(name, params, body, parent){
		this.name = name;
		this.type = params ? 'macrofun' : 'macro';
		if (params){
			if (typeof params == 'string'){
				this.params = Text.split(params, ',', true);
			}else {
				this.params = params;
			}
		}else {
			this.params = [];
		}
		this.body = body;
		this.parent = parent;
		if (Template.test(body)){
			try {
				this.script = Template.func(body, params, true);
			}catch (e) {
				this.error = e;
			}
		}
	}
	var Template = require("./template.js");
	Macro.prototype.getValue = function (params, ret_src){
		var value, val_src;
		if (typeof params == 'string'){
			params = Text.split(params.replace(/^\((.*)\)$/g, '$1'), ',', 'trim');
		}
		if (this.script){
			value = this.script.apply(this.parent, params || []);
		}else {
			value = this.body;
		}
		value = replaceParam(value, this.params, params || []);
		value = Text.trimIndent(value);
		val_src = this.parent.parse(value);
		if (ret_src){
			return val_src;
		}
		return val_src.join();
	}
	function replaceParam(value, keys, params){
		var keys_join = keys.join('|'),
			re = new RegExp('(#*?)('+(keys_join ? '\\b(?:'+keys_join+')\\b|' : '')+'#(\\d+)|\\bARGR\\.\\.\\.)(##)?', 'g'),
			m,
			hash,
			unhash,
			key,
			num,
			arg,
			val,
			insert = [],
			id;
		while (m = re.exec(value)){
			hash = m[1], key = m[2], num = m[3], unhash = m[4];
			num = num || keys.indexOf(key);
			if (key == 'ARGR...'){
				val = params.slice(keys.length).join(', ');
			}else if (params[num]){
				val = params[num];
			}
			id = '$$$'+ID()+'$$$';
			insert.push([id, (val ? hash%2 ? '"'+val+'"' : val : '')]);
			value = value.slice(0, m.index)+id+value.substr(re.lastIndex);
			re.lastIndex = m.index+id.length;
		}
		for (var i=0; i < insert.length; i++){
			value = value.replace(insert[i][0], insert[i][1]);
		}
		return value;
	}
	module.exports = Macro;
	return Macro;
})();