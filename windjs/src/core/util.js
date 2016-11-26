import {OneOffTimer} from "core/utils/timers/timers";
 

var Util = {
	now(){
		if (Date.now) {
			return Date.now();
		} else {
			return new Date().valueOf();
		}
	},

	defer(callback){
		return new OneOffTimer(0, callback);
	},

	method(name, ...args){
		var boundArguments = Array.prototype.slice.call(args, 1);
		return function(object) {
			return object[name].apply(object, boundArguments.concat(arguments));
		};
	} 


}

export default Util;
