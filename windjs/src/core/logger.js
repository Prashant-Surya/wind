import Logger from "js-logger";

Logger.useDefaults();


export class ComponentLogger{
    constructor(component){
        this.component = component;
        this.logger = Logger;
    }

    debug(){
        this.logger.debug(this.component.constructor.name + ":->", ...arguments);   
    }
    
    
}


export default Logger;
