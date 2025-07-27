const { processUploadedFile } = require('../services/fileUtils');

let lastUploadedFilePath = '';

exports.handleFileUpload = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  lastUploadedFilePath = file.path;
  try {
    await processUploadedFile(file.path);
    await new Promise(r => setTimeout(r, 2000));
    res.json({ message: 'File processed successfully. Click "Generate report" now.' });
  } catch (err) {
    console.error('Error processing file:', err);
    res.status(500).json({ message: 'Failed to process the uploaded file' });
  }
};

exports.getLastUploadedFilePath = () => lastUploadedFilePath;
