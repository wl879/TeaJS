var Fs, Path, dirName, baseName, extName, name, join;
Fs = require("fs");
Path = require("path");
module.exports.dirName = (dirName = Path && Path.dirname);
module.exports.baseName = (baseName = Path && Path.basename);
module.exports.extName = (extName = Path && Path.extname);
module.exports.name = (name = Path && function(to){return Path.parse(to).name});
module.exports.join = (join = Path && Path.join);
function split(to){
	return Path.parse(to);
};
module.exports.split = split;
function relative(from, to){
	if (from){
		to = Path.relative(from, to);
		if (!/^[\/\.]/.test(to)){
			to = './'+to;
		}
	}
	return to;
};
module.exports.relative = relative;
function resolve(from, to, exts){
	var path;
	if (!to){
		to = from, from = null;
	}else if (to === true){
		exts = to, to = from, from = null;
	}
	to = to.replace(/^`+|^'+|^"+|"+$|'+$|`+$/g, '').trim();
	if (!/^(\~|\/|\.)/.test(to)){
		to = './'+to;
	}
	path = from ? Path.resolve(from, to) : Path.resolve(to);
	if (Array.isArray(exts)){
		if (!isFile(path)){
			for (var ext, i = 0; i < exts.length; i++){
				ext = exts[i];
				if (isFile(path+ext)){
					path = path+ext;
					break;
				}
			}
		}
	}else if (exts && /\/$/.test(to)){
		path += '/';
	}
	return path;
};
module.exports.resolve = resolve;
function isPath(text){
	// var winpath = /^[a-zA-Z];[\\/]((?! )(?![^\\/]*\s+[\\/])[\w -]+[\\/])*(?! )(?![^.]+\s+\.)[\w -]+$/; 
	// var lnxPath = /^([\/] [\w-]+)*$/; 
	return /^([^\*\s]|\\[ \t])*(\/([^\*\s]|\\[ \t])+)+$/.test(text);
};
module.exports.isPath = isPath;
function isExist(to){
	return Fs.existsSync(to);
};
module.exports.isExist = isExist;
function isFile(to){
	return Fs.existsSync(to) && Fs.statSync(to).isFile();
};
module.exports.isFile = isFile;
function isDir(to){
	return Fs.existsSync(to) && Fs.statSync(to).isDirectory();
};
module.exports.isDir = isDir;
/**
 * 
 */
function scanDir(to, filter, deep, reverse){
	var res;
	res = scanPath(to, filter, deep, reverse);
	return getherDirs(res.dirs);
};
module.exports.scanDir = scanDir;
function scanFile(to, filter, deep, reverse){
	var res;
	res = scanPath(to, [null, filter], deep, reverse);
	return getherFiles(res);
};
module.exports.scanFile = scanFile;
function scanPath(to, filter, deep, reverse){
	var res, dir_filter, file_filter, dir_list;
	res = {"files": [], "dirs": {}};
	if (typeof filter == 'number'){
		reverse = deep, deep = filter, filter = null;
	}
	if (Array.isArray(filter)){
		dir_filter = filter[0];
		file_filter = filter[1];
	}else {
		dir_filter = filter;
		file_filter = filter;
	}
	dir_filter = wildcard(dir_filter, true);
	file_filter = wildcard(file_filter, true);
	if (isFile(to)){
		res.files.push(to);
		return res;
	}
	if (!isDir(to)){
		return res;
	}
	dir_list = Fs.readdirSync(to);
	for (var tmp, i = 0; i < dir_list.length; i++){
		tmp = dir_list[i];
		tmp = Path.join(to, tmp);
		if (Fs.statSync(tmp).isDirectory()){
			if (testFilter(dir_filter, tmp, reverse)){
				continue;
			}
			if (deep){
				res.dirs[tmp] = scanPath(tmp, filter, deep-1, reverse);
			}else {
				res.dirs[tmp] = 0;
			}
		}else {
			if (testFilter(file_filter, tmp, reverse)){
				continue;
			}
			res.files.push(tmp);
		}
	}
	return res;
};
module.exports.scanPath = scanPath;
function checkFiles(to, from, def_file){
	var res, files, dirs, file;
	if (Array.isArray(from)){
		def_file = from, from = null;
	}
	res = checkPath(to, from);
	files = res.files;
	if (res.error){
		files.error = res.error;
	}else if (def_file && !files.length && res.dirs.length){
		dirs = res.dirs;
		for (var dir, i = 0; i < dirs.length; i++){
			dir = dirs[i];
			for (var name, j = 0; j < def_file.length; j++){
				name = def_file[j];
				file = Path.join(dir, name);
				if (isFile(file)){
					files.push(file);
				}
			}
		}
	}else {
		for (var file, i = files.length - 1; i >= 0; i--){
			file = files[i];
			if (/\/\..+$/.test(file)){
				files.splice(i, 1);
			}
		}
	}
	return files;
};
module.exports.checkFiles = checkFiles;
function checkDirs(to, from){
	var res, dirs;
	res = checkPath(to, from);
	dirs = res.dirs;
	if (res.error){
		dirs.error = res.error;
	}
	return dirs;
};
module.exports.checkDirs = checkDirs;
function checkPath(to, from){
	var res, names, len, dirs, files, wc, tmp, scan;
	to = resolve(from, to, true);
	res = {"files": [], "dirs": []};
	if (isDir(to)){
		res.dirs.push(to);
		return res;
	}
	if (isFile(to)){
		res.files.push(to);
		return res;
	}
	names = to.split('/');
	len = names.length-1;
	dirs = [''];
	files = [];
	for (var name, i = 0; i < names.length; i++){
		name = names[i];
		if (!name && i != 0){
			break;
		}
		wc = wildcard(name);
		tmp = [];
		for (var dir, j = 0; j < dirs.length; j++){
			dir = dirs[j];
			if (wc){
				scan = scanPath(dir, wc);
				tmp.push.apply(tmp, Object.keys(scan.dirs));
				if (i == len){
					files = scan.files;
				}
				continue;
			}else {
				if (isDir(dir+name+'/')){
					tmp.push(dir+name+'/');
				}
				if (i == len && isFile(dir+name)){
					files.push(dir+name);
				}
			}
		}
		dirs = tmp;
		if (!dirs.length && !files.length){
			res.error = {};
			res.error.path = names.slice(0, i+1).join('/');
			res.error.msg = 'Dir "'+res.error.path+'" is not exist!';
			break;
		}
	}
	res.dirs = dirs;
	res.files = files;
	return res;
};
module.exports.checkPath = checkPath;
/**
 * 
 */
function writeFile(content, file, encoding){
	var dir;
	dir = Path.dirname(file);
	!isDir(dir) && mkdir(dir, 0755);
	return Fs.writeFileSync(file, content, encoding || 'utf8');
};
module.exports.writeFile = writeFile;
function readFile(file, encoding, linenum){
	var text;
	if (typeof encoding == 'number'){
		linenum = encoding, encoding = 'utf-8';
	}
	if (isFile(file)){
		text = Fs.readFileSync(file, encoding || 'utf-8');
		if (linenum){
			text = readLine(text, linenum);
		}
		return text;
	}
};
module.exports.readFile = readFile;
function readLine(text, something){
	var lines;
	if (typeof something == 'number'){
		lines = text.split('\n');
		return lines[something-1];
	}
	if (typeof something == 'string'){
		if (index == text.indexOf(something)){
			if (index >= 0){
				return indexLine(text, text.indexOf(something))[0];
			}
		}
	}
};
module.exports.readLine = readLine;
function mkdir(to, mode){
	var base_dir;
	if (!Fs.existsSync(to)){
		base_dir = Path.dirname(to);
		if (!Fs.existsSync(base_dir)){
			mkdir(base_dir, mode);
		}
		return Fs.mkdirSync(to, mode || 0755);
	}
};
module.exports.mkdir = mkdir;
/**
 * 
 */
function wildcard(str, force){
	if (!str || str instanceof RegExp){
		return str;
	}
	if (force || /([^\\]|^)[\*\?]/.test(str)){
		str = str.replace(/\./g, '\\.');
		str = str.replace(/([^\\]|^)\?/g, '$1.');
		str = str.replace(/([^\\]|^)\*/g, '$1.*?');
		try {
			return new RegExp('^'+str+'$');
		} catch (_e){};
	}
};
function testFile(to, names){
	if (names && names.length){
		for (var name, i = 0; i < names.length; i++){
			name = names[i];
			name = Path.join(to, name);
			if (isFile(name)){
				return name;
			}
		}
	}else if (isFile(to)){
		return to;
	}
};
function testFilter(filter, path, reverse){
	if (filter && (reverse ? filter.test(path) : !filter.test(path))){
		return true;
	}
	return false;
};
function getherDirs(dirs){
	var list;
	list = [];
	for (var dir in dirs){
		if (!dirs.hasOwnProperty(dir)) continue;
		list.push(dir);
		list.push.apply(list, getherDirs(dirs[dir].dirs));
	}
	return list;
};
function getherFiles(res){
	var list;
	list = res.files.slice();
	if (res.dirs){
		for (var dir in res.dirs){
			if (!res.dirs.hasOwnProperty(dir)) continue;
			var data = res.dirs[dir];
			list.push.apply(list, getherFiles(data));
		}
	}
	return list;
};
if (!Path || !Fs){
	console.error('Fp module load fail!');
	module.exports = null;
}