const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const itemController = require('../controllers/itemController');
const inventoryController = require('../controllers/inventoryController');

// Order endpoints
router.post('/orders/search', orderController.searchOrders);
router.post('/orders/batch-retrieve', orderController.batchRetrieveOrders);

// Item endpoints
router.post('/items/search', itemController.searchItems);
router.post('/items/batch-details', itemController.getItemDetailsBatch);

// Inventory endpoints
router.post('/stock/update', inventoryController.updateStock);

module.exports = router;
