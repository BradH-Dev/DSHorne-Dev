const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

router.post('/searchSquare', catalogController.search);
router.post('/getItemInfo', catalogController.batchRetrieve);
router.post('/sendUpdate', catalogController.updateInventory);
router.post('/getCount', catalogController.getInventory);


module.exports = router;
