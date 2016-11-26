import Protocol from 'core/connection/protocol/protocol';
import Connection from 'core/connection/connection';


export default class Handshake {
	constructor(transport, callback) {
		this.transport = transport;
		this.callback = callback;
		this.bindListeners();
	}

	close() {
		this.unbindListeners();
		this.transport.close();
	}

	bindListeners() {
		this.onMessage = (m)=> {
			this.unbindListeners();

			var result;
			try {
				result = Protocol.processHandshake(m);
			} catch (e) {
				this.finish("error", { error: e });
				this.transport.close();
				return;
			}

			if (result.action === "connected") {
				this.finish("connected", {
					connection: new Connection(result.id, this.transport),
					activityTimeout: result.activityTimeout
				});
			} else {
				this.finish(result.action, { error: result.error });
				this.transport.close();
			}
		};

		this.onClosed = (closeEvent) => {
			this.unbindListeners();

			var action = Protocol.getCloseAction(closeEvent) || "backoff";
			var error = Protocol.getCloseError(closeEvent);
			this.finish(action, { error: error });
		};

		this.transport.bind("message", this.onMessage);
		this.transport.bind("closed", this.onClosed);
	}

	unbindListeners() {
		this.transport.unbind("message", this.onMessage);
		this.transport.unbind("closed", this.onClosed);
	}

	finish(action, params) {
		const new_params = {...params, transport: this.transport, action: action};
		this.callback(
			new_params
		);
	}

}
