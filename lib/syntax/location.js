var Location = (function(){
	function Location(file, source, code, start, end, line, column){
		if (!source && file){
			source = Text.readFile(file);
		}
		this.__file_id = CacheFile(file);
		this.__source_id = CacheSource(source);
		this.code = code || '';
		this.lineNumber = (line != null ? line : null);
		this.columnNumber = (column != null ? column : null);
		this.start = (start != null ? start : 0);
		this.end = end || start+this.code.length-1;
		if (line == null){
			CountLineNumber(this, start);
		}
	}
	var file_cache = [], source_cache = [];
	Location.prototype.__defineGetter__("fileName", function(){
		return file_cache[this.__file_id] || '';
	});
	Location.prototype.__defineGetter__("source", function(){
		var data = source_cache[this.__source_id];
		return data && data.source || '';
	});
	Location.prototype.__defineGetter__("line", function(){
		var data = source_cache[this.__source_id];
		return data && data[this.lineNumber-1][3] || '';
	});
	Location.prototype.fission = function (code, start, end){
		return new Location(this.__file_id, this.__source_id, code, start, end);
	}
	function CountLineNumber(loc, start){
		var data;
		if (data = source_cache[loc.__source_id]){
			for (var i=0, line_data; i < data.length; i++){
				line_data = data[i];
				if (start >= line_data[1] && start <= line_data[2]){
					loc.lineNumber = line_data[0];
					loc.columnNumber = start-line_data[1];
					break;
				}
			}
		}
		return loc;
	}
	function CacheFile(file){
		if (typeof file == 'number'){
			return file;
		}
		if (file){
			var index = file_cache.indexOf(file);
			if (index == -1){
				index = file_cache.push(file)-1;
			}
			return index;
		}
		return null;
	}
	function CacheSource(source){
		if (typeof source == 'number'){
			return source;
		}
		if (source){
			var index = -1;
			for (var i=0; i < source_cache.length; i++){
				if (source_cache[i].text == source){
					index = i;
					break;
				}
			}
			if (index == -1){
				var lines = source.split('\n'), shift = 0, data = [];
				for (var i=0, line; i < lines.length; i++){
					line = lines[i];
					data.push([i+1, shift, (shift += line.length+1)-1, line+'\n']);
				}
				data.source = source;
				index = source_cache.push(data)-1;
			}
			return index;
		}
		return null;
	}
	return Location;
})();
module.exports = Location;