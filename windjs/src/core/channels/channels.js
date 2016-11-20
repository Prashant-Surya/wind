import * as Collections from '../utils/collections';
import Factory from '../utils/factory';



export default class Channels {
    constructor() {
        this.channels = {};
    }

    add(name, wind) {
        if (!this.channels[name]) {
            this.channels[name] = createChannel(name, wind);
        }
        return this.channels[name];
    }

    all() {
        return Collections.values(this.channels);
    }

    find(name) {
        return this.channels[name];
    }

    remove(name) {
        var channel = this.channels[name];
        delete this.channels[name];
        return channel;
    }

    disconnect() {
        Collections.objectApply(this.channels, function(channel) {
            channel.disconnect();
        });
    }
}

function createChannel(name, wind) {
    return Factory.createChannel(name, wind);
}

