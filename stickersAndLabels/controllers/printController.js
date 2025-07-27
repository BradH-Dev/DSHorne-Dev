const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const pdfPrinter = require('pdf-to-printer');
const { writeFileAsync, cleanupFile } = require('../utils/pdfUtils');

exports.printPdfFromUrl = async (req, res) => {
  const { pdfUrl } = req.body;
  if (!pdfUrl) return res.status(400).json({ message: 'Invalid PDF URL' });

  try {
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfDoc = await PDFDocument.load(response.data);
    const pdfBytes = await pdfDoc.save();

    const filePath = path.join(__dirname, '../shared/temp_original.pdf');
    await writeFileAsync(filePath, pdfBytes);
    await pdfPrinter.print(filePath);
    cleanupFile(filePath);

    res.json({ message: 'Your label has been received by the printer successfully and should print momentarily' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Looks like there was an issue sending the label to the printer. Restart the printer and try again, then contact Brad' });
  }
};

exports.uploadAndPrintPdf = (req, res) => {
  if (!req.files?.pdf) return res.status(400).json({ message: 'No files were uploaded.' });

  const pdfFile = req.files.pdf;
  const tempPath = path.join(__dirname, `../shared/tempPrint_${Date.now()}.pdf`);

  pdfFile.mv(tempPath, async err => {
    if (err) return res.status(500).json({ message: 'Error moving file: ' + err.message });

    try {
      const a6Width = 4.13 * 72;
      const a6Height = 5.83 * 72;
      const pdfBytes = await fs.promises.readFile(tempPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const newPdfDoc = await PDFDocument.create();

      for (const page of pdfDoc.getPages()) {
        const embeddedPage = await newPdfDoc.embedPage(page);
        const [w, h] = [embeddedPage.width, embeddedPage.height];
        const scale = Math.min(a6Width / w, a6Height / h);
        const newPage = newPdfDoc.addPage([a6Width, a6Height]);
        newPage.drawPage(embeddedPage, {
          x: (a6Width - w * scale) / 2,
          y: (a6Height - h * scale) / 2,
          width: w * scale,
          height: h * scale
        });
      }

      const finalPath = path.join(__dirname, '../shared/temp_final.pdf');
      await fs.promises.writeFile(finalPath, await newPdfDoc.save());
      await pdfPrinter.print(finalPath);

      cleanupFile(finalPath);
      res.json({ message: 'Your label has been received by the printer successfully and should print momentarily' });
    } catch (e) {
      console.error('Print Error:', e);
      res.status(500).json({ message: 'Looks like there was an issue sending the label to the printer. Restart the printer and try again, then contact Brad' });
    } finally {
      cleanupFile(tempPath);
    }
  });
};
