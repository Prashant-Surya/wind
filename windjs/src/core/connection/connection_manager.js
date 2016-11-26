import EventsDispatcher from "core/events/dispatcher";
import {ComponentLogger} from "core/logger";
import { OneOffTimer as Timer } from 'core/utils/timers/timers';
import Connection from 'core/connection/connection';
import TransportConnection from 'core/transports/transport_connection';


export default class ConnectionManager extends EventsDispatcher{
    constructor(key, options){
        super();
        this.key = key;
        this.options = options || {};
        this.state = "initialized";
        this.connection = null;
		this.encrypted = !!options.encrypted;

        this.connectionCallbacks = this.buildConnectionCallbacks();
        this.errorCallbacks = this.buildErrorCallbacks();
        this.handshakeCallbacks = this.buildHandshakeCallbacks(this.errorCallbacks);
        this.logger = new ComponentLogger(this);
    }

    connect(){
		if (this.connection) {
			return;
		}
        this.logger.debug("About to connect now");
		this.updateState("connecting");
		this.startConnecting();
		//this.setUnavailableTimer();
    }

    send(data){
        if (!this.connection)
            return false;

        return this.connection.send(data);
    }

    send_event(name, data, channel){
        if (!this.connection) {
            this.logger.debug("Sending event but connection not active ..", name, data, channel);
            return false;
        }

        return this.connection.send_event(name, data, channel);
    }

    disconnect(){
        this.logger.debug("disconnect called");
        this.disconnectInternally();
        this.updateState("disconnected");
    }

	isEncrypted() {
		return this.encrypted;
	}


	startConnecting() {
        this.logger.debug("startConnecting called");

        const transport = new TransportConnection(this.key, this.options);
        this.connection = new Connection(null, transport);
        this.setConnection(this.connection);
	}

	abortConnecting() {
        this.logger.debug("abortConnecting called");
		if (this.runner) {
			this.runner.abort();
			this.runner = null;
		}
	}

	disconnectInternally() {
        this.logger.debug("disconnectInternally called");

		this.abortConnecting();
		this.clearRetryTimer();
		this.clearUnavailableTimer();
		if (this.connection) {
			var connection = this.abandonConnection();
			connection.close();
		}
	}


	retryIn(delay) {
        this.logger.debug("Retrying with delay...", delay);
		if (delay > 0) {
			this.emit("connecting_in", Math.round(delay / 1000));
		}
		this.retryTimer = new Timer(delay || 0, ()=> {
			this.disconnectInternally();
			this.connect();
		});
	}

	clearRetryTimer() {
        this.logger.debug("clearRetryTimer called");

		if (this.retryTimer) {
			this.retryTimer.ensureAborted();
			this.retryTimer = null;
		}
	}

	setUnavailableTimer() {
        this.logger.debug("setUnavailableTimer called");

		this.unavailableTimer = new Timer(
			this.options.unavailableTimeout,
			()=> {
				this.updateState("unavailable");
			}
		);
	}

	clearUnavailableTimer() {
        this.logger.debug("clearUnavailableTimer called", this.unavailableTimer);

		if (this.unavailableTimer) {
			this.unavailableTimer.ensureAborted();
		}
	}

	sendActivityCheck() {
        this.logger.debug("sendActivityCheck called");

		this.stopActivityCheck();
		this.connection.ping();
		// wait for pong response
		this.activityTimer = new Timer(
			this.options.pongTimeout,
			()=> {
				this.retryIn(0);
			}
		);
	}

	resetActivityCheck() {
		this.stopActivityCheck();
		// send ping after inactivity
		if (!this.connection.handlesActivityChecks()) {
			this.activityTimer = new Timer(this.activityTimeout, ()=> {
				this.sendActivityCheck();
			});
		}
	}

	stopActivityCheck() {
		if (this.activityTimer) {
			this.activityTimer.ensureAborted();
		}
	}

	buildConnectionCallbacks() {
		return {
			message: (message)=> {
				// includes pong messages from server
				//this.resetActivityCheck();
				this.emit('message', message);
			},
			ping: ()=> {
				this.send_event('pusher:pong', {});
			},
			activity: ()=> {
				this.resetActivityCheck();
			},
			error: (error)=> {
                this.logger.debug("Connection callback error ", error);
				// just emit error to user - socket will already be closed by browser
				this.emit("error", { type: "WebSocketError", error: error });
			},
			closed: ()=> {
                this.logger.debug("COnnection closed callback");
				this.abandonConnection();
				if (this.shouldRetry()) {
					this.retryIn(1000);
				}
			}
		};
	}

    buildHandshakeCallbacks(errorCallbacks) {
		const new_callbacks = {
            ...errorCallbacks,
			connected: (handshake)=> {
                this.activityTimeout = Math.min(
                    this.options.activityTimeout,
                    handshake.activityTimeout,
                    handshake.connection.activityTimeout || Infinity
                );
                this.clearUnavailableTimer();
                this.setConnection(handshake.connection);
                this.updateState("connected", { socket_id: this.socket_id });
			}
		};
		return new_callbacks;
	}

    buildErrorCallbacks() {
		let withErrorEmitted = (callback)=> {
			return (result)=> {
				if (result.error) {
					this.emit("error", { type: "WebSocketError", error: result.error });
				}
				callback(result);
			};
		};

        return {
            ssl_only: withErrorEmitted(()=> {
                this.logger.debug("ssl_only error callback");
                this.encrypted = true;
                this.retryIn(0);
            }),
            refused: withErrorEmitted(()=> {
                this.disconnect();
            }),
            backoff: withErrorEmitted(()=> {
                this.retryIn(1000);
            }),
            retry: withErrorEmitted(()=> {
                this.logger.debug("retry error callback");
                this.retryIn(0);
            })
        };
    }

    setConnection(connection) {
        this.connection = connection;
        this.logger.debug("Setting connection callbacks ", this.connectionCallbacks);
        for (var event in this.connectionCallbacks) {
            this.connection.bind(event, this.connectionCallbacks[event]);
        }
        //this.resetActivityCheck();
    }

    abandonConnection() {
        if (!this.connection) {
            return;
        }
        this.stopActivityCheck();
        for (var event in this.connectionCallbacks) {
            this.connection.unbind(event, this.connectionCallbacks[event]);
        }
        var connection = this.connection;
        this.connection = null;
        return connection;
    }

	updateState(newState, data) {
		var previousState = this.state;
		this.state = newState;
		if (previousState !== newState) {
			var newStateDescription = newState;
			if (newStateDescription === "connected") {
				newStateDescription += " with new socket ID " + data.socket_id;
			}
			this.logger.debug('State changed', previousState + ' -> ' + newStateDescription);
			this.emit('state_change', { previous: previousState, current: newState });
			this.emit(newState, data);
		}
	}

	shouldRetry(){
		return this.state === "connecting" || this.state === "connected";
	}

}
