import CallbackRegistry from "core/events/callback_registry"

import {ComponentLogger} from "core/logger";

export default class Dispatcher {
    constructor(logger){
        this.logger = logger?logger: new ComponentLogger(this);
        this.callbacks = new CallbackRegistry(this.logger);
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
        if (!callbacks) {
            this.logger.debug("No callbacks found for eventName: ", eventName);
            return;
        }
        for(let entry of callbacks){
            let d = entry[1];
            d.callback.call(d.context, data);
        }
        return this;
    }
}
