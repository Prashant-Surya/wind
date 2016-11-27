from channel import ChannelSubscriptionManager
from logger import get_logger
import json


class EventType(object):
    CHANNEL_SUBSCRIBE = 'wind:subscribe'
    CHANNEL_UNSUBSCRIBE = 'wind:unsubscribe'

    @staticmethod
    def is_subscription_event(event):
        return event == EventType.CHANNEL_SUBSCRIBE

    @staticmethod
    def is_unsubscription_event(event):
        return event == EventType.CHANNEL_SUBSCRIBE


class MessageHandler(object):
    _handler = None

    def __init__(self, logger=None):
        self.logger = logger or get_logger(__name__)

    @staticmethod
    def get_handler(logger=None):
        """Returns the cached handler.
        """
        if MessageHandler._handler is None:
            inst = MessageHandler(logger=logger)
            MessageHandler._handler = inst
        return MessageHandler._handler

    def handle_message(self, message, connection):
        """Handle an incoming message.
        """
        event = message.get('event')

        if not event:
            self.logger.error("Invalid event name: %s", event)
            return

        channel = message.get('channel')
        data = message.get('data')

        if EventType.is_subscription_event(event):
            self.logger.debug('Received  a subscription event with message: %s', message)
            channel = data.get('channel')
            ChannelSubscriptionManager.register_subscription(
                    channel, connection)
            return

        self.logger.debug('Broadcasting message %s', message)

        ChannelSubscriptionManager.broadcast(
            channel, json.dumps(message))

