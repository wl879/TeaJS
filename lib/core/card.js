var Card = (function(){
	var not_semicolon, width_limit;
	not_semicolon = /^(COMMENT|IfStam|WhileStam|DoWhileStam|WithStam|ForStam|SwitchStam|CaseStam|DefaultStam)$/;
	width_limit = 80;
	Card.prototype.isCard = true;
	function Card(type){
		this.type = type || '';
		this.length = 0;
		if (arguments.length > 1){
			this.add.apply(this, Jsop.toArray(arguments, 1));
		}
	};
	Card.prototype.add = function (){
		var type;
		for (var item, i = 0; i < arguments.length; i++){
			item = arguments[i];
			if (!item){
				continue;
			}
			if (item.isToken){
				if (!item.is('EOT')){
					this[this.length++] = item;
				}
				continue;
			}
			type = typeof item;
			if (item.isCard || type == 'string'){
				this[this.length++] = item;
				continue;
			}
			if (type == 'number'){
				this[this.length++] = item+'';
				continue;
			}
			if (isArray(item)){
				this.add.apply(this, item);
				continue;
			}
			throw Error.create(5004, isClass(item), new Error());
		}
		return this;
	};
	Card.prototype.insert = function (pos){
		var args;
		args = Jsop.toArray(arguments, 1);
		for (var i = pos; i < this.length; i++){
			args.push(this[i]);
		}
		this.length = pos;
		this.add.apply(this, args);
		return this;
	};
	Card.prototype.delete = function (a, b){
		if (b == null) b = a;
		Array.prototype.splice.call(this, a, b-a+1);
		return this;
	};
	Card.prototype.__defineGetter__("text", function(){
		return this.toScript();
	});
	Card.prototype.toScript = function (){
		if (!this._formated){
			format(this);
		}
		return toText(this);
	};
	Card.prototype.toList = function (){
		var list;
		list = [];
		for (var item, i = 0; i < this.length; i++){
			item = this[i];
			if (!item) continue;
			if (item.isCard){
				list.push.apply(list, item.toList());
			}else {
				list.push(item);
			}
		}
		return list;
	};
	function toText(list){
		var texts = [];
		for (var item, i = 0; i < list.length; i++){
			item = list[i];
			if (item.isToken){
				if (item.is('EOT')){
					continue;
				}
				texts.push(item.text);
			}else if (item.isCard || isArray(item)){
				texts.push(toText(item));
			}else {
				texts.push(item);
			}
		}
		return texts.join('');
	};
	function countText(card){
		var texts;
		texts = [];
		for (var item, i = 0; i < card.length; i++){
			item = card[i];
			if (!item){
				continue;
			}
			if (item.isToken){
				texts.push(item.text);
			}else if (item.isCard){
				texts.push(countText(item));
			}else {
				texts.push(item);
			}
		}
		return texts.join('');
	};
	function countTextLen(card, limit){
		var len;
		len = 0;
		for (var item, i = 0; i < card.length; i++){
			item = card[i];
			if (limit && len >= limit){
				return len;
			}
			if (item.isToken){
				len += item.text.length;
			}else if (item.isCard || isArray(item)){
				len += countTextLen(item, limit && limit-len);
			}else {
				len += item.length;
			}
		}
		return len;
	};
	function format(card){
		each(card);
		if (card.type == 'Root'){
			if (card.length){
				lineFeed(card);
			}
		}
		return card;
	};
	function each(card){
		var parent;
		parent = card.type;
		for (var item, i = 0; i < card.length; i++){
			item = card[i];
			if (!item){
				continue;
			}
			switch (item.type){
				case 'COMMENT':
					if (Argv['--clear']){
						card[i] = null;
					}
					break;
				case 'ArrayExpr':
					formatArray(item);
					break;
				case 'JsonExpr':
					formatJson(item);
					break;
				case 'VarStam':case 'ConstStam':case 'LetStam':
					formatVar(item);
					break;
				case 'Block':
					if (item.length){
						each(item);
						lineFeed(item, parent);
						indentLine(item, parent);
						if (card.type == 'BlockNode'){
							item.add('\n');
						}else if (typeof card[i+1] == 'string' && /^\s*}/.test(card[i+1])){
							item.add('\n');
						}
					}
					break;
				default:
					if (item.isCard){
						each(item);
					}else if (item == ','){
						card[i] = ', ';
					}
					break;
			}
		}
		return card;
	};
	function lineFeed(card, parent){
		for (var line, i = card.length - 1; i >= 0; i--){
			line = card[i];
			if (line){
				if (!not_semicolon.test(line.type) && parent != 'Block'){
					card.insert(i+1, ';');
				}
				if (i || parent && parent != 'Block'){
					card.insert(i, '\n');
				}
			}
		}
	};
	function indentLine(card, parent){
		for (var item, i = 0; i < card.length; i++){
			item = card[i];
			if (item == '\n'){
				card[i] = '\n\t';
				continue;
			}else if (i === 0 && parent){
				card.insert(0, '\t');
				continue;
			}
			if (item.isToken){
				if (!item.is('STRING')){
					card[i] = item.text.replace(/\n/g, '\n\t');
				}
				continue;
			}
			if (item.isCard){
				indentLine(item);
				continue;
			}
			if (typeof item == 'string'){
				card[i] = item.replace(/\n/g, '\n\t');
			}
		}
		return card;
	};
	function formatArray(card){
		var comma;
		comma = card[1];
		if (comma && comma.type == 'CommaExpr'){
			if (countTextLen(comma, width_limit) >= width_limit){
				for (var i = 0; i < comma.length; i++){
					if (comma[i].isCard){
						each(comma[i]);
					}else if (comma[i] == ', ' || comma[i] == ','){
						comma[i] = ',\n';
					}
				}
				comma.insert(0, '\n');
				indentLine(comma);
				return;
			}
		}
		each(card);
	};
	function formatJson(card){
		var comma;
		comma = card[1];
		if (comma && comma.type == 'CommaExpr'){
			if (countTextLen(comma, width_limit) >= width_limit){
				for (var i = 0; i < comma.length; i++){
					if (comma[i].isCard){
						each(comma[i]);
					}else if (comma[i] == ', ' || comma[i] == ','){
						comma[i] = ',\n';
					}
				}
				comma.insert(0, '\n');
				indentLine(comma);
				return;
			}
		}
		each(card);
	};
	function formatVar(card){
		var comma, text;
		comma = card[1];
		if (comma && comma.type == 'CommaExpr'){
			text = countText(comma);
			if (/\=/.test(text) && text.length >= width_limit){
				for (var i = 0; i < comma.length; i++){
					if (comma[i].isCard){
						each(comma[i]);
					}else if (comma[i] == ', ' || comma[i] == ','){
						comma[i] = ',\n';
					}
				}
				indentLine(comma);
				return;
			}
		}
		each(card);
	};
	return Card;
})();
module.exports = Card;