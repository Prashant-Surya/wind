import EventsDispatcher from "core/events/dispatcher";
import  Protocol from "core/connection/protocol/protocol";
import * as Collections from "core/utils/collections";


export default class Connection extends EventsDispatcher{
    constructor(id, transport){
        super();
        this.id = id;
        this.transport = transport;
    }

    send(data){
        this.transport.send(data);
    }

    send_event(name, data, channel){
        var message = {
            event: name,
            data: data
        }

        if (channel) message.channel = channel;
        return this.send(Protocol.encodeMessage(message));
    }

    close(){
        this.transport.close();
    }

    bindListeners(){
        var listeners = {
            message: (m) => {
                var message;
                try {
                    message = Protocol.decodeMessage(m);
                }
                catch(e) {
                    this.emit('error', {
                        type: 'MessageParseError',
                        error: e,
                        data: m.data
                   });
                }

                if (message !== undefined){
                    switch(message.event){
                        case 'wind:error':
                            this.emit('error', {type: 'WindError', data: message.data});
                            break;
                    }
                }

                this.emit('message', message);
            },

            error: (error) => {
                this.emit("error", {type: "WebsocketError", error: error});
            },

            closed: (closeEvent) => {
                unbindListeners();
                this.transport = null;
                this.emit("closed");
            }

        };

        var unbindListeners = () => {
            Collections.objectApply(listeners, (listener, event) => {
                this.transport.unbind(event, listener);
            })
        }

        Collections.objectApply(listeners, (listener, event) => {
            this.transport.bind(event, listener);
        })
    }
}
