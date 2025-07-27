import { closePopup, donePopup } from './popup.js';
import { sleep } from './utils.js';

export function deleteRow(button) {
  const row = button.parentNode.parentNode;
  row.parentNode.removeChild(row);
  import('./stock.js').then(module => module.saveTableData());
}

export function forceAction(button) {
  document.getElementById("running").style.display = "block";
  const row = button.parentNode.parentNode;
  const inStoreToken = row.dataset.storeToken;
  if (inStoreToken) {
    fetchInventoryCount(inStoreToken, row);
  } else {
    console.error('No In-store Token found for this row');
  }
}

async function fetchInventoryCount(catalogObjectId, row) {
  const url = '/catalog/getCount';
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({
      catalog_object_ids: [catalogObjectId]
    })
  };
  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    if (response.ok && data.counts && data.counts.length > 0) {
      const inventoryCount = parseFloat(data.counts[0].quantity);
      const multiplierCell = row.cells[3];
      const multiplier = parseFloat(multiplierCell.textContent.trim());
      let calculatedValue = Math.floor(inventoryCount * multiplier) - 1;
      if (calculatedValue < 0){
        calculatedValue = 0;
      }
      forceUpdateInventory(row.dataset.onlineToken, calculatedValue, row, inventoryCount);
    } else {
      throw new Error(data.errors ? JSON.stringify(data.errors) : 'Failed to fetch inventory count or no inventory data available');
    }
  } catch (error) {
    console.error('Error fetching inventory count:', error);
  }
}

async function forceUpdateInventory(onlineToken, quantity, row, inventoryCount) {
  const url = '/catalog/sendUpdate';
  const idempotency_key = uuid.v4();
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idempotency_key: idempotency_key,
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
    })
  };
  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    if (response.ok && !data.errors) {
      closePopup("running");
      await sleep(100);
      var messageBody = `You have the following in-store product and stock:<br><br> ${row.cells[1].textContent} |  (${inventoryCount} units)<br><br>Therefore, the online product<br><strong> "${row.cells[5].textContent}"</strong> <br>has had its stock level updated.<br><br> <strong>New count is: ${quantity}`;
      donePopup("Stock updated!", messageBody, "OK");
    } else {
      let errorDetails = data.errors ? data.errors.map(err => err.detail).join(', ') : 'No specific error details provided.';
      throw new Error(`Failed to update inventory: ${errorDetails}`);
    }
  } catch (error) {
    console.error('Error sending inventory update:', error.message);
    closePopup("running");
    await sleep(100);
    var messageBody = `Error sending inventory update:<br><br>${error.message}<br><br>No inventory was updated.`;
    donePopup("Stock NOT updated!", messageBody, "OK - I'll try again and let Brad know if happens again");
  }
}
