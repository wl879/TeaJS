module.exports = function(heap, node, params){
	var str, mark;
	str = node.text;
	mark = str.match(/^('{4}|'{3}|'|"{4}|"{3}|"|`)/)[1];
	str = str.slice(mark.length, -mark.length);
	if (/\n/.test(str)){
		str = SText.clip(str);
	}
	if (str && (mark[0] == '"' || mark == '`')){
		str = stringTemplate(mark, str, node);
		if (node.parent.is('Access')){
			str = '('+str+')';
		}
	}else {
		str = stringFormat(mark, str);
	}
	return this.card('String', str);
};
function stringTemplate(mark, str, node){
	var strs, m, ab, temp;
	strs = [];
	while (m = str.match(/(^|[^\\])\$(\w+|\{)\b/)){
		strs.push(stringFormat(mark, str.substr(0, m.index+m[1].length)));
		if (m[2] == '{'){
			ab = SText.indexPair(str, '{', '}', m.index);
			if (ab){
				temp = str.slice(ab[0]+1, ab[1]);
				if (/[^\w\s\$\_]/.test(temp)){
					strs.push('('+temp+')');
				}else {
					strs.push(temp);
				}
				str = str.substr(ab[1]+1);
			}else {
				Tea.error(1120, node);
			}
		}else {
			strs.push(m[2]);
			str = str.substr(m.index+m[0].length);
		}
	}
	if (str){
		strs.push(stringFormat(mark, str));
	}
	str = strs.join('+');
	return str;
};
function stringFormat(mark, str){
	// 转义
	if (mark == '`'){
		str = str.replace(/\\`/g, '`');
	}
	if (mark == '`' || mark == '"""' || mark == "'''"){
		str = SText(str, mark == "'''" ? "'" : '"');
	}
	// 转义引号
	if (mark == '`' || mark == '"""' || mark == '""""'){
		str = str.replace(/(^|[^\\])"/g, '$1\\"');
	}else if (mark == "'''" || mark == "''''"){
		str = str.replace(/(^|[^\\])'/g, ""+1+"\\'");
	}
	switch (mark){
		case '""""':case "''''":case "`":
			// 保留换行符
			str = str.replace(/(^|[^\\])\n/g, '$1\\n');
			str = str.replace(/(^|[^\\])\n/g, '$1\\n');
			break;
		case '"""':case "'''":
			// 保留格式
			str = str.replace(/([^\\]|^)(\\{2,4,6,8})?\\n/g, '$1$2\\n\\\n');
			break;
		case '"':case "'":
			// 不保留换行符			
			str = str.replace(/(^|[^\\])\n\s*/g, '$1');
			break;
	}
	return mark[0] == "'" ? "'"+str+"'" : '"'+str+'"';
};