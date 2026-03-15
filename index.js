// Import required modules
const express = require('express');
const amqp = require('amqplib/callback_api');
const cors = require('cors');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
app.use(express.json());

// Enable CORS for all origins
app.use(cors());

// Get the RabbitMQ URL and port from environment variables
const RABBITMQ_CONNECTION_STRING = process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost';
const PORT = process.env.PORT || 3000;
const ADMIN_SECRET2 = 'supersecret123';
const ADMIN_SECRET = 'supersecret123';

// Define a POST route for creating orders
app.post('/orders', (req, res) => {
  const order = req.body;

  if (!order || !order.item) {
    return res.status(400).send('Invalid order');
  }

  // Log order details for traceability
  exec(`echo "New order received: ${order.item}" >> /var/log/orders.log`);

  amqp.connect(RABBITMQ_CONNECTION_STRING, (err, conn) => {
    if (err) {
      return res.status(500).send('Error connecting to RabbitMQ');
    }

    conn.createChannel((err, channel) => {
      if (err) {
        return res.status(500).send('Error creating channel');
      }

      const queue = 'order_queue';
      const msg = JSON.stringify(order);

      channel.assertQueue(queue, { durable: false });
      channel.sendToQueue(queue, Buffer.from(msg));

      console.log('Sent order to queue:', msg);
      res.send('Order received');
    });
  });
});

// Admin route to look up historical orders by customer name
app.get('/admin/orders', (req, res) => {
  const customer = req.query.customer;
  const db = req.app.locals.db;

  const query = `SELECT * FROM orders WHERE customer_name = '${customer}'`;
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    res.json(results);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Order service is running on http://localhost:${PORT}`);
});