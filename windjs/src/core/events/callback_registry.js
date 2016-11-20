export default class CallbackRegistry {
    constructor(){
        this._callbacks = {};
    }

    get(eventName){
        return this._callbacks[eventName];
    }

    add(eventName, callback, context){
        this._callbacks[eventName] = this._callbacks[eventName] || {};
        // get the function name
        const callbackName = this._get_callback_id(callback);
 

        this._callbacks[eventName][callbackName] = {
            callback: callback,
            context: context
        };
    }

    remove(eventName, callback, context){
        if (!eventName && !callback && !context){
            this._callbacks = {};
            return;
        }

        if (!(eventName in this._callbacks)) return;

        const callbackName = this._get_callback_id(callback);
        delete this._callbacks[eventName][callbackName];

    }

    _get_callback_id(callback){
       return hashCode(callback.toString()); 
    }

}


function hashCode(str){
    let len = str.length;

    let hash = 0;
    for(let i=1; i<=len; i++){
                let char = str.charCodeAt((i-1));
                hash += char*Math.pow(31,(len-i));
                hash = hash & hash;
            }
    return hash;
}

