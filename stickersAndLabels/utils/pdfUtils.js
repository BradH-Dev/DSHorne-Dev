const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

const cleanupFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch (_) {}
};

module.exports = {
  writeFileAsync,
  cleanupFile
};
