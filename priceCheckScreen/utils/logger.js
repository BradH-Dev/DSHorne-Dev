const fs = require('fs');

let writing = false;
const writeQueue = [];

function writeLogEntrySafely(logEntry) {
  return new Promise((resolve, reject) => {
    const attemptWrite = () => {
      if (!writing) {
        writing = true;
        try {
          const filePath = 'barcode_log.csv';
          let fileContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
          const lines = fileContent.trim().split('\n');
          const header = lines[0] || 'Time of request,Searched barcode,Returned item name,Returned price,Returned image URL';
          const existingData = lines.slice(1);

          const updatedContent = [header, logEntry.trim(), ...existingData].join('\n') + '\n';
          fs.writeFileSync(filePath, updatedContent);

          resolve();
        } catch (err) {
          reject(err);
        } finally {
          writing = false;
          if (writeQueue.length > 0) {
            setImmediate(writeQueue.shift());
          }
        }
      } else {
        writeQueue.push(attemptWrite);
      }
    };

    attemptWrite();
  });
}

module.exports = { writeLogEntrySafely };
