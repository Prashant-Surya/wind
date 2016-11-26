import EventsDispatcher from "core/events/dispatcher";
import Factory from "core/utils/factory";
import Logger from "core/logger";
import DefaultConfig from "core/config";
import Runtime from "runtime";


export default class Wind {

    constructor(app_key, options){
        this.key = app_key;

        options = options || {};

		let clusterConfig = {};

		if (options.cluster) {
			clusterConfig = DefaultConfig.getClusterConfig(options.cluster);
		}

		this.config = {
			...DefaultConfig.getGlobalConfig(),
			...options,
			...clusterConfig
		}

        Logger.debug("Wind Config ", this.config);

		let connectionManagerOptions = {
			activityTimeout: this.config.activity_timeout,
			pongTimeout: this.config.pong_timeout,
			unavailableTimeout: this.config.unavailable_timeout,
			...this.config,
			encrypted: this.isEncrypted()
		}

        this.connection = Factory.createConnectionManager(
            this.key = app_key,
			connectionManagerOptions
        );

        this.connection.bind('connected', () => {
            this.subscribeAll();
        })

        this.emitter = new EventsDispatcher(); 
        this.channels = Factory.createChannels();

        this.connection.bind('message', (params) => {
            if (!params) return;

            var internal = (params.event.indexOf('wind_internal:') === 0);

            if (params.channel){
                var channel = this.channel(params.channel);
                if (channel) {
                    channel.handleEvent(params.event, params.data);
                }
            }

            if (!internal){
                this.emitter.emit(params.event, params.data);
            }
        })

        this.connection.bind('disconnected', () => {
            this.channels.disconnect();
        });

        this.connection.bind('error', (err) => {
            Logger.warn(err);
        });

        this.connect();

    }

    channel(name){
        return this.channels.find(name);
    }

    allChannels() {
        return this.channels.all();
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

	isEncrypted() {
        Logger.debug("Runtime protocol ", Runtime.getProtocol());

		if (Runtime.getProtocol() === "https:") {
			return true;
		} else {
			return Boolean(this.config.encrypted);
		}
	}

}

