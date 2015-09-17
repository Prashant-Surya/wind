# -*- coding: utf-8 -*-
"""
    Simple sockjs-tornado chat application. By default will listen on port 8080.
"""
import tornado
import tornado.ioloop
import tornado.web

import sockjs.tornado

import pylzma
from manager import BufferManager
import json

class MessagePushBufferHandler(tornado.web.RequestHandler):
    """Handler to buffer realtime messages.
    """
    def get(self):
        payload = self.get_argument('p', default=None)
        if not payload:
            return
        channel = self.get_argument('ch', None)
        if not channel:
            return
        BufferManager.buffer(channel, payload)


if __name__ == "__main__":

    import logging
    logging.getLogger().setLevel(logging.DEBUG)

    app = tornado.web.Application(
            [(r"/", MessagePushBufferHandler)]
    )

    app.listen(8081)

    tornado.ioloop.IOLoop.instance().start()
