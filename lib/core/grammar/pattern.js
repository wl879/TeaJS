var Pattern = (function(){
	var Asset, Syntax, cache, check_loop;
	Asset = require("./asset.js");
	Syntax = require("../syntax.js");
	cache = Jsop.data();
	check_loop = {};
	function Pattern(str){
		var or_list, asset_list, patt;
		this.length = 0;
		this.minLimit = 0;
		if (str){
			this.string = str;
			or_list = splitPattern(str);
			if (or_list.length == 1){
				this.type = 'Pattern';
				asset_list = or_list[0];
				for (var i = 0; i < asset_list.length; i++){
					this.add(compileAsset(asset_list[i]));
				}
			}else {
				this.type = 'Or';
				for (var asset_list, j = 0; j < or_list.length; j++){
					asset_list = or_list[j];
					patt = new Pattern();
					patt.string = asset_list.join(' ');
					for (var i = 0; i < asset_list.length; i++){
						patt.add(compileAsset(asset_list[i]));
					}
					this.add(patt);
				}
			}
		}
	};
	Pattern.prototype.add = function (){
		for (var asset, i = 0; i < arguments.length; i++){
			asset = arguments[i];
			this[this.length++] = asset;
			if (asset.isPattern){
				if (asset.minLimit){
					this.minLimit = 1;
				}
			}else {
				this.minLimit += !asset.config.mode || asset.config.mode[0] == '+' ? 1 : 0;
			}
		}
		return this;
	};
	Pattern.prototype.parse = function (grm, src, params){
		var handle, _params, res;
		if (check_loop.index != src.index){
			check_loop.count = {};
			check_loop.index = src.index;
			check_loop.times = 0;
		}else {
			if (check_loop.times > 500){
				throw Error.create(4003, grm.stack('loop'), new Error());
			}
			check_loop.times++;
		}
		handle = grm.handle;
		_params = handle.params;
		handle.params = params;
		if (handle.debug){
			print('['+handle.name+' syntax debug]');
			print.indent();
		}
		res = checkPattern(this, src, grm, true);
		if (handle.debug){
			print.back();
			print('['+handle.name+' syntax debug end]\n');
		}
		handle.params = _params;
		if (handle.error){
			return {"error": handle.error};
		}
		return res;
	};
	Pattern.prototype.isPattern = true;
	Pattern.compile = function(str){
		if (!cache[str]){
			return cache[str] = new Pattern(str);
		}
		return cache[str];
	};
	Pattern.parse = function(grm, patt, src, params){
		if (typeof patt == 'string'){
			patt = Pattern.compile(patt);
		}
		return patt.parse(grm, src, params);
	};
	function splitPattern(str){
		var or_list;
		str = str.replace(/\s+(→)/g, '$1');
		str = str.replace(/(^| |,)(\[|\(|\{|\]|\)|\})(∅|→|\\n\n|:\d+|\+\?|\*\?|\+|\*|\!|\?)( |$)/g, '$1\\$2$3$4');
		or_list = SText.split(str, '|');
		for (var item, i = 0; i < or_list.length; i++){
			item = or_list[i];
			or_list[i] = SText.split(item, ' ', true);
		}
		return or_list;
	};
	function compileAsset(str){
		var asset;
		asset = Asset.compile(str);
		if (asset.type == 'Sub'){
			if (!asset.content.isPattern){
				asset.content = Pattern.compile(asset.content);
			}
		}
		return asset;
	};
	// parse pattern
	function checkPattern(patt, src, grm, __root){
		var start_index, res;
		start_index = src.index;
		if (patt.type == 'Or'){
			for (var i = 0; i < patt.length; i++){
				src.index = start_index;
				if (res = parsePattern(patt[i], src, grm, __root)){
					break;
				}
				if (grm.handle.error){
					return false;
				}
			}
		}else {
			res = parsePattern(patt, src, grm, __root);
		}
		if (res){
			if (res.isEmpty){
				return res;
			}
			return checkPack(patt, grm, res, null, __root);
		}
		src.index = start_index;
		return false;
	};
	function parsePattern(patt, src, grm, __root){
		var start_index, valid_index, res_list, total_ig, test_up, handle, step_index, ref, config;
		start_index = valid_index = src.index;
		res_list = [];
		res_list.matched = 0;
		total_ig = 0;
		test_up = false;
		handle = grm.handle;
		if (__root) handle.cache = res_list;
		for (var asset, i = 0; i < patt.length; i++){
			asset = patt[i];
			test_up = false;
			step_index = src.index;
			ref = parseAsset(asset, src, grm);
			if (handle.error) return false;
			config = asset.config;
			if (ref){
				if (config.mode == '!'){
					return grm.error(config.error, src.current);
				}
				res_list.matched++;
				if (config.test || ref.isTest){
					test_up = true;
					checkPack(asset, grm, ref, res_list);
					src.index = step_index;
					continue;
				}
				if (config.mode == '*' || config.mode == '+'){
					ref = matchMore(asset, src, grm, ref, config.smallest ? patt[i+1] : null);
				}
				if (ref === true){
					checkPack(asset, grm, ref, res_list);
					valid_index = src.index;
					total_ig++;
					continue;
				}
				valid_index = src.index;
				if (!ref.isEmpty){
					grm.next(src, !config.lf);
				}
				if (config.ig){
					checkPack(asset, grm, ref, res_list);
					total_ig++;
					continue;
				}
				ref = checkPack(asset, grm, ref, res_list);
				if (ref.isToken || ref.isSyntax){
					res_list.push(ref);
				}else if (ref.length){
					res_list.push.apply(res_list, ref);
				}
			}else {
				if (config.mode == '?' || config.mode == '*' || config.mode == '!'){
					src.index = step_index;
					if (config.pack == 'check empty'){
						res_list.push(new Syntax(config.name));
					}
					continue;
				}
				if (asset.type == 'Sub' && asset.content.minLimit == 0){
					src.index = step_index;
					continue;
				}
				return grm.error(config.error, src[step_index-1]);
			}
		}
		src.index = valid_index;
		if (res_list.matched){
			if (res_list.length == 1 && patt.length == 1){
				res_list = res_list[0];
			}
			if (res_list.length === 0 && start_index === src.index && total_ig === 0){
				res_list.isEmpty = true;
				if (patt.length == 1 && test_up){
					res_list.isTest = true;
				}
			}
			return res_list;
			src.index = start_index;
		}
	};
	function parseAsset(asset, src, grm){
		var start_index, handle, ref;
		start_index = src.index;
		handle = grm.handle;
		if (start_index >= src.length){
			return false;
		}
		if (asset.type == 'Sub'){
			if (handle.debug){
				print.indent();
			}
			ref = checkPattern(asset.content, src, grm);
			if (handle.debug){
				print.back();
			}
		}else {
			ref = asset.parse(src, grm);
		}
		if (handle.debug){
			print('[Asset] =', !!ref, asset, [ref ? src.join(start_index, src.index) : src[start_index].text]);
		}
		if (ref && !grm.handle.error){
			if (ref === true || ref.isSyntax || ref.isToken || ref.length || ref.matched){
				return ref;
			}
			return true;
		}
		src.index = start_index;
		return false;
	};
	function matchMore(asset, src, grm, res, next_asset){
		var step_index, res_list;
		step_index = src.index;
		res_list = res.isToken || res.isSyntax ? [res] : res;
		while (res = matchNext(asset, src, grm, next_asset)){
			if (step_index == src.index){
				return res_list;
			}
			step_index = src.index;
			if (res_list === true){
				continue;
			}
			if (res.isToken || res.isSyntax){
				res_list.push(res);
			}else if (res.length){
				res_list.push.apply(res_list, res);
			}
		}
		src.index = step_index;
		return res_list;
	};
	function matchNext(asset, src, grm, next_asset){
		var start_index, next, res;
		start_index = src.index;
		if (next_asset){
			grm.handle.try = true;
			grm.next(src, !asset.config.lf);
			next = parseAsset(next_asset, src, grm);
			grm.handle.try = false;
		}
		src.index = start_index;
		if (!next){
			grm.next(src, !asset.config.lf);
			if (res = parseAsset(asset, src, grm)){
				return res;
			}
		}
		src.index = start_index;
		return false;
	};
	function checkPack(asset, grm, res, res_list, __root){
		var handle, config, name, res_cache;
		handle = grm.handle;
		if (!(config = asset.config)){
			if (handle.packName && handle.pattern == asset){
				config = {"name": handle.packName, "pack": handle.packMode};
			}
		}
		if (!config || !(name = config.name)){
			return res;
		}
		switch (config.pack){
			case 'rename pattern':
				handle.packMode = 'rename response';
				handle.packName = name;
				break;
			case 'pattern name':
				handle.packMode = 'response name';
				handle.packName = name;
				break;
			case 'check response':
				if (res && !res.isSyntax && res.length > 1){
					return new Syntax(name, res);
				}
				break;
			case 'packing matched':
				res_cache = handle.cache;
				if (res_cache.length){
					if (res_list && res_cache != res_list){
						res_cache[0] = new Syntax(name, res_cache, res_list, res);
						res_list.length = 0;
					}else {
						res_cache[0] = new Syntax(name, res_cache, res);
					}
					res_cache.length = 1;
				}
				return true;
			case 'response name':
				return new Syntax(name, res);
			case 'rename response':
				if (!res.isSyntax && res.length == 1){
					res = res[0];
				}
				if (res.isSyntax){
					res.type = name;
				}else {
					return new Syntax(name, res);
				}
				break;
		}
		return res;
	};
	return Pattern;
})();
module.exports = Pattern;