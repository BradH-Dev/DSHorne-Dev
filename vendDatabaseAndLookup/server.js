const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 6501;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/products', require('./routes/products'));
app.use('/api/pdfs', require('./routes/pdfs'));

// Fallback routes (HTML pages)
app.get('/customer-details', (req, res) => {
    res.sendFile(__dirname + '/public/search-customer/customer-details.html');
});

app.get('/unknown-details', (req, res) => {
    res.sendFile(__dirname + '/public/search-all/unknown-details.html');
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index/index.html');
});

// Server start
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});