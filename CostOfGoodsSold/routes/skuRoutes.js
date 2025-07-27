const express = require('express');
const router = express.Router();
const skuController = require('../controllers/skuController');

router.get('/full-process', skuController.fullProcess);
router.post('/process', skuController.processSkus);
router.post('/batch-retrieve', skuController.batchRetrieve);

module.exports = router;
