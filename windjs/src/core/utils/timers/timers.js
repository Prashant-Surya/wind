import Timer from "core/utils/timers/base";

function clearTimeout(timer) {
      window.clearTimeout(timer);
}

function clearInterval(timer) {
      window.clearInterval(timer);
}

export class OneOffTimer extends Timer {
    constructor(delay, callback) {
        super(setTimeout, clearTimeout, delay, function(timer){
            callback();
            return null;
        })
    }
}

export class PeriodicTimer extends Timer {
    constructor(delay, callback) {
        super(setInterval, clearInterval, delay, function(timer){
            callback();
            return timer;
        })
    }
}

