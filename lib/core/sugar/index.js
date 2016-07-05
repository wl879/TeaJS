var public;
var Source = null;
var SugarBox = (function(){
	var Macro = require("./macro.js");
	var Script = require("./script.js");
	var Grammar = require("../grammar");
	var Transform = require("../transform");
	function SugarBox(){
		!Source && (Source = require("../source"));
		this.map = {};
		this._std_ = {};
		this._expr_ = {};
		this._stam_ = {};
		this._sugar_ = {};
		this._macro_ = {};
	};
	SugarBox.prototype.__defineGetter__("length", function(){
		return Object.keys(this.map).length;
	});
	SugarBox.prototype.extend = function (){
		for (var box, i = 0; i < arguments.length; i++){
			box = arguments[i];
			if (!box){
				continue;
			}
			for (var type in box){
				if (!box.hasOwnProperty(type)) continue;
				var data = box[type];
				Jsop.extend(this[type], data);
			}
		}
		return this;
	};
	SugarBox.prototype.add = function (type, name, args, body, location){
		switch (type){
			case 'sugar':case 'expr':case 'stam':
				this.map[name] = type = '_'+type+'_';
				this[type][name] = Grammar.syntax(name, args, type == 'sugar' ? '' : 'package node');
			case 'std':
				this._std_[name] = new Script(body, ['handle', 'node', 'scope']);
				break;
			case 'macro':
				this.map[name] = '_macro_';
				this._macro_[name] = new Macro(name, args, body, location);
				break;
		}
	};
	SugarBox.prototype.undef = function (){
		for (var name, i = 0; i < arguments.length; i++){
			name = arguments[i];
			name = name.trim();
			if (this.map[name]){
				delete this[this.map[name]][name];
				delete this.map[name];
				delete this._std_[name];
			}
		}
	};
	SugarBox.prototype.get = function (name, limit){
		var mark;
		mark = name.match(/^(#*)/)[1];
		if (mark){
			name = name.substr(mark.length);
		}
		if (limit){
			limit = '_'+limit+'_';
			if (this[limit].hasOwnProperty(name)){
				return this[limit][name];
			}
			if (public[limit].hasOwnProperty(name)){
				return public[limit][name];
			}
		}
		if (this.map.hasOwnProperty(name)){
			return this[this.map[name]][name];
		}
		if (public.map.hasOwnProperty(name)){
			return public[public.map[name]][name];
		}
	};
	SugarBox.prototype.isSugarBox = true;
	return SugarBox;
})();
module.exports = SugarBox;
module.exports.public = (public = new SugarBox());
function define(sugar){
	!Source && (Source = require("../source"));
	if (typeof sugar == 'string'){
		if (Fp.isPath(sugar)){
			Source.lexer(null, sugar, public);
		}else {
			Source.lexer(sugar, null, public);
		}
	}else if (sugar){
		public.extend(sugar);
	}
};
module.exports.define = define;
function box(extend){
	box = new SugarBox();
	if (extend){
		if (extend.isSource){
			box.extend(extend.sugarBox);
		}else {
			box.extend(extend);
			box.parent = extend;
		}
	}
	return box;
};
module.exports.box = box;