import HTTPFactory from './http/http';
import Transports from './transports/transports';
import transportConnectionInitializer from './transports/transport_connection_initializer';

var Runtime = {
	HTTPFactory,
    Transports,
	transportConnectionInitializer,

  getXHRAPI() {
    return window.XMLHttpRequest
  },

  getWebSocketAPI() {
    return window.WebSocket || window.MozWebSocket;
  },

  getDocument(){
    return document;
  },

  getProtocol(){
    return this.getDocument().location.protocol;
  },

  onDocumentBody(callback) {
    if (document.body) {
      callback();
    } else {
      setTimeout(()=> {
        this.onDocumentBody(callback);
      }, 0);
    }
  },

  getLocalStorage() {
    try {
      return window.localStorage;
    } catch (e) {
      return undefined;
    }
  },

    createWebSocket(url) {
        var Constructor = this.getWebSocketAPI();
        return new Constructor(url);
    },

  isXHRSupported(){
    var Constructor = this.getXHRAPI();
    return Boolean(Constructor) && (new Constructor()).withCredentials !== undefined;
  },



  addUnloadListener(listener) {
    if (window.addEventListener !== undefined) {
     window.addEventListener("unload", listener, false);
    } else if (window.attachEvent !== undefined) {
     window.attachEvent("onunload", listener);
    }
  },

  removeUnloadListener(listener) {
    if (window.addEventListener !== undefined) {
      window.removeEventListener("unload", listener, false);
    } else if (window.detachEvent !== undefined) {
      window.detachEvent("onunload", listener);
    }
  }
}

export default Runtime;
