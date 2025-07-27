const express = require('express');
const router = express.Router();
const csvController = require('../controllers/csvController');

router.post('/generate', csvController.generateCsv);
router.post('/process', csvController.processCsv);
router.post('/processed-details', csvController.downloadProcessedDetails);
router.post('/update', csvController.updateCategory);
router.get('/getCategories', csvController.serveCategoriesCsv);

module.exports = router;
