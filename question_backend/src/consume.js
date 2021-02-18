const express = require('express');
const AmqpCacoon = require('amqp-cacoon').default;
const fetch = require('node-fetch');

const config = {
  messageBus: {
    // Protocol should be "amqp" or "amqps"
    protocol: process.env.RABBITMQ_PROTOCOL || 'amqp',
    // Username + Password on the RabbitMQ host
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD,
    // Host
    host: process.env.RABBITMQ_HOST,
    // Port
    port: process.env.RABBITMQ_PORT || 5672,
    // Queue setup
    queue: process.env.RABBITMQ_QUEUE,
  },
};

let amqpCacoon = new AmqpCacoon({
  protocol: config.messageBus.protocol,
  username: config.messageBus.username,
  password: config.messageBus.password,
  host: config.messageBus.host,
  port: config.messageBus.port,
  amqp_opts: {},
  providers: {},
  onChannelConnect: async function (channel) {
    if (channel) {
      await channel.assertQueue(config.messageBus.queue);
    }
  },
});

console.log('Starting');

// Consume batch of message at a time. Configuration for time based or size based batching is provided
amqpCacoon.registerConsumerBatch(
  config.messageBus.queue,
  async (channel, batch) => {
    try {
      console.log('Messsage length', batch.messages.length);
      let posts = {
        //entry: { body: j.body },
        //addedContexts: null,
      };
      for (let msg of batch.messages) {
        let m = JSON.parse(msg.content.toString());
        if (m.type === 'post' && m.body && m.body.addedContexts) {
          posts[m.body.addedContexts] = posts[m.body.addedContexts] || {
            entry: { body: '' },
            addedContexts: m.body.addedContexts,
          };
          posts[m.body.addedContexts].entry.body += '\r\n' + m.body.entry.body;
        }
      }
      for (let key in posts) {
        console.log('Key:', key);
        let m = posts[key];
        console.log('message:', m);
        await fetch(process.env.INFRANODE_POST_URL, {
          method: 'POST',
          body: JSON.stringify(m),
          headers: {
            authorization: process.env.INFRANODE_AUTORIZATION_HEADER,
            'Content-Type': 'application/json',
          },
        });
      }
      batch.ackAll(); // To ack all messages
    } catch (e) {
      console.log('Error: ', e);
      batch.nackAll(); // To nack all messages
    }
  },
  {
    batching: {
      maxTimeMs: 30000, // Don't provide messages to the callback until at least 60000 ms have passed
      maxSizeBytes: 1000000,
    },
  }
);
