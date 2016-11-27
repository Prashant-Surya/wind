# -*- coding: utf-8 -*-
"""
    Simple sockjs-tornado chat application. By default will listen on port 8080.
"""
import tornado.ioloop
import tornado.web

import sockjs.tornado
import json


from message_handler import MessageHandler


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
        self.render('build/wind/wind.min.js')


class PushMessagesAPIHandler(tornado.web.RequestHandler):
    def get(self):
        message = self.get_argument('message', default=None)
        if message is None:
            return

        try:
            message = json.loads(message)
        except Exception, e:
            print "Failed json loading ", e
            return

        handler = MessageHandler.get_handler()
        handler.handle_message(message, self)


class ChatConnection(sockjs.tornado.SockJSConnection):
    """Chat connection implementation"""
    def on_open(self, info):
        # Add client to the clients list
        print "Someone joined.."

    def on_message(self, message):
        print "Message received", message
        if not message:
            return

        try:
            message = json.loads(message)
        except Exception, e:
            print "Failed json loading ", e
            return

        handler = MessageHandler.get_handler()
        handler.handle_message(message, self)

    def on_close(self):
        print "connection closed"

    @property
    def session_id(self):
        return self.session.session_id

if __name__ == "__main__":
    import logging
    logging.getLogger().setLevel(logging.DEBUG)

    # 1. Create chat router
    ChatRouter = sockjs.tornado.SockJSRouter(ChatConnection, '/chat')
    WindRouter = sockjs.tornado.SockJSRouter(ChatConnection, '/wind')

    urls = [
        (r"/build/wind/wind.js", StaticFilesHandler),
        (r"/build/wind/wind.min.js", StaticFilesHandler),
        (r"/push", PushMessagesAPIHandler),
        (r"/", IndexHandler),  ] + ChatRouter.urls + WindRouter.urls

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
