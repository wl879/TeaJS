var Syntax = (function(){
	var Pattern = require("./pattern.js");
	var cache = {};
	var exec_cache = {"length": 0};
	function Syntax(name, patt, mode){
		this.id = Tea.ID();
		this.name = name;
		if (!mode){
			if (/\w+(Expr|Decl|Patt|Stam|Dest)$/.test(name)){
				mode = 'package node';
			}else if (/^[A-Z_]+$/.test(name)){
				mode = 'to token';
			}
		}
		this.packMode = mode;
		if (typeof patt == 'function'){
			this.callback = patt;
		}else {
			this.pattern = Pattern.compile(patt);
			if (this.pattern.debug){
				print(this);
			}
		}
	};
	Syntax.prototype.exec = function (handle, src, params){
		var id, result;
		id = src.id+':'+src.index+':'+this.id+':'+params;
		if (result = checExecCache(id, src)){
			return result;
		}
		handle.initHeap(this.name, {
			"params": params,
			"startIndex": src.index,
			"packName": this.name,
			"packMode": this.packMode,
			"matchcache": []});
		if (this.pattern){
			handle.setHeap({"syntax": this.pattern, "debug": this.pattern.debug ? [] : null});
			result = this.pattern.exec(handle, src, true);
		}else {
			result = this.callback.call(handle, handle.heap, src, params);
		}
		result = handle.didHeap(result);
		sevaExecCache(id, result, src);
		return result;
	};
	Syntax.compile = function(name, patt, mode){
		var id;
		id = name+"::::"+patt+'::::'+mode;
		if (cache[id]){
			return cache[id];
		}
		return cache[id] = new Syntax(name, patt, mode);
	};
	Syntax.prototype.isSyntax = true;
	function sevaExecCache(id, result, src){
		exec_cache[id] = [result, src.index];
		exec_cache.length++;
		exec_cache.sourceID = src.id;
	};
	function checExecCache(id, src){
		if (exec_cache[id]){
			src.index = exec_cache[id][1];
			return exec_cache[id][0];
		}
		if (exec_cache.length > 1000 || exec_cache.sourceID != src.id){
			exec_cache = {"length": 0};
		}
	};
	return Syntax;
})();
module.exports = Syntax;