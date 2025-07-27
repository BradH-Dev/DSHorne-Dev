

let total = 0;
let divisor = 1.1;
let gst = " excluding GST"
let itemIds = [];



let currentCursor = null;  // Global variable to hold the current cursor

async function searchOrders(cursor = null) {
    document.getElementById("running").style.display = "block";  // Show that it is running
    const bodyData = {
        "location_ids": ["L8YQAQM3A2XMJ"],
        "return_entries": true,
        "cursor": cursor,  // Include the cursor if provided
        "limit": 50,
        "query": {
            "filter": {
                "source_filter": {
                    "source_names": [
                        "Square Online"
                    ]
                },
                "state_filter": {
                    "states": [
                        "OPEN",
                        "COMPLETED"
                    ]
                }
            },
            "sort": {
                "sort_field": "CREATED_AT",
                "sort_order": "DESC"
            }
        }
    };

    if (!cursor) delete bodyData.cursor; // Remove cursor key if not provided
    
    const response = await fetch('/api/orders/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
    });
    const data = await response.json();
    const orderIds = data.order_entries.map(entry => entry.order_id);
    currentCursor = data.cursor;  // Update the global cursor with the new cursor from the response
    retrieveBatchOrders(orderIds);
}



async function retrieveBatchOrders(orderIds) {
    const response = await fetch('/api/orders/batch-retrieve', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "order_ids": orderIds,
            "location_id": "L8YQAQM3A2XMJ"
        })
    });
    const data = await response.json();

    // Ensure that all orders are found. Filter out any undefined elements.
    const sortedOrders = orderIds.map(id => data.orders.find(order => order.id === id)).filter(order => order !== undefined);
    showOrdersPopup(sortedOrders);
}



  
// Function to load line items for a given order ID and update the main table
async function loadLineItems(orderId) {
    const checkbox = document.getElementById('topRightCheckbox');
    checkbox.checked = true;
    divisor = 1;
    gst = " including GST";

    // Fetch the order data from the API
    const response = await fetch(`/api/orders/batch-retrieve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "order_ids": [orderId],
            "location_id": "L8YQAQM3A2XMJ"
        })
    });

    const data = await response.json();

    // Assuming we have line items in the first order of the array
    if (data.orders && data.orders[0].line_items) {
        // Close the popup
        document.getElementById('ordersPopup').style.display = 'none';

        // Insert all line items into the main table
        insertRowsIntoGrid(data.orders[0].line_items, data.orders[0]);
        console.log(data.orders[0]);
    }
}
async function insertRowsIntoGrid(items, orderData) {
    const table = document.getElementById('grid');
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    resetTableState(); 
    // Collect all catalog object IDs
    const catalogObjectIds = items.map(item => item.catalog_object_id);

    // Fetch details for all items in a batch
    try {
        const itemDetails = await fetchItemDetailsBatch(catalogObjectIds);

        items.forEach(item => {
            
            const details = itemDetails.objects.find(detail => detail.id === item.catalog_object_id);
            const newRow = table.insertRow(-1);


            for (let i = 0; i < 8; i++) {
                const cell = newRow.insertCell(i);
                cell.contentEditable = "true";

                switch (i) {
                    case 0:
                        cell.innerHTML = details && details.item_variation_data.sku || "Search SKU/Barcode...";
                        break;
                    case 1:
                        const variationName = details && details.item_variation_data.name;
                        cell.innerHTML = (variationName && variationName !== "Regular") ? `${item.name} - ${variationName}` : item.name || "Search item name...";
                        break;
                    case 2:
                        cell.innerHTML = item.quantity || "1";
                        break;
                    case 3:
                        cell.contentEditable = "false";
                        cell.innerHTML = `$${(item.base_price_money.amount / 100).toFixed(2)}`;
                        cell.dataset.rawPrice = (item.base_price_money.amount / 100).toString();
                        break;
                    case 4:
                        const totalPrice = (item.base_price_money.amount * item.quantity) / 100;
                        cell.contentEditable = "false";
                        cell.innerHTML = `$${totalPrice.toFixed(2)}`;
                        cell.dataset.rawPrice = totalPrice.toString();
                        break;
                    case 5:
                        cell.contentEditable = "true";
                        cell.innerHTML = "0%";  // Default 0% discount
                        break;
                    case 6:
                        createOverwriteButton(cell);
                        break;
                    case 7:
                        createDeleteButton(cell);
                        
                        break;
                }
                addEventListenersToCell(cell);
            }
        });

        // Optionally, add a Freight row if applicable
        if (orderData.service_charges[0]) {
            const freightInfo = orderData.service_charges[0].amount_money.amount;
            console.log(freightInfo);
            if (freightInfo) {
                const freightRow = table.insertRow(-1);
                addFreightRow(freightRow, freightInfo);
            }
        }

        updateTotal();
    } catch (error) {
        console.error('Error fetching batch item details:', error);
    }
}

function resetTableState() {
    const table = document.getElementById('grid');
    for (let i = 1; i < table.rows.length; i++) {  // Start at 1 to skip the header row
        const row = table.rows[i];
        for (let j = 0; j < row.cells.length; j++) {
            const cell = row.cells[j];
            // Clear dataset attributes for each cell
            for (let key in cell.dataset) {
                if (cell.dataset.hasOwnProperty(key)) {
                    delete cell.dataset[key];
                }
            }
        }
    }
}

async function fetchItemDetailsBatch(catalogObjectIds) {
    const response = await fetch('/api/items/batch-details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ object_ids: catalogObjectIds })
    });
    if (!response.ok) {
        throw new Error('Failed to fetch batch item details');
    }
    return response.json();
}

function addFreightRow(freightRow, freightInfo) {
    for (let i = 0; i < 8; i++) {
        const cell = freightRow.insertCell(i);
        cell.contentEditable = "true";
        const freightPrice = freightInfo / 100;
        switch (i) {
            case 0:
                cell.contentEditable = "false";
                cell.innerHTML = "Freight";
                break;
            case 1:
                cell.contentEditable = "false";
                cell.innerHTML = "FREIGHT";
                break;
            case 2:
                cell.contentEditable = "false";
                cell.innerHTML = "1";
                break;
            case 3:
                cell.contentEditable = "false";
                cell.innerHTML = `$${freightPrice.toFixed(2)}`;
                cell.dataset.rawPrice = freightPrice.toString();
                break;
            case 4:
                cell.contentEditable = "false";
                cell.innerHTML = `$${freightPrice.toFixed(2)}`;
                cell.dataset.rawPrice = freightPrice.toString();
                break;
                
            case 5:
                cell.contentEditable = "true";
                cell.innerHTML = "0%";
                break;

                case 6:
                    createOverwriteButton(cell);
                    break;
                case 7:
                    createDeleteButton(cell);
                    break;
        }
        addEventListenersToCell(cell);
    }
}

async function fetchItemDetails(catalogObjectId) {
    const response = await fetch('/api/items/batch-details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ catalogObjectId })
    });
    if (!response.ok) {
        throw new Error('Failed to fetch item details');
    }
    return response.json();
}
  

function showOrdersPopup(orders) {
    document.getElementById("running").style.display = "none";
    const popup = document.getElementById('ordersPopup');
    if (!popup) {
        console.error('Orders popup element not found');
        return;
    }

    let html = `<h3>Order Details:</h3><table><thead><tr><th>Paid at OR last updated at</th><th>Recipient</th><th>Amount</th><th>Address</th></tr></thead><tbody>`;
    orders.forEach(order => {
        
        
        const recipientInfo = getRecipientInfo(order);

        let createdAt;
        let address = recipientInfo.address; 
        if (order.fulfillments[0].pickup_details){
        
            address = "PICKUP order at DS Horne & ASW";

        }


        if (order.tenders){
            createdAt = formatDate(order.tenders[0].created_at);
        }
        else if (order.fulfillments[0].pickup_details){
            createdAt = `${formatDate(order.fulfillments[0].pickup_details.placed_at)}`;

        }
        else{
            createdAt = formatDate(order.created_at);
        }
        html += `<tr data-order-id="${order.id}"><td>${createdAt}</td><td>${recipientInfo.name}</td><td>${recipientInfo.amount}</td><td>${address}</td></tr>`;
    });
    html += `</tbody></table>`;
    if (currentCursor) {  // Only show the Load more button if there is a cursor
        html += `<button onclick="searchOrders('${currentCursor}')">Load more...</button>`;
    }
    else {
        html += `<p>End of orders</p>`;
    }
    html += `<button onclick="closeOrdersPopup()">Close</button>`;
    popup.innerHTML = html;
    popup.style.display = 'block';
    addRowClickListeners();
    setupOutsideClickListener();
}

let outsideClickListener = null; // Define it globally or higher in scope

function setupOutsideClickListener() {
    const popup = document.getElementById('ordersPopup');

    // Avoid attaching multiple listeners
    if (outsideClickListener) return;

    outsideClickListener = function(event) {
        if (!popup.contains(event.target)) {
            closeOrdersPopup();
            document.removeEventListener('click', outsideClickListener);
            outsideClickListener = null; // Reset so we can reattach later if needed
        }
    };

    setTimeout(() => { // Delay to avoid instant close due to current click
        document.addEventListener('click', outsideClickListener);
    }, 0);
}

document.getElementById("done");

function getRecipientInfo(order) {
    let recipient = 'Unknown';
    let address = '';
    console.log(order.fulfillments)
    if (order.fulfillments) {
        order.fulfillments.forEach(fulfillment => {

   
                if (fulfillment.type === "SHIPMENT" && fulfillment.shipment_details) {
                    recipient = fulfillment.shipment_details.recipient.display_name;
                    address = formatAddress(fulfillment.shipment_details.recipient.address);
                } else if (fulfillment.type === "PICKUP" && fulfillment.pickup_details) {
                    recipient = fulfillment.pickup_details.recipient.display_name;
                    address = formatAddress(fulfillment.pickup_details.recipient.address);
                }

        });
    }
    const amount = order.net_amounts.total_money ? `$${(order.net_amounts.total_money.amount / 100).toFixed(2)}` : 'Unknown';
    return { name: recipient, amount: amount, address: address };
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
}

function addRowClickListeners() {
    const rows = document.querySelectorAll('#ordersPopup table tbody tr');
    rows.forEach(row => {
        row.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            loadLineItems(orderId);
        });
    });
}
function formatAddress(addressDetails) {
    return `${addressDetails.address_line_1 || ''} ${addressDetails.address_line_2 || ''}, ${addressDetails.locality || ''}, ${addressDetails.administrative_district_level_1 || ''}, ${addressDetails.postal_code || ''}, ${addressDetails.country || ''}`;
}

function closeOrdersPopup() {
    const popup = document.getElementById('ordersPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}


function prepareProcessTableData(isRecount) {
    
    closePopup("stockCheck");
    const table = document.getElementById("grid");
    let confirmTableBody;
    if (isRecount){
        confirmTableBody = document.getElementById("confirmTableRecount").getElementsByTagName("tbody")[0];
    }else{
        confirmTableBody = document.getElementById("confirmTable").getElementsByTagName("tbody")[0];
    }
    confirmTableBody.innerHTML = "";  // Clear previous entries
    let realEntries = 0;

    Array.from(table.getElementsByTagName("tr")).forEach((row, index) => {
        if (index > 0) {  // Skip header
            const item = row.cells[1].textContent.trim();
            const quantity = row.cells[2].textContent.trim();

            if (item !== "Search item name..." && quantity >= 0) {
                realEntries++;
                const rowHTML = `<tr><td>${item}</td><td>${quantity}</td></tr>`;
                confirmTableBody.innerHTML += rowHTML;
            }
        }
    });
    if (realEntries > 0){
        if (isRecount){
            document.getElementById("confirmPopupRecount").style.display = "block";  // Show the popup
        }else {
            document.getElementById("confirmPopup").style.display = "block";  // Show the popup
        }
        
    }
    else{
        donePopup("Stock NOT updated", "Looks like there is nothing entered in the table. Make sure you've actually entered some stock!", "OK - I'm a silly billy");
    }

    
}

function showCheckStockPopup() {
    document.getElementById("checkStock").style.display = "block";  // Show the popup
}

function closePopup(type) {
    if (type == "reviewStock")
        document.getElementById("confirmPopup").style.display = "none";  // Hide the popup
        document.getElementById("confirmPopupRecount").style.display = "none";  // Hide the popup
    if (type == "stockCheck")
        document.getElementById("checkStock").style.display = "none";  // Hide the popup
    if (type == "running")
        document.getElementById("running").style.display = "none";  // Hide the popup
    if (type == "done")
        document.getElementById("done").style.display = "none";  // Hide the popup
}


function processTableData(isRecount) {
    document.getElementById("running").style.display = "block";  // Hide the popup
    itemIds = [];
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
        if (isRecount){
            sendInventoryUpdate(true);
        }else{
            sendInventoryUpdate(false);
        }
        
        console.log("Inventory update called after all fetches completed.");
    }).catch(error => {
        console.error("Error with fetch operations: ", error);
    });

}

async function fetchData(sku, rowIndex, attempt = 1) {
    const url = "/proxy";
    const requestOptions = {
        method: 'POST',
        headers: {
            'Square-Version': '2024-05-15',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            object_types: ["ITEM_VARIATION"],
            query: {
                exact_query: {
                    attribute_name: "sku",
                    attribute_value: sku
                }
            }
        })
    };

    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) throw new Error('Network response was not ok.');

        const data = await response.json();
        if (data.objects && data.objects.length > 0) {
            data.objects.forEach(object => {
                if (object.type && object.item_variation_data && object.item_variation_data.item_id) {
                    itemIds.push({ id: object.id, rowIndex: rowIndex });  // Fix here to use item_id
                }
            });
        }
        console.log(itemIds);
    } catch (error) {
        console.error('Error fetching data: ', error);
        if (attempt < 3) {
            console.log(`Retrying... Attempt ${attempt + 1}`);
            setTimeout(() => fetchData(sku, rowIndex, attempt + 1), 2000);
        }
    }
}

async function sendInventoryUpdate(isRecount) {
    closePopup("reviewStock");  // Close the popup after processing
    const changes = itemIds.map(item => {
        const row = document.getElementById("grid").rows[item.rowIndex];
        const quantity = row.cells[2].textContent;  // Assuming quantity is in the second column


        if (isRecount){
            console.log("is recount");
            return {
                type: "PHYSICAL_COUNT",
                physical_count: {
                    state: "IN_STOCK",
                    quantity: quantity,
                    catalog_object_id: item.id,
                    location_id: "L8YQAQM3A2XMJ",
                    team_member_id: "TMR2KGMEDAS_qR2y",
                    occurred_at: new Date().toISOString()
                }
            };
        }
        else {
            return {
                type: "ADJUSTMENT",
                adjustment: {
                    to_state: "SOLD",
                    from_state: "IN_STOCK",
                    quantity: quantity,
                    catalog_object_id: item.id,
                    location_id: "L8YQAQM3A2XMJ",
                    team_member_id: "TMR2KGMEDAS_qR2y",
                    occurred_at: new Date().toISOString()
                }
            };
        }
    });
  

    const idempotency_key = uuid.v4();
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            idempotency_key: idempotency_key,
            changes: changes
        })
    };

    try {
        const response = await fetch('api/proxy/stock', requestOptions);
        console.log(response)
        closePopup("running");
        
        setTimeout(() => {
            if (response.ok) {
                donePopup("SUCCESS!", "Stock has been adjusted in Square. You may close this window.","OK :)")
                console.log('SUCCESSFUL! Stock has been adjusted in Square');
            } else {
                donePopup("ERROR!", "Stock has NOT been adjusted in Square. Try again once. If this appears again, contact Brad","OK, I will go get help :)")
                alert("ERROR! Stock NOT updated. Contact Brad as there is likely an issue.");
                console.error('Failed to update inventory');
            }
        }, 100);  // Delay the alert by 100 milliseconds
    } catch (error) {
        console.error('Error sending inventory update: ', error);
    }
}

function donePopup(messageHeading, messageBody, buttonText) {
    const popup = document.getElementById("done");
    popup.style.display = "block";

    document.getElementById("messageHeading").textContent = messageHeading;
    document.getElementById("messageBody").innerHTML = messageBody;

    const closeButton = document.getElementById("closeButton");
    closeButton.innerText = buttonText;
    closeButton.onclick = function(event) {
        event.stopPropagation();  // ⛔️ Prevent from triggering outer click listener
        popup.style.display = "none";
    };

    // ⏳ Delay to next tick so this doesn't instantly fire on same click
    setTimeout(() => {
        function handleClickOutside(event) {
            if (!popup.contains(event.target)) {
                popup.style.display = "none";
                document.removeEventListener('click', handleClickOutside);
            }
        }
        document.addEventListener('click', handleClickOutside);
    }, 0);
}

function help() {
    donePopup("How to use:", "<strong>IMPORTANT NOTE:</strong><br><br>You <strong>CAN</strong> use this page to reduce stock levels <strong>WITHOUT</strong> generating an invoice. This may come in handy in some circumstances. This can be done by using the 'RE-COUNT stock in Square' button.<br><br><br><strong>SEARCHING:</strong> <br><br>Use the 'Item' column to search for products with a <strong>keyword</strong> (i.e. `Cow hide`) <br><br> Use the 'SKU' column to search for products with a <strong>SKU or Barcode</strong> (i.e. 12345) <br><br> A dropdown will appear, allowing you to choose an item. <strong>This will pull the correct product SKU, name, and price from Square.</strong> <br><br> Use the `Quantity` column to adjust the <strong>quantity</strong> you are to sell. You are <strong>NOT</strong> required to enter a measurement type (per item/per sqm, etc). Simply enter the value - it already knows the unit<br><br><br> <strong>PRICING AND GST:</strong><br><br> Prices by default are pulled in <strong>GST exclusive.</strong> The small checkbox in the top right of the table will enable <strong>GST inclusive</strong> mode <br><br> The `Edit` button allows you to overtype the <strong>unit price</strong> of a particular item. BE CAREFUL! This uses the current checkbox selection. So, if you check the box to be in GST inclusive mode and overtype a price excluding GST, the calculations will be incorrect <br><br><strong>NOTE:</strong> If you make a mistake with pricing/there is an error in rounding and notice it in Xero, you can change PRICES once exported into Xero without issue. If you need to change stock after already doing a stock adjustment, you will need to manually adjust this in Square<br><br><br><strong>PROCESSING INVOICES:</strong><br><br>Clicking 'Generate invoice CSV' button will automatically download a CSV which needs to be imported to <strong>Xero</strong>. You will be automatically prompted to complete a stock reduction. <br><br><br><strong>STOCK REDUCTION:</strong><br><br>Clicking 'Reduce stock as SOLD in Square' (or after generating an invoice) will prompt you to confirm your stock adjustments. This will automatically reduce the stock you have specified for each product. (i.e. if you input 'Shoulders Veg' with quantity '1.5', the current stock value in Square will be reduced by 1.5). This will incur Cost of Goods Sold ramifications. Use the 'RE-COUNT stock in Square' button if you merely want to re-count the stock level without causing CoGS ramifications<br><br><strong>SEARCHING ORDERS ON SQUARE:</strong><br><br>You can search existing orders on Square using the 'Search Orders...' button. This will open a popup showing you a list of current orders. This includes all order types, including 'New', 'Ready', 'In Progress', and 'Completed' orders", "OK - Thanks ever so much for your help, Brad");
}

async function processRows(rows) {
    const maxWorkers = 5;
    const totalRows = rows.length - 1; // excluding header
    const chunkSize = Math.ceil(totalRows / maxWorkers);
    const workersResults = new Array(totalRows).fill(null); // Placeholder for results
    const progressElement = document.getElementById("progress");

    async function fetchItemData(startIndex, endIndex, workerIndex) {
        for (let i = startIndex; i <= endIndex; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');
            const sku = cells[0].textContent.trim();
            const description = cells[1].textContent.trim().replace(/"/g, '""');
            progressElement.innerHTML = `Worker ${workerIndex}: Grabbing Xero category for item:<strong> ${description}</strong> <br><br>(Item ${i} of ${totalRows})`;

            if (sku === "Search SKU/Barcode..." || description === "Search item name...") {
                continue;
            }

            const requestBody = {
                begin_time: "2023-12-16T04:47:54.144Z",
                object_types: ["ITEM_VARIATION"],
                query: { exact_query: { attribute_name: "sku", attribute_value: sku } }
            };

            let response, data;
            let attempts = 0;
            do {
                try {
                    response = await fetch('/api/items/search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    data = await response.json();
                    if (data.objects && data.objects.length > 0) {
                        workersResults[i - 1] = data.objects[0].item_variation_data.item_id; // -1 because we skip the header row
                        break; // successful fetch, exit the retry loop
                    }
                } catch (error) {
                    attempts++;
                    console.error(`Attempt ${attempts}: Failed to fetch data for SKU ${sku}`);
                }
            } while (attempts < 3); // Retry up to 3 times
        }
    }

    // Launch workers
    const workerPromises = [];
    for (let w = 0; w < maxWorkers; w++) {
        const startIndex = 1 + w * chunkSize;
        const endIndex = Math.min(startIndex + chunkSize - 1, rows.length - 1);
        workerPromises.push(fetchItemData(startIndex, endIndex, w + 1));
    }

    await Promise.all(workerPromises);
    return workersResults.filter(id => id !== null); // Filter out nulls if any rows were skipped
}

let rowCount = 0;
let rowCounter = 0;

async function fetchDataParallel(rows) {
    const chunkSize = Math.ceil(rows.length / 5); // Calculate the number of rows each worker will process
    const fetchPromises = [];

    for (let worker = 0; worker < 5; worker++) {
        const startIndex = worker * chunkSize;
        const endIndex = Math.min(startIndex + chunkSize, rows.length);
        const chunkRows = rows.slice(startIndex, endIndex);
        
        fetchPromises.push(fetchChunkData(chunkRows, startIndex, endIndex)); // Fetch data for each chunk
    }

    const results = await Promise.all(fetchPromises);
    const itemIds = results.flat(); // Combine all itemIds from each chunk
    console.log('All item IDs:', itemIds);
}

async function fetchChunkData(chunkRows, startIndex, endIndex) {
    const itemIds = [];
    const progressElement = document.getElementById("progress");

    for (let i = 0; i < chunkRows.length; i++) {
        rowCounter++;
        const progressElement = document.getElementById("progress");
        progressElement.innerHTML = `Grabbing Xero categories for items in bulk <br><br>(Rows processed: ${rowCounter} of ${rowCount})`; // Update the progress text
        const row = chunkRows[i];
        const cells = row.querySelectorAll('td');
        const sku = cells[0].textContent.trim();
        const description = cells[1].textContent.trim().replace(/"/g, '""');
        progressElement.innerHTML = `Grabbing Xero category for item: <strong>${description}</strong><br><br>(Item ${startIndex + i + 1} of ${endIndex})`;

        if (sku === "Search SKU/Barcode..." || description === "Search item name...") {
            continue;
        }

        const response = await fetch('/api/items/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                begin_time: "2023-12-16T04:47:54.144Z",
                object_types: ["ITEM_VARIATION"],
                query: { exact_query: { attribute_name: "sku", attribute_value: sku } }
            })
        });
        const data = await response.json();
        if (data.objects && data.objects.length > 0) {
            itemIds.push(data.objects[0].item_variation_data.item_id);
        }
    }
    return itemIds;
}



function startCSVProcess() {
    const popup = document.getElementById("confirmCSVRun");


    popup.style.display = "block";
  

    // ⏳ Delay to next tick so this doesn't instantly fire on same click
    setTimeout(() => {
        function handleClickOutside(event) {
            if (!popup.contains(event.target)) {
                popup.style.display = "none";
                document.removeEventListener('click', handleClickOutside);
            }
        }
        document.addEventListener('click', handleClickOutside);
    }, 0);


    const confirmBtn = document.getElementById("confirmStartCSV");
    const cancelBtn = document.getElementById("cancelStartCSV");
  
    function cleanup() {
      popup.style.display = "none";
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
    }
  
    function onConfirm() {
      cleanup();
      generateCSV(); // Run your original function
    }
  
    function onCancel() {
      cleanup();
      // Do nothing — user chose to skip
    }
  
    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  }

async function generateCSV() {

    updatePrices();
    document.getElementById("running").style.display = "block";
    
    rowCounter = 0;
    rowCount = 0;


    const grid = document.getElementById('grid');
    const rows = [...grid.querySelectorAll('tr')].slice(1); // Excluding header row and converting to array for easier manipulation

    let realEntries = 0;
    for (const row of rows) {
        const item = row.cells[1]?.textContent.trim();
        const quantity = row.cells[2]?.textContent.trim();

        if (item !== "Search item name..." && quantity >= 0) {
            realEntries++;
        }
    }
  

    rowCount = rows.length;
    
    console.log(rowCount);
    let csvLines = [
        '"*ContactName","EmailAddress","POAddressLine1","POAddressLine2","POAddressLine3","POAddressLine4","POCity","PORegion","POPostalCode","POCountry","*InvoiceNumber","Reference","*InvoiceDate","*DueDate","InventoryItemCode","*Description","*Quantity","*UnitAmount","Discount","*AccountCode","*TaxType","TrackingName1","TrackingOption1","TrackingName2","TrackingOption2","Currency","BrandingTheme"'
    ];

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);
    const formatDate = (date) => ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2) + '/' + date.getFullYear();

    // Step 1

    let realDataCount = 0;
    let itemIds = [];
    let itemsDetails = {};

    // Helper function to fetch data with retries
    const fetchDataHelper = async (sku, retries = 500, delay = 1000) => {
        try {
            
            const response = await fetch('/api/items/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    begin_time: "2023-12-16T04:47:54.144Z",
                    object_types: ["ITEM_VARIATION"],
                    query: { exact_query: { attribute_name: "sku", attribute_value: sku } }
                })
            });
            const data = await response.json();
            if (response.ok && data.objects && data.objects.length > 0) {
                rowCounter++;
                document.getElementById("progress").innerHTML = `Processing rows... (${rowCounter} of ${rowCount})`;
                return data.objects[0].item_variation_data.item_id;
            } else {
                throw new Error(data.error || 'No valid item ID found in response');
            }
        } catch (error) {
            console.error(`Error fetching data for SKU: ${sku}, Retrying...`, error);
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay)); // Wait for `delay` milliseconds before retrying
                // Increase delay by 1000 milliseconds for the next retry
                const newDelay = delay + 1000;
                return fetchDataHelper(sku, retries - 1, newDelay);
            } else {
                console.error('No more retries left, failed to fetch data for:', sku);
                return null;
            }
        }
    };

    // Create batches for parallel requests
    const batchSize = 3;
    const batchPromises = [];

    for (let i = 0; i < rows.length; i += batchSize) {
        realDataCount++;

        
    const batch = rows.slice(i, i + batchSize);
    batchPromises.push(
        Promise.allSettled(batch.map(row => {
            const cells = row.querySelectorAll('td');
            const sku = cells[0].textContent.trim();
            const description = cells[1].textContent.trim().replace(/"/g, '""');

            if (!sku || sku === "Search SKU/Barcode..." || !description || description === "Search item name...") {
                return null; // Skip invalid rows
            }

            const progressElement = document.getElementById("progress");
            progressElement.innerHTML = `Contacting Square to fetch details for products in ${rowCount} row(s). <br><br><strong>The first run of the day may take a moment to start as Square wakes up.</strong><br><br>Give it a few minutes. If you're still reading this after that, contact Brad :)`;
            return fetchDataHelper(sku);
        }))
    );
    }

    // Resolve all batch promises and flatten the results
    const results = await Promise.all(batchPromises);
    itemIds = results.flat().map(result => result.status === 'fulfilled' ? result.value : null);

    console.log(`Item IDs: ${itemIds}`);
    // Step 2: Batch Request for Item Details
    if (itemIds.length > 0) {
        const detailsResponse = await fetch('/api/items/batch-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ object_ids: itemIds, include_related_objects: true })
        });
    
        const detailsData = await detailsResponse.json();
    
        if (detailsData.objects) {
            const itemsMap = new Map(detailsData.objects.map(obj => [obj.id, obj]));
    
            const orderedDetails = itemIds.map(id => itemsMap.get(id)).filter(item => item);
    
            console.log(orderedDetails);
    
            orderedDetails.forEach(object => {
                if (object.item_data.categories && object.item_data.categories.length > 0) {
                    itemsDetails[object.id] = object.item_data.categories.map(cat => cat.id)[0];
                    console.log(`Item ${object.id}: Category ID - ${itemsDetails[object.id]}`);
                } else {
                    console.warn(`Item ${object.id} has no categories.`);
                    itemsDetails[object.id] = null;
                }
            });
        } else {
            console.warn("No valid item details returned from API.");
        }
    }

    

    // Step 3: Process Rows Again to Assign Categories
    for (let i = 0, itemIdIndex = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        const sku = cells[0].textContent.trim();
        const description = cells[1].textContent.trim().replace(/"/g, '""');
        const quantity = cells[2].textContent.trim();
        if (!cells[3] || !cells[3].dataset.finalOutputPrice) {
            console.warn(`Skipping row ${i + 1}: Missing unit price (finalOutputPrice)`);
            continue; // Skip this row entirely
        }
        const unitAmount = cells[3].dataset.finalOutputPrice.trim();
        const discountValue = cells[5].textContent.trim();

        if (sku === "Search SKU/Barcode..." || description === "Search item name...") {
            continue;
        }
        // Use itemIdIndex to access the correct item ID from itemIds
        const itemId = itemIds[itemIdIndex]; // Use a separate index that only increments when not skipped
        itemIdIndex++;

        let category = await fetchCategoryDetails(itemsDetails[itemId]);
        let selected = 41200;


        switch (category) {
            case "leather":
                selected = 41200;
                break;
            case "leathercraft":
                selected = 42100;
                break;
            case "souvenirs":
                selected = 43100;
                break;
        }
        
        if (sku == "Freight" || sku == "FREIGHT"){
            selected = 43950;
        }
        console.log(`Categories: ${category}`);
        let rowData = [
            '"CHANGE THIS"', '""', '""', '""', '""', '""', '""', '""', '""', '""',
            '"9999999"', '""', `"${formatDate(today)}"`, `"${formatDate(dueDate)}"`, '',
            `"${sku} | ${description}"`, `"${quantity}"`, `"${unitAmount}"`, `"${discountValue}"`, `"${selected}"`, '"GST on Income"',
            '""', '""', '""', '""', '""', '""', '""'
        ];
        console.log(rowData);
        csvLines.push(rowData.join(","));
    }
    

    if (realDataCount === 0 || realEntries === 0) {
        console.log('No real data to export.');
        donePopup("Stock NOT updated", "Looks like there is nothing entered in the table. Make sure you've actually entered some stock!", "OK - I'm a silly billy");
        document.getElementById("running").style.display = "none";
        return;
    }

    let csvContent = csvLines.join("\n");
    let csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let csvUrl = URL.createObjectURL(csvBlob);
    
    document.getElementById("running").style.display = "none";
    const progressElement = document.getElementById("progress");
    progressElement.innerHTML = ``; // Update the progress text

    var link = document.createElement("a");
    link.setAttribute("href", csvUrl);
    link.setAttribute("download", "exported_data.csv");
    document.body.appendChild(link);
    link.click();
    
    showCheckStockPopup();
}

async function fetchCategoryDetails(categoryId) {
    try {
        const response = await fetch('/category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ categoryId: categoryId })
        });

        if (!response.ok) {
            throw new Error('No match found or error occurred');
        }

        const data = await response.json();
        console.log("Fetched category details:", data.message);
        return data.message.split(": ")[1]; // Assuming the message is in the format "Match found: category"
    } catch (error) {
        console.error('Error:', error);
        return null; // Return null on error
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('grid');
    const checkbox = document.getElementById('topRightCheckbox');

    // Listener for the checkbox change
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            divisor = 1;
            gst = " including GST";
        } else {
            divisor = 1.1;
            gst = " excluding GST";
        }
        // Recalculate the total and update prices without retriggering input events
        recalculatePrices();
    });

    // Function to recalculate prices based on the current divisor
    function recalculatePrices() {
        const rows = document.querySelectorAll('#grid tr');
        rows.forEach((row, index) => {
            if (index > 0) { // Skip the header row
                let quantity = parseFloat(row.cells[2].textContent) || 0;
                let discountPercent = parseFloat(row.cells[5].textContent) || 0;
                let discountMultiplier = (100 - discountPercent) / 100;
    
                let originalPrice = parseFloat(row.cells[3].dataset.rawPrice) || 0;
                let newPrice = divisor === 1 ? originalPrice * 1.1 : originalPrice / 1.1;

                let originalUnitPrice;
                let newUnitPrice;

                if (row.dataset.active === 'false') {
                    const rawUnitStr = row.cells[3].dataset.rawUnitPrice;
                    console.log(`Row ${index}: rawUnitPrice =`, rawUnitStr);
                    
                    if (rawUnitStr === undefined) {

                        return;
                    }
                    originalUnitPrice = parseFloat(row.cells[3].dataset.rawUnitPrice) || 0;
                    newUnitPrice = divisor === 1 ? originalUnitPrice * 1.1 : originalUnitPrice / 1.1;
                    row.cells[3].dataset.rawUnitPrice = newUnitPrice;
                }



    
                row.cells[3].dataset.rawPrice = newPrice;
                

                let priceToDisplay;

                if (row.dataset.active ==='false'){ // In unit price mode
                    priceToDisplay = newUnitPrice;
                }
                else {
                    priceToDisplay = newPrice;
                }
                row.cells[3].dataset.finalOutputPrice = priceToDisplay * discountMultiplier;
    

    
                let totalDisplayPrice = priceToDisplay * quantity;
                let discountedTotalPrice = totalDisplayPrice * discountMultiplier;


    


                
                const scaledRawPrice = Math.round(priceToDisplay * 100);
                const scaledQuantity = Math.round(quantity * 100); // Scale up quantity
                const totalSinglePrice = scaledRawPrice * discountMultiplier / 100;
                const totalPrice = scaledQuantity * scaledRawPrice * discountMultiplier / 10000;

                let display = formattedPriceDisplay(row, scaledRawPrice, scaledQuantity, totalSinglePrice, totalPrice);

                    
                if (row.dataset.active === 'false') {
                    row.cells[4].dataset.rawUnitPrice = totalPrice;
                } else {
                    row.cells[4].dataset.rawPrice = totalPrice;
                }

                if (discountPercent !== 0) {
                    row.cells[3].textContent = display.dollarDisplayDiscount;
                    row.cells[4].textContent = display.dollarDisplayAllDiscount;
                } else {
                    row.cells[3].textContent = display.dollarDisplay;
                    row.cells[4].textContent = display.dollarDisplayAll;
                }

            }
        });
        updateTotal();
    }

});


function updateTotal() {
    let totalWithoutDiscount = 0;
    let totalWithDiscount = 0;

    const rows = document.querySelectorAll('#grid tr');
    rows.forEach((row, index) => {
        if (index > 0) { // Skip the header row
            let quantity = parseFloat(row.cells[2].textContent) || 0;
            let unitPrice;

            if (row.dataset.active != 'true'){
                unitPrice = parseFloat(row.cells[3].dataset.rawUnitPrice) || 0;
            } else{

                unitPrice = parseFloat(row.cells[3].dataset.rawPrice) || 0;
            }

            let discountPercent = parseFloat(row.cells[5].textContent) || 0;
            let discountMultiplier = (100 - discountPercent) / 100;

            let totalPrice = unitPrice * quantity;
            totalWithoutDiscount += totalPrice;
            totalWithDiscount += totalPrice * discountMultiplier;
        }
    });

    document.getElementById('totalPrice').textContent = 
        `${totalWithoutDiscount.toFixed(2)}${gst} ($${totalWithDiscount.toFixed(2)}${gst})`;
}


function formattedPriceDisplay(row, scaledRawPrice, scaledQuantity, totalSinglePrice, totalPrice) {
    let dollarDisplay = `$${(scaledRawPrice / 100).toFixed(2)}`;
    let dollarDisplayAll = `$${(scaledRawPrice * scaledQuantity / 10000).toFixed(2)}`;
    let dollarDisplayDiscount = `$${(scaledRawPrice / 100).toFixed(2)} ($${totalSinglePrice.toFixed(2)})`;
    let dollarDisplayAllDiscount = `$${(scaledRawPrice * scaledQuantity / 10000).toFixed(2)} ($${totalPrice.toFixed(2)})`;

    if (row.dataset.active === 'false') {
        dollarDisplay = `$${(scaledRawPrice / 100).toFixed(2)}*`;
        dollarDisplayAll = `$${(scaledRawPrice * scaledQuantity / 10000).toFixed(2)}*`;
        dollarDisplayDiscount = `$${(scaledRawPrice / 100).toFixed(2)}* ($${totalSinglePrice.toFixed(2)}*)`;
        dollarDisplayAllDiscount = `$${(scaledRawPrice * scaledQuantity / 10000).toFixed(2)}* ($${totalPrice.toFixed(2)}*)`;
    }

    return {
        dollarDisplay,
        dollarDisplayAll,
        dollarDisplayDiscount,
        dollarDisplayAllDiscount
    };
}


function updatePrices(isUnitButtonBool) {
    console.log("running check");
    const rows = document.querySelectorAll('#grid tr');
    rows.forEach((row, index) => {
        if (index > 0) { // Skip the header row
            let quantity = parseFloat(row.cells[2].textContent) || 0;
            let scaledQuantity = Math.round(quantity * 100); // Scale up quantity

            let discountPercent = parseFloat(row.cells[5].textContent) || 0;
            let discountMultiplier = (100 - discountPercent) / 100;

            let rawPrice;
            if (row.dataset.active === 'false') {
                const rawUnitStr = row.cells[3].dataset.rawUnitPrice;
                console.log(`Row ${index}: rawUnitPrice =`, rawUnitStr);

                if (isUnitButtonBool && rawUnitStr === undefined) {
                    const toggleButton = row.cells[6].querySelector('.row-toggle');
                    if (toggleButton) {
                        toggleButton.click();  // ⏪ Revert the button to retail mode
                    }
                
                    donePopup(
                        "Missing Unit Cost",
                        "No unit cost saved in Square for this product.<br><br>Switched this row back to retail pricing.<br><br>Use the 'Use unit cost' toggle again if needed, but make sure unit cost is defined in Square.",
                        "OK"
                    );
                    return;
                }

                rawPrice = parseFloat(rawUnitStr);
            } else {
                rawPrice = parseFloat(row.cells[3].dataset.rawPrice) || 0;
            }

            console.log(rawPrice);

            if (isNaN(rawPrice)) rawPrice = 0;

            const scaledRawPrice = Math.round(rawPrice * 100);

            const totalSinglePrice = scaledRawPrice * discountMultiplier / 100;
            const totalPrice = scaledQuantity * scaledRawPrice * discountMultiplier / 10000;

            row.cells[3].dataset.finalOutputPrice = (scaledRawPrice / 100).toFixed(2);

            let display = formattedPriceDisplay(row, scaledRawPrice, scaledQuantity, totalSinglePrice, totalPrice);

            if (discountPercent !== 0) {
                row.cells[3].textContent = display.dollarDisplayDiscount;
                row.cells[4].textContent = display.dollarDisplayAllDiscount;
            } else {
                row.cells[3].textContent = display.dollarDisplay;
                row.cells[4].textContent = display.dollarDisplayAll;
            }

            if (row.dataset.active === 'false') {
                row.cells[4].dataset.rawUnitPrice = totalPrice;
            } else {
                row.cells[4].dataset.rawPrice = totalPrice;
            }
        }
    });
}


function insertRow() {
    const grid = document.getElementById('grid');
    const newRow = grid.insertRow(-1);
    const cellSKU = newRow.insertCell(0);
    const cellItem = newRow.insertCell(1);
    const cellQuantity = newRow.insertCell(2);

    const cellPrice = newRow.insertCell(4);
    const cellPriceAll = newRow.insertCell(5);
    const cellDiscount = newRow.insertCell(6);
    const cellOverride = newRow.insertCell(7);
    

    cellSKU.contentEditable = "true";
    cellSKU.innerHTML = "Search SKU/Barcode...";  // Default text for SKU
    cellItem.contentEditable = "true";
    cellQuantity.contentEditable = "true";
    cellPrice.contentEditable = "true";
    cellPriceAll.contentEditable = "false";
    cellDiscount.contentEditable = "true";

    cellPrice.dataset.rawPrice = "0.00";  // Initialize raw price data
    cellPriceAll.dataset.rawPrice = "0.00";  // Initialize raw total price data
    cellPrice.dataset.finalOutputPrice = "0.00";
    cellItem.innerHTML = "Search item name...";
    cellQuantity.innerHTML = "1";
    cellPrice.innerHTML = "0.00";
    cellPriceAll.innerHTML = "0.00";

    // Attach listeners
    for (const cell of newRow.cells) {
        addEventListenersToCell(cell);
    }

    updateTotal();


}

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('grid');

    // Function to add event listeners to all cells in a row
    function addEventListenersToRow(row) {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            addEventListenersToCell(cell);
        });
    }

    // Function to add event listeners to a single cell
    function addEventListenersToCell(cell) {
        cell.addEventListener('click', highlightText);
        cell.addEventListener('focus', highlightText, true);
        cell.addEventListener('input', function() {
            const colIndex = cell.cellIndex;
            if (colIndex === 5) {
                // Keep only digits and dots
                let text = cell.textContent.replace(/[^0-9.]/g, '').trim();
                if (text !== '') {
                    cell.textContent = text + '%';
                    // Reposition cursor
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.setStart(cell.firstChild, text.length);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        });
    }

    // Attach listeners to all existing rows at load
    const existingRows = grid.querySelectorAll('tr');
    existingRows.forEach(row => {
        addEventListenersToRow(row);
    });

    window.insertRow = function() {
        const grid = document.getElementById('grid');
        const prevScrollHeight = document.body.scrollHeight;
        const newRow = grid.insertRow(-1);
        for (let i = 0; i < 8; i++) { // Adjust to 6 for the new "Overwrite price" button
            const cell = newRow.insertCell(i);
            cell.contentEditable = "true";

            switch (i) {
                case 0:
                    cell.innerHTML = "Search SKU/Barcode...";
                    break;
                case 1:
                    cell.innerHTML = "Search item name...";
                    break;
                case 2:
                    cell.innerHTML = "1"; // Default quantity
                    break;
                case 3:
                    cell.contentEditable = "false";
                    cell.innerHTML = "0.00";
                    break;
                case 4:
                    cell.contentEditable = "false";
                    cell.innerHTML = "0.00";
                    break;
                    
                case 5:
                    cell.contentEditable = "true";
                    cell.innerHTML = "0%";
                    break;
                case 6:
                    cell.contentEditable = "false";
                    createOverwriteButton(cell); // Add a button for overwriting price
                    createUnitRetailButton(cell);
                    break;
                case 7:
                    cell.contentEditable = "false";
                    createDeleteButton(cell);
                    
                    break;
            }
            
            addEventListenersToCell(cell);
        }
        updateTotal();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
                if (scrollHeight > prevScrollHeight) {
                    window.scrollTo({ top: scrollHeight, behavior: 'smooth' });
                }
            });
        });
    };
});

function createDeleteButton(cell) {
    const button = document.createElement('button');
    button.textContent = 'Delete';
    button.onclick = function () {
        deleteRow(this); // Assuming the function correctly deletes the row
    };
    cell.appendChild(button);
}

function createUnitRetailButton(cell) {
    const button = document.createElement('button');
    button.textContent = 'Use unit cost';
    button.classList.add('row-toggle');
    
    const row = cell.parentElement;
    row.dataset.active = "true";  // default state

    button.onclick = () => {
        const isActive = row.dataset.active === "true";
        row.dataset.active = (!isActive).toString();  // toggle the state

        button.textContent = isActive ? 'Use retail price' : 'Use unit cost';
        button.style.opacity = isActive ? '0.9' : '1';
        button.style.backgroundColor = isActive ? '#ccc' : '';
        updatePrices(true);
    };

    cell.appendChild(button);
    cell.contentEditable = "false";
}


function initializeUnitRetailButtons() {
    document.querySelectorAll('.row-toggle').forEach(button => {
        const row = button.closest('tr');
        row.dataset.active = "true";  // default state

        button.onclick = () => {
            const isActive = row.dataset.active === "true";
            row.dataset.active = (!isActive).toString();  // toggle the state

            button.textContent = isActive ? 'Use retail price' : 'Use unit cost';
            button.style.opacity = isActive ? '0.6' : '1';
            button.style.backgroundColor = isActive ? '#ccc' : '';
            updatePrices(true);
        };
    });
}

// Call this once after the table is rendered
window.addEventListener('DOMContentLoaded', initializeUnitRetailButtons);


function deleteRow(button) {
    const row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
    updateTotal(); // Recalculate the total after the row is deleted
}


function createOverwriteButton(cell) {
    const button = document.createElement('button');
    button.textContent = 'Edit';
    button.onclick = function() {
        openPricePopup(this.parentElement.parentElement); // Pass the current row
    };
    cell.appendChild(button);
    cell.contentEditable = "false"; // The cell itself should not be editable
}

function openPricePopup(row) {
    let priceInput = 0;

    if (row.dataset.active === 'false') { // If we are using unit cost mode

        if (divisor == 1.1){
            priceInput = prompt("YOU ARE OVER-TYPING UNIT COST (which EXCLUDES GST presently). Enter a new price PER unit (EXCLUDING GST) Leave out $ symbols. Just normal decimal format please (with lots of decimal places for precision):", "");
        }
        else{
            priceInput = prompt("YOU ARE OVER-TYPING UNIT COST (which INCLUDES GST presently). Enter a new price PER unit (INCLUDING GST) Leave out $ symbols. Just normal decimal format please (with lots of decimal places for precision):", "");
        }
    
        if (priceInput !== null && priceInput.trim() !== "") {
            const newPrice = parseFloat(priceInput);
            if (!isNaN(newPrice)) {
                row.cells[3].dataset.rawUnitPrice = newPrice; // Update the dataset for calculations
                row.cells[3].textContent = `$${newPrice.toFixed(2)}`;
                updatePrices(); // Update all prices based on this input
                updateTotal(); // Recalculate the total
            } else {
                alert("Please enter a valid number for the price.");
            }
        }
    
    
    
    } else {

        if (divisor == 1.1){
            priceInput = prompt("Enter a new price PER unit (EXCLUDING GST). Leave out $ symbols. Just normal decimal format please (with lots of decimal places for precision):", "");
        }
        else{
            priceInput = prompt("Enter a new price PER unit (INCLUDING GST) Leave out $ symbols. Just normal decimal format please (with lots of decimal places for precision):", "");
        }
        
        if (priceInput !== null && priceInput.trim() !== "") {
            const newPrice = parseFloat(priceInput);
            if (!isNaN(newPrice)) {
                row.cells[3].dataset.rawPrice = newPrice; // Update the dataset for calculations
                row.cells[3].textContent = `$${newPrice.toFixed(2)}`;
                updatePrices(); // Update all prices based on this input
                updateTotal(); // Recalculate the total
            } else {
                alert("Please enter a valid number for the price.");
            }
        }

    }
}

function addEventListenersToCell(cell) {
    cell.addEventListener('click', highlightText);
    cell.addEventListener('focus', highlightText, true);
}


function highlightText(event) {
    console.log("Highlight function triggered"); // Debug output
    const target = event.target;
    setTimeout(() => {
        if (target.contentEditable === "true") {
            target.select ? target.select() : document.execCommand('selectAll', false, null);
        }
    }, 0);
}

let timeout = null;
function handleInput(event) {
    clearTimeout(timeout);
    const target = event.target;

    hideAllDropdowns();

    timeout = setTimeout(() => {
        // Grab only the raw user-typed text, ignoring any dropdown content
        const userText = (target.childNodes[0] && target.childNodes[0].nodeValue || "").trim();

        console.log(`Searching for: ${userText}`);
        hideAllDropdowns();

        if (userText.length > 0) {
            searchItems(userText, target);
        } else {
            hideAllDropdowns();
        }
    }, 300);
}

function handleItemSearch(event) {
    clearTimeout(timeout);
    const targetCell = event.target;

    // Hide the dropdown immediately upon receiving input
    hideAllDropdowns();

    timeout = setTimeout(() => {
        const searchText = (targetCell.childNodes[0] && targetCell.childNodes[0].nodeValue || "").trim();
        console.log("Searching for: " + searchText);
        if (searchText.length > 0) {
            // First API Call to search for item variations
            fetch('/api/items/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "object_types": ["ITEM_VARIATION"],
                    "query": {
                        "text_query": {
                            "keywords": [searchText]
                        }
                    }
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                const itemIds = data.objects.map(obj => obj.item_variation_data.item_id).slice(0, 10);
                if (itemIds.length > 0) {
                    // Second API Call to retrieve detailed information about the items
                    fetch('/api/items/batch-details', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "object_ids": itemIds
                        })
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
    }, 500); // Wait for 1 second after typing stops
}


function searchItems(query, targetCell) {
    console.log(`Running search with query '${query}'`);
    const data = {
        "object_types": ["ITEM"],
        "query": {
            "text_query": {
                "keywords": [query.trim()]
            }
        }
    };

    fetch('/api/items/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => displayDropdown(data.objects, targetCell))
    .catch(error => console.error('Error:', error))
}


function displayDropdown(items, targetCell) {
    console.log(items);
    hideAllDropdowns();
    let dropdown = targetCell.parentNode.querySelector('.dropdown-content');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'dropdown-content';
        dropdown.style.position = 'absolute';
        dropdown.style.zIndex = '9999';
        targetCell.style.position = 'relative'; // ensure cell is positioning anchor
        targetCell.appendChild(dropdown); // ✅ lock it to the cell itself
    }

    dropdown.innerHTML = ''; // Clear previous content
    dropdown.style.display = 'block';

    let displayedItems = Array.isArray(items) ? items.slice(0, 10) : [];

    if (displayedItems.length > 0) {
        displayedItems.forEach(item => {
            let link = document.createElement('a');
            link.href = '#';
            link.textContent = item.item_data.name;
            link.onclick = () => handleVariations(item, targetCell, dropdown);
            dropdown.appendChild(link);
        });
    } else {
        let noResult = document.createElement('div');
        noResult.textContent = "No results";
        dropdown.appendChild(noResult);
    }

    // 🔽 or 🔼 Decide dropdown direction based on space
    const cellRect = targetCell.getBoundingClientRect();
    const dropdownHeight = dropdown.offsetHeight || 150; // assume rough height before render
    const spaceBelow = window.innerHeight - cellRect.bottom;
    const spaceAbove = cellRect.top;

    dropdown.style.top = (spaceBelow > dropdownHeight)
        ? '100%'   // show below
        : `-${dropdownHeight}px`; // show above
    dropdown.style.left = '0px'; // anchor to left edge of the cell
    dropdown.style.width = '100%'; // make it match the cell
}


function handleVariations(item, targetCell, dropdown) {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Kill all unit prices stored in case the row is over-typed
    delete targetCell.parentNode.cells[3].dataset.rawUnitPrice;
    const isUsingUnitPrice =  targetCell.parentNode.dataset.active === 'false'; // false = using unit price
    const toggleButton =  targetCell.parentNode.cells[6].querySelector('.row-toggle');

    if (toggleButton && isUsingUnitPrice) {
        toggleButton.click(); // Switch it back to retail price (active = true)
    }


    // Remove focus to avoid contenteditable causing scroll jump
    const active = document.activeElement;
    if (active && active !== document.body) active.blur();

    if (item.item_data.variations && item.item_data.variations.length > 1) {
        showVariationPopup(item.item_data.variations, targetCell, item, dropdown);
    } else if (item.item_data.variations.length === 1) {
        let variation = item.item_data.variations[0];


        targetCell.parentNode.cells[0].textContent = variation.item_variation_data.sku;
        targetCell.parentNode.cells[1].textContent = item.item_data.name;

        let price = (variation.item_variation_data.price_money.amount / 100) / divisor;
        let unitCost = variation.item_variation_data.default_unit_cost?.amount;
        if (unitCost !== undefined) {
            targetCell.parentNode.cells[3].dataset.rawUnitPrice = unitCost / 100 / divisor;
        } else {
            delete targetCell.parentNode.cells[3].dataset.rawUnitPrice;
        }
        targetCell.parentNode.cells[3].dataset.rawPrice = price;
        targetCell.parentNode.cells[3].textContent = `$${price.toFixed(2)}`;

        let priceAll = price * parseFloat(targetCell.parentNode.cells[2].textContent);
        let unitCostAll = unitCost * parseFloat(targetCell.parentNode.cells[2].textContent); 
        targetCell.parentNode.cells[4].dataset.rawUnitPrice = unitCostAll;
        targetCell.parentNode.cells[4].dataset.rawPrice = priceAll;
        targetCell.parentNode.cells[4].textContent = `$${priceAll.toFixed(2)}`;

        dropdown.style.display = 'none';
    } else {
        targetCell.textContent = item.item_data.name;
        dropdown.style.display = 'none';
    }

    // Restore scroll position manually
    requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
}


function showVariationPopup(variations, targetCell, item, dropdown) {
    document.querySelectorAll('.variation-popup').forEach(popup => popup.remove());
    const popup = document.createElement('div');
    popup.className = 'variation-popup';

    // Styles
    Object.assign(popup.style, {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        border: '1px solid black',
        background: 'white',
        padding: '20px',
        zIndex: '1000',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        maxWidth: '70vw',
        maxHeight: '90vh',
        overflowY: 'auto',
    });

    // Make it non-focusable to avoid scroll jumps
    popup.setAttribute('tabindex', '-1');

    // Backup scroll position
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    variations.forEach(variation => {
        const option = document.createElement('button');
        option.textContent = variation.item_variation_data.name;
        option.style.display = 'block';
        option.style.marginBottom = '8px';
        option.setAttribute('tabindex', '-1'); // prevent focus
        option.onclick = () => {
            let variationData;

            fetch('/api/items/batch-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "object_ids": variation.id
                })
            })
            .then(response => response.json())
            .then(data => {
                variationData = data.objects;
            })
            console.log(variationData);


            const row = targetCell.parentNode;
            row.cells[1].textContent = item.item_data.name + " - " + option.textContent;
            row.cells[0].textContent = variation.item_variation_data.sku;

            const price = (variation.item_variation_data.price_money.amount / 100) / divisor;
            row.cells[3].dataset.rawPrice = price;

            let unitCost = variation.item_variation_data.default_unit_cost?.amount;
            if (unitCost !== undefined) {
                row.cells[3].dataset.rawUnitPrice = unitCost / 100 / divisor;
            } else {
                delete row.cells[3].dataset.rawUnitPrice;
            }

            row.cells[3].textContent = `$${price.toFixed(2)}`;



            const priceAll = price * parseFloat(row.cells[2].textContent);
            let unitCostAll = unitCost * parseFloat(row.cells[2].textContent); 
            
            row.cells[4].dataset.rawPrice = priceAll;
            row.cells[4].dataset.rawUnitPrice = unitCostAll;
            row.cells[4].textContent = `$${priceAll.toFixed(2)}`;

            dropdown.style.display = 'none';
            document.body.removeChild(popup);
            dropdown.style.display = 'none';
            popup.remove();
            document.removeEventListener('click', outsideClickListener);
        };
        popup.appendChild(option);
    });


    function outsideClickListener(event) {
        if (!popup.contains(event.target)) {
            popup.remove();
            document.removeEventListener('click', outsideClickListener);
        }
    }

    // Defer appending to avoid triggering layout-driven scroll
    requestAnimationFrame(() => {
        document.body.appendChild(popup);

        // Force restore scroll in case browser jumps
        window.scrollTo(scrollX, scrollY);
        document.addEventListener('mousedown', outsideClickListener);
    });
}


// Additional event listener to ensure dropdown hides when clicking elsewhere or on tab out
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('click', function(event) {
        const activeCell = document.activeElement;
        if (!event.target.matches('#grid td')) {
            hideAllDropdowns(); // Hide when clicking outside any cell
        }
    });

    const grid = document.getElementById('grid');
    grid.addEventListener('input', function(event) {
        if (event.target.cellIndex === 2) { // Handle price calculation
            updateTotal();
        } else if (event.target.cellIndex === 1) { // Handle item search
            handleInput(event);
        }
    });
});

// Initialize and attach event listeners also when new cells are added
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('grid');
    grid.addEventListener('input', function(event) {
        if (event.target.cellIndex === 2) { // Handle price calculation
            updateTotal();
        } else if (event.target.cellIndex === 0) { // Handle item search
            handleItemSearch(event);
        }
    });

    // Ensure dropdown is removed if clicking outside
    document.body.addEventListener('click', function(event) {
        if (!event.target.matches('#grid td')) {
            let dropdowns = document.querySelectorAll('.dropdown-content');
            dropdowns.forEach(dropdown => dropdown.style.display = 'none');
        }
    });
});




document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('grid');

    // Function to add event listeners to all cells in a row
    function addEventListenersToRow(row) {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            addEventListenersToCell(cell);
        });
    }

    // Function to add event listeners to a single cell
    function addEventListenersToCell(cell) {
        cell.addEventListener('click', highlightText);
        cell.addEventListener('focus', highlightText, true);
        cell.addEventListener('input', function() {
            // Hide any dropdowns when the user starts typing
            hideAllDropdowns();
        });
    }

    // Attach listeners to all existing rows at load
    const existingRows = grid.querySelectorAll('tr');
    existingRows.forEach(row => {
        addEventListenersToRow(row);
    });


});

// Function to hide all dropdowns
function hideAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(d => d.remove());
}

// Function to highlight text in editable cells
function highlightText(event) {
    const target = event.target;
    setTimeout(() => {
        if (target.contentEditable === "true") {
            target.select ? target.select() : document.execCommand('selectAll', false, null);
        }
    }, 0);
}

// Additional logic to manage dropdown visibility and grid interactions
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('grid');
    grid.addEventListener('input', function(event) {
        if (event.target.cellIndex === 0) { // Handle item search
            handleItemSearch(event);
        }
        if (event.target.cellIndex === 2 || event.target.cellIndex === 3 || event.target.cellIndex === 4 || event.target.cellIndex === 5) {
            // Trigger updateTotal when changes happen in quantity or price cells
            updateTotal();
            updatePrices();
        }
    });

    // Observer for changes in the grid content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                // Update total if rows are added or removed
                updateTotal();
            }
        });
    });
    observer.observe(grid, { childList: true, subtree: true });

    // Ensure dropdown is removed if clicking outside
    document.body.addEventListener('click', function(event) {
        if (!event.target.matches('#grid td')) {
            hideAllDropdowns();
        }
    });

    // Initial call to updateTotal to set initial state correctly
    updateTotal();
});

