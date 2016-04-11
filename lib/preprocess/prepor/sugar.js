var Sugar = (function(){
	var Template, Grammar;
	Template = require("../template.js");
	Grammar = require("../../core/grammar");
	function Sugar(type, name, pattern, body, location){
		this.type = type;
		this.name = name;
		this.pattern = pattern;
		this.bodys = Template.create(body, ['std', 'node', 'scope']);
		this.location = location;
	};
	Sugar.prototype.parse = function (parser, tar, params){
		var index, node, scope, patt;
		if (tar.isSource){
			index = tar.index;
			if (node = parser.pattern(this.pattern, tar, params, this.type == 'expr' || this.type == 'stam' ? this.name : null)){
				return node;
			}
			tar.index = index;
		}else if (tar.isNode){
			scope = tar.scope;
			patt = '';
			for (var item, i = 0; i < this.bodys.length; i++){
				item = this.bodys[i];
				if (typeof item == 'function'){
					item = item.apply(this, [parser, tar, scope]);
				}
				if (typeof item == 'string'){
					patt += item;
				}else if (item){
					return item;
				}
			}
			patt = patt.trim();
			return parser.pattern(patt, tar);
		}
	};
	Sugar.prototype.error = function (){
		throw Error.create(this.location, new Error());
	};
	return Sugar;
})();
module.exports = Sugar;