import EventsDispatcher from "core/events/dispatcher";
import {ComponentLogger} from "core/logger";


export default class TransportConnection extends EventsDispatcher {
    constructor(key, options){
        super();
        this.socket = null;
        this.state = "new";
		this.options = options ||{};
		this.key = key;
		this.activityTimeout = options.activityTimeout;
        this.logger = new ComponentLogger(this);
        this.message_buffer = [];
    }

	handlesActivityChecks(){
        return false;
		return Boolean(this.hooks.handlesActivityChecks);
	}

	supportsPing(){
        return false;
		//return Boolean(this.hooks.supportsPing);
	}



    connect() {
        this.logger.debug("Connect request start");
        this.logger.debug("State", this.state);

        //if (this.socket || this.state !== "initialized") return false;
        try {
            var transports = [
                "websocket",
                "xhr-streaming",
                "iframe-eventsource",
                "iframe-htmlfile",
                "xhr-polling",
                "iframe-xhr-polling",
                "jsonp-polling"
            ];
            this.logger.debug("Transport received options ", this.options);
            let host = this.options.httpHost;
            let port = this.options.httpPort;
            let httpPath = this.options.httpPath;
            let endpoint = `http://${host}:${port}${httpPath}`;

            this.socket = new SockJS(endpoint, transports);
            this.logger.debug("SockJS connection object ", this.socket);
        } catch (e){
            this.changeState("closed");
            this.logger.debug("Socket init failed ", e);
            return false;
        }
        this.bindListeners();
        this.changeState("connecting");
        return true;

    }

	ping() {
		if (this.state === "open" && this.supportsPing()) {
			this.socket.ping();
		}
	}


    close(){
        if (this.socket)
            this.socket.close();
    }

    send(data){
        this.logger.debug("sending data ", data, "state->", this.state);
        if (this.state === "open") {
            this.socket.send(data);
        }
        else {
            this.message_buffer.push(data);
        }
    }

    onOpen(){
        this.changeState("open");
        this.socket.onopen = undefined;
        if (this.message_buffer.length > 0) {
            this.pushBufferedMessages();
        }
    }

    pushBufferedMessages(){
        while(this.message_buffer.length > 0){
            let data = this.message_buffer.shift();
            this.send(data);
        }
    }

    onClose(){
        this.changeState("closed");
        this.unbindListeners();
        this.socket = undefined;
    }

    onMessage(message){
        this.emit("message", message);
    }

	onActivity(){
		this.emit("activity");
	}

    bindListeners(){
        this.socket.onopen = () => {
            this.logger.debug("Socket connection opened");
            this.onOpen();
        }

        this.socket.onerror= (error) => {
            this.logger.debug("Socket connection met with an error ", error);
            this.onError(error);
        }

        this.socket.onclose = (closeEvent) => {
            this.logger.debug("Socket connection closed ", closeEvent);
            this.onClose();
        }

        this.socket.onmessage = (message) => {
            this.logger.debug("Socket received message ", message);
            this.onMessage(message);
        }
    }


    unbindListeners() {
        if (this.socket) {
            this.socket.onopen = undefined;
            this.socket.onerror = undefined;
            this.socket.onclose = undefined;
            this.socket.onmessage = undefined;
        }
    }

    changeState(state, params){
        this.logger.debug("changing state to ", state);
        this.state = state;
		this.emit(state, params);
    }

}
