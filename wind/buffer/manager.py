import pika
import threading
import requests


class BaseBufferBackend(object):
    @classmethod
    def queue_message(cls, queue, message):
        raise NotImplementedError

class RabbitMQBufferBackend(BaseBufferBackend):

    @classmethod
    def _get_connection_parameters(self):
        HOST = 'localhost'
        USERNAME = 'guest'
        PASSWORD = 'guest'

        credentials = pika.PlainCredentials(USERNAME, PASSWORD)
        parameters = pika.ConnectionParameters(
                host=HOST,
                credentials=credentials,
                heartbeat_interval=1)
        return parameters

    @classmethod
    def _get_connection(cls, queue):
        conn_params = cls._get_connection_parameters()
        connection = pika.BlockingConnection(conn_params)
        return connection

    @classmethod
    def queue_message(cls, queue, message):
        connection = cls._get_connection(queue)

        channel = connection.channel()
        channel.queue_declare(queue=queue)
        channel.basic_publish(exchange='',
                              routing_key=queue,
                              body=message)
        connection.close()

    @classmethod
    def consume_messages(cls, queue, callback):
        thread = threading.Thread(target=cls._consume_messages,
                                  args=(queue, callback))
        thread.start()

    @classmethod
    def _consume_messages(cls, queue, callback):
        connection = cls._get_connection(queue)
        channel = connection.channel()
        channel.queue_declare(queue=queue)
        channel.basic_consume(callback, queue=queue, no_ack=True)
        print "Consuming from queue", queue
        channel.start_consuming()

    @classmethod
    def _callback(cls, ch, method, properties, body):
        cls.push_message(body)

    @classmethod
    def push_message(cls, message):
        host = 'http://localhost:8080/push/'
        data = {
            'message': message
        }
        print "Pushing messages "
        requests.get(host, params=data)


class BufferManager(object):
    buffer_backend = None

    @classmethod
    def get_buffer_backend(cls):
        if cls.buffer_backend is None:
            cls.buffer_backend = RabbitMQBufferBackend
        return cls.buffer_backend

    @classmethod
    def buffer(cls, channel, message):
        buffer_backend = cls.get_buffer_backend()
        thread = threading.Thread(target=buffer_backend.queue_message,
                args=(channel, message))
        #buffer_backend.queue_message(channel, message)
        thread.start()

