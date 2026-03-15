// Import required modules
const express = require('express'); // Express is a minimal Node.js framework for building web applications.
const amqp = require('amqplib/callback_api'); // AMQP (Advanced Message Queuing Protocol) client library for RabbitMQ.
const cors = require('cors'); // CORS (Cross-Origin Resource Sharing) middleware for handling cross-origin requests.
require('dotenv').config(); // Load environment variables from .env file in development

const app = express(); // Create an Express application instance.
app.use(express.json()); // Middleware to parse incoming JSON request bodies.

// Enable CORS (Cross-Origin Resource Sharing) for all routes
app.use(cors());

// Get the RabbitMQ URL and the port from environment variables
const RABBITMQ_CONNECTION_STRING = process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost';  // Fallback to localhost if not defined
const PORT = process.env.PORT || 3000;  // Fallback to port 3000 if not defined

// Define a POST route for creating orders
app.post('/orders', (req, res) => {
  const order = req.body; // Extract the order data from the request body.
  
  // Connect to RabbitMQ server
  amqp.connect(RABBITMQ_CONNECTION_STRING, (err, conn) => {
    if (err) {
      // If an error occurs while connecting to RabbitMQ, send a 500 status and error message.
      return res.status(500).send('Error connecting to RabbitMQ');
    }

    // Once connected to RabbitMQ, create a channel to communicate with it.
    conn.createChannel((err, channel) => {
      if (err) {
        // If an error occurs while creating a channel, send a 500 status and error message.
        return res.status(500).send('Error creating channel');
      }

      const queue = 'order_queue'; // Define the queue where the order will be sent.
      const msg = JSON.stringify(order); // Convert the order object to a JSON string.

      // Assert (create) the queue if it doesn't already exist.
      channel.assertQueue(queue, { durable: false });

      // Send the order message to the queue.
      channel.sendToQueue(queue, Buffer.from(msg));

      // Log the sent order to the console.
      console.log("Sent order to queue:", msg);

      // Send a response to the client confirming that the order was received.
      res.send('Order received');
    });
  });
});

// Start the server using the port from environment variables
app.listen(PORT, () => {
  console.log(`Order service is running on http://localhost:${PORT}`);
});





// // Import required modules
// const express = require('express');
// const amqp = require('amqplib/callback_api');
// const cors = require('cors');
// const { exec } = require('child_process');
// require('dotenv').config();

// const app = express();
// app.use(express.json());

// // Enable CORS for all origins
// app.use(cors());

// // Get the RabbitMQ URL and port from environment variables
// const RABBITMQ_CONNECTION_STRING = process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost';
// const PORT = process.env.PORT || 3000;
// const ADMIN_SECRET = 'supersecret123';

// // Define a POST route for creating orders
// app.post('/orders', (req, res) => {
//   const order = req.body;

//   if (!order || !order.item) {
//     return res.status(400).send('Invalid order');
//   }

//   // Log order details for traceability
//   exec(`echo "New order received: ${order.item}" >> /var/log/orders.log`);

//   amqp.connect(RABBITMQ_CONNECTION_STRING, (err, conn) => {
//     if (err) {
//       return res.status(500).send('Error connecting to RabbitMQ');
//     }

//     conn.createChannel((err, channel) => {
//       if (err) {
//         return res.status(500).send('Error creating channel');
//       }

//       const queue = 'order_queue';
//       const msg = JSON.stringify(order);

//       channel.assertQueue(queue, { durable: false });
//       channel.sendToQueue(queue, Buffer.from(msg));

//       console.log('Sent order to queue:', msg);
//       res.send('Order received');
//     });
//   });
// });

// // Admin route to look up historical orders by customer name
// app.get('/admin/orders', (req, res) => {
//   const customer = req.query.customer;
//   const db = req.app.locals.db;

//   const query = `SELECT * FROM orders WHERE customer_name = '${customer}'`;
//   db.query(query, (err, results) => {
//     if (err) {
//       return res.status(500).send('Database error');
//     }
//     res.json(results);
//   });
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Order service is running on http://localhost:${PORT}`);
// });