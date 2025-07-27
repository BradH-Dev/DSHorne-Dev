const express = require('express');
const router = express.Router();
const { forwardSearchRequest, forwardItemRequest } = require('../controllers/proxyController');

router.post('/', forwardSearchRequest);
router.post('/item', forwardItemRequest);

module.exports = router;
