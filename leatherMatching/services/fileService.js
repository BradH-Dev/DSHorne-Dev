const fs = require('fs').promises;

exports.readJSON = async (file) => {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    throw err;
  }
};

exports.writeJSON = async (file, data) => {
  try {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
  } catch (err) {
    throw err;
  }
};

exports.readFile = (file) => fs.readFile(file, 'utf8');
exports.writeFile = (file, data) => fs.writeFile(file, data);
