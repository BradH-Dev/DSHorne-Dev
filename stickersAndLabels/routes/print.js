const express = require('express');
const router = express.Router();
const { printPdfFromUrl, uploadAndPrintPdf } = require('../controllers/printController');

router.post('/url', printPdfFromUrl);
router.post('/upload', uploadAndPrintPdf);

module.exports = router;
