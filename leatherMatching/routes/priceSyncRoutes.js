const express = require('express');
const router = express.Router();
const priceSyncController = require('../controllers/priceSyncController');

router.post('/saveData', priceSyncController.saveData);
router.get('/loadData', priceSyncController.loadData);

module.exports = router;
