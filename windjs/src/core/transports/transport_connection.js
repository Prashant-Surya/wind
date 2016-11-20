import EventsDispatcher from "core/events/dispatcher";
import Logger from "core/logger";


export default class TransportConnection extends EventsDispatcher {
    constructor(name){
        super();
        this.name = name;
        this.socket = null;
        this.state = "new";
    }

    connect() {
        Logger.debug("TransportConnection connect request");
        Logger.debug("State", this.state);

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

            this.socket = new SockJS('http://' + "localhost:8080" + '/chat', transports);
            Logger.debug("SockJS connection object ", this.socket);
        } catch (e){
            this.changeState("closed");
            Logger.debug("Socket init failed ", e);
            return false;
        }
        this.bindListeners();
        this.changeState("connecting");
        return true;

    }

    close(){
        this.socket.close();
    }

    send(data){
        if (this.state === "open") {
            this.socket.send(data);
        }
    }

    onOpen(){
        this.changeState("open");
        this.socket.onopen = undefined;
    }

    onClose(){
        this.changeState("closed");
        this.unbindListeners();
        this.socket = undefined;
    }

    onMessage(message){
        this.emit("message", message);
    }

    bindListeners(){
        this.socket.onopen = () => {
            this.onOpen();
        }

        this.socket.onerror= (error) => {
            this.onError(error);
        }

        this.socket.onclose = (closeEvent) => {
            this.onClose();
        }

        this.socket.onmessage = (message) => {
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

    changeState(state){
        Logger.debug("TransportConnection", "changing state to ", state);
        this.state = state;
    }

}
