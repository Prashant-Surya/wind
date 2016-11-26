import * as URLSchemes from "core/transports/url_schemes";
import Transport from "core/transports/transport";
import * as Collections from "core/utils/collections";
import Runtime from 'runtime';

/** WebSocket transport.
 *
 * Uses native WebSocket implementation, including MozWebSocket supported by
 * earlier Firefox versions.
 */
var WSTransport = new Transport({
  isInitialized: function() {
    return Boolean(Runtime.getWebSocketAPI());
  },
  isSupported: function() {
    return Boolean(Runtime.getWebSocketAPI());
  },
  getSocket: function(url) {
    return Runtime.createWebSocket(url);
  }
});

var httpConfiguration = {
  urls: URLSchemes.http,
  handlesActivityChecks: false,
  supportsPing: true,
  isInitialized: function() {
    return true;
  }
};

export var streamingConfiguration = { 
	getSocket: function(url) {
      return Runtime.HTTPFactory.createStreamingSocket(url);
    },
	...httpConfiguration
}

export var pollingConfiguration = {
	getSocket: function(url) {
      return Runtime.HTTPFactory.createPollingSocket(url);
    },
	...httpConfiguration
}

var xhrConfiguration = {
  isSupported: function(){
    return Runtime.isXHRSupported();
  }
};

/** HTTP streaming transport using CORS-enabled XMLHttpRequest. */
var XHRStreamingTransport = new Transport(
    {...streamingConfiguration, ...xhrConfiguration}
);

/** HTTP long-polling transport using CORS-enabled XMLHttpRequest. */
var XHRPollingTransport = new Transport(
    {...pollingConfiguration, ...xhrConfiguration}
);

var Transports  = {
  ws: WSTransport,
  xhr_streaming: XHRStreamingTransport,
  xhr_polling: XHRPollingTransport
}

export default Transports;
