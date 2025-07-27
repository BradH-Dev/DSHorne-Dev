import { apiCall } from './api.js';
import { updateGrid } from './grid.js';

export async function addEntry() {
    const sku = document.getElementById('sku').value;
    const quantity = document.getElementById('quantity').value;
    const table = document.getElementById('entries');
    const row = table.insertRow(1);
    const [cell1, cell2, cell3, cell4, cell5] = Array.from({ length: 5 }, () => row.insertCell());

    const itemDetails = await apiCall(sku);

    cell1.innerHTML = `<input type="text" value="${sku}" disabled>`;
    cell2.innerHTML = `<input type="number" value="${quantity}" disabled>`;
    cell3.innerHTML = itemDetails.itemName || 'Item not found';
    cell4.innerHTML = itemDetails.price || 'Price not available';

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => makeEditable(editBtn);
    cell5.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteRow(deleteBtn);
    cell5.appendChild(deleteBtn);

    updateGrid();
}

function makeEditable(btn) {
    const row = btn.closest('tr');
    const [skuInput, qtyInput] = row.querySelectorAll('input');
    skuInput.disabled = false;
    qtyInput.disabled = false;
    btn.textContent = "Apply";
    btn.onclick = () => applyChanges(btn);
}

async function applyChanges(btn) {
    const row = btn.closest('tr');
    const [skuInput, qtyInput] = row.querySelectorAll('input');
    skuInput.disabled = true;
    qtyInput.disabled = true;

    btn.textContent = "Edit";
    btn.onclick = () => makeEditable(btn);

    const itemDetails = await apiCall(skuInput.value);
    row.cells[2].innerHTML = itemDetails.itemName || 'Item not found';
    row.cells[3].innerHTML = itemDetails.price || 'Price not available';
    updateGrid();
}

function deleteRow(btn) {
    const row = btn.closest('tr');
    row.remove();
    updateGrid();
}
