import Channels from "core/channels/channels";
import Channel from "core/channels/channel";


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
}

export default Factory;
