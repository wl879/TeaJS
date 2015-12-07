var a = (function(){
	function a(){
		this.ab = 1234;
	}
	a.prototype = new b();
	a.prototype.constructor = a;
	a.prototype.__super__ = b.prototype;
	a.prototype.__defineGetter__("abc", function(){
		console.log('abc');
	});
	a.prototype.def = function (){
		retur(this.abc);
	}
	return a;
})();
//# sourceMappingURL=test_map.map