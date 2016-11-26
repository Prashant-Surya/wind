import * as Collections from 'core/utils/collections';
import Util from 'core/util';

export default class BestConnectedEverStrategy {
  constructor(strategies) {
    this.strategies = strategies;
  }

  isSupported() {
    return Collections.any(this.strategies, Util.method("isSupported"));
  }

  connect(minPriority, callback) {
    return connect(this.strategies, minPriority, function(i, runners) {
      return function(error, handshake) {
        runners[i].error = error;
        if (error) {
          if (allRunnersFailed(runners)) {
            callback(true);
          }
          return;
        }
        Collections.apply(runners, function(runner) {
          runner.forceMinPriority(handshake.transport.priority);
        });
        callback(null, handshake);
      };
    });
  }
}

function connect(strategies, minPriority, callbackBuilder) {
    var runners = Collections.map(strategies, function(strategy, i, _, rs) {
        return strategy.connect(minPriority, callbackBuilder(i, rs));
    });
    return {
        abort: function() {
            Collections.apply(runners, abortRunner);
        },
        forceMinPriority: function(p) {
            Collections.apply(runners, function(runner) {
                runner.forceMinPriority(p);
            });
        }
    };
}


function allRunnersFailed(runners) {
    return Collections.all(runners, function(runner) {
        return Boolean(runner.error);
    });
}

function abortRunner(runner) {
    if (!runner.error && !runner.aborted) {
        runner.abort();
        runner.aborted = true;
    }
}


