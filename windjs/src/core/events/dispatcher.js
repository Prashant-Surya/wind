import CallbackRegistry from "core/events/callback_registry"

import {ComponentLogger} from "core/logger";

export default class Dispatcher {
    constructor(){
        this.callbacks = new CallbackRegistry();
        this.logger = new ComponentLogger(this);
    }

    bind(eventName, callback, context){
        this.callbacks.add(eventName, callback, context);
        return this;
    }

    unbind(eventName, callback, context){
        this.callbacks.remove(eventName, callback, context);
    }

    emit(eventName, data){
        this.logger.debug("Emitting event ->", eventName, ":with data->", data);
        var callbacks = this.callbacks.get(eventName);
        this.logger.debug("All callbacks ", callbacks);
        if (!callbacks) return;
        for(let entry of callbacks){
            this.logger.debug(entry);
            let d = entry[1];
            d.callback.call(d.context, data);
        }
        return this;
    }
}
