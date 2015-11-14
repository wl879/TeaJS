require("./printer.js");
var debug_lv = 0, debug_event_listener = [];
global.debug = function(e){
	var text;
	if (arguments.length == 0 || e instanceof Error){
		text = debug.stacksToText(e);
	}else {
		text = print.toString(arguments, '~ ');
	}
	debug.echo(text, new Error(), true);
};
debug.echo = function(text, error, show_line_info){
	if (show_line_info || (debug_lv&64) == 64){
		var at_line = debug.line(error || new Error(), true);
		text = text.replace(/(\n|$)/, '<-->'+at_line+'$1');
	}
	print(text);
};
debug.line = function(err, ret_str){
	var stacks = debug.stacks(err || (new Error)), stack = stacks[0];
	if (ret_str){
		return stacks[0].filetext;
	}
	if (debug.log){
		debug.log(stacks[0].filetext);
	}
};
debug.eventMap = {"all" : 0};
debug.addEvent = function(name, shot_name, func){
	if (typeof shot_name == 'function'){
		func = shot_name, shot_name = null;
	}
	var num = this.eventMap.all+1;
	this.eventMap.all += num;
	this.eventMap[name] = num;
	if (shot_name){
		this.eventMap[shot_name] = num;
	}
	this['__'+name] = func;
};
debug.onEvent = function(part, fn){
	if (fn){
		var lv = parseDebugConf(part);
		if ((debug_lv&lv) == lv){
			fn(debug_lv);
		}else {
			debug_event_listener.push([lv, fn]);
		}
	}else {
		var lv = typeof part == 'number' ? part : this.eventMap[part];
		return (debug_lv&(lv || 0)) == lv;
	}
};
debug.disable = function(part){
	debug_lv = parseDebugConf(part);
	for (name in this.eventMap){
		if (!this.eventMap.hasOwnProperty(name)) continue;
		if (debug[name] && (debug_lv&this.eventMap[name]) != this.eventMap[name]){
			debug[name] = null;
		}
	}
};
debug.enable = function(part){
	debug_lv = parseDebugConf(part);
	var open_list = [];
	for (name in this.eventMap){
		if (!this.eventMap.hasOwnProperty(name)) continue;
		if (debug['__'+name]){
			if ((debug_lv&this.eventMap[name]) == this.eventMap[name]){
				debug[name] = debug['__'+name];
				open_list.push(name);
			}else {
				debug[name] = null;
			}
		}
	}
	if (open_list.length){
		print('* Debug enable: "'+open_list.join('", "')+'"');
	}
	for (var i=debug_event_listener.length-1, item; i >= 0; i--){
		item = debug_event_listener[i];
		if ((debug_lv&item[0]) == item[0]){
			item[1](argvj_debug_level);
		}
	}
};
debug.stacks = function(err, shift){
	var stacks;
	if (isArray(err)) return err;
	if (typeof err == 'number'){
		shift = err, err = null;
	}
	if (typeof err == 'string'){
		stacks = err.split('\n');
	}else {
		err = err || new Error();
		stacks = err.stack.split('\n');
	}
	var i = 1, ret = [], m, tmp;
	if (err && err.name == 'Error'){
		while (i < stacks.length && /at (.*Function.debug|.*Function.print|.*?TeaError|.*?tea\.throw)/i.test(stacks[i])){
			i++;
		}
	}
	for (; i < stacks.length; i++){
		if (stacks[i].indexOf('anonymous') != -1){
			continue;
		}
		if (m = stacks[i].match(/at (.*?) \((.*?)\)$/)){
			tmp = m[2].split(':');
			ret.push({"fileName": tmp[0],
				"lineNumber": tmp[1],
				"columnNumber": tmp[2],
				"code": m[1],
				"source": stacks[i],
				"filetext": m[2]});
		}
	}
	if (shift){
		ret = ret.slice(shift);
	}
	ret.message = stacks[0];
	return ret;
};
debug.stacksToText = function(stacks, msg, name){
	stacks = debug.stacks(stacks || new Error);
	var text = msg === false ? [] : ['['+(name || 'Tea error stack')+']'+(msg && '\n'+msg || '')];
	for (var i=0, stack; i < stacks.length; i++){
		stack = stacks[i];
		if (typeof stacks[i] == 'string'){
			text.push(stacks[i]);
		}else {
			text.push(" · "+(stack.code)+" <-> File \""+(stack.fileName)+"\", <->line "+(stack.lineNumber));
		}
	}
	text = text.join('\n');
	return print.toText(text);
};
debug.__defineGetter__('level', function(){return debug_lv});
function parseDebugConf(part){
	var e = debug_lv;
	if (typeof part == 'number'){
		e = part;
	}else if (part){
		for (var i_ref = part.replace(/\W+/g, ' ').trim().split(' '), i=0, name; i < i_ref.length; i++){
			name = i_ref[i];
			if (debug.eventMap[name]){
				e += debug.eventMap[name];
			}
		}
	}
	return e;
}