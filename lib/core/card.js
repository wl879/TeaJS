var Node;
Node = require("./node.js");
var width_limit = 80;
var Card = (function(){
	function Card(type){
		this.type = type || '';
		this.length = 0;
		if (arguments.length > 1){
			this.add.apply(this, Jsop.toArray(arguments, 1));
		}
	};
	Card.prototype = Object.create(Node.NodeObj.prototype);
	Card.prototype.__super__ = Node.NodeObj.prototype;
	Card.prototype.constructor = Card;
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
			if (item.isCard){
				if (item.type == 'List'){
					this.add.apply(this, Jsop.toArray(item));
					continue;
				}
				this[this.length++] = item;
				continue;
			}
			type = typeof item;
			if (type == 'boolean'){
				continue;
			}
			if (type == 'string'){
				this[this.length++] = item;
				continue;
			}
			if (type == 'number'){
				this[this.length++] = item+'';
				continue;
			}
			if (Array.isArray(item)){
				this.add.apply(this, item);
				continue;
			}
			Tea.error(5004);
		}
		return this;
	};
	Card.prototype.copy = function (card){
		this.type = card.type;
		for (var item, i = 0; i < card.length; i++){
			item = card[i];
			this[this.length++] = item;
		}
		return this;
	};
	Card.prototype.__defineGetter__("text", function(){
		if (!this.__formatted__){
			formatCard(this);
		}
		var texts = [];
		for (var item, i = 0; i < this.length; i++){
			item = this[i];
			if (!item){
				continue;
			}
			if (item.isToken){
				if (item.is('EOT')){
					continue;
				}
				texts.push(item.alias || item.text);
			}else if (item.isCard){
				texts.push(item.text);
			}else {
				texts.push(item == ',' ? ', ' : item);
			}
		}
		return texts.join('');
	});
	Card.prototype.isCard = true;
	function formatCard(card){
		var head, body, foot;
		card.__formatted__ = true;
		switch (card.type){
			case 'JsonExpr':case 'ArrayExpr':
				formatJsonAndArray(card);
				break;
			case 'VarDecl':case 'ConstDecl':case 'LetDecl':
				formatVarDecl(card);
				break;
			case 'Line':
				card.insert(0, '\n');
				break;
			case 'Root':
				if (card.length == 3){
					head = card[0], body = card[1], foot = card[2];
					if (head.length || foot.length){
						body = card;
					}
				}else {
					body = card;
				}
				if (body.length == 1 && (body[0].type == 'JsonExpr' || body[0].type == 'ArrayExpr')){
					card.__formatted__ = true;
					break;
				}
				formatLineFeed(card);
				break;
			case 'BlockNode':case 'BlockStam':
				if (!checkEmpty(card, 1, -2)){
					if (card[0] == '{'){
						card.insert(1, '\n');
						formatLineFeed(card, 2, -2);
						formatLineIndent(card);
						card.insert(-1, '\n');
					}else {
						card.insert(0, '\n');
						formatLineFeed(card);
						formatLineIndent(card);
					}
				}
				break;
			case 'SwitchNode':
				if (card.length){
					card.insert(0, '\n');
					formatLineFeed(card);
					formatLineIndent(card);
					card.add('\n');
				}
				break;
			case 'HeadNode':case 'BodyNode':case 'FootNode':
				if (card.length){
					formatLineFeed(card);
				}
				break;
		}
		return card;
	};
	function formatLineFeed(card, start, end){
		var sub;
		if (start == null) start = 0;
		if (end == null) end = card.length-1;
		if (end < 0){
			end = card.length+end;
		}
		for (var i=start; i <= end; i++){
			if ((sub = card[i]) && (sub.length || sub.isToken)){
				if (!/^(HeadNode|FootNode|BodyNode|COMMENT|IfStam|WhileStam|WithStam|ForStam|SwitchStam|CaseStam|DefaultStam)$/.test(sub.type) && !/^(\n|\{|\}|;)$/.test(sub)){
					end++;
					card.insert(++i, ';');
				}
				if (i == end){
					break;
				}
				if (!/\n$/.test(sub) && card[i+1] && (card[i+1].length || card[i+1].isToken)){
					end++;
					card.insert(++i, '\n');
				}
			}
		}
		return card;
	};
	function formatLineIndent(card, start, end){
		var item;
		if (start == null) start = 0;
		if (end == null) end = card.length-1;
		if (card.type == 'String'){
			return card;
		}
		for (var i=start; i <= end; i++){
			if (!(item = card[i])){
				continue;
			}
			if (item.isToken){
				if (item.is('STRING')){
					continue;
				}
				item.text = item.text.replace(/\n/g, '\n\t');
				continue;
			}
			if (item.isCard){
				formatLineIndent(item.__formatted__ ? item : formatCard(item));
				continue;
			}
			card[i] = item.replace(/\n/g, '\n\t');
		}
		return card;
	};
	function formatJsonAndArray(card){
		if (countTextLen(card, width_limit) >= width_limit){
			for (var i = 0; i < card.length; i++){
				if (card[i] == ', ' || card[i] == ','){
					card[i] = ',\n';
				}
			}
			card.insert(1, '\n');
			formatLineIndent(card);
			card.insert(-1, '\n');
		}
	};
	function formatVarDecl(card){
		var text;
		text = countText(card);
		if (/\=/.test(text) && text.length >= width_limit){
			for (var i = 0; i < card.length; i++){
				if (card[i] == ', ' || card[i] == ','){
					card[i] = ',\n';
				}
			}
			formatLineIndent(card);
		}
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
			}else if (item.isCard || Array.isArray(item)){
				len += countTextLen(item, limit && limit-len);
			}else {
				len += item.length;
			}
		}
		return len;
	};
	function checkEmpty(card, start, end){
		if (start == null) start = 0;
		if (!card.length && !card.isToken){
			return true;
		}
		if (end < 0){
			end = card.length+end;
		}else {
			end = end || card.length-1;
		}
		for (var i=start; i <= end; i++){
			if (card[i].length || card[i].isToken){
				return false;
			}
		}
		return true;
	};
	return Card;
})();
module.exports = Card;