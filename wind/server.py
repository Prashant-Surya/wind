# -*- coding: utf-8 -*-
"""
    Simple sockjs-tornado chat application. By default will listen on port 8080.
"""
import tornado.ioloop
import tornado.web

import sockjs.tornado
import pylzma
from collections import defaultdict
import json


class IndexHandler(tornado.web.RequestHandler):
    """Regular HTTP handler to serve the chatroom page"""
    def get(self):
        #arguments = self.request.arguments
        #print arguments
        #data  = arguments.get('data')[0]
        #data = pylzma.decompress(data)
        #print data
        self.render('../windjs/index.html')


class StaticFilesHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('build/wind/wind.js')


class ChannelSubscriptionManager(object):
    subscriptions = defaultdict(dict)

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
        print "Broadcasting to connections ", subscriptions.__len__()
        for session_id, connection in subscriptions.iteritems():
            session = connection.session
            if session.is_closed:
                continue

            session.send_message(message)



class ChatConnection(sockjs.tornado.SockJSConnection):
    """Chat connection implementation"""
    # Class level variable
    participants = set()

    def on_open(self, info):
        print "INfo ", info.__dict__
        # Send that someone joined
        #self.broadcast(self.participants, "Someone joined.")

        # Add client to the clients list
        print "Someone joined.."
        self.participants.add(self)

    def on_message(self, message):
        print "Message received", message
        if not message:
            return

        try:
            message = json.loads(message)
        except Exception, e:
            print "Failed json loading ", e
            return

        data = message.get('data')

        event = message.get('event')
        channel = message.get('channel')


        print  "Event ..", event, "Channel",channel, "Data->", data

        if event == "wind:subscribe":
            channel = data.get('channel')
            ChannelSubscriptionManager.register_subscription(
                   channel, self)
            return
        #           c

        # Broadcast message
        print "Received Message ", message
        ChannelSubscriptionManager.broadcast(channel, json.dumps(message))
        #self.broadcast(self.participants, json.dumps(message))

    def on_close(self):
        print "connection closed"
        # Remove client from the clients list and broadcast leave message
        self.participants.remove(self)

        #self.broadcast(self.participants, "Someone left.")

    @property
    def session_id(self):
        return self.session.session_id

if __name__ == "__main__":
    import logging
    logging.getLogger().setLevel(logging.DEBUG)

    # 1. Create chat router
    ChatRouter = sockjs.tornado.SockJSRouter(ChatConnection, '/chat')
    WindRouter = sockjs.tornado.SockJSRouter(ChatConnection, '/wind')

    urls = [(r"/build/wind/wind.js", StaticFilesHandler), (r"/", IndexHandler),  ] + ChatRouter.urls + WindRouter.urls

    # 2. Create Tornado application
    app = tornado.web.Application(
            urls
    )

    for url in urls:
        print url
    # 3. Make Tornado app listen on port 8080
    app.listen(8080)

    # 4. Start IOLoop
    tornado.ioloop.IOLoop.instance().start()
