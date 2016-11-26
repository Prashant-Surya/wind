

export default class BaseTimer{
    constructor(set, clear, delay, callback){
        this.clear = clear;
        this.timer = set(() => {
            if (this.timer) {
                this.timer = callback(this.timer);
            }
        }, delay);
    }

    isRunning() {
        return this.timer !== null;
    }

    ensureAborted() {
        if (this.timer) {
            this.clear(this.timer);
            this.timer = null;
        }
    }
}
