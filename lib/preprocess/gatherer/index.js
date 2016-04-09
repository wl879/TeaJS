var modules;
modules = [
	require("./const.js"),
	require("./define.js"),
	require("./control.js"),
	require("./include.js")];
for (var modu, i = 0; i < modules.length; i++){
	modu = modules[i];
	for (var key in modu){
		if (!modu.hasOwnProperty(key)) continue;
		exports[key] = modu[key];
	}
}