const express = require('express');
const router = express.Router();
const { handleBarcodeScan } = require('../controllers/scanController');

router.post('/', handleBarcodeScan);

module.exports = router;
