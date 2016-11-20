import EventsDispatcher from "core/events/dispatcher";


export default class Channel extends EventsDispatcher{
    constructor(name, wind){
        super();
        this.name = name;
        this.wind = wind;
        this.subscribed = false;
    }

    trigger(event, data){
        /*
        if (event.indexOf("client-") !== 0) {
            throw new Errors.BadEventName(
                "Event '" + event + "' does not start with 'client-'"
            );
        }
        */

        return this.wind.send_event(event, data, this.name);
    }

    disconnect(){
        this.subscribed = false;
    }

    handleEvent(event, data){
        this.emit(event, data);
    }

    subscribe(){
        if (this.subscribed) return;
        this.wind.send_event('wind:subscribe', {
            channel: this.name,
            channel_data: null 
        })
    }

    unsubscribe(){
        this.subscribed = false;
        this.wind.send_event('wind:unsubscribe', {
            channel: this.name,
            channel_data: null
        })
    }
}
