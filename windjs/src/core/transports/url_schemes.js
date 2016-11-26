import Defaults from 'core/defaults';

function getGenericURL(baseScheme, params, path){
      var scheme = baseScheme + (params.encrypted ? "s" : "");
      var host = params.encrypted ? params.hostEncrypted : params.hostUnencrypted;
      return scheme + "://" + host + path;
}

function getGenericPath(key, queryString){
      var path = "/app/" + key;
      var query =
            "?protocol=" + Defaults.PROTOCOL +
            "&client=js" +
            "&version=" + Defaults.VERSION +
            (queryString ? ("&" + queryString) : "");
      return path + query;
}

export var ws = {
        getInitial: function(key , params) {
                    return getGenericURL("ws", params, getGenericPath(key, "flash=false"));
                }
};

export var http = {
        getInitial: function(key, params) {
                    var path = (params.httpPath || "/pusher") + getGenericPath(key);
                    return getGenericURL("http", params, path);
                }
};

export var sockjs = {
      getInitial: function(key, params) {
              return getGenericURL("http", params, params.httpPath || "/pusher");
            },
      getPath: function(key, params) {
              return getGenericPath(key);
            }
};

