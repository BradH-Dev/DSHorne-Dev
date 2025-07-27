const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');

router.get('/get-details', customersController.getCustomerDetails);
router.get('/get-sales', customersController.getCustomerSales);
router.post('/search-all', customersController.searchAllCustomers);


module.exports = router;