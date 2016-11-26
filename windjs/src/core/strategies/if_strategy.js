
/** Proxies method calls to one of substrategies basing on the test function.
 *
 * @param {Function} test
 * @param {Strategy} trueBranch strategy used when test returns true
 * @param {Strategy} falseBranch strategy used when test returns false
 */
export default class IfStrategy {

  constructor(test, trueBranch, falseBranch) {
    this.test = test;
    this.trueBranch = trueBranch;
    this.falseBranch = falseBranch;
  }

  isSupported(){
    var branch = this.test() ? this.trueBranch : this.falseBranch;
    return branch.isSupported();
  }

  connect(minPriority, callback){
    var branch = this.test() ? this.trueBranch : this.falseBranch;
    return branch.connect(minPriority, callback);
  }
}
