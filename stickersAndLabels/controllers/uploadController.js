const path = require('path');
const fs = require('fs');
const pdfDir = path.join(__dirname, '../shared/pdfs');

if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

let counter = 0;

exports.uploadAndStorePdf = (req, res) => {
  if (!req.files?.pdf) return res.status(400).send('No files were uploaded.');

  const filename = `barcodes${counter % 10}.pdf`;
  const filepath = path.join(pdfDir, filename);
  counter++;

  req.files.pdf.mv(filepath, err => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'File uploaded successfully', url: `/pdfs/${filename}` });
  });
};
