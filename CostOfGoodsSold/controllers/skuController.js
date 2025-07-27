const { processAndWriteSKUs, readIdsFromCSV, batchRetrieveItems, writeResultsWithCategories, processCsvData } = require('../services/squareService');
const csvMutex = require('../middlewares/mutex');
const { sleep } = require('../utils/helpers');

exports.fullProcess = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('retry: 999999999\n\n');

  const keepAlive = setInterval(() => res.write(':\n\n'), 20000);
  const sendUpdate = msg => res.write(`data: ${msg}\n\n`);

  const release = await csvMutex.acquire();

  try {
    sendUpdate("Collating SKUs and gathering category information...");
    await processAndWriteSKUs();
    await sleep(2000);

    sendUpdate("Retrieving sold item details and categories...");
    const ids = await readIdsFromCSV('scan_results.csv');
    const items = await batchRetrieveItems(ids);
    await writeResultsWithCategories('scan_results.csv', items);
    await sleep(3000);

    sendUpdate("Matching and formatting final CSV...");
    await processCsvData();

  } catch (err) {
    console.error("Full process failed:", err);
    sendUpdate("ERROR: " + err.message);
  } finally {
    res.write('event: done\ndata: OK\n\n');
    clearInterval(keepAlive);
    await sleep(500);
    res.end();
    release();
  }
};

exports.processSkus = async (req, res) => {
  const release = await csvMutex.acquire();
  try {
    await processAndWriteSKUs();
    res.status(200).send("SKUs processed and written to scan_results.csv.");
  } catch (error) {
    console.error('Error processing SKUs:', error);
    res.status(500).send("Failed to process SKUs.");
  } finally {
    release();
  }
};

exports.batchRetrieve = async (req, res) => {
  const release = await csvMutex.acquire();
  try {
    const ids = await readIdsFromCSV('scan_results.csv');
    const items = await batchRetrieveItems(ids);
    await writeResultsWithCategories('scan_results.csv', items);
    res.send("Batch retrieve complete.");
  } catch (error) {
    console.error('Error in batch retrieve:', error);
    res.status(500).send("Failed batch retrieve.");
  } finally {
    release();
  }
};
