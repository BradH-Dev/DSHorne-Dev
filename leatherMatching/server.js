require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');

// Logger to file
require('./middleware/logger')();

const app = express();
const PORT = 2501;
const server = http.createServer(app);

// Static and JSON
app.use(express.json());
app.use(express.static('public'));

// Route imports
const loggingRoutes = require('./routes/loggingRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const orderRoutes = require('./routes/orderRoutes');
const priceSyncRoutes = require('./routes/priceSyncRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Sockets
const io = require('./services/socketService').init(server);

app.use('/logging', loggingRoutes);
app.use('/catalog', catalogRoutes);
app.use('/orders', orderRoutes);
app.use('/priceSync', priceSyncRoutes);
app.use('/webhook', webhookRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
