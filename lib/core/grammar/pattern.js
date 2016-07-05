var Pattern = (function(){
	var Asset = require("./asset.js");
	var cache = Jsop();
	function Pattern(str){
		var m, or_list, asset_list, patt;
		this.length = 0;
		this.minLimit = 0;
		if (str){
			if (m = str.match(/^\(\?(debug)\)/)){
				this.debug = true;
				str = str.substr(m[0].length);
			}
			this.string = str;
			or_list = splitPattern(str);
			if (or_list.length == 1){
				this.type = 'Pattern';
				asset_list = or_list[0];
				for (var i = 0; i < asset_list.length; i++){
					this.add(Asset.compile(asset_list[i]));
				}
			}else {
				this.type = 'Or';
				for (var asset_list, j = 0; j < or_list.length; j++){
					asset_list = or_list[j];
					patt = new Pattern();
					patt.string = asset_list.join(' ');
					for (var i = 0; i < asset_list.length; i++){
						patt.add(Asset.compile(asset_list[i]));
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
			if (asset.isSyntaxPattern){
				if (asset.minLimit){
					this.minLimit = 1;
				}
			}else {
				this.minLimit += !asset.config.mode || asset.config.mode[0] == '+' ? 1 : 0;
			}
		}
		return this;
	};
	Pattern.prototype.exec = function (handle, src, init){
		var heap, debug_log, start_index, res;
		heap = handle.heap;
		debug_log = heap.log([this]);
		start_index = src.index;
		if (this.type == 'Or'){
			res = parseOrPattern(handle, this, src, init);
		}else {
			res = parsePattern(handle, this, src, init);
		}
		debug_log && debug_log.push(res, start_index, src.index);
		if (res){
			return res.isEmpty ? res : checkPack(handle, this, res, null);
		}
		src.index = start_index;
		return false;
	};
	Pattern.prototype.isSyntaxPattern = true;
	Pattern.compile = function(str){
		if (!cache[str]){
			return cache[str] = new Pattern(str);
		}
		return cache[str];
	};
	function splitPattern(str){
		var or_list;
		str = str.replace(/\s+(→)/g, '$1');
		or_list = SText.split(str, '|');
		for (var item, i = 0; i < or_list.length; i++){
			item = or_list[i];
			or_list[i] = SText.split(item, ' ', true);
		}
		return or_list;
	};
	/**
	     * 
	     */
	function parseOrPattern(handle, patts, src, init){
		var start_index, debug_log, res;
		start_index = src.index;
		for (var patt, i = 0; i < patts.length; i++){
			patt = patts[i];
			debug_log = handle.heap.log([patt]);
			src.index = start_index;
			res = parsePattern(handle, patt, src, init);
			debug_log && debug_log.push(res, start_index, src.index);
			if (res){
				return res;
			}
		}
	};
	function parsePattern(handle, patt, src, init){
		var match_cache, start_index, valid_index, step_index, ref, config;
		match_cache = [];
		match_cache.matched = 0;
		match_cache.ignored = 0;
		start_index = src.index;
		valid_index = start_index;
		init && handle.setHeap('matchcache', match_cache);
		for (var asset, i = 0; i < patt.length; i++){
			asset = patt[i];
			step_index = src.index;
			ref = asset.exec(handle, src);
			config = asset.config;
			if (ref){
				if ('!' == config.mode){
					return config.error && handle.throw(config.error, src.current);
				}
				match_cache.matched++;
				if ((config.test || ref.isTest) && '?' != config.mode){
					checkPack(handle, asset, ref, match_cache);
					src.index = step_index;
					continue;
				}
				if ('*' == config.mode || '+' == config.mode){
					ref = matchMore(handle, asset, src, ref, config.smallest ? patt[i+1] : null);
				}
				if (ref === true){
					checkPack(handle, asset, ref, match_cache);
					valid_index = src.index;
					match_cache.ignored++;
					continue;
				}
				valid_index = src.index;
				if (!ref.isEmpty){
					src.next(!config.lf);
				}
				if (config.ig){
					checkPack(handle, asset, ref, match_cache);
					match_cache.ignored++;
					continue;
				}
				checkPack(handle, asset, ref, match_cache, true);
			}else {
				if ('?' == config.mode || '*' == config.mode){
					src.index = step_index;
					checkPack(handle, asset, false, match_cache, true);
					if (config.test){
						break;
					}
					continue;
				}
				if ('!' == config.mode){
					src.index = step_index;
					checkPack(handle, asset, false, match_cache, true);
					continue;
				}
				if (asset.type == 'Group' && asset.value.minLimit == 0){
					src.index = step_index;
					continue;
				}
				return config.error && handle.throw(config.error, src[step_index]);
			}
		}
		src.index = valid_index;
		if (match_cache.matched){
			if (match_cache.length === 0 && start_index === src.index && match_cache.ignored === 0){
				match_cache.isEmpty = true;
				if (patt.length == 1 && patt[0].config.test){
					match_cache.isTest = true;
				}
			}
			return match_cache;
		}
	};
	function matchMore(handle, asset, src, res, next_asset){
		var step_index, res_list;
		step_index = src.index;
		res_list = res.isNode || res.isToken ? [res] : res;
		while (res = matchNext(handle, asset, src, next_asset)){
			if (step_index == src.index){
				return res_list;
			}
			step_index = src.index;
			if (res_list === true){
				continue;
			}
			if (res.isNode || res.isToken){
				res_list.push(res);
			}else if (res.length){
				res_list.push.apply(res_list, res);
			}
		}
		src.index = step_index;
		return res_list;
	};
	function matchNext(handle, asset, src, next_asset){
		var start_index, ref, res;
		start_index = src.index;
		if (next_asset){
			handle.tryMode = true;
			src.next(!asset.config.lf);
			ref = next_asset.exec(handle, src);
			handle.tryMode = false;
		}
		src.index = start_index;
		if (!ref){
			src.next(!asset.config.lf);
			if (res = asset.exec(handle, src)){
				return res;
			}
		}
		src.index = start_index;
		return false;
	};
	function checkPack(handle, asset, res, match_cache, do_add){
		var heap, config, pack_name, root_match_cache, text, token;
		heap = handle.heap;
		config = asset.config || heap.packMode && heap.syntax == asset && {"packName": heap.packName, "packMode": heap.packMode};
		pack_name = config && config.packName;
		if (pack_name){
			if (!res){
				if (config.packMode == 'check empty'){
					res = handle.node(pack_name);
				}
			}else {
				switch (config.packMode){
					case 'package matched':
						root_match_cache = heap.matchcache;
						if (root_match_cache.length){
							if (match_cache && root_match_cache != match_cache){
								root_match_cache[0] = handle.node(pack_name, root_match_cache, match_cache, res);
								match_cache.length = 0;
							}else {
								root_match_cache[0] = handle.node(pack_name, root_match_cache, res);
							}
							root_match_cache.length = 1;
						}
						return true;
					case 'rename pattern':
						heap.packMode = 'rename pack';
						heap.packName = pack_name;
						break;
					case 'pattern name':
						heap.packMode = 'package node';
						heap.packName = pack_name;
						break;
					case 'check pack':
						if (res && !res.isNode && res.length > 1){
							res = handle.node(pack_name, res);
						}
						break;
					case 'package node':
						if (!res.isNode && res.length == 1 && res[0].isNode && res[0].type == pack_name){
							res = res[0];
						}else if (!res.isNode || res.type != pack_name){
							res = handle.node(pack_name, res);
						}
						break;
					case 'rename pack':
						if (!res.isNode && res.length == 1){
							res = res[0];
						}
						if (res.isNode){
							res.type = pack_name;
						}else {
							res = handle.node(pack_name, res);
						}
						break;
					case 'to token':
						if (!res.isToken){
							text = '';
							for (var i = 0; i < res.length; i++){
								text += res[i].text;
							}
							token = res[0].clone(text, [pack_name, 'CONST']);
							token.location.code = token.text;
							token.location.end = res[res.length-1].location.end;
							res = token;
						}
						break;
				}
			}
		}
		if (do_add && res && match_cache){
			if (res.isNode || res.isToken){
				match_cache.push(res);
			}else if (res.length){
				match_cache.push.apply(match_cache, res);
			}
		}
		return res;
	};
	return Pattern;
})();
module.exports = Pattern;