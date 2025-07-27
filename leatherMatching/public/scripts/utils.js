export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  export function addEventListenersToCell(cell, row) {
    cell.addEventListener('click', highlightText);
    cell.addEventListener('focus', highlightText, true);
  }
  
  export function createActionButton(cell, text, action) {
    const button = document.createElement('button');
    button.textContent = text;
    button.onclick = function() { action(this); };
    cell.appendChild(button);
  }
  
  export function updateDivisionResult(row) {
    const inStorePrice = row.cells[2].textContent.replace(/[,$]/g, '');
    const onlinePrice = row.cells[6].textContent.replace(/[,$]/g, '');
    const inStorePriceFloat = parseFloat(inStorePrice);
    const onlinePriceFloat = parseFloat(onlinePrice);
    if (!isNaN(inStorePriceFloat) && !isNaN(onlinePriceFloat) && onlinePriceFloat !== 0) {
      const inStoreReduction = onlinePriceFloat / inStorePriceFloat;
      const onlineReduction = inStorePriceFloat / onlinePriceFloat;
      row.cells[7].textContent = inStoreReduction.toFixed(2);
      row.cells[3].textContent = onlineReduction.toFixed(2);
    } else {
      row.cells[7].textContent = "Enter both products to calculate";
      row.cells[3].textContent = "Enter both products to calculate";
    }
  }
  
  function highlightText(event) {
    const target = event.target;
    setTimeout(() => {
      if (target.contentEditable === "true") {
        target.select ? target.select() : document.execCommand('selectAll', false, null);
      }
    }, 0);
  }
  
  export function saveScrollPosition() {
    window.lastScrollY = window.scrollY;
  }
  
  export function restoreScrollPosition() {
    window.scrollTo(0, window.lastScrollY || 0);
  }
  