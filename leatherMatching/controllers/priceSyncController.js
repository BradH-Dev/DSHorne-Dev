const fileService = require('../services/fileService');

exports.saveData = async (req, res) => {
  try {
    await fileService.writeJSON('tableData.json', req.body);
    res.json({ message: 'Data saved successfully' });
  } catch (err) {
    console.error('Error writing to file:', err);
    res.status(500).json({ message: 'Failed to save data' });
  }
};

exports.loadData = async (req, res) => {
  try {
    const data = await fileService.readJSON('tableData.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load data' });
  }
};
