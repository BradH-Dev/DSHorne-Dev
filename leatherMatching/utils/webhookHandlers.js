const fileService = require('../services/fileService');
const squareService = require('../services/squareService');
const socketService = require('../services/socketService');
const uuidv4 = require('./uuid');
const sleep = require('./sleep');

async function forceUpdateInventory(onlineToken, quantity) {
  const idempotency_key = uuidv4();
  const changes = {
    idempotency_key,
    changes: [{
      type: "PHYSICAL_COUNT",
      physical_count: {
        state: "IN_STOCK",
        catalog_object_id: onlineToken,
        location_id: "L8YQAQM3A2XMJ",
        occurred_at: new Date().toISOString(),
        quantity: quantity.toString(),
        team_member_id: "TMR2KGMEDAS_qR2y"
      }
    }]
  };

  try {
    await squareService.inventoryChangesBatchCreate(changes);
    console.log('SUCCESSFUL! Stock has been adjusted in Square');
  } catch (error) {
    console.error('Error sending inventory update:', error.message);
  }
}

async function updateOnlinePrices(filePath, inStoreInventoryDetails, onlineInventoryDetails) {
  try {
    const jsonData = await fileService.readJSON(filePath);
    for (const item of jsonData) {
      let inStoreDetail, inStorePrice, inStoreQuantity, onlineDetail;
      if (inStoreInventoryDetails[item["In-store Token"]]) {
        inStoreDetail = inStoreInventoryDetails[item["In-store Token"]];
        inStorePrice = parseFloat(item["In-store Price (for reference)"].replace('$', '')).toFixed(2);
        inStoreQuantity = inStoreDetail.quantity;
      }
      if (onlineInventoryDetails[item["Online Token"]]) {
        onlineDetail = onlineInventoryDetails[item["Online Token"]];
        item["Online Item"] = onlineDetail.name;
        item["Online Price (for reference)"] = `$${onlineDetail.price.toFixed(2)}`;
        const onlinePrice = onlineDetail.price;
        const onlineReduction = (inStorePrice / onlinePrice).toFixed(2);
        const inStoreReduction = (onlinePrice / inStorePrice).toFixed(2);
        item["Online will reduce by (per 1x square unit in-store sale)..."] = onlineReduction;
        item["In-store will reduce by (per 1x online sale)..."] = inStoreReduction;
        let calculatedValue = Math.floor(inStoreQuantity * onlineReduction) - 1;
        if (calculatedValue < 0) calculatedValue = 0;
        await forceUpdateInventory(item["Online Token"], calculatedValue);
      } else {
        console.log('For this token, no changes were found:', item["In-store Token"]);
      }
    }
    await fileService.writeJSON(filePath, jsonData);
    console.log('In-store prices updated based on inventory details.');
  } catch (err) {
    console.error('Failed to read or write to file, or fetch catalog data:', err);
    throw err;
  }
}

async function updateInStorePrices(filePath, inventoryDetails) {
  try {
    const jsonData = await fileService.readJSON(filePath);
    for (const item of jsonData) {
      if (inventoryDetails[item["In-store Token"]]) {
        const detail = inventoryDetails[item["In-store Token"]];
        const inStorePrice = parseFloat(detail.price).toFixed(2);
        item["In-store Price (for reference)"] = `$${inStorePrice}`;
        item["In-store Item"] = detail.name;
        const onlineToken = item["Online Token"];
        const onlineResponse = await squareService.batchRetrieve([onlineToken]);
        if (onlineResponse.objects && onlineResponse.objects.length > 0) {
          const onlinePrice = onlineResponse.objects[0].item_variation_data.price_money.amount / 100;
          const onlineReduction = (inStorePrice / onlinePrice).toFixed(2);
          const inStoreReduction = (onlinePrice / inStorePrice).toFixed(2);
          item["Online will reduce by (per 1x square unit in-store sale)..."] = onlineReduction;
          item["In-store will reduce by (per 1x online sale)..."] = inStoreReduction;
          let calculatedValue = Math.floor(detail.quantity * onlineReduction) - 1;
          if (calculatedValue < 0) calculatedValue = 0;
          await forceUpdateInventory(onlineToken, calculatedValue);
        }
      }
    }
    await fileService.writeJSON(filePath, jsonData);
    console.log('In-store prices updated based on inventory details.');
  } catch (err) {
    console.error('Failed to read or write to file, or fetch catalog data:', err);
    throw err;
  }
}

async function processInStoreMatches(matchedTokens) {
  const inventoryDetails = {};
  const inventoryResponse = await squareService.inventoryBatchRetrieve({ catalog_object_ids: matchedTokens });
  inventoryResponse.counts.forEach(count => {
    if (count.state === "IN_STOCK") inventoryDetails[count.catalog_object_id] = { quantity: count.quantity };
  });
  const catalogResponse = await squareService.batchRetrieve(matchedTokens);
  for (const object of catalogResponse.objects) {
    let secondName = "";
    let firstName = "";
    if (object.item_variation_data && object.type === "ITEM_VARIATION") {
      inventoryDetails[object.id].price = object.item_variation_data.price_money.amount / 100;
      if (object.item_variation_data.name !== "Regular") secondName = " - " + object.item_variation_data.name;
      if (object.item_variation_data.item_id) {
        const parentObj = await squareService.batchRetrieve([object.item_variation_data.item_id]);
        if (parentObj.objects.length > 0) firstName = parentObj.objects[0].item_data.name;
      }
      inventoryDetails[object.id].name = firstName + secondName;
    }
  }
  await updateInStorePrices("tableData.json", inventoryDetails);
  return inventoryDetails;
}

async function processOnlineMatches(matchedTokens) {
  const inStoreInventoryDetails = {};
  const onlineInventoryDetails = {};
  const jsonData = await fileService.readJSON('tableData.json');
  const inStoreTokens = jsonData.reduce((acc, item) => {
    if (matchedTokens.includes(item["Online Token"])) acc.push(item["In-store Token"]);
    return acc;
  }, []);
  if (inStoreTokens.length > 0) {
    const inventoryResponse = await squareService.inventoryBatchRetrieve({ catalog_object_ids: inStoreTokens });
    inventoryResponse.counts.forEach(count => {
      if (count.state === "IN_STOCK") inStoreInventoryDetails[count.catalog_object_id] = { quantity: count.quantity };
    });
  }
  const catalogResponse = await squareService.batchRetrieve(inStoreTokens);
  for (const object of catalogResponse.objects) {
    if (object.item_variation_data && object.type === "ITEM_VARIATION") {
      inStoreInventoryDetails[object.id].price = object.item_variation_data.price_money.amount / 100;
    }
  }
  const onlineResponse = await squareService.batchRetrieve(matchedTokens);
  for (const object of onlineResponse.objects) {
    let secondName = "";
    let firstName = "";
    if (object.item_variation_data && object.type === "ITEM_VARIATION") {
      onlineInventoryDetails[object.id] = { price: object.item_variation_data.price_money.amount / 100 };
      if (object.item_variation_data.name !== "Regular") secondName = " - " + object.item_variation_data.name;
      if (object.item_variation_data.item_id) {
        const parentObj = await squareService.batchRetrieve([object.item_variation_data.item_id]);
        if (parentObj.objects.length > 0) firstName = parentObj.objects[0].item_data.name;
      }
      onlineInventoryDetails[object.id].name = firstName + secondName;
    }
  }
  await updateOnlinePrices("tableData.json", inStoreInventoryDetails, onlineInventoryDetails);
  return true;
}

async function handleGeneralUpdate(webhookData) {
  const updatedAt = webhookData.data.object.catalog_version.updated_at;
  try {
    const currentLastSyncTime = await fileService.readFile('last_sync_time.txt');
    const tableData = await fileService.readJSON('tableData.json');
    const matchedInStoreTokens = [];
    const matchedOnlineTokens = [];
    const data = await squareService.searchCatalog({ begin_time: currentLastSyncTime });
    if (data.objects) {
      data.objects.forEach(object => {
        if (object.item_data && object.item_data.variations) {
          object.item_data.variations.forEach(variation => {
            tableData.forEach(item => {
              if (item["In-store Token"] === variation.id) matchedInStoreTokens.push(variation.id);
              if (item["Online Token"] === variation.id) matchedOnlineTokens.push(variation.id);
            });
          });
        }
      });
    }
    if (matchedInStoreTokens.length > 0) await processInStoreMatches(matchedInStoreTokens);
    if (matchedOnlineTokens.length > 0) await processOnlineMatches(matchedOnlineTokens);
    if (new Date(updatedAt) > new Date(currentLastSyncTime)) {
      await fileService.writeFile('last_sync_time.txt', updatedAt);
      console.log('Updated last_sync_time.txt with newer timestamp:', updatedAt);
    }
  } catch (err) {
    console.error('Error during processing:', err);
  }
}

async function handleInventoryUpdate(webhookData) {
  try {
    const tableData = await fileService.readJSON('tableData.json');
    const matchedInStoreTokens = [];
    if (webhookData.object.inventory_counts) {
      webhookData.object.inventory_counts.forEach(count => {
        if (count.catalog_object_id && count.state == "IN_STOCK") {
          tableData.forEach(item => {
            if (item["In-store Token"] === count.catalog_object_id) matchedInStoreTokens.push(count.catalog_object_id);
          });
        }
      });
    }
    if (matchedInStoreTokens.length > 0) await processInStoreMatches(matchedInStoreTokens);
  } catch (err) {
    console.error('Error during processing:', err);
  }
}

async function handlePaymentCreated(paymentData) {
  await sleep(10000);
  const orderId = paymentData.object.payment.order_id;
  try {
    const orderDetails = await squareService.getOrder(orderId);
    if (orderDetails.order && orderDetails.order.line_items) {
      const lineItemNames = orderDetails.order.line_items.reduce((names, item) => {
        if (item.name) names.push(item.name);
        return names;
      }, []);
      socketService.emit('paymentUpdate', {
        message: 'Payment was processed. ',
        orderId,
        lineItemNames
      });
      await checkCatalogObjectIDs(orderDetails.order.line_items);
    }
  } catch (error) {
    console.error('Failed to process payment and fetch order details:', error);
  }
}

async function checkCatalogObjectIDs(lineItems) {
  try {
    const tableData = await fileService.readJSON('tableData.json');
    const changes = [];
    for (const item of lineItems) {
      const match = tableData.find(data =>
        data['In-store Token'] === item.catalog_object_id || data['Online Token'] === item.catalog_object_id);
      if (match) {
        let reductionQuantity = 0;
        let catalogObjectId = '';
        if (match['Online Token'] === item.catalog_object_id) {
          reductionQuantity = (parseFloat(item.quantity) * parseFloat(match['In-store will reduce by (per 1x online sale)...'])).toFixed(2);
          catalogObjectId = match['In-store Token'];
          socketService.emit('reductionMessage', { message: `Reduction for in-store item token ${catalogObjectId}: ${reductionQuantity}` });
        } else if (match['In-store Token'] === item.catalog_object_id) {
          reductionQuantity = Math.ceil(parseFloat(item.quantity) * parseFloat(match['Online will reduce by (per 1x square unit in-store sale)...']));
          catalogObjectId = match['Online Token'];
          socketService.emit('reductionMessage', { message: `Reduction for online item token ${catalogObjectId}: ${reductionQuantity.toFixed(2)}` });
        }
        if (reductionQuantity > 0) {
          changes.push({
            type: "ADJUSTMENT",
            adjustment: {
              catalog_object_id: catalogObjectId,
              from_state: "IN_STOCK",
              to_state: "SOLD",
              quantity: reductionQuantity.toString(),
              location_id: "L8YQAQM3A2XMJ",
              occurred_at: new Date().toISOString(),
              team_member_id: "TMR2KGMEDAS_qR2y"
            }
          });
        }
      }
    }
    if (changes.length > 0) {
      const idempotency_key = uuidv4();
      await sendInventoryUpdate(changes, idempotency_key);
    }
  } catch (error) {
    console.error('Failed to load or process tableData.json:', error);
  }
}

async function sendInventoryUpdate(changes, idempotency_key) {
  const body = { idempotency_key, changes };
  try {
    const data = await squareService.inventoryChangesBatchCreate(body);
    socketService.emit('stockUpdated', { message: 'SUCCESSFUL! Stock has been adjusted in Square to a new quantity: ', responseValue: data.counts[0].quantity });
  } catch (error) {
    console.error('Error sending inventory update:', error);
  }
}

module.exports = {
  handleGeneralUpdate,
  handleInventoryUpdate,
  handlePaymentCreated,
};
