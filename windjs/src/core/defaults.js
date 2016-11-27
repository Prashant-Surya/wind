
var Defaults = {
	VERSION: "<VERSION>",
	PROTOCOL: 7,

	// DEPRECATED: WS connection parameters
	host: 'localhost',
	ws_port: 8081,
	wss_port: 443,
	// DEPRECATED: SockJS fallback parameters
	sockjs_host: 'localhost',
	sockjs_http_port: 8080,
	sockjs_https_port: 443,
	sockjs_path: "/wind",
	// DEPRECATED: Stats
	stats_host: 'stats.pusher.com',
	// DEPRECATED: Other settings
	channel_auth_endpoint: '/pusher/auth',
	channel_auth_transport: 'ajax',
	activity_timeout: 120000,
	pong_timeout: 30000,
	unavailable_timeout: 10000,

	// CDN configuration
	cdn_http: '<CDN_HTTP>',
	cdn_https: '<CDN_HTTPS>',
	dependency_suffix: '<DEPENDENCY_SUFFIX>'
}

export default Defaults;
