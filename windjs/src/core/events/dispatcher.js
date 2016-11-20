import CallbackRegistry from "core/events/callback_registry"

import Logger from "core/logger";

export default class Dispatcher {
    constructor(){
        this.callbacks = new CallbackRegistry();
    }

    bind(eventName, callback, context){
        this.callbacks.add(eventName, callback, context);
        return this;
    }

    unbind(eventName, callback, context){
        this.callbacks.remove(eventName, callback, context);
    }

    emit(eventName, data){
        Logger.debug("Emitting event ", eventName, "with data", data);
        var callbacks = this.callbacks.get(eventName);
        if (!callbacks) return;
        for(let entry of callbacks){
            Logger.debug(entry);
        }
        return this;
    }
}
