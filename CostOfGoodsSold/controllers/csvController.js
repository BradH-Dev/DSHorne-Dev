const { getMostRecentUpload, writeDetailsToCSV } = require('../services/fileUtils');
const { parseCurrency } = require('../utils/helpers');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const csvMutex = require('../middlewares/mutex');
const { readCSVWithRetry, writeCSV } = require('../services/fileUtils');
const { getLastUploadedFilePath } = require('./uploadController');

exports.generateCsv = async (req, res) => {
  const release = await csvMutex.acquire();
  try {
    const filePath = getMostRecentUpload();
    const categorySums = {
      leather: 0, leathercraft: 0, souvenirs: 0, uncategorised: 0
    };

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => {
        const value = parseCurrency(data['Cost of Goods Sold']);
        if (categorySums.hasOwnProperty(data.Selection)) {
          categorySums[data.Selection] += value;
        }
      })
      .on('end', () => {
        const csvWriter = createObjectCsvWriter({
          path: 'newfile.csv',
          header: [
            { id: 'narration', title: 'Narration' },
            { id: 'date', title: 'Date' },
            { id: 'description', title: 'Description' },
            { id: 'accountCode', title: 'AccountCode' },
            { id: 'taxRate', title: 'TaxRate' },
            { id: 'amount', title: 'Amount' },
            { id: 'trackingName1', title: 'TrackingName1' },
            { id: 'trackingOption1', title: 'TrackingOption1' },
            { id: 'trackingName2', title: 'TrackingName2' },
            { id: 'trackingOption2', title: 'TrackingOption2' },
          ]
        });

        const records = Object.entries(categorySums).map(([key, val]) => ({
          narration: 'DRAFT Cost of Sales',
          date: new Date().toLocaleDateString('en-GB'),
          description: `Total ${key} sales`,
          accountCode: key === 'leather' ? '51200' :
                       key === 'leathercraft' ? '51550' :
                       key === 'souvenirs' ? '53100' : '51780',
          taxRate: 'BAS Excluded',
          amount: val.toFixed(2),
          trackingName1: '', trackingOption1: '',
          trackingName2: '', trackingOption2: ''
        }));

        csvWriter.writeRecords(records).then(() => {
          res.download('newfile.csv');
        });
      });
  } catch (err) {
    console.error('Failed to generate CSV:', err);
    res.status(500).send('Failed to generate CSV');
  } finally {
    release();
  }
};

exports.processCsv = async (req, res) => {
  const release = await csvMutex.acquire();
  try {
    const scanResults = await readCSVWithRetry('scan_results.csv');
    const categories = await readCSVWithRetry('categories.csv');
    const filePath = getMostRecentUpload();
    const costs = await readCSVWithRetry(filePath);

    const updatedCosts = costs.map(cost => {
      const match = scanResults.find(s => s.SKU === cost.SKU);
      const category = categories.find(c => c.ID === match?.ReportingCategory);
      return { ...cost, Selection: category?.SELECTION || 'uncategorised' };
    });

    await writeCSV(filePath, updatedCosts);
    await new Promise(r => setTimeout(r, 2000));
    await writeDetailsToCSV('processed_details.csv', updatedCosts);
    res.json({ message: 'CSV data processed successfully' });
  } catch (error) {
    console.error('Failed to process CSV:', error);
    res.status(500).json({ message: 'Failed to process CSV files' });
  } finally {
    release();
  }
};

exports.downloadProcessedDetails = (req, res) => {
  res.download('processed_details.csv');
};

exports.updateCategory = async (req, res) => {
  const { id, selection } = req.body;
  const records = await readCSVWithRetry('categories.csv');
  const updatedRecords = records.map(r => r.ID === id ? { ...r, SELECTION: selection } : r);

  const csvWriter = createObjectCsvWriter({
    path: 'categories.csv',
    header: [
      { id: 'NAME', title: 'NAME' },
      { id: 'ID', title: 'ID' },
      { id: 'SELECTION', title: 'SELECTION' }
    ]
  });

  await csvWriter.writeRecords(updatedRecords);
  res.status(200).send('Update successful');
};


exports.serveCategoriesCsv = (req, res) => {
    const filePath = path.join(__dirname, '..', 'categories.csv');
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('categories.csv not found');
    }
    res.sendFile(filePath);
  };