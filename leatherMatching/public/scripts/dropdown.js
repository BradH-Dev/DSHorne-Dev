import { saveScrollPosition, restoreScrollPosition, sleep } from './utils.js';
import { saveTableData } from './stock.js';
import { updateDivisionResult } from './utils.js';

// Attach global listeners once on DOMContentLoaded
export function setupDropdowns() {
  document.body.addEventListener('click', function(event) {
    hideAllDropdowns();
    const activeCell = document.activeElement;
    if (!event.target.matches('#grid td')) {
      hideAllDropdowns();
    }
  });

  const grid = document.getElementById('grid');
  grid.addEventListener('input', function(event) {
    if (event.target.cellIndex === 1 || event.target.cellIndex === 5) {
      handleInput(event);
    }
    if (event.target.cellIndex === 0 || event.target.cellIndex === 4) {
      handleItemSearch(event);
    }
  });
}

// ---- Dropdown Logic ----

let timeout = null;

export function handleInput(event) {
  clearTimeout(timeout);
  const target = event.target;
  hideAllDropdowns();

  timeout = setTimeout(() => {
    if (target.textContent.trim().length > 0) {
      searchItems(target.textContent, target);
    } else {
      hideAllDropdowns();
    }
  }, 300);
}

export function handleItemSearch(event) {
  clearTimeout(timeout);
  const targetCell = event.target;
  hideAllDropdowns();

  timeout = setTimeout(() => {
    const searchText = targetCell.textContent.trim();
    if (searchText.length > 0) {
      fetch('/catalog/searchSquare', {
        method: 'POST',
        body: JSON.stringify({
          "object_types": ["ITEM_VARIATION"],
          "query": { "text_query": { "keywords": [searchText] } }
        })
      })
      .then(response => response.json())
      .then(data => {
        const itemIds = data.objects.map(obj => obj.item_variation_data.item_id).slice(0, 10);
        hideAllDropdowns();
        if (itemIds.length > 0) {
          fetch('/catalog/getItemInfo', {
            method: 'POST',
            body: JSON.stringify({ "object_ids": itemIds })
          })
          .then(response => response.json())
          .then(data => {
            displayDropdown(data.objects, targetCell);
          })
          .catch(error => console.error('Error in batch retrieve:', error));
        } else {
          console.error('No item variations found for the query.');
        }
      })
      .catch(error => console.error('Error in initial search:', error));
    } else {
      hideAllDropdowns();
    }
  }, 300);
}

export function searchItems(query, targetCell) {
  const data = {
    "object_types": ["ITEM"],
    "query": {
      "text_query": { "keywords": [query.trim()] }
    }
  };

  fetch('/catalog/searchSquare', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => displayDropdown(data.objects, targetCell))
  .catch(error => console.error('Error:', error));
}

export function displayDropdown(items, targetCell) {
  hideAllDropdowns();
  let dropdown = targetCell.parentNode.querySelector('.dropdown-content');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'dropdown-content';
    document.body.appendChild(dropdown);
  }
  dropdown.innerHTML = '';
  let displayedItems = Array.isArray(items) ? items.slice(0, 10) : [];
  saveScrollPosition();
  if (displayedItems.length > 0) {
    displayedItems.forEach(item => {
      let link = document.createElement('a');
      link.href = '#';
      link.textContent = item.item_data.name;
      link.onclick = (e) => {
        e.preventDefault();
        handleVariations(item, targetCell, dropdown);
      };
      dropdown.appendChild(link);
    });
  } else {
    let noResult = document.createElement('div');
    noResult.textContent = "No results";
    dropdown.appendChild(noResult);
  }
  dropdown.style.display = 'block';
  const maxWidth = Math.max(...Array.from(dropdown.children).map(x => x.scrollWidth));
  const minWidth = targetCell.offsetWidth;
  dropdown.style.width = `${Math.max(maxWidth, minWidth)}px`;
  const rect = targetCell.getBoundingClientRect();
  dropdown.style.left = `${Math.min(rect.left, window.innerWidth - dropdown.offsetWidth)}px`;
  const dropdownHeight = dropdown.offsetHeight;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  if (spaceBelow >= dropdownHeight) {
    dropdown.style.top = `${rect.bottom}px`;
  } else if (spaceAbove >= dropdownHeight) {
    dropdown.style.top = `${rect.top - dropdownHeight}px`;
  } else {
    dropdown.style.top = `${window.innerHeight - dropdownHeight + window.scrollY}px`;
    document.body.style.minHeight = `${rect.bottom + dropdownHeight}px`;
    window.scrollTo(0, rect.bottom + dropdownHeight - window.innerHeight);
  }
}

export function handleVariations(item, targetCell, dropdown) {
  saveScrollPosition();
  const table = targetCell.closest('table');
  const headers = table.querySelectorAll('thead th');
  const row = targetCell.closest('tr');
  const columnName = headers[targetCell.cellIndex].textContent.trim();

  if (columnName === "In-store SKU" || columnName === "Online SKU") {
    if (item.item_data.variations && item.item_data.variations.length > 1) {
      showVariationPopup(item.item_data.variations, targetCell, item, dropdown, columnName);
    } else if (item.item_data.variations.length === 1) {
      let variation = item.item_data.variations[0];
      let baseIndex = targetCell.cellIndex;
      if (baseIndex === 0) row.dataset.storeToken = variation.id;
      else if (baseIndex === 4) row.dataset.onlineToken = variation.id;
      targetCell.parentNode.cells[baseIndex].textContent = variation.item_variation_data.sku;
      targetCell.parentNode.cells[baseIndex + 1].textContent = item.item_data.name;
      let price = (variation.item_variation_data.price_money.amount / 100);
      targetCell.parentNode.cells[baseIndex + 2].textContent = `$${price.toFixed(2)}`;
    } else {
      targetCell.textContent = item.item_data.name;
      dropdown.style.display = 'none';
    }
    updateDivisionResult(row);
    saveTableData();
    restoreScrollPosition();
  }
  if (columnName === "In-store Item" || columnName === "Online Item") {
    if (item.item_data.variations && item.item_data.variations.length > 1) {
      showVariationPopup(item.item_data.variations, targetCell, item, dropdown, columnName);
    } else if (item.item_data.variations.length === 1) {
      let variation = item.item_data.variations[0];
      let baseIndex = targetCell.cellIndex;
      if (baseIndex === 1) row.dataset.storeToken = variation.id;
      else if (baseIndex === 5) row.dataset.onlineToken = variation.id;
      targetCell.parentNode.cells[baseIndex - 1].textContent = variation.item_variation_data.sku;
      targetCell.parentNode.cells[baseIndex].textContent = item.item_data.name;
      let price = (variation.item_variation_data.price_money.amount / 100);
      targetCell.parentNode.cells[baseIndex + 1].textContent = `$${price.toFixed(2)}`;
    } else {
      targetCell.textContent = item.item_data.name;
      dropdown.style.display = 'none';
    }
    updateDivisionResult(row);
    saveTableData();
    restoreScrollPosition();
  }
}

export async function showVariationPopup(variations, targetCell, item, dropdown, columnName) {
  await sleep(1);
  restoreScrollPosition();
  let popup = document.createElement('div');
  popup.className = 'variation-popup';
  popup.style.position = 'fixed';
  popup.style.left = '50%';
  popup.style.top = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.border = '1px solid black';
  popup.style.background = 'white';
  popup.style.padding = '20px';
  popup.style.zIndex = '1000';

  variations.forEach(variation => {
    let option = document.createElement('button');
    option.textContent = variation.item_variation_data.name;
    saveScrollPosition();
    option.onclick = () => {
      const row = targetCell.closest('tr');
      restoreScrollPosition();
      if (columnName === "In-store SKU" || columnName === "Online SKU") {
        let baseIndex = targetCell.cellIndex;
        targetCell.parentNode.cells[baseIndex].textContent = variation.item_variation_data.sku;
        targetCell.parentNode.cells[baseIndex + 1].textContent = item.item_data.name + " - " + option.textContent;
        let price = (variation.item_variation_data.price_money.amount / 100);
        targetCell.parentNode.cells[baseIndex + 2].textContent = `$${price.toFixed(2)}`;
        if (baseIndex === 0) row.dataset.storeToken = variation.id;
        else if (baseIndex === 4) row.dataset.onlineToken = variation.id;
      }

      if (columnName === "In-store Item" || columnName === "Online Item") {
        let baseIndex = targetCell.cellIndex;
        targetCell.parentNode.cells[baseIndex - 1].textContent = variation.item_variation_data.sku;
        targetCell.parentNode.cells[baseIndex].textContent = item.item_data.name + " - " + option.textContent;
        let price = (variation.item_variation_data.price_money.amount / 100);
        targetCell.parentNode.cells[baseIndex + 1].textContent = `$${price.toFixed(2)}`;
        if (baseIndex === 1) row.dataset.storeToken = variation.id;
        else if (baseIndex === 5) row.dataset.onlineToken = variation.id;
      }
      dropdown.style.display = 'none';
      document.body.removeChild(popup);
      updateDivisionResult(row);
      saveTableData();
    };
    popup.appendChild(option);
  });

  document.body.appendChild(popup);
}

export function hideAllDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown-content');
  dropdowns.forEach(dropdown => {
    dropdown.style.display = 'none';
  });
}
