const { getMostRecentUpload } = require('../services/fileUtils');
const { createObjectCsvWriter } = require('csv-writer');
const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs');

const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;
const teamMemberId = 'TMR2KGMEDAS_qR2y';

exports.generateInvoiceCsv = async (req, res) => {
  const { updatedAfter, updatedBefore } = req.body;
  const matchingAdjustments = [];
  let cursor = null;

  try {
    // Step 1: Get inventory changes
    do {
      const payload = {
        types: ['ADJUSTMENT'],
        updated_after: updatedAfter,
        updated_before: updatedBefore,
        states: ['SOLD']
      };

      if (cursor) payload.cursor = cursor;

      const response = await axios.post(
        'https://connect.squareup.com/v2/inventory/changes/batch-retrieve',
        payload,
        {
          headers: {
            'Square-Version': '2024-05-15',
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { changes = [], cursor: newCursor } = response.data;

      for (const change of changes) {
        const adj = change.adjustment;
        if (
          change.type === 'ADJUSTMENT' &&
          adj &&
          (adj.source?.product === "EXTERNAL_API" || adj.team_member_id === teamMemberId) &&
          adj.from_state === 'IN_STOCK' &&
          adj.to_state === 'SOLD'
        ) {
          matchingAdjustments.push({
            catalog_object_id: adj.catalog_object_id,
            quantity: parseFloat(adj.quantity).toFixed(2)
          });
        }
      }

      cursor = newCursor;
    } while (cursor);

    if (matchingAdjustments.length === 0) {
      return res.status(200).json({ message: 'No invoice adjustments found for the given date range.' });
    }

    // Step 2: Get catalog data
    const catalogResponse = await axios.post(
      'https://connect.squareup.com/v2/catalog/batch-retrieve',
      {
        object_ids: matchingAdjustments.map(adj => adj.catalog_object_id)
      },
      {
        headers: {
          'Square-Version': '2024-05-15',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const idToDetails = {};
    for (const obj of catalogResponse.data.objects) {
      if (obj.type === 'ITEM_VARIATION' && obj.item_variation_data?.sku) {
        const sku = obj.item_variation_data.sku;
        const vendorInfo = obj.item_variation_data.item_variation_vendor_infos?.[0]?.item_variation_vendor_info_data;
        const unitCost = vendorInfo?.price_money?.amount || 0;

        idToDetails[obj.id] = {
          sku,
          unitCost: unitCost / 100
        };
      }
    }

    const invoiceRows = matchingAdjustments.map(adj => {
      const details = idToDetails[adj.catalog_object_id] || {};
      const totalCost = (details.unitCost || 0) * adj.quantity;
      return {
        'Item Name': '',
        'Item Variation Name': '',
        'GTIN': '',
        'SKU': details.sku || '',
        'Qty Sold': adj.quantity,
        'Unit': '',
        'Cost of Goods Sold': totalCost.toFixed(2),
        'Average Cost': '',
        'Average Revenue': '',
        'Total Revenue': '',
        'Profit': '',
        'Profit Margin': ''
      };
    });

    // Append to existing file
    const filePath = getMostRecentUpload();
    const headers = await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', resolve)
        .on('error', reject);
    });

    const appender = createObjectCsvWriter({
      path: filePath,
      header: headers.map(h => ({ id: h, title: h })),
      append: true
    });

    await appender.writeRecords(invoiceRows);

    // Downloadable invoice file
    const invoiceFilePath = 'invoices.csv';
    const downloader = createObjectCsvWriter({
      path: invoiceFilePath,
      header: [
        { id: 'Item Name', title: 'Item Name' },
        { id: 'Item Variation Name', title: 'Item Variation Name' },
        { id: 'GTIN', title: 'GTIN' },
        { id: 'SKU', title: 'SKU' },
        { id: 'Qty Sold', title: 'Qty Sold' },
        { id: 'Unit', title: 'Unit' },
        { id: 'Cost of Goods Sold', title: 'Cost of Goods Sold' },
        { id: 'Average Cost', title: 'Average Cost' },
        { id: 'Average Revenue', title: 'Average Revenue' },
        { id: 'Total Revenue', title: 'Total Revenue' },
        { id: 'Profit', title: 'Profit' },
        { id: 'Profit Margin', title: 'Profit Margin' },
        { id: 'Selection', title: 'Selection' }
      ]
    });

    await downloader.writeRecords(invoiceRows);

    res.download(invoiceFilePath, 'invoices.csv', err => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Could not download the file' });
      }
      fs.unlink(invoiceFilePath, () => {});
    });

  } catch (error) {
    console.error('Error in /get-invoices:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate invoice data' });
  }
};
