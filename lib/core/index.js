var Tea = (function(){
	var Token = require("./token.js");
	var Node = require("./node.js");
	var Source = require("./source");
	var SourceMap = require("./sourcemap.js");
	var Scope = require("./scope.js");
	var Card = require("./card.js");
	var Grammar = require("./grammar");
	var Transform = require("./transform");
	var Sugar = require("./sugar");
	var Heap = require("./heap.js");
	function Tea(file, text, sugar_box, std){
		this.fileName = file || '';
		this.sugarBox = Sugar.box(sugar_box);
		this.standard = std || 'es5';
		this.grammar = 'tea';
		this.heap = 0;
		if (text){
			if (text.isSource){
				this.source = text;
			}else {
				this.fileText = text;
			}
		}else {
			this.fileText = file && Fp.readFile(file);
		}
	};
	Tea.prototype.__defineSetter__("grammar", function(version){
		this.__grammar__ = typeof version == 'string' ? Grammar.cache['tea'] : version;
		return this.__grammar__;
	});
	Tea.prototype.__defineGetter__("grammar", function(){
		return this.__grammar__ || (this.__grammar__ = Grammar.cache['tea']);
	});
	Tea.prototype.__defineSetter__("standard", function(version){
		this.__standard__ = typeof version == 'string' ? Transform.cache[version] : version;
		return this.__standard__;
	});
	Tea.prototype.__defineGetter__("standard", function(){
		return this.__standard__;
	});
	Tea.prototype.__defineSetter__("source", function(src){
		var sugar_box, macro;
		sugar_box = this.sugarBox;
		if (src.sugarBox.length){
			sugar_box.extend(src.sugarBox);
		}
		this.__source__ = src;
		for (var token, i = 0; i < src.length; i++){
			token = src[i];
			if (token){
				switch (token.type){
					case 'IDENTIFIER':
						if (macro = sugar_box.get(token.text, 'macro')){
							macro.exec(this, src, i);
						}
						break;
					case 'TAG':
						if (macro = sugar_box.get(token.text.substr(1), 'macro')){
							macro.exec(this, src, i);
						}
						break;
				}
			}
		}
		this.__source__.refresh(0);
		return this.__source__;
	});
	Tea.prototype.__defineGetter__("source", function(){
		var src;
		if (!this.__source__){
			src = Source.create(this.fileText, this.fileName);
			this.source = src;
		}
		return this.__source__;
	});
	Tea.prototype.__defineGetter__("scope", function(){
		if (!this.nodeTree.scope){
			return Scope.init(this.nodeTree);
		}
		return this.nodeTree.scope;
	});
	Tea.prototype.__defineGetter__("nodeTree", function(){
		if (!this.__nodeTree__){
			this.source.refresh(0);
			this.heap = 0;
			this.__nodeTree__ = this.parse('Root');
		}
		return this.__nodeTree__;
	});
	Tea.prototype.__defineGetter__("cardTree", function(){
		if (!this.__cardTree__){
			Scope.init(this.nodeTree);
			this.heap = 0;
			this.__cardTree__ = this.transform(this.nodeTree);
		}
		return this.__cardTree__;
	});
	Tea.prototype.token = function (text, index, loc){
		return Token.create(text, index, loc);
	};
	Tea.prototype.node = function (){
		return Jsop.newClass(Node, arguments);
	};
	Tea.prototype.card = function (){
		return Jsop.newClass(Card, arguments);
	};
	/**
	     * resolver
	     */
	Tea.prototype.argv = function (name, value){
		!this.__argv__ && (this.__argv__ = {});
		if (arguments.length > 1){
			return this.__argv__[name] = value;
		}
		if (this.__argv__.hasOwnProperty(name)){
			return this.__argv__[name];
		}
		return Tea.argv[name];
	};
	Tea.prototype.initHeap = function (id, sets){
		this.heap = new Heap(id, this.heap, this);
		if (sets){
			this.heap.set(sets);
		}
		return this.heap;
	};
	Tea.prototype.didHeap = function (result, callback){
		var heap;
		heap = this.heap;
		result = heap.did(result, callback);
		this.heap = heap.parent;
		return result;
	};
	Tea.prototype.setHeap = function (name, value){
		return this.heap.set(name, value);
	};
	Tea.prototype.getHeap = function (name){
		return this.heap.get(name);
	};
	/**
	     * grammar part
	     */
	Tea.prototype.parse = function (syntax, params, name, mode){
		return Grammar.parse(this, syntax, params, name, mode);
	};
	/**
	     * transform part
	     */
	Tea.prototype.transform = function (std, node, params){
		return Transform.parse(this, std, node, params);
	};
	/**
	     *
	     */
	Tea.prototype.sourcemap = function (file){
		var map;
		map = new SourceMap();
		map.sourceRoot = this.fileName;
		map.parse(this.cardTree);
		if (file){
			map.file = file;
			Fp.writeFile(map.text, Fp.resolve(Fp.dirName(this.fileName), file), 'UTF-8');
		}
		return map;
	};
	Tea.prototype.output = function (file, map){
		var script;
		script = this.cardTree.text;
		if (file){
			file = Fp.resolve(Fp.dirName(this.fileName), file);
		}
		if (map){
			map = Fp.resolve(Fp.dirName(file), typeof map == 'string' ? map : file+'.map');
			script += '\n\n//# sourceMappingURL='+(file ? Fp.relative(Fp.dirName(file), map) : map);
			this.sourcemap(map);
		}
		if (file){
			Fp.writeFile(script, file, 'UTF-8');
		}
		return script;
	};
	/**
	     *
	     */
	Tea.define = function(type, name, value){
		var names, values;
		switch (type){
			case 'token':
				names = Array.isArray(name) ? name : name.split(' ').filter(function($){return $});
				values = Array.isArray(value) ? value : SText.split(value, ' ', null, true, false).filter(function($){return $});
				Token.define(names, values);
				break;
			case 'node':
				names = Array.isArray(name) ? name : name.split(' ').filter(function($){return $});
				values = Array.isArray(value) ? value : SText.split(value, ' ', null, true, false).filter(function($){return $});
				Node.define(names, values);
				break;
			case 'scope':
				if (Array.isArray(value)){
					for (var i = 0; i < value.length; i++){
						Scope.define(name, value[i]);
					}
				}else {
					Scope.define(name, value);
				}
				break;
			case 'sugar':
				Sugar.define(name);
				break;
			case 'syntax':
				Grammar.define('tea', name, value);
				break;
			default:
				Transform.define(type, name, value);
				break;
		}
	};
	Tea.prototype.throw = function(msg, target, asset){
		if (!msg || this.tryMode){
			return false;
		}
		if (msg === '∆'){
			msg = 1100;
		}
		Tea.error(msg, target, this.heap.stack(asset));
	};
	return Tea;
})();
module.exports = Tea;