import { setupTable, insertRow, loadTableData, saveTableData } from './table.js';
import { donePopup, closePopup } from './popup.js';
import { processTableData, prepareProcessTableData, showCheckStockPopup } from './stock.js';
import { forceAction, deleteRow } from './force.js';
import { setupDropdowns } from './dropdown.js';
import { updateAllPricesOnLoad, requestUpdatedPrices, fetchPricesOnLoad, logCurrentDateTime } from './price.js';
import { sleep } from './utils.js';
import { showHelp } from './popup.js';


window.help1 = () => showHelp('help1');
window.help2 = () => showHelp('help2');
window.closePopup = closePopup;
window.insertRow = insertRow;
window.prepareProcessTableData = prepareProcessTableData;
window.processTableData = processTableData;

document.addEventListener('DOMContentLoaded', async () => {
  await setupTable();
  await loadTableData();
  setupDropdowns();
});
