import {OneOffTimer as Timer} from 'core/utils/timers/timers';

/** Runs substrategy after specified delay.
 *
 * Options:
 * - delay - time in miliseconds to delay the substrategy attempt
 *
 * @param {Strategy} strategy
 * @param {Object} options
 */
export default class DelayedStrategy  {
  constructor(strategy, {delay : number}) {
    this.strategy = strategy;
    this.options = {delay : number};
  }

  isSupported(){
    return this.strategy.isSupported();
  }

  connect(minPriority , callback) {
    var strategy = this.strategy;
    var runner;
    var timer = new Timer(this.options.delay, function() {
      runner = strategy.connect(minPriority, callback);
    });

    return {
      abort: function() {
        timer.ensureAborted();
        if (runner) {
          runner.abort();
        }
      },
      forceMinPriority: function(p) {
        minPriority = p;
        if (runner) {
          runner.forceMinPriority(p);
        }
      }
    };
  }
}
