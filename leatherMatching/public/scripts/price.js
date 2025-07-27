import { saveTableData } from './stock.js';

// Updates both in-store and online prices from Square for all rows in the table
export async function requestUpdatedPrices(onlineBool) {
  const grid = document.getElementById('grid');
  const rows = Array.from(grid.rows).slice(1); // Skip header row
  let tokens = [];
  let priceColumnIndex = onlineBool === 1 ? 6 : 2;
  tokens = rows.map(row => ({
    token: row.dataset[onlineBool === 1 ? 'onlineToken' : 'storeToken'],
    row: row
  })).filter(item => item.token);

  const prices = await fetchPricesOnLoad(tokens);
  prices.forEach(({ price, row }) => {
    if (price !== undefined) {
      row.cells[priceColumnIndex].textContent = `$${(price / 100).toFixed(2)}`;
    }
  });
  saveTableData();
  logCurrentDateTime();
}

export async function logCurrentDateTime() {
  await fetch('/logging/addEntry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function fetchPricesOnLoad(tokenInfo) {
  const requests = tokenInfo.map(({ token, row }) =>
    fetch('/catalog/getItemInfo', {
      method: 'POST',
      body: JSON.stringify({
        object_ids: [token],
        include_category_path_to_root: false,
        include_related_objects: false
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.objects && data.objects.length > 0) {
        return { price: data.objects[0].item_variation_data.price_money.amount, row };
      }
      return { price: undefined, row };
    })
    .catch(error => {
      console.error('Failed to fetch prices:', error);
      return { price: undefined, row };
    })
  );
  return Promise.all(requests);
}

export function updateAllPricesOnLoad() {
  document.getElementById("running").style.display = "block";
  requestUpdatedPrices(1).then(() => requestUpdatedPrices(0))
    .then(() => {
      document.getElementById("running").style.display = "none";
      document.getElementById("doneRunning").style.display = "block";
      setTimeout(() => {
        document.getElementById("doneRunning").style.display = "none";
        document.getElementById("initialLoad").style.display = "none";
      }, 600);
    });
}
