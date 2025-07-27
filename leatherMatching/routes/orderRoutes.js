const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/getDetails', orderController.getOrderDetails);

module.exports = router;
