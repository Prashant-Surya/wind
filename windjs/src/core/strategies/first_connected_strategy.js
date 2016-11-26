
/** Launches the substrategy and terminates on the first open connection.
 *
 * @param {Strategy} strategy
 */
export default class FirstConnectedStrategy {

  constructor(strategy) {
    this.strategy = strategy;
  }

  isSupported(){
    return this.strategy.isSupported();
  }

  connect(minPriority, callback){
    var runner = this.strategy.connect(
      minPriority,
      function(error, handshake) {
        if (handshake) {
          runner.abort();
        }
        callback(error, handshake);
      }
    );
    return runner;
  }

}
