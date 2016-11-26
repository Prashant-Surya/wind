import TransportConnection from 'core/transports/transport_connection';


export default class Transport{
    constructor(hooks){
        this.hooks = hooks;
    }

    isSupported(environment){
        return this.hooks.isSupported(environment);
    }

    createConnection(name, priority, key, options){
        return new TransportConnection(
            this.hooks, name, priority, key, options)
    }
}
