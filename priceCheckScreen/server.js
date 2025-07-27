const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
require('dotenv').config();
const barcodeRoutes = require('./routes/barcode');
const { processBarcodeScan, startKeepAliveTask } = require('./controllers/barcodeController');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 4101;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/barcode', barcodeRoutes);

// WebSocket logic
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received:', message);
    const { barcode } = JSON.parse(message);
    processBarcodeScan(barcode, ws);
  });

  ws.send(JSON.stringify({ message: 'scanBarcode' }));
});

startKeepAliveTask();

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
