import {ComponentLogger} from "core/logger";

export default class CallbackRegistry {
    constructor(logger){
        this.init_callbacks();
        this.logger = logger?logger: new ComponentLogger(this);
        this.logger.debug("CallbackRegistry initialized ", this._callbacks);
    }

    get(eventName){
        return this._callbacks.get(eventName);
    }

    add(eventName, callback, context){
        if (!this._callbacks.has(eventName)) this._callbacks.set(eventName, new Map());

        const callbackName = this._get_callback_id(callback);
 

        this._callbacks.get(eventName).set(callbackName, {
            callback: callback,
            context: context
        });
    }

    remove(eventName, callback, context){
        if (!eventName && !callback && !context){
            this.init_callbacks();
            return;
        }

        if (!(eventName in this._callbacks)) return;

        const callbackName = this._get_callback_id(callback);
        this._callbacks.get(eventName).delete(callbackName);

    }

    _get_callback_id(callback){
       return hashCode(callback.toString()); 
    }

    init_callbacks(){
        this._callbacks = new Map();
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

