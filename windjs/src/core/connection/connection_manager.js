import EventsDispatcher from "core/events/dispatcher";


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
    }

    connect(){
    	if (this.connection || this.runner) {
      		return;
    	}
    	if (!this.strategy.isSupported()) {
      		this.updateState("failed");
      		return;
    	}
    	this.updateState("connecting");
    	this.startConnecting();
    	this.setUnavailableTimer();

    }

    send(data){
        if (!this.connection)
            return false;

        return this.connection.send(data);
    }

    send_event(name, data, channel){
        if (!this.connection) return false;

        return this.connection.send_event(name, data, channel);
    }

    disconnect(){
        this.disconnectInternally();
        this.updateState("disconnected");
    }

	isEncrypted() {
		return this.encrypted;
	};


	startConnecting() {
		var callback = (error, handshake)=> {
			if (error) {
				this.runner = this.strategy.connect(0, callback);
			} else {
				if (handshake.action === "error") {
					this.emit("error", { type: "HandshakeError", error: handshake.error });
					this.timeline.error({ handshakeError: handshake.error });
				} else {
					this.abortConnecting(); // we don't support switching connections yet
					this.handshakeCallbacks[handshake.action](handshake);
				}
			}
    	};
		this.runner = this.strategy.connect(0, callback);
	};

	abortConnecting() {
		if (this.runner) {
			this.runner.abort();
			this.runner = null;
		}
	};

	disconnectInternally() {
		this.abortConnecting();
		this.clearRetryTimer();
		this.clearUnavailableTimer();
		if (this.connection) {
			var connection = this.abandonConnection();
			connection.close();
		}
	};


	updateStrategy() {
		this.strategy = this.options.getStrategy({
			key: this.key,
			encrypted: this.encrypted
		});
	};

	
	retryIn(delay) {
		this.timeline.info({ action: "retry", delay: delay });
		if (delay > 0) {
			this.emit("connecting_in", Math.round(delay / 1000));
		}
		this.retryTimer = new Timer(delay || 0, ()=> {
			this.disconnectInternally();
			this.connect();
		});
	}

	clearRetryTimer() {
		if (this.retryTimer) {
			this.retryTimer.ensureAborted();
			this.retryTimer = null;
		}
	};

	setUnavailableTimer() {
		this.unavailableTimer = new Timer(
			this.options.unavailableTimeout,
			()=> {
				this.updateState("unavailable");
			}
		);
	};

	clearUnavailableTimer() {
		if (this.unavailableTimer) {
			this.unavailableTimer.ensureAborted();
		}
	};

	sendActivityCheck() {
		this.stopActivityCheck();
		this.connection.ping();
		// wait for pong response
		this.activityTimer = new Timer(
			this.options.pongTimeout,
			()=> {
				this.timeline.error({ pong_timed_out: this.options.pongTimeout });
				this.retryIn(0);
			}
		);
	};

	resetActivityCheck() {
		this.stopActivityCheck();
		// send ping after inactivity
		if (!this.connection.handlesActivityChecks()) {
			this.activityTimer = new Timer(this.activityTimeout, ()=> {
				this.sendActivityCheck();
			});
		}
	};

	stopActivityCheck() {
		if (this.activityTimer) {
			this.activityTimer.ensureAborted();
		}
	};

	buildConnectionCallbacks() {
		return {
			message: (message)=> {
				// includes pong messages from server
				this.resetActivityCheck();
				this.emit('message', message);
			},
			ping: ()=> {
				this.send_event('pusher:pong', {});
			},
			activity: ()=> {
				this.resetActivityCheck();
			},
			error: (error)=> {
				// just emit error to user - socket will already be closed by browser
				this.emit("error", { type: "WebSocketError", error: error });
			},
			closed: ()=> {
				this.abandonConnection();
				if (this.shouldRetry()) {
					this.retryIn(1000);
				}
			}
		};
	}

 	buildHandshakeCallbacks(errorCallbacks) {
		const new_callbacks = { ...errorCallbacks, {
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
		}

    return {
      ssl_only: withErrorEmitted(()=> {
        this.encrypted = true;
        this.updateStrategy();
        this.retryIn(0);
      }),
      refused: withErrorEmitted(()=> {
        this.disconnect();
      }),
      backoff: withErrorEmitted(()=> {
        this.retryIn(1000);
      }),
      retry: withErrorEmitted(()=> {
        this.retryIn(0);
      })
    };
  };

}
