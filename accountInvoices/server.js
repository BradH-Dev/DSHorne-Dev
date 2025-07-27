require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { setupWebSocket } = require('./websocket');
const quoteUtils = require('./utils/quoteUtils');

// Route imports
const quoteRoutes = require('./routes/quote');
const categoryRoutes = require('./routes/category');
const squareRoutes = require('./routes/square');

const app = express();
const PORT = 1236;
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/quotes', quoteRoutes);
app.use('/category', categoryRoutes);
app.use('/api', squareRoutes);

// WebSocket
setupWebSocket(server);

// Start
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

quoteUtils.loadQuotes();
quoteUtils.scheduleDailyReset();
