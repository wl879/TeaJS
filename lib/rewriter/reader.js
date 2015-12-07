var Reader = (function(){
	var Writer = require("./writer.js");
	var ES5 = require("./ES5.js");
	var pattern_cache = {};
	function Reader(ctx){
		if (this.constructor != Reader){
			return new Reader(ctx);
		}
		this.context = ctx;
	}
	Reader.prototype.new = function (type){
		var write = new Writer(this, type);
		if (arguments.length > 1){
			write.read.apply(write, Hash.slice(arguments, 1));
		}
		return write;
	}
	Reader.prototype.read = function (node, do_each){
		var res;
		if (!node){
			return;
		}
		if (!node.istoken && !node.isnode){
			return node;
		}
		if (!do_each && (res = getReader(node.type, this, node))){
			if (res.isnode){
				return this.read(res, true);
			}
			return res;
		}else if (node.isnode){
			var write = this.new(node.type);
			for (var i=0, item; i < node.length; i++){
				item = node[i];
				write.read(item);
			}
			return write;
		}else if (node.istoken){
			return node;
		}
	}
	Reader.prototype.patt = function (patt, node, write){
		var res;
		if (!(patt = getPattern(patt, node))){
			return;
		}
		if (!write) write = this.new(patt.name || node.type);
		var patt_list = patt.list;
		for (var i=0, chip; i < patt_list.length; i++){
			chip = patt_list[i];
			if (chip.ispattern){
				if (res = parsePatternAccessor.call(this, chip, node)){
					if (res.type == write.type){
						for (var j=0; j < res.length; j++){
							write.read(res[j]);
						}
					}else {
						write.read(res);
					}
				}else if (res === null && typeof patt_list[i-1] == 'string'){
					Array.prototype.pop.call(write);
				}
			}else if (chip){
				write.read(chip);
			}
		}
		return write;
	}
	Reader.compilePattern = function(source){
		var m;
		if (pattern_cache[source]){
			return pattern_cache[source];
		}
		var chips = source.replace(/ ?\| ?/g, '|').split('|'), patt = [];
		for (var i=0, chip; i < chips.length; i++){
			chip = chips[i];
			var ptn = {"condition": '', "list": [], "name": '', "source": chip};
			if (m = chip.match(/^\(\:(\w+)\)\ ?/)){
				ptn.name = m[1];
				chip = chip.substr(m[0].length);
			}
			if (m = chip.match(/^\(\?(.*?)\)\ ?/)){
				ptn.condition = compilePatternCondition(m[1]);
				chip = chip.substr(m[0].length);
			}
			while (m = chip.match(/\b([A-Z]\w+[A-Z]\w+)\(#(\d+(?:\.\d+)*)?\)|#(\d+(?:\.\d+)*)?/)){
				ptn.list.push(chip.slice(0, m.index));
				ptn.list.push(compilePatternAccessor(m, ptn.source));
				chip = chip.substr(m.index+m[0].length);
			}
			if (chip){
				ptn.list.push(chip);
			}
			patt.push(ptn);
		}
		patt.isreader = true;
		return pattern_cache[source] = patt;
	};
	function getReader(type, self, node){
		var write, reader;
		// if tea.argv['--ES'] == 6:
		// 	if type in ES6:
		// 		reader = ES6[type];
		if (!reader && ES5.hasOwnProperty(type)){
			reader = ES5[type];
		}
		if (reader){
			if (typeof reader == 'function'){
				write = self.new(type);
				reader = reader.call(self, node, write) || write;
			}
			if (typeof reader == 'string' || reader.isreader){
				return self.patt(reader, node);
			}
			return reader;
		}
		if (self.context && (reader = self.context.get(type, 'statement', 'expression'))){
			return reader.read(self, node);
		}
	}
	function getPattern(patt, node){
		var item, patt = patt.isreader ? patt : Reader.compilePattern(patt);
		for (var i=0; i < patt.length; i++){
			if (!patt[i].condition){
				return patt[i];
			}
			var conds = patt[i].condition;
			for (var j=0, cond; j < conds.length; j++){
				cond = conds[j];
				item = getNodeItem(node, cond.indexs, true);
				if (item && item[cond.fn].apply(item, cond.param)){
					if (cond.logic != '&&'){
						return patt[i];
					}
				}else if (cond.logic != '||'){
					break;
				}
			}
		}
	}
	function getNodeItem(node, indexs, strict){
		var item = node;
		if (indexs){
			for (var _i=0, i; _i < indexs.length; _i++){
				i = indexs[_i];
				if (item[i]){
					item = item[i];
				}else {
					if (strict){
						return null;
					}
					break;
				}
			}
			if (item == node || !item){
				return null;
			}
		}
		return item;
	}
	function initReader(reader){
		for (var name in reader){
			if (!reader.hasOwnProperty(name)) continue;
			var ptn = reader[name];
			if (typeof ptn == 'string'){
				Reader.compilePattern(ptn);
			}
			if (/ /.test(name)){
				delete reader[name];
				for (var _i_ref = name.split(' '), _i=0, n; _i < _i_ref.length; _i++){
					n = _i_ref[_i];
					reader[n] = ptn;
				}
			}
		}
	}
	function compilePatternCondition(text){
		var m, list = [];
		while (m = text.match(/^\ *#(\d+(?:\.\d+)*)? (is|eq) (.*?)(\&\&|\|\||$)/)){
			list.push({"fn": m[2],
				"indexs": m[1] && m[1].split('.'),
				"param": m[3].trim().split(','),
				"logic": m[4]});
			if (m[4]){
				text = text.substr(m[0].length);
				continue;
			}
			break;
		}
		return list;
	}
	function compilePatternAccessor(match, source){
		var fn, index, param;
		if (fn = match[1]){
			index = match[2];
		}else {
			index = match[3];
		}
		if (index){
			index = index.split('.');
		}
		return {"fn": fn, "indexs": index, "param": param, "ispattern": true, "source": source};
	}
	function parsePatternAccessor(patt, node){
		var item, write;
		if (!(item = getNodeItem(node, patt.indexs))){
			return null;
		}
		if (!patt.fn){
			write = item.istoken || item.isnode ? this.read(item, node == item) : item;
		}else if (/^[A-Z]+$/.test(patt.fn) && this[patt.fn]){
			write = item.isnode || item.istoken ? this.read(item, node == item) : item;
			this[patt.fn](write);
		}else if (write = getReader(patt.fn, this, item)){
			return write;
		}else {
			throw tea.error(new Error(), 'writer patt has undefined function', [patt.source, -1, patt.fn]);
		}
		return write;
	}
	initReader(ES5);
	Reader.prototype.COMMA = function (write){
		return this.JOIN(write, ',');
	}
	Reader.prototype.JOIN = function (write, separator){
		if (separator == null) separator = ' ';
		for (var i = write.length-1; i >= 1; i--){
			Array.prototype.splice.call(write, i, 0, separator);
		}
		return write;
	}
	Reader.prototype.VAR = function (){
		var list = [];
		for (var i=0; i < arguments.length; i++){
			if (arguments[i]){
				list.push(this.read(arguments[i]));
			}
		}
		if (list.length){
			this.COMMA(list);
			var write = this.new('VarDecl', 'var #0', [list]);
			return write;
		}
	}
	return Reader;
})();
module.exports = Reader;