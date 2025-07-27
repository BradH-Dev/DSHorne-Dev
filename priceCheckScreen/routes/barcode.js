const express = require('express');
const router = express.Router();
const { processBarcodeScan } = require('../controllers/barcodeController');

router.post('/scan', async (req, res) => {
  const { barcode } = req.body;
  try {
    await processBarcodeScan(barcode, null); // No WebSocket
    res.status(200).json({ message: 'Scan processed.' });
  } catch (error) {
    res.status(500).json({ error: 'Scan failed.' });
  }
});

module.exports = router;
