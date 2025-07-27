require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const uploadRoutes = require('./routes/uploadRoutes');
const csvRoutes = require('./routes/csvRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const skuRoutes = require('./routes/skuRoutes');
const { fetchAndUpdateCSV } = require('./services/squareService');

const app = express();
const port = 7001;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/upload', uploadRoutes);
app.use('/csv', csvRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/skus', skuRoutes);

app.get('/', async (req, res) => {
  await fetchAndUpdateCSV();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
