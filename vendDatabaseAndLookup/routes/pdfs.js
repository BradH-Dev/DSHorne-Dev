const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const PDF_DIR = path.join(__dirname, '../public/shared/pdfs');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

// Track a rolling counter in memory
let counter = 0;

// Use multer to parse multipart/form-data for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Take the client-generated PDF and save it locally on a ring buffer of 10 PDFs (oldest deleted first)
router.post('/save', upload.single('pdf'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });

    const filename = `pdf${counter % 10}.pdf`;
    const filepath = path.join(PDF_DIR, filename);
    const publicPath = `/shared/pdfs/${filename}`;
    counter++;

    fs.writeFile(filepath, req.file.buffer, (err) => {
        if (err) {
            console.error('Error saving PDF:', err);
            return res.status(500).json({ error: 'Failed to save PDF.' });
        }

        return res.json({ url: publicPath });
    });
});

module.exports = router;
