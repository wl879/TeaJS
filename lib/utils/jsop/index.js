// javascript object parser
var SText, ArrPro;
module.exports = jsop;
SText = require("../stext");
ArrPro = Array.prototype;
function jsop(str){
	var list, json, i, key, val;
	if (/^\[.*?\]$/.test(str)){
		list = SText.split(str.slice(1, -1), /;|,/, true);
		for (var i = 0; i < list.length; i++){
			if (/(\d+)(\.\d*)?|false|true|null|undefined/.test(list[i])){
				list[i] = eval('('+list[i]+')');
			}
		}
		return list;
	}
	if (/^\{.*?\}$/.test(str)){
		str = str.slice(1, -1);
	}
	list = SText.split(str, /;|,/, true);
	json = {};
	for (var item, j = 0; j < list.length; j++){
		item = list[j];
		i = item.indexOf(':');
		if (i > 0){
			key = item.substr(0, i).trim();
			val = item.substr(i+1).trim();
			if (/^\[.*?\]$|^\{.*?\}$/.test(val)){
				val = jsop(val);
			}
		}else {
			key = item;
			val = true;
		}
		json[key] = val;
	}
	return json;
};
function data(){
	var json;
	json = {
		"constructor": undefined,
		"isPrototypeOf": undefined,
		"toString": undefined,
		"toLocaleString": undefined,
		"valueOf": undefined};
	return json;
};
module.exports.data = data;
function keys(obj){
	return Object.keys(obj);
};
module.exports.keys = keys;
function toArray(obj, start, end){
	var temp;
	if (obj.length == null){
		temp = [];
		for (var key in obj){
			if (!obj.hasOwnProperty(key)) continue;
			temp.push(obj[key]);
		}
		obj = temp;
	}
	return ArrPro.slice.call(obj, start, end);
};
module.exports.toArray = toArray;
function concat(obj){
	arguments[0] = copy(obj) || {};
	return extend.apply(this, arguments);
};
module.exports.concat = concat;
function extend(obj){
	for (var arg, i = 1; i < arguments.length; i++){
		arg = arguments[i];
		if (arg){
			for (var k in arg){
				if (!arg.hasOwnProperty(k)) continue;
				obj[k] = arg[k];
			}
		}
	}
	return obj;
};
module.exports.extend = extend;
function copy(obj, deep){
	var clone;
	if (deep == null) deep = 1;
	if (typeof obj == 'object'){
		if (Array.isArray(obj)){
			clone = [];
		}else {
			clone = {};
			if (clone.prototype != obj.prototype){
				clone.prototype = obj.prototype;
				clone.constructor = obj.constructor;
			}
		}
		for (var key in obj){
			if (!obj.hasOwnProperty(key)) continue;
			clone[key] = deep ? copy(obj[key], deep-1) : obj[key];
		}
		return clone;
	}else {
		return obj;
	}
};
module.exports.copy = copy;
function reverse(obj){
	var r;
	r = {};
	for (var val, key = 0; key < obj.length; key++){
		val = obj[key];
		!r[val] && (r[val] = []);
		r[val].push(key);
	}
	return r;
};
module.exports.reverse = reverse;
function newClass(cls, argus){
	var obj;
	obj = Object.create(cls.prototype);
	if (argus.length){
		cls.apply(obj, argus);
	}
	return obj;
};
module.exports.newClass = newClass;
function eq(obj1, obj2){
	if (obj1 == obj2){
		return true;
	}
	if (!(typeof obj1 == 'object')){
		return false;
	}
	if (obj1.constructor != obj2.constructor){
		return false;
	}
	for (var k in obj1){
		if (!obj1.hasOwnProperty(k)) continue;
		if (eq(obj1[k], obj2[k]) == false){
			return false;
		}
	}
	return true;
};
module.exports.eq = eq;
function isJson(obj){
	return !obj.constructor || obj.constructor.prototype.hasOwnProperty("isPrototypeOf");
};
module.exports.isJson = isJson;
function isEmpty(obj){
	for (var k in obj){
		if (!obj.hasOwnProperty(k)) continue;
		return false;
	}
	return true;
};
module.exports.isEmpty = isEmpty;
function isClass(obj, class_name){
	var name;
	if (obj && obj.constructor){
		if (class_name && typeof class_name != 'string'){
			return obj.constructor == class_name;
		}
		if (obj.constructor.toString){
			if (name = funcName(obj.constructor)){
				return class_name ? class_name == name : name;
			}
		}
	}
	return undefined;
};
module.exports.isClass = isClass;
function funcName(fn){
	var m;
	if (fn && (m = fn.toString().match(/function\s*(\w+)/))){
		return m[1];
	}
};
module.exports.funcName = funcName;