from collections import defaultdict
from logger import get_logger


class ChannelSubscriptionManager(object):
    subscriptions = defaultdict(dict)
    logger = get_logger(__name__)

    @classmethod
    def register_subscription(cls, channel_name, connection):
        session_id = connection.session_id
        cls.subscriptions[channel_name][session_id] = connection
        print "Registered connection for channel ", channel_name

    @classmethod
    def get_subscriptions(cls, channel_name):
        return cls.subscriptions.get(channel_name)

    @classmethod
    def broadcast(cls, channel_name, message):
        if channel_name is None:
            raise Exception("Channel name is required")
        subscriptions = cls.get_subscriptions(channel_name)
        if not subscriptions:
            return
        cls.logger.debug("Sending messages to %s connections",
                subscriptions.__len__())
        for session_id, connection in subscriptions.iteritems():
            session = connection.session
            if session.is_closed:
                cls.logger.debug("Connection found closed with session id: %s", session_id)
                continue

            session.send_message(message)

