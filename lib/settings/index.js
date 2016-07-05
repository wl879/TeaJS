var ref, ref0, ref1, ref2;
var Tea = require("../core");
/**
 * Define token map
 */
for (var name in (ref = require("./token.js"))){
	if (!ref.hasOwnProperty(name)) continue;
	var value = ref[name];
	Tea.define('token', name, value);
}
/**
 * Define grammar map
 */
for (var name in (ref0 = require("./syntax"))){
	if (!ref0.hasOwnProperty(name)) continue;
	var value = ref0[name];
	Tea.define('syntax', name, value);
}
require("../core/node.js").map = require("./node.js");
/**
 * Define scope map
 */
for (var name in (ref1 = require("./scope.js"))){
	if (!ref1.hasOwnProperty(name)) continue;
	var value = ref1[name];
	Tea.define('scope', name, value);
}
/**
 * Define standard map
 */
for (var name in (ref2 = require("./standards/es5"))){
	if (!ref2.hasOwnProperty(name)) continue;
	var value = ref2[name];
	Tea.define('es5', name, value);
}