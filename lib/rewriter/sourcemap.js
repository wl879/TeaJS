var SourceMap = (function(){
	function SourceMap(){
		this.version = 3;
		this.file = '';
		this.sourceRoot = '';
		this.sources = [];
		this.names = [];
		this.mappings = [];
	}
	var VLQ_SHIFT, VLQ_CONTINUATION_BIT, VLQ_VALUE_MASK, BASE64_CHARS;
	VLQ_SHIFT = 5;
	VLQ_CONTINUATION_BIT = 1<<VLQ_SHIFT;
	VLQ_VALUE_MASK = VLQ_CONTINUATION_BIT-1;
	BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	SourceMap.prototype.addSource = function (file){
		var i = this.sources.indexOf(file);
		if (i == -1){
			return this.sources.push(file)-1;
		}
		return i;
	}
	SourceMap.prototype.addName = function (name){
		var i = this.names.indexOf(name);
		if (i == -1){
			return this.names.push(name)-1;
		}
		return i;
	}
	SourceMap.prototype.parse = function (writer, src){
		var loc,
			vlq,
			m,
			line = '',
			line_num = 1,
			add_comma,
			last_vlq,
			last_col = 0,
			last_loc_line = 1,
			last_loc_col = 0;
		for (var i_ref = writer.toList(), i=0, item; i < i_ref.length; i++){
			item = i_ref[i];
			if (item.istoken){
				if (item.location && item.location.fileName){
					loc = item.location;
					vlq = SourceMap.encodeVlq(line.length-last_col, this.addSource(loc.fileName), loc.lineNumber-last_loc_line, loc.columnNumber-last_loc_col);
					// if item.type == 'IdentifierTokn':
					// 	vlq += @.encodeVlq( @.addName(item.text) );
					if (add_comma) this.mappings.push(','); else add_comma = true;
					this.mappings.push(vlq);
					last_vlq = vlq;
					last_col = line.length;
					last_loc_line = loc.lineNumber;
					last_loc_col = loc.columnNumber;
				}
				item = item.text;
			}
			if (/\n/.test(item)){
				while (m = item.match(/\n/)){
					this.mappings.push(';');
					line_num++;
					line = item = item.substr(m.index+1);
				}
				add_comma = last_col = 0;
			}else {
				line += item;
			}
		}
		return this;
	}
	SourceMap.prototype.__defineGetter__("data", function(){
		return {"version": 3,
			"file": this.file || '',
			"sourceRoot": this.sourceRoot || '',
			"sources": this.sources,
			"names": this.names,
			"mappings": this.mappings.join('')};
	});
	SourceMap.prototype.__defineGetter__("text", function(){
		return Text(this.data);
	});
	SourceMap.encodeVlq = function(){
		var signBit, valueToEncode, answer, nextChunk, vlq = '';
		for (var _i=0, value; _i < arguments.length; _i++){
			value = arguments[_i];
			signBit = value < 0 ? 1 : 0;
			valueToEncode = (Math.abs(value)<<1)+signBit;
			answer = '';
			while (valueToEncode || !answer){
				nextChunk = valueToEncode&VLQ_VALUE_MASK;
				valueToEncode = valueToEncode>>VLQ_SHIFT;
				if (valueToEncode){
					nextChunk = nextChunk|VLQ_CONTINUATION_BIT;
				}
				answer += this.encodeBase64(nextChunk);
			}
			vlq += answer;
		}
		return vlq;
	};
	SourceMap.encodeBase64 = function(value){
		if (BASE64_CHARS[value]){
			return BASE64_CHARS[value];
		}
		throw tea.error(new Error(), "Cannot Base64 encode value: "+value);
	};
	return SourceMap;
})();
module.exports = SourceMap;