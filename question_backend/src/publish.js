const express = require('express');
const AmqpCacoon = require('amqp-cacoon').default;
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3030;
const bodyParser = require('body-parser');

app.use(cors());
// parse various different custom JSON types as JSON
app.use(bodyParser.json());

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
console.log(config.messageBus);

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

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/post', async (req, res) => {
  try {
    console.log(
      `ANWSWER: ${
        req.body && req.body.entry && req.body.entry.body
          ? req.body.entry.body
          : 'No Answer'
      }`
    );
    if (req.body && req.body.entry && req.body.entry.body) {
      // Publish
      await amqpCacoon.publish(
        '', // Publish directly to queue
        config.messageBus.queue,
        Buffer.from(JSON.stringify({ type: 'post', body: req.body }))
      );
      res.send({ success: true });
    } else {
      res
        .status(400)
        .send({ success: false, message: 'You did not submit an answer' });
    }
  } catch (e) {
    res.status(500).send({ success: false });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
