# -*- coding: utf-8 -*-
"""
    Simple sockjs-tornado chat application. By default will listen on port 8080.
"""
import tornado.ioloop
import tornado.web

import sockjs.tornado
import pylzma
import pika
from collections import defaultdict


class ConnectionManager(object):
    connections = defaultdict(set)

    @classmethod
    def subscribe_connection_to_channel(cls, channel_name, connection):
        cls.connections[channel_name].add(connection)

    @classmethod
    def remove_connection_from_channel(cls, channel_name, connection):
        cls.connections[channel_name].remove(connection)

    @classmethod
    def get_connections_for_channel(cls, channel_name):
        return cls.connections.get(channel_name, set())


class IndexHandler(tornado.web.RequestHandler):
    """Regular HTTP handler to serve the chatroom page"""
    def get(self):
        #arguments = self.request.arguments
        #print arguments
        #data  = arguments.get('data')[0]
        #data = pylzma.decompress(data)
        #print data
        self.render('index.html')

class MessagePushHandler(tornado.web.RequestHandler):
    """Regular HTTP handler to serve the chatroom page"""
    def get(self):
        message = self.get_argument('message', default=None)
        if not message:
            return
        clients = ConnectionManager.get_connections_for_channel('wind')
        RealtimeServer.broadcast(clients, message)


class RealtimeConnection(sockjs.tornado.SockJSConnection):
    """Chat connection implementation"""
    # Class level variable
    connection_manager = ConnectionManager

    def on_open(self, info):
        # Send that someone joined
        channel = 'wind'
        participants = self.connection_manager.get_connections_for_channel(channel)
        # Broadcast message
        self.broadcast(participants, 'someone joined')


        # Add client to the clients list
        print self.session.conn_info.__dict__
        self.connection_manager.subscribe_connection_to_channel(channel, self)

    def on_message(self, message):
        channel = 'wind'
        participants = self.connection_manager.get_connections_for_channel(channel)
        # Broadcast message
        self.broadcast(participants, message)

    def on_close(self):
        channel = 'wind'
        # Remove client from the clients list and broadcast leave message
        self.connection_manager.remove_connection_from_channel(channel, self)
        participants = self.connection_manager.get_connections_for_channel(channel)

        self.broadcast(participants, "Someone left.")


class RealtimeServer(object):
    router = sockjs.tornado.SockJSRouter(RealtimeConnection, '/chat')

    @classmethod
    def start_server(cls):
        urls = [(r"/", IndexHandler)] + cls.router.urls + [(r"/push/", MessagePushHandler)]
        app = tornado.web.Application(urls)

        app.listen(8080)
        tornado.ioloop.IOLoop.instance().start()

    @classmethod
    def broadcast(cls, clients, message):
        cls.router.broadcast(clients, message)



if __name__ == "__main__":
    import logging
    logging.getLogger().setLevel(logging.DEBUG)

    print "Starting server"
    RealtimeServer.start_server()

    # 1. Create chat router
    #RealtimeRouter = sockjs.tornado.SockJSRouter(RealtimeConnection, '/chat')

    # 2. Create Tornado application
    #app = tornado.web.Application(
    #        [(r"/", IndexHandler)] + RealtimeRouter.urls
    #)

    # 3. Make Tornado app listen on port 8080
    #app.listen(8080)

    # 4. Start IOLoop
    #tornado.ioloop.IOLoop.instance().start()
