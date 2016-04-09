var Standard, versions;
Standard = require("./standard.js");
exports.versions = (versions = []);
function create(version, prepor){
	if (!(Standard.hasOwnProperty(version))){
		throw Error.create(5007, version, new Error());
	}
	return new Standard(version, prepor);
};
module.exports.create = create;
function define(name, map){
	var std_obj;
	if (versions.indexOf(name) == -1){
		versions.push(name);
		!Standard[name] && (Standard[name] = {});
	}
	std_obj = compile(map, Standard[name]);
	return std_obj;
};
module.exports.define = define;
function compile(map, std_obj){
	var std, ref;
	for (var names in map){
		if (!map.hasOwnProperty(names)) continue;
		var item = map[names];
		std = _compile(item);
		for (var ref = names.split(' '), name, i = 0; i < ref.length; i++){
			name = ref[i];
			if (!/^[A-Z]/.test(name)){
				throw Error.create(5001, name, new Error());
			}
			std_obj[name] = std;
		}
	}
	return std_obj;
};
module.exports.compile = compile;
function _compile(data){
	var stds;
	stds = {};
	stds.isStandard = true;
	if (typeof data == 'string' || typeof data == 'function'){
		stds['default'] = data;
	}else if (isArray(data)){
		stds = [];
		stds.isStandard = 'list';
		for (var i = 0; i < data.length; i++){
			stds.push(_compile(data[i]));
		}
	}else {
		for (var cond in data){
			if (!data.hasOwnProperty(cond)) continue;
			var val = data[cond];
			if (typeof val == 'object'){
				val = _compile(val);
			}
			stds[cond.replace(/\s*\n\s*/g, ' ')] = val;
		}
	}
	return stds;
};