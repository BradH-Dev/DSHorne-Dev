
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { getMostRecentUpload, writeDetailsToCSV, writeCSV, readCSVWithRetry } = require('./fileUtils');

const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;

exports.fetchAllItemVariations = async () => {
  let items = [];
  let cursor = null;

  do {
    const res = await axios.get('https://connect.squareup.com/v2/catalog/list', {
      params: { types: 'ITEM_VARIATION', cursor },
      headers: {
        'Square-Version': '2024-03-20',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.data.objects) {
      items.push(...res.data.objects);
      cursor = res.data.cursor || null;
    } else {
      break;
    }
  } while (cursor);

  return items;
};

exports.processAndWriteSKUs = async () => {
  const allItems = await exports.fetchAllItemVariations();
  const skuToItemIdMap = new Map(allItems.map(item => [item.item_variation_data.sku, item.item_variation_data.item_id]));

  const results = [];
  const filePath = getMostRecentUpload();
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', data => {
      const itemID = skuToItemIdMap.get(data.SKU);
      if (itemID) results.push({ SKU: data.SKU, ItemID: itemID });
    })
    .on('end', async () => {
      const writer = createObjectCsvWriter({
        path: 'scan_results.csv',
        header: [
          { id: 'SKU', title: 'SKU' },
          { id: 'ItemID', title: 'ItemID' }
        ]
      });
      await writer.writeRecords(results);
      console.log('scan_results.csv updated');
    });
};

exports.readIdsFromCSV = async (filePath) => {
  const ids = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', row => {
        if (row.ItemID) ids.push(row.ItemID.trim());
      })
      .on('end', () => resolve(ids))
      .on('error', reject);
  });
};

exports.batchRetrieveItems = async (allIds, batchSize = 100) => {
  let results = [];
  const maxRetries = 100;

  for (let i = 0; i < allIds.length; i += batchSize) {
    const batch = allIds.slice(i, i + batchSize);
    let retries = 0;
    let success = false;

    while (!success && retries < maxRetries) {
      try {
        const response = await axios.post(
          'https://connect.squareup.com/v2/catalog/batch-retrieve',
          { object_ids: batch },
          {
            headers: {
              'Square-Version': '2024-06-04',
              'Authorization': `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        results = results.concat(response.data.objects);
        success = true;
      } catch (error) {
        retries++;
        console.error(`Retry ${retries} failed for batch ${i}: ${error.message}`);
        if (retries === maxRetries) console.error('Skipping failed batch.');
      }
    }
  }

  return results;
};

exports.writeResultsWithCategories = async (filePath, items) => {
  const map = items.reduce((acc, item) => {
    acc[item.id] = item.item_data?.reporting_category?.id || 'No Category';
    return acc;
  }, {});

  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', row => {
        results.push({
          SKU: row.SKU,
          ItemID: row.ItemID,
          ReportingCategory: map[row.ItemID] || 'No Category'
        });
      })
      .on('end', async () => {
        const writer = createObjectCsvWriter({
          path: filePath,
          header: [
            { id: 'SKU', title: 'SKU' },
            { id: 'ItemID', title: 'ItemID' },
            { id: 'ReportingCategory', title: 'ReportingCategory' }
          ],
          append: false
        });

        await writer.writeRecords(results);
        console.log('scan_results.csv updated with categories');
        resolve();
      })
      .on('error', reject);
  });
};

exports.processCsvData = async () => {
  const scanResults = await readCSVWithRetry('scan_results.csv');
  const categories = await readCSVWithRetry('categories.csv');
  const filePath = getMostRecentUpload();
  const costs = await readCSVWithRetry(filePath);

  const updated = costs.map(cost => {
    const match = scanResults.find(s => s.SKU === cost.SKU);
    const category = categories.find(c => c.ID === match?.ReportingCategory);
    return { ...cost, Selection: category?.SELECTION || 'uncategorised' };
  });

  await writeCSV(filePath, updated);
  await writeDetailsToCSV('processed_details.csv', updated);
};

exports.fetchAndUpdateCSV = async () => {
  try {
    let cursor = '';
    const categories = [];

    do {
      const url = `https://connect.squareup.com/v2/catalog/list?types=CATEGORY${cursor ? `&cursor=${cursor}` : ''}`;
      const response = await axios.get(url, {
        headers: {
          'Square-Version': '2024-05-15',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const fetched = response.data.objects.filter(cat => cat.category_data?.is_top_level);
      categories.push(...fetched.map(cat => ({
        name: cat.category_data.name,
        id: cat.id
      })));

      cursor = response.data.cursor || '';
    } while (cursor);

    const existing = await readCSVWithRetry('categories.csv').catch(() => []);
    const recordMap = new Map(existing.map(r => [r.ID, { ...r, SELECTION: r.SELECTION || '' }]));

    categories.forEach(apiRec => {
      const existing = recordMap.get(apiRec.id);
      if (existing) existing.NAME = apiRec.name;
      else recordMap.set(apiRec.id, { NAME: apiRec.name, ID: apiRec.id, SELECTION: '' });
    });

    const apiIds = new Set(categories.map(c => c.id));
    for (const id of recordMap.keys()) {
      if (!apiIds.has(id)) recordMap.delete(id);
    }

    const finalRecords = Array.from(recordMap.values());
    const csvWriter = createObjectCsvWriter({
      path: 'categories.csv',
      header: [
        { id: 'NAME', title: 'NAME' },
        { id: 'ID', title: 'ID' },
        { id: 'SELECTION', title: 'SELECTION' }
      ],
      append: false
    });

    await csvWriter.writeRecords(finalRecords);
  } catch (err) {
    console.error('Error updating category CSV:', err);
  }
};
