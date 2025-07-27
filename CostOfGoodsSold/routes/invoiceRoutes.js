const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

router.post('/get', invoiceController.generateInvoiceCsv);

module.exports = router;
