const express = require('express');
const router = express.Router();
const loggingController = require('../controllers/loggingController');

router.post('/addEntry', loggingController.updateLog);
router.get('/getLastUpdateTime', loggingController.getLastUpdateTime);

module.exports = router;
