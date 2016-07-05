var SourceMap = (function(){
	var VLQ_SHIFT = 5;
	var VLQ_CONTINUATION_BIT = 1<<VLQ_SHIFT;
	var VLQ_VALUE_MASK = VLQ_CONTINUATION_BIT-1;
	var BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	function SourceMap(){
		this.version = 3;
		this.file = '';
		this.sourceRoot = '';
		this.names = [];
		this._sources = [];
		this._mappings = [];
	};
	SourceMap.prototype.parse = function (card){
		var list, sources, line, line_num, add_comma, last_vlq, last_col, last_loc_line, last_loc_col, loc, vlq, m;
		list = card.toList();
		sources = this._sources;
		line = '';
		line_num = 1;
		add_comma = null;
		last_vlq = null;
		last_col = 0;
		last_loc_line = 1;
		last_loc_col = 0;
		for (var item, i = 0; i < list.length; i++){
			item = list[i];
			if (item.isToken){
				if (item.location && item.location.fileName){
					loc = item.location;
					vlq = encodeVlq(line.length-last_col, sourceId(sources, loc.fileName), loc.lineNumber-last_loc_line, loc.columnNumber-last_loc_col);
					add_comma ? this._mappings.push(',') : (add_comma = true);
					this._mappings.push(vlq);
					last_vlq = vlq;
					last_col = line.length;
					last_loc_line = loc.lineNumber;
					last_loc_col = loc.columnNumber;
				}
				item = item.text;
			}
			if (/\n/.test(item)){
				while (m = item.match(/\n/)){
					this._mappings.push(';');
					line_num++;
					line = item = item.substr(m.index+1);
				}
				add_comma = last_col = 0;
			}else {
				line += item;
			}
		}
		return this;
	};
	SourceMap.prototype.addName = function (name){
		var i = this.names.indexOf(name);
		if (i == -1){
			return this.names.push(name)-1;
		}
		return i;
	};
	SourceMap.prototype.__defineGetter__("sources", function(){
		if (!Fp){
			return this._sources;
		}
		var ss = [];
		var dir = Fp.dirName(this.file);
		for (var file, i = 0; i < this._sources.length; i++){
			file = this._sources[i];
			ss.push(Fp.relative(dir, file));
		}
		return ss;
	});
	SourceMap.prototype.__defineGetter__("mappings", function(){
		return this._mappings.join('');
	});
	SourceMap.prototype.__defineGetter__("text", function(){
		var data;
		data = {
			"version": 3,
			"file": this.file || '',
			"sourceRoot": '',
			"sources": this.sources,
			"names": this.names,
			"mappings": this.mappings};
		return SText(data);
	});
	function sourceId(sources, filename){
		var i;
		i = sources.indexOf(filename);
		if (i == -1){
			return sources.push(filename)-1;
		}
		return i;
	};
	function encodeVlq(){
		var vlq, signBit, valueToEncode, answer, nextChunk;
		vlq = [];
		for (var value, i = 0; i < arguments.length; i++){
			value = arguments[i];
			signBit = value < 0 ? 1 : 0;
			valueToEncode = (Math.abs(value)<<1)+signBit;
			answer = '';
			while (valueToEncode || !answer){
				nextChunk = valueToEncode&VLQ_VALUE_MASK;
				valueToEncode = valueToEncode>>VLQ_SHIFT;
				if (valueToEncode){
					nextChunk = nextChunk|VLQ_CONTINUATION_BIT;
				}
				answer += encodeBase64(nextChunk);
			}
			vlq.push(answer);
		}
		return vlq.join('');
	};
	function encodeBase64(value){
		if (BASE64_CHARS[value]){
			return BASE64_CHARS[value];
		}
		Tea.error("Cannot Base64 encode value: "+value);
	};
	return SourceMap;
})();
module.exports = SourceMap;