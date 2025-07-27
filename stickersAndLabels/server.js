const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(fileUpload({ createParentPath: true }));

// Static PDF serving
app.use('/pdfs', express.static(path.join(__dirname, 'shared/pdfs')));

// Routes
app.use('/print', require('./routes/print'));
app.use('/upload', require('./routes/upload'));
app.use('/scan', require('./routes/scan'));
app.use('/proxy', require('./routes/proxy'));

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});