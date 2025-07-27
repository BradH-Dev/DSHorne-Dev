import { generatePDF, closeModal, backToHome, fetchProductDetails } from '../shared/utils.js';

// Globals used to carry contextual data between modules (e.g for generating PDFs)
let globalCustomer = null;
let globalDate;
let globalInvoice;
let globalTotalPrice;

// DOM References used throughout this module
const modal = document.getElementById('lineItemsModal');
const progressBar = document.getElementById('progressBar');
const progressBarContainer = document.getElementById('progressBarContainer');
const generatePdfButton = document.getElementById('generatePdfButton');
const closeModalButton = document.querySelector('.close-button');
const salesContainer = document.getElementById('salesContainer');

// Wire up top-level UI event handlers
document.getElementById('backToHomeButton').addEventListener('click', backToHome);
closeModalButton.addEventListener('click', closeModal);
generatePdfButton.addEventListener('click', () => {
    generatePDF({ globalCustomer, globalDate, globalInvoice, globalTotalPrice });
});

// Allow modal dismissal when clicking outside it
window.onclick = function(event) {
    if (event.target === modal) closeModal();
};

// When the page loads, extract the query params and begin data fetch for sales records
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    fetchSalesData(urlParams);
});


// --- Fetch and Render Core Sales Data ---

// Loads customer details and injects them into the modal view
function fetchCustomerDetails(customerId) {
    fetch(`/api/customers/get-details?id=${customerId}`)
        .then(res => res.json())
        .then(customer => {
            globalCustomer = customer;

            // Combine physical address fields, filter out falsy values
            const phone = [customer.phone, customer.mobile].filter(Boolean).join(' | ');
            document.getElementById('customerInfo').innerHTML = `
                <table class="customer-details-table">
                    <tr><th>Name</th><td>${customer.first_name || ''} ${customer.last_name || ''}</td></tr>
                    <tr><th>Company</th><td>${customer.company_name || ''}</td></tr>
                    <tr><th>Address</th><td>${[
                        customer.physical_address_1,
                        customer.physical_address_2,
                        customer.physical_suburb,
                        customer.physical_city,
                        customer.physical_postcode,
                        customer.physical_state
                    ].filter(Boolean).join(', ')}</td></tr>
                    <tr><th>Email</th><td>${customer.email || ''}</td></tr>
                    <tr><th>Phone/Mobile</th><td>${phone}</td></tr>
                </table>`;
        })
        .catch(err => console.error('Failed to load customer data:', err));
}

// Fetches unknown-customer sales data and displays a loading bar while retrieving it
function fetchSalesData(queryParams) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/sales/get-unknown-customer?${queryParams}`);

    // Show the progress bar at the top of the page
    progressBarContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';

    // Update progress bar as download progresses
    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = ((event.loaded / event.total) * 100).toFixed(0);
            progressBar.style.width = `${percent}%`;
            progressBar.textContent = `${percent}%`;
        } else {
            progressBar.textContent = 'Loading...';
        }
    };

    // When data is loaded, parse and render it
    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            const sales = JSON.parse(xhr.responseText);
            progressBar.style.width = '100%';
            progressBar.textContent = 'Formatting data into table, this may take a moment...';
            setTimeout(() => displaySalesData(sales), 50);
        } else {
            console.error('Error fetching customer sales:', xhr.statusText);
            progressBarContainer.style.display = 'none';
        }
    };

    xhr.onerror = () => {
        console.error('Request failed');
        progressBarContainer.style.display = 'none';
    };

    xhr.send();
}


// --- Table Rendering and Sorting ---

// Renders the table header and populates the body with sale rows
function displaySalesData(sales) {
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date of Sale</th>
                <th>Invoice Number</th>
                <th>Receipt Number</th>
                <th>Status</th>
                <th>Total Price</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    salesContainer.appendChild(table);
    const tbody = table.querySelector('tbody');

    // Insert rows into the table
    populateTable(sales, tbody);

    // Enable sorting by column with directional toggle
    const headers = table.querySelectorAll('thead th');
    const sortDirections = Array(headers.length).fill(true);
    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            const isAsc = sortDirections[index];
            sortTableByColumn(table, index, isAsc);
            sortDirections[index] = !isAsc;
        });
    });

    // Default sort by date (column 0)
    sortTableByColumn(table, 0, true);
    progressBarContainer.style.display = 'none';
}

// Creates rows for each sale and appends them to the table
function populateTable(sales, tbody) {
    const fragment = document.createDocumentFragment();

    sales.forEach(sale => {
        const saleDate = new Date(sale.sale_date);
        const formattedDate = `${saleDate.getDate().toString().padStart(2, '0')}/${(saleDate.getMonth() + 1).toString().padStart(2, '0')}/${saleDate.getFullYear()}`;
        const statusMap = {
            'ONACCOUNT_CLOSED': 'COMPLETED - ON ACCOUNT',
            'ONACCOUNT': 'INCOMPLETE',
            'CLOSED': 'COMPLETED - CLOSED'
        };
        const saleStatusText = statusMap[sale.status] || sale.status;

        const row = document.createElement("tr");
        row.setAttribute('data-sale-id', sale.id);
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${sale.invoice_number}</td>
            <td>${sale.receipt_number}</td>
            <td>${saleStatusText}</td>
            <td>$${parseFloat(sale.total_price_incl).toFixed(2)}</td>
        `;
        row.onclick = () => {
            fetchSaleLineItems(
                sale.id,
                formattedDate,
                sale.total_price_incl,
                saleStatusText,
                sale.receipt_number,
                sale.invoice_number,
                sale.customer_id
            );
        };
        fragment.appendChild(row);
    });

    // Add a clear ending row for visual separation
    const endRow = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "--- End of sales ---";
    cell.style.textAlign = "center";
    endRow.appendChild(cell);
    fragment.appendChild(endRow);

    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

// Handles sorting the sales table by column and toggling direction
function sortTableByColumn(table, column, asc = true) {
    const dir = asc ? 1 : -1;
    const tBody = table.tBodies[0];
    const rows = Array.from(tBody.querySelectorAll("tr"));
    const endRow = rows.pop();

    const sorted = rows.sort((a, b) => {
        const aText = a.children[column].textContent.trim();
        const bText = b.children[column].textContent.trim();

        if (column === 0) {
            return dir * (new Date(aText.split('/').reverse().join('-')) - new Date(bText.split('/').reverse().join('-')));
        }
        if (column === 4) {
            return dir * (parseFloat(aText.slice(1)) - parseFloat(bText.slice(1)));
        }
        return dir * aText.localeCompare(bText);
    });

    tBody.innerHTML = '';
    tBody.append(...sorted, endRow);

    // Visually mark the sorted column
    table.querySelectorAll("th").forEach(th => th.classList.remove("th-sort-asc", "th-sort-desc"));
    table.querySelector(`th:nth-child(${column + 1})`).classList.toggle("th-sort-asc", asc);
    table.querySelector(`th:nth-child(${column + 1})`).classList.toggle("th-sort-desc", !asc);
}


// --- Modal Details and Line Items ---

// Fetches and formats all sale item data to show in modal
function fetchSaleLineItems(saleId, saleDate, totalPrice, saleStatus, receiptNum, invoiceNum, customerId) {
    globalDate = saleDate;
    globalInvoice = invoiceNum;
    globalTotalPrice = totalPrice;

    fetchCustomerDetails(customerId);

    fetch(`/api/sales/get-line-items?saleId=${saleId}`)
        .then(res => res.json())
        .then(lineItems => {
            const tbody = document.getElementById('lineItemsTable').querySelector('tbody');
            tbody.innerHTML = '';

            const promises = lineItems.map(item =>
                fetchProductDetails(item.product_id).then(name => ({ ...item, variantName: name }))
            );

            Promise.all(promises).then(items => {
                items.sort((a, b) => a.variantName.localeCompare(b.variantName));
                items.forEach(item => {
                    const quantity = ((item.total_price / item.price).toFixed(2)) || item.quantity.toFixed(2);
                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${item.variantName}</td>
                        <td>${quantity}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>$${item.tax.toFixed(2)}</td>
                        <td>$${(item.total_price + item.total_tax).toFixed(2)}</td>
                    `;
                });

                // Add totals row with calculated GST and subtotal
                const gst = totalPrice / 11;
                const subtotal = totalPrice - gst;
                const summaryRow = tbody.insertRow();
                summaryRow.innerHTML = `
                    <td class="large-font"></td>
                    <td class="large-font"></td>
                    <td class="large-font">$${subtotal.toFixed(2)}</td>
                    <td class="large-font">$${gst.toFixed(2)}</td>
                    <td class="large-font"><strong>$${totalPrice.toFixed(2)}</strong></td>
                `;

                fetchPaymentDetails(saleId, saleStatus);
                openModal();
            });
        })
        .catch(err => console.error('Failed to load sale line items:', err));
}

// Fetches and displays the payment history for a given sale
function fetchPaymentDetails(saleId, status) {
    fetch(`/api/sales/get-payment?saleId=${saleId}`)
        .then(res => res.json())
        .then(payments => {
            const paymentDetails = document.getElementById('paymentDetails');

            // Handle empty payment scenarios
            if ((status === "INCOMPLETE" || status === "VOIDED") && payments.length === 0) {
                paymentDetails.innerHTML = status === "VOIDED"
                    ? 'No payments recorded as sale was voided.'
                    : 'No payments recorded. Either sale was incomplete, or there was likely a sync failure.';
                return;
            }

            // Format and inject payment entries
            const formatted = payments.map(payment => {
                const name = payment.name === 'Xero' ? 'Xero (on account)'
                          : payment.name === 'DEAR' ? 'DEAR (on account)'
                          : payment.name;

                const date = new Date(payment.payment_date);
                const formattedDate = payment.name === 'Xero'
                    ? date.toLocaleDateString('en-GB')
                    : date.toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });

                return `<li>${name}: $${payment.amount.toFixed(2)}, paid on ${formattedDate}</li>`;
            }).join('');

            paymentDetails.innerHTML = `<h3>Payment Details:</h3><ul>${formatted}</ul>`;
        })
        .catch(err => console.error('Failed to load payment details:', err));
}

// Opens the modal popup for the current sale
function openModal() {
    modal.style.display = 'block';
}
