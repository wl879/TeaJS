// TODO: --os --xxxx
var Argv = (function(){
	var _conf_re = /^\s*(\-\w)?(?:, *)?(\-\-[\w\-]+)?\ +(\<[^\>]+\>|\[[^\]]+\]|"[^"]+"|'[^']+'|\w+?\b)?\s*(.*)$/mg;
	var _desc = {};
	var _config = {};
	function Argv(argv, desc){
		this.length = 0;
		if (argv || desc){
			this.parse(argv, desc);
		}
	};
	Argv.prototype.parse = function (argv, desc){
		var last_name, type, value;
		if (desc){
			Argv.desc(desc);
		}
		if (argv){
			last_name = '';
			for (var name, i = 0; i < argv.length; i++){
				name = argv[i];
				if (i === 0){
					if (/^node$|bin.*?node$/.test(name)){
						i += 1;
						continue;
					}
					if (name[0] != '-'){
						continue;
					}
				}
				if (name[0] == '-'){
					last_name = '';
					name = checkName(this, name);
					type = _config[name];
					if (type == 'boolean'){
						this[name] = true;
						continue;
					}
					value = argv[i+1];
					if (!value || value[0] == '-'){
						if (type == 'important'){
							throw '[Important argv]\n\n  '+_desc[name];
						}
						value = true;
					}else {
						i += 1;
					}
					this[name] = value;
					last_name = name;
				}else if (last_name){
					if (!Array.isArray(this[last_name])){
						this[last_name] = [this[last_name]];
					}
					this[last_name].push(name);
				}else if (!this['--file']){
					this['--file'] = name;
					last_name = '--file';
				}else {
					this[this.length++] = name;
				}
			}
		}
		return this;
	};
	Argv.prototype.pipe = function (callback, timeout){
		Argv.readPipe(callback, timeout);
		return this;
	};
	Argv.prototype.set = function (desc){
		Argv.desc(desc);
		return this;
	};
	Argv.prototype.add = function (short, long, desc, type){
		Argv.add(short, long, desc, type);
		return this;
	};
	Argv.prototype.help = function (com){
		if (com == null) com = 'help';
		return print.toText(_desc[com]);
	};
	Argv.desc = function(desc, temp){
		var opt, m, short, long, type;
		if (temp == null) temp = _conf_re;
		if (typeof desc == 'string'){
			opt = [];
			temp.lastIndex = 0;
			while (m = temp.exec(desc)){
				opt.push([m[1], m[2], m[3], m[4]]);
			}
			_desc.help = desc;
		}else if (Array.isArray(desc)){
			opt = desc;
		}
		if (opt && opt.length){
			for (var item, i = 0; i < opt.length; i++){
				item = opt[i];
				short = item[0], long = item[1], type = item[2], desc = item[3];
				if (short || long){
					switch (type && type[0]){
						case '[':
							type = 'default';
							break;
						case '<':
							type = 'important';
							break;
						case '"':case "'":
							type = type.slict(1, -1);
							break;
						default:
							if (type){
								if (!desc){
									desc = type, type = null;
								}else if (type == 'false'){
									type = false;
								}else if (type == 'true'){
									type = true;
								}
							}else {
								type = 'boolean';
							}
							break;
					}
					Argv.add(short, long, desc, type);
				}
			}
		}
	};
	Argv.add = function(short, long, desc, type){
		if (short && short.substr(0, 2) == '--'){
			desc = long, long = short, short = null;
		}
		if (!long){
			long = short, short = null;
		}
		if (desc){
			desc = short+', '+long+' '+type+'      '+desc;
			short && (_desc[short] = desc);
			_desc[long] = desc;
		}
		if (type){
			short && (_config[short] = type);
			_config[long] = type;
		}
		if (short && long && short != long){
			Argv.prototype.__defineGetter__(short, function(){
				return this[long];
			});
			Argv.prototype.__defineSetter__(short, function(v){
				return this[long] = v;
			});
		}
		if (type != null && type != 'default' && type != 'important' && type != 'boolean' && type != 'number'){
			Argv.prototype[long] = type;
		}
	};
	Argv.readPipe = function(callback, timeout){
		var timing;
		if (timeout == null) timeout = 100;
		process.stdin.setEncoding('utf8');
		process.stdin.on('readable', function(){
			var chunk;
			chunk = process.stdin.read();
			process.stdin.destroy();
			process.stdin.resume();
			clearTimeout(timing);
			callback(chunk);
		});
		timing = setTimeout(function(){
			process.stdin.destroy();
			process.stdin.resume();
			callback(null);
		}, timeout);
	};
	Argv.create = function(argv, desc){
		return new Argv(argv, desc);
	};
	function checkName(self, name){
		var i, temp, type;
		if (name[1] != '-' && name.length > 2){
			for (i = 1; i < name.length-1; i++){
				temp = '-'+name[i];
				type = _config[temp];
				if (type == 'important'){
					throw '[Important argv]\n\n  '+_desc[temp];
				}
				self[temp] = true;
			}
			name = '-'+name[name.length-1];
		}
		return name;
	};
	return Argv;
})();
module.exports = Argv;