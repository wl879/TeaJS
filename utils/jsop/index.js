// javascript object parser
var SText, ArrPro;
module.exports = jsop;
SText = require("../stext");
ArrPro = Array.prototype;
function jsop(str){
	var list, json, i, key, val;
	if (/^\[.*?\]$/.test(str)){
		list = SText.split(str.slice(1, -1), /;|,/, true);
		for (var i=0; i < list.length; i++){
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
	for (var _i=0, item; _i < list.length; _i++){
		item = list[_i];
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
}
function data(){
	var json;
	json = {"constructor": undefined,
		"isPrototypeOf": undefined,
		"toString": undefined,
		"toLocaleString": undefined,
		"valueOf": undefined};
	return json;
};
function keys(obj){
	return Object.keys(obj);
};
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
function concat(obj){
	arguments[0] = copy(obj) || {};
	return extend.apply(this, arguments);
};
function extend(obj){
	for (var i=1, arg; i < arguments.length; i++){
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
function copy(obj, deep){
	if (deep == null) deep = 1;
	var clone;
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
function reverse(obj){
	var r;
	r = {};
	for (var key=0, val; key < obj.length; key++){
		val = obj[key];
		if (!r[val]) r[val] = [];
		r[val].push(key);
	}
	return r;
};
function newClass(cls, argus){
	var obj;
	obj = Object.create(cls.prototype);
	if (argus.length){
		cls.apply(obj, argus);
	}
	return obj;
};
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
function isJson(obj){
	return !obj.constructor || obj.constructor.prototype.hasOwnProperty("isPrototypeOf");
};
function isEmpty(obj){
	for (var k in obj){
		if (!obj.hasOwnProperty(k)) continue;
		return false;
	}
	return true;
};
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
function funcName(fn){
	var m;
	if (fn && (m = fn.toString().match(/function\s*(\w+)/))){
		return m[1];
	}
};
module.exports.data = data;
module.exports.keys = keys;
module.exports.toArray = toArray;
module.exports.concat = concat;
module.exports.extend = extend;
module.exports.copy = copy;
module.exports.reverse = reverse;
module.exports.newClass = newClass;
module.exports.eq = eq;
module.exports.isJson = isJson;
module.exports.isEmpty = isEmpty;
module.exports.isClass = isClass;
module.exports.funcName = funcName;