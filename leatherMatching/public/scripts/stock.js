import { donePopup, closePopup } from './popup.js';
import { sleep } from './utils.js';

export function prepareProcessTableData() {
  saveScrollPosition();
  closePopup("stockCheck");
  const table = document.getElementById("grid");
  const confirmTableBody = document.getElementById("confirmTable").getElementsByTagName("tbody")[0];
  confirmTableBody.innerHTML = "";
  let realEntries = 0;
  Array.from(table.getElementsByTagName("tr")).forEach((row, index) => {
    if (index > 0) {
      const item = row.cells[1].textContent.trim();
      const quantity = row.cells[2].textContent.trim();
      if (item !== "Search item name..." && quantity > 0) {
        realEntries++;
        const rowHTML = `<tr><td>${item}</td><td>${quantity}</td></tr>`;
        confirmTableBody.innerHTML += rowHTML;
      }
    }
  });
  if (realEntries > 0){
    document.getElementById("confirmPopup").style.display = "block";
  }
  else{
    donePopup("Stock NOT updated", "Looks like there is nothing entered in the table. Make sure you've actually entered some stock!", "OK - I'm a silly billy");
  }
}

export function showCheckStockPopup() {
  saveScrollPosition();
  document.getElementById("checkStock").style.display = "block";
}

export function processTableData() {
  const table = document.getElementById("grid");
  if (!table) {
    console.error("Table not found!");
    return;
  }
  const rows = table.getElementsByTagName("tr");
  const skuList = [];
  Array.from(rows).forEach((row, index) => {
    const firstCell = row.cells[0];
    if (firstCell && firstCell.contentEditable === "true") {
      skuList.push({ sku: firstCell.textContent.trim(), rowIndex: index });
    }
  });
  const fetchPromises = skuList.filter(item => item.sku !== "Search SKU/Barcode...")
    .map(item => fetchData(item.sku, item.rowIndex));
  Promise.all(fetchPromises).then(() => {
    sendInventoryUpdate();
    console.log("Inventory update called after all fetches completed.");
  }).catch(error => {
    console.error("Error with fetch operations: ", error);
  });
}

// Save Table Data function, moved here for import by other modules
export function saveTableData() {
  const grid = document.getElementById('grid');
  const headers = Array.from(grid.rows[0].cells).map(header => header.textContent.trim());
  const data = Array.from(grid.rows).slice(1).map(row => {
    let rowData = {};
    Array.from(row.cells).slice(0, -1).forEach((cell, index) => {
      rowData[headers[index]] = cell.textContent.trim();
    });
    rowData['In-store Token'] = row.dataset.storeToken || "N/A";
    rowData['Online Token'] = row.dataset.onlineToken || "N/A"
    return rowData;
  });
  fetch('/priceSync/saveData', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(response => {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }).then(data => {
    console.log('Data successfully saved', data.message);
  }).catch(error => {
    console.error('Failed to save table data:', error);
  });
}
