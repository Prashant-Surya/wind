import Channels from "core/channels/channels";
import Channel from "core/channels/channel";
import Handshake from "core/connection/handshake/handshake";
import ConnectionManager from "core/connection/connection_manager";

import AssistantToTheTransportManager from "core/transports/assistant_to_the_transport_manager";

var Factory = {
    createChannels(){
        return new Channels();
    },

    createChannel(name, wind){
        return new Channel(name, wind);
    },

    createHandshake(transport, callback) {
        return new Handshake(transport, callback);
    },

    createConnectionManager(key, options){
        return new ConnectionManager(key, options);
    },

    createAssistantToTheTransportManager(manager, transport, options){
        return new AssistantToTheTransportManager(manager, transport, options);
    }
}

export default Factory;
