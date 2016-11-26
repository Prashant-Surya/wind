import * as Collections from '../utils/collections';
import Util from '../util';
import {OneOffTimer as Timer} from 'core/utils/timers/timers';

/** Loops through strategies with optional timeouts.
 *
 * Options:
 * - loop - whether it should loop through the substrategy list
 * - timeout - initial timeout for a single substrategy
 * - timeoutLimit - maximum timeout
 *
 * @param {Strategy[]} strategies
 * @param {Object} options
 */
export default class SequentialStrategy{

  constructor(strategies, options) {
    this.strategies = strategies;
    this.loop = Boolean(options.loop);
    this.failFast = Boolean(options.failFast);
    this.timeout = options.timeout;
    this.timeoutLimit = options.timeoutLimit;
  }

  isSupported(){
    return Collections.any(this.strategies, Util.method("isSupported"));
  }

  connect(minPriority, callback) {
    var strategies = this.strategies;
    var current = 0;
    var timeout = this.timeout;
    var runner = null;

    var tryNextStrategy = (error, handshake)=> {
      if (handshake) {
        callback(null, handshake);
      } else {
        current = current + 1;
        if (this.loop) {
          current = current % strategies.length;
        }

        if (current < strategies.length) {
          if (timeout) {
            timeout = timeout * 2;
            if (this.timeoutLimit) {
              timeout = Math.min(timeout, this.timeoutLimit);
            }
          }
          runner = this.tryStrategy(
            strategies[current],
            minPriority,
            { timeout, failFast: this.failFast },
            tryNextStrategy
          );
        } else {
          callback(true);
        }
      }
    };

    runner = this.tryStrategy(
      strategies[current],
      minPriority,
      { timeout: timeout, failFast: this.failFast },
      tryNextStrategy
    );

    return {
      abort: function() {
        runner.abort();
      },
      forceMinPriority: function(p) {
        minPriority = p;
        if (runner) {
          runner.forceMinPriority(p);
        }
      }
    };
  }

  tryStrategy(strategy, minPriority, options, callback) {
    var timer = null;
    var runner = null;

    if (options.timeout > 0) {
      timer = new Timer(options.timeout, function() {
        runner.abort();
        callback(true);
      });
    }

    runner = strategy.connect(minPriority, function(error, handshake) {
      if (error && timer && timer.isRunning() && !options.failFast) {
        // advance to the next strategy after the timeout
        return;
      }
      if (timer) {
        timer.ensureAborted();
      }
      callback(error, handshake);
    });

    return {
      abort: function() {
        if (timer) {
          timer.ensureAborted();
        }
        runner.abort();
      },
      forceMinPriority: function(p) {
        runner.forceMinPriority(p);
      }
    };
  }
}
