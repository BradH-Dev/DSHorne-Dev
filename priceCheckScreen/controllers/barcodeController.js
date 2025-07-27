const axios = require('axios');
const { writeLogEntrySafely } = require('../utils/logger');

const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;
const keepAliveBarcodes = ["10486", "N783565", "10374", "14245", "10763", "11290"];

function getRandomDelay(minMinutes, maxMinutes) {
  const minMs = minMinutes * 60 * 1000;
  const maxMs = maxMinutes * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function startKeepAliveTask() {
  const delay = getRandomDelay(10, 25);
  setTimeout(async () => {
    const randomBarcode = keepAliveBarcodes[Math.floor(Math.random() * keepAliveBarcodes.length)];
    console.log(`[Keep-Alive] Running dummy scan for barcode: ${randomBarcode}`);
    await processBarcodeScan(randomBarcode, null);
    startKeepAliveTask();
  }, delay);
}

async function processBarcodeScan(barcode, ws) {
  let imageUrl, logEntry;
  const now = new Date();
  const formattedTime = now.toLocaleString('en-AU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true
  }).replace(',', '');

  try {
    if (ws) ws.send(JSON.stringify({ message: 'searching1' }));

    let response = await searchCatalog(barcode, 'upc');
    if (!(response.data.objects?.length > 0)) {
      response = await searchCatalog(barcode, 'sku');
    }

    if (response.data.objects?.length > 0) {
      if (ws) ws.send(JSON.stringify({ message: 'fetching' }));
      const item = response.data.objects[0].item_variation_data;
      let itemName = item.name;
      const itemId = item.item_id;
      const amount = item.price_money.amount / 100;
      const currency = item.price_money.currency;
      const imageId = item.image_ids?.[0];

      let detailedName = itemName;
      if (itemName === "Regular") {
        const res = await fetchItem(itemId);
        itemName = res.name;
        imageUrl = res.imageUrl;
      } else {
        const res = await fetchItemWithImage(itemId, imageId);
        itemName = res.name + " - " + itemName;
        imageUrl = res.imageUrl;
      }

      logEntry = `${formattedTime},${barcode},${ws ? itemName : 'KEEP API FRESH - ' + itemName},$${amount.toFixed(2)},${imageUrl}\n`;

      if (ws) {
        ws.send(JSON.stringify({
          price: `$${amount.toFixed(2)}`,
          currency, itemName, imageUrl
        }));
      }
    } else {
        console.log("opo");
      const msg = "Unknown product. Please try scanning again now, or ask a team member for assistance. <br><br><strong>Please note:</strong><br><br><i>Clothing cannot be price-checked. Pricing sheets are posted on walls near the clothing displays.</i>";
      logEntry = `${formattedTime},${barcode},${ws ? 'UNKNOWN PRODUCT' : 'KEEP API FRESH - UNKNOWN PRODUCT'},N/A,N/A\n`;
      if (ws) ws.send(JSON.stringify({ message: msg }));
    }

    await writeLogEntrySafely(logEntry);
  } catch (error) {
    console.error(error);
    if (ws) ws.send(JSON.stringify({ message: 'Server error' }));
  }
}

function searchCatalog(barcode, attribute) {
  return axios.post('https://connect.squareup.com/v2/catalog/search', {
    query: { exact_query: { attribute_value: barcode, attribute_name: attribute } },
    object_types: ["ITEM_VARIATION"],
    begin_time: "2024-04-07T04:40:41.397Z",
  }, {
    headers: {
      'Square-Version': '2024-03-20',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

async function fetchItem(itemId) {
  const res = await axios.get(`https://connect.squareup.com/v2/catalog/object/${itemId}`, {
    headers: {
      'Square-Version': '2024-03-20',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  return {
    name: res.data.object?.item_data?.name || 'Unknown',
    imageUrl: res.data.object?.item_data?.ecom_image_uris?.[0] || res.data.object?.item_data?.ecom_image_uri || null
  };
}

async function fetchItemWithImage(itemId, imageId) {
  const res = await axios.get(`https://connect.squareup.com/v2/catalog/object/${itemId}?include_related_objects=true`, {
    headers: {
      'Square-Version': '2025-01-23',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const objects = res.data.related_objects || [];
  const matchedImage = objects.find(obj => obj.type === "IMAGE" && obj.id === imageId);
  const imageUrl = matchedImage?.image_data?.url || res.data.object?.item_data?.ecom_image_uris?.[0] || null;

  return {
    name: res.data.object?.item_data?.name || 'Unknown',
    imageUrl
  };
}

module.exports = { processBarcodeScan, startKeepAliveTask };
