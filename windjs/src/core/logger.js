import Logger from "js-logger";

Logger.useDefaults();


export class ComponentLogger{
    constructor(component){
        this.component = component;
        this.logger = Logger;

        this.componentName = this.component.constructor.name;
    }

    debug(){
        this.logger.debug(this.getPrefix('DEBUG'), ...arguments);   
    }

    warn(){
        this.logger.warn(this.getPrefix('WARN'), ...arguments);
    }

    getPrefix(levelVerbose){
        let date = this.getCurrentDate();
        let componentName = this.componentName;
        let prefix = `${date} ${levelVerbose} ${componentName}:->`;
        return prefix;
    }

    getCurrentDate(){
        return new Date().toLocaleString();
    }
}
