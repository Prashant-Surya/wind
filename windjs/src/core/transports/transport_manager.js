import AssistantToTheTransportManager from './assistant_to_the_transport_manager';
import Factory from "core/utils/factory";


/** Keeps track of the number of lives left for a transport.
 *
 * In the beginning of a session, transports may be assigned a number of
 * lives. When an AssistantToTheTransportManager instance reports a transport
 * connection closed uncleanly, the transport loses a life. When the number
 * of lives drops to zero, the transport gets disabled by its manager.
 *
 * @param {Object} options
 */
export default class TransportManager {
  constructor(options){
    this.options = options || {};
    this.livesLeft = this.options.lives || Infinity;
  }

  /** Creates a assistant for the transport.
   *
   * @param {Transport} transport
   * @returns {AssistantToTheTransportManager}
   */
  getAssistant(transport) {
    return Factory.createAssistantToTheTransportManager(this, transport, {
      minPingDelay: this.options.minPingDelay,
      maxPingDelay: this.options.maxPingDelay
    });
  }

  /** Returns whether the transport has any lives left.
   *
   * @returns {Boolean}
   */
  isAlive(){
    return this.livesLeft > 0;
  }

  /** Takes one life from the transport. */
  reportDeath() {
    this.livesLeft -= 1;
  }
}
