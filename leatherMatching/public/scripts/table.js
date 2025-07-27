import { addEventListenersToCell, createActionButton, updateDivisionResult } from './utils.js';
import { saveTableData } from './stock.js';
import { forceAction, deleteRow } from './force.js';

export async function setupTable() {
  const grid = document.getElementById('grid');
  const rows = grid.querySelectorAll('tr');
  rows.forEach(row => {
    Array.from(row.cells).forEach(cell => addEventListenersToCell(cell, row));
  });
}

export function insertRow() {
  const grid = document.getElementById('grid');
  const newRow = grid.insertRow(-1);
  const cellsContent = [
    "Search In-Store SKU/Barcode...",
    "Search In-Store Item...",
    "0",
    "0",
    "Search Online SKU/Barcode...",
    "Search Online Item...",
    "0",
    "0"
  ];
  cellsContent.forEach((content, i) => {
    const cell = newRow.insertCell(i);
    cell.contentEditable = (i !== 2 && i !== 3 && i !== 6 && i !== 7) ? "true" : "false";
    cell.innerHTML = content;
    addEventListenersToCell(cell, newRow);
  });
  const actionCell = newRow.insertCell(8);
  createActionButton(actionCell, 'Delete', deleteRow);
  createActionButton(actionCell, 'Force', forceAction);
  actionCell.contentEditable = "false";
}

export async function loadTableData() {
  try {
    const response = await fetch('/priceSync/loadData');
    const data = await response.json();
    const grid = document.getElementById('grid');
    while (grid.rows.length > 0) grid.deleteRow(0);
    const headers = [
      "In-store SKU", "In-store Item", "In-store Price (for reference)", "Online will reduce by (per 1x square unit in-store sale)...",
      "Online SKU", "Online Item", "Online Price (for reference)", "In-store will reduce by (per 1x online sale)...", "Actions"
    ];
    const header = grid.createTHead().insertRow(0);
    headers.forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      header.appendChild(th);
    });
    data.forEach(rowData => {
      const newRow = grid.insertRow(-1);
      newRow.dataset.storeToken = rowData['In-store Token'] || "N/A";
      newRow.dataset.onlineToken = rowData['Online Token'] || "N/A";
      headers.slice(0, -1).forEach((header, index) => {
        const newCell = newRow.insertCell();
        newCell.contentEditable = (index !== 2 && index !== 3 && index !== 6 && index !== 7) ? "true" : "false";
        newCell.textContent = rowData[header] || "N/A";
        addEventListenersToCell(newCell, newRow);
      });
      const actionCell = newRow.insertCell();
      createActionButton(actionCell, 'Delete', deleteRow);
      createActionButton(actionCell, 'Force', forceAction);
      actionCell.contentEditable = "false";
      updateDivisionResult(newRow);
    });
  } catch (error) {
    console.error('Error loading data', error);
  }
}

export { saveTableData };
