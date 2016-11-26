    
var HTTP = { 
      
  createStreamingSocket(url){
    return this.createSocket(streamingHooks, url);
  },  
      
  createPollingSocket(url) {
    return this.createSocket(pollingHooks, url);
  },  
        
  createSocket(hooks, url){
    return new HTTPSocket(hooks, url);
  },
      
  createXHR(method, url){
    return this.createRequest(xhrHooks, method, url);
  },  
      
  createRequest(hooks, method, url){
    return new HTTPRequest(hooks, method, url);
  }
} 
    
export default HTTP;
