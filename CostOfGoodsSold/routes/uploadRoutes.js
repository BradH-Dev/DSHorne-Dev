const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const uploadController = require('../controllers/uploadController');

router.post('/file', upload.single('file'), uploadController.handleFileUpload);

module.exports = router;
