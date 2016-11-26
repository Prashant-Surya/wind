import {
  default as Transports,
  streamingConfiguration,
  pollingConfiguration
} from 'isomorphic/transports/transports';
import Transport from 'core/transports/transport';
import * as URLSchemes from 'core/transports/url_schemes';
import Runtime from 'runtime';
import {Dependencies} from '../dom/dependencies';


var SockJSTransport = new Transport({
  file: "sockjs",
  urls: URLSchemes.sockjs,
  handlesActivityChecks: true,
  supportsPing: false,

  isSupported: function() {
    return true;
  },
  isInitialized: function() {
    return window.SockJS !== undefined;
  },
  getSocket: function(url, options) {
    return new window.SockJS(url, null, {
      js_path: Dependencies.getPath("sockjs", {
        encrypted: options.encrypted
      }),
      ignore_null_origin: options.ignoreNullOrigin
    });
  },
  beforeOpen: function(socket, path) {
    socket.send(JSON.stringify({
      path: path
    }));
  }
});

var xdrConfiguration = {
    isSupported: function(environment) {
        var yes = Runtime.isXDRSupported(environment.encrypted);
        return yes;
    }
};

/** HTTP streaming transport using XDomainRequest (IE 8,9). */
var XDRStreamingTransport = new Transport(
    {...streamingConfiguration, ...xdrConfiguration}
);

/** HTTP long-polling transport using XDomainRequest (IE 8,9). */
var XDRPollingTransport = new Transport(
    {...pollingConfiguration, ...xdrConfiguration}
);

Transports.xdr_streaming = XDRStreamingTransport;
Transports.xdr_polling = XDRPollingTransport;
Transports.sockjs = SockJSTransport;

export default Transports;

