import EventsDispatcher from "core/events/dispatcher";
import Connection from "core/connection/connection";
import Factory from "core/utils/factory";
import TransportConnection from "core/transports/transport_connection";
import Logger from "core/logger";


/*
export class Connection {
    constructor(wind){
        this.wind = wind;
        this.connection = this.create_connection();
    }

    create_connection() {
        var transports = [
            "websocket",
            "xhr-streaming",
            "iframe-eventsource",
            "iframe-htmlfile",
            "xhr-polling",
            "iframe-xhr-polling",
            "jsonp-polling"
        ]

        console.log("Transports", transports);

        var conn = new SockJS('http://' + "localhost:8080" + '/chat', transports);
        conn.onopen = function() {
            console.log("Connected");
            conn.send('I got connected');
        }

        conn.onmessage = function(e) {
            console.log("Received Message", e);
        }

        console.log("Hellp"); 

        return conn;
    }

    bind(channel_name, callback){
       return false; 
    }
}
*/


export default class Wind {

    constructor(app_key, options){
        this.app_key = app_key;
        this.options = options || {};
        this.connection = this.createConnection();
        this.connection.bind('connected', () => {
            this.subscribeAll();
        })

        this.emitter = new EventsDispatcher(); 
        this.channels = Factory.createChannels();

        this.connection.bind('message', (params) => {
            var internal = (params.event.indexOf('wind_internal:') === 0);

            if (params.channel){
                var channel = this.channel(params.channel);
                if (channel) {
                    channel.handleEvent(params.event, params.data);
                }
            }
        })

        this.connection.bind('disconnected', () => {
            this.channels.disconnect();
        });

        this.connection.bind('error', (err) => {
            Logger.warn(err);
        });

    }

    channel(name){
        return this.channels.find(name);
    }

    allChannels() {
        return this.channels.all();
    }
    createConnection() {
        const transport = new TransportConnection("hello");
        transport.connect();
        var connection = new Connection(this, transport);
        return connection;
    }

    connect(){
        this.connection.connect();
    }

    disconnect(){
        this.connection.disconnect();
    }


    bind(eventName, callback){
        this.emitter.bind(eventName, callback);
        return this;
    }

    unbind(eventName, callback){
        this.emitter.unbind(eventName, callback);
        return this;
    }

    subscribeAll() {
        var channelName;
        for (channelName in this.channels.channels) {
            if (this.channels.channels.hasOwnProperty(channelName)) {
                this.subscribe(channelName);
            }
        }
    }


    subscribe(channelName) {
        Logger.debug("subscribing to channel ", channelName);

        var channel = this.channels.add(channelName, this);
        channel.subscribe();
        return channel;
    }


    unsubscribe(channelName) {
        var channel = this.channels.find(channelName);
        if (channel) {
          channel.cancelSubscription();
        } else {
          channel = this.channels.remove(channelName);
          if (channel && this.connection.state === "connected") {
            channel.unsubscribe();
          }
        }
      }


    send_event(eventName, data, channel) {
        return this.connection.send_event(eventName, data, channel);
    }

    bind_all(callback){
        this.emitter.bind_all(callback);
        return this;
    }

}

