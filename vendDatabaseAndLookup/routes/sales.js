const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/get-unknown-customer', salesController.getUnknownCustomerSales);
router.get('/get-line-items', salesController.getSaleLineItems);
router.get('/get-payment', salesController.getPaymentDetails);

module.exports = router;
