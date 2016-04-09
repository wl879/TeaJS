var Pattern = (function(){
	var cache, Asset, Card;
	cache = Jsop.data();
	Asset = require("./asset.js");
	Card = require("../card.js");
	function Pattern(text, type){
		var m;
		this.length = 0;
		this.string = text;
		if (type == 'Logic'){
			this.type = type;
			this.add(Asset.compile(text, 'Logic'));
		}else {
			while (m = Asset.test(text)){
				if (m.index){
					this.add(text.slice(0, m.index));
				}
				this.add(Asset.compile(m));
				text = text.substr(m.index+m[0].length);
			}
			if (text){
				this.add(text);
			}
		}
	};
	Pattern.prototype.add = function (){
		for (var asset, i = 0; i < arguments.length; i++){
			asset = arguments[i];
			if (typeof asset == 'string'){
				asset = SText.cleanESC(asset);
			}
			this[this.length++] = asset;
		}
		return this;
	};
	Pattern.prototype.parse = function (std, node){
		if (this.type == 'Logic'){
			return this[0].parse(node, std);
		}else {
			return parsePattern(this, node, std);
		}
	};
	Pattern.prototype.isPattern = true;
	Pattern.compile = function(text, type){
		if (cache[text]){
			return cache[text];
		}
		return cache[text] = new Pattern(text, type);
	};
	Pattern.parse = function(std, patt, node){
		if (typeof patt == 'string'){
			patt = Pattern.compile(patt);
		}
		return patt.parse(std, node);
	};
	function parsePattern(patt, node, std){
		var card;
		card = new Card(node.isNode ? node.type : 'Clip');
		for (var ref, i = 0; i < patt.length; i++){
			ref = patt[i];
			if (ref.isAsset){
				ref = checkAccAsset(ref, node, std);
				if (!ref){
					if (typeof card[card.length-1] == 'string'){
						ref = card[card.length-1].replace(/\s*(\,|\.|\:\:)*\s*$/, '');
						if (!ref){
							Array.prototype.pop.call(card);
						}else {
							card[card.length-1] = ref;
						}
					}
					continue;
				}
			}
			if (ref){
				if (ref === true){
					continue;
				}
				card.add(ref);
			}
		}
		if (!card.length){
			return "";
		}
		if (patt.length == 1 && (patt[0].name == 'LIST' || patt[0].name == 'EACH')){
			return Jsop.toArray(card);
		}
		if (card.length == 1){
			if (card.type == card[0].type){
				card = card[0];
			}else if (patt.length == 1){
				if (patt[0].type == 'Call'){
					card = card[0];
				}
			}
		}
		return card;
	};
	function checkAccAsset(acc, node, std){
		var ref;
		if (ref = acc.parse(node, std)){
			if (ref.isSyntax || ref.isToken){
				if (std.handle.standard == node.type && ref == node){
					ref = std.read(ref, true);
				}else {
					ref = std.read(ref);
				}
			}
		}else if (ref === 0){
			ref = '0';
		}
		return ref;
	};
	return Pattern;
})();
module.exports = Pattern;