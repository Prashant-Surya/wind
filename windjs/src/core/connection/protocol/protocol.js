
export default class Protocol {

    static decodeMessage(message){
    try {
        var params = JSON.parse(message.data);
        if (typeof params.data === 'string') {
            try {
                params.data = JSON.parse(params.data);
            } catch (e) {
                if (!(e instanceof SyntaxError)) {
                // TODO looks like unreachable code
                // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse
                throw e;
            }
        }
    }

        return params;

    } catch (e) {
        throw { type: 'MessageParseError', error: e, data: message.data};
    }
    }


    static  encodeMessage(message){
        return JSON.stringify(message);
    }


	static processHandshake(message) {
		message = Protocol.decodeMessage(message);

		if (message.event === "wind:connection_established") {
			if (!message.data.activity_timeout) {
				throw "No activity timeout specified in handshake";
			}
			return {
				action: "connected",
				id: message.data.socket_id,
				activityTimeout: message.data.activity_timeout * 1000
			};
		} else if (message.event === "wind:error") {
			// From protocol 6 close codes are sent only once, so this only
			// happens when connection does not support close codes
			return {
				action: Protocol.getCloseAction(message.data),
				error: Protocol.getCloseError(message.data)
			};
		} else {
			throw "Invalid handshake";
		}
	}


	static getCloseAction(closeEvent){
		if (closeEvent.code < 4000) {
			// ignore 1000 CLOSE_NORMAL, 1001 CLOSE_GOING_AWAY,
			//        1005 CLOSE_NO_STATUS, 1006 CLOSE_ABNORMAL
			// ignore 1007...3999
			// handle 1002 CLOSE_PROTOCOL_ERROR, 1003 CLOSE_UNSUPPORTED,
			//        1004 CLOSE_TOO_LARGE
			if (closeEvent.code >= 1002 && closeEvent.code <= 1004) {
				return "backoff";
			} else {
				return null;
			}
		} else if (closeEvent.code === 4000) {
			return "ssl_only";
		} else if (closeEvent.code < 4100) {
			return "refused";
		} else if (closeEvent.code < 4200) {
			return "backoff";
		} else if (closeEvent.code < 4300) {
			return "retry";
		} else {
			// unknown error
			return "refused";
		}
	}

	static getCloseError(closeEvent) {
		if (closeEvent.code !== 1000 && closeEvent.code !== 1001) {
			return {
				type: 'WindError',
				data: {
					code: closeEvent.code,
					message: closeEvent.reason || closeEvent.message
				}
			};
		} else {
			return null;
		}
	}
}



