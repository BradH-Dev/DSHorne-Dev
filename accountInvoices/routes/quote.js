const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

router.post('/new-quote', quoteController.getNewQuote);

module.exports = router;
