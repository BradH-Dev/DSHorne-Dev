const express = require('express');
const router = express.Router();
const { uploadAndStorePdf } = require('../controllers/uploadController');

router.post('/', uploadAndStorePdf);

module.exports = router;
