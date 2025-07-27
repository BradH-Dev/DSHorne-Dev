const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

exports.processUploadedFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve())
      .on('error', reject);
  });
};

exports.getMostRecentUpload = () => {
  const files = fs.readdirSync('uploads')
    .map(name => ({ name, time: fs.statSync(`uploads/${name}`).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) throw new Error('No uploaded files found.');
  return `uploads/${files[0].name}`;
};

exports.writeDetailsToCSV = async (filename, data) => {
  let total = 0, freight = 0;

  const records = data.filter(i => i.Selection === 'uncategorised').map(item => {
    const firstKey = Object.keys(item)[0];
    const priceKey = Object.keys(item)[6];
    const price = parseFloat(item[priceKey].replace(/[$,]/g, '')) || 0;
    total += price;
    if (item[firstKey] === 'FREIGHT') freight = price;

    return {
      itemName: item[firstKey],
      selection: item.Selection,
      price: `$${price.toFixed(2)}`
    };
  });

  const netTotal = total - freight;

  const csvWriter = createObjectCsvWriter({
    path: filename,
    header: [
      { id: 'itemName', title: 'Item Name' },
      { id: 'selection', title: 'Selection' },
      { id: 'price', title: `Price (Net Total EXCLUDING freight: $${netTotal.toFixed(2)})` }
    ]
  });

  if (records.length > 0) {
    await csvWriter.writeRecords(records);
    console.log('Details written to CSV');
  } else {
    console.log('No uncategorised items to write.');
  }
};

exports.readCSVWithRetry = function readCSVWithRetry(filename, retries = 5) {
  return new Promise((resolve, reject) => {
    const attemptRead = attemptsLeft => {
      const results = [];
      const stream = fs.createReadStream(filename);
      stream
        .pipe(csv())
        .on('data', data => results.push(data))
        .on('end', () => resolve(results))
        .on('error', error => {
          if (error.code === 'EBUSY' && attemptsLeft > 0) {
            setTimeout(() => attemptRead(attemptsLeft - 1), 1000);
          } else {
            reject(error);
          }
        });
    };

    attemptRead(retries);
  });
};

exports.writeCSV = async (filename, data) => {
  const csvWriter = createObjectCsvWriter({
    path: filename,
    header: Object.keys(data[0]).map(k => ({ id: k, title: k })),
    append: false
  });

  await csvWriter.writeRecords(data);
  console.log('CSV file written:', filename);
};
