var TeaHeap = (function(){
	function TeaHeap(id, parent, tea){
		this.id = id;
		this.parent = parent;
		this.tea = tea;
	};
	TeaHeap.prototype.set = function (name, value){
		if (typeof name == 'object'){
			return Jsop.extend(this, name);
		}
		return this[name] = value;
	};
	TeaHeap.prototype.get = function (name, destroy){
		var value;
		value = this[name];
		if (destroy){
			this[name] = null;
		}
		return value;
	};
	TeaHeap.prototype.variable = function (name, value, oper){
		if (!this.variables){
			this.variables = {};
		}
		if (arguments.length > 1){
			if (oper == '+='){
				return this.variables[name] += value;
			}
			if (oper == '-='){
				return this.variables[name] -= value;
			}
			return this.variables[name] = value;
		}
		return this.variables[name];
	};
	TeaHeap.prototype.cache = function (name, value, find, find_value){
		var heap;
		heap = find ? this.find(find, find_value) : this;
		if (heap){
			if (value){
				!heap[name] && (heap[name] = []);
				if (heap[name].indexOf(value) == -1){
					heap[name].push(value);
				}
			}
			return name ? heap[name] : heap;
		}
	};
	TeaHeap.prototype.find = function (key, value){
		var heap;
		heap = this;
		while (heap){
			if (value){
				if (heap[key] == value){
					return heap;
				}
			}else {
				if (heap.id == key){
					return heap;
				}
				if (heap[key]){
					return heap;
				}
			}
			heap = heap.parent;
		}
	};
	TeaHeap.prototype.log = function (data){
		if (this.debug){
			this.debug.push(data);
			return data;
		}
	};
	TeaHeap.prototype.ondid = function (fn, params){
		this._ondid_ = fn;
		this._ondidparams_ = params;
	};
	TeaHeap.prototype.did = function (result, callback){
		if (this._ondid_){
			result = this._ondid_.call(this.tea, this, result, this._ondidparams_);
			this._ondid_ = null;
			this._ondidparams_ = null;
		}
		if (callback){
			result = callback(this.tea, result);
		}
		if (this.debug){
			printDebugLog(this);
		}
		return result;
	};
	TeaHeap.prototype.stack = function (){
		var heap, list;
		heap = this;
		list = [];
		while (heap){
			list.push(heap.id);
			if (/block|root/i.test(heap.id)){
				break;
			}
			heap = heap.parent;
		}
		return '[Grammar match stack] '+list.reverse().join('->');
	};
	function printDebugLog(heap){
		var handle, source, logs, texts, asset, ref, start, end, code, patt;
		handle = heap.tea;
		source = handle.source;
		logs = heap.debug;
		texts = [];
		for (var item, i = logs.length - 1; i >= 0; i--){
			item = logs[i];
			asset = item[0], ref = item[1], start = item[2], end = item[3];
			ref = ref ? '<g:✓:>' : '<r:#:>';
			code = source.join(start, end).replace(/\n/g, '\\n');
			patt = asset.string;
			if (asset.type == 'Pattern' || asset.type == 'Or'){
				texts = [
					""+ref+" ["+(i?'Group':'Pattern')+"] "+patt+" \""+code+"\"\n"+texts.reverse().join('\n').replace(/^/mg, '    ').replace(/^ (.*? \[Or)/mg, '$1')];
			}else if (!asset.type){
				texts = [""+ref+" [Or] "+patt+" \""+code+"\"\n"+texts.reverse().join('\n')];
			}else {
				texts.push(""+ref+" ["+(asset.type)+"] "+patt+" \""+code+"\"");
			}
		}
		print('<-->\n'+texts.join('\n')+'\n');
	};
	return TeaHeap;
})();
module.exports = TeaHeap;