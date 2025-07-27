// Imports shared utility functions for generating PDFs, navigating back to the home page,
// closing modals, and fetching product name data.
import { generatePDF, closeModal, backToHome, fetchProductDetails } from '../shared/utils.js';

// --- GLOBAL STATE ---
let globalCustomer = null;
let globalInvoice = null;
let globalTotalPrice = null;
let globalDate = null;

// --- INITIALIZATION ---
// Handles logic after DOM is fully loaded: parse URL params and attach modal handlers
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const customerId = params.get('id');

    if (customerId) {
        fetchCustomerDetails(customerId);
        fetchCustomerSales(customerId);
    }

    document.querySelector('.close-button').addEventListener('click', closeModal);
    window.onclick = event => {
        if (event.target === document.getElementById('lineItemsModal')) {
            closeModal();
        }
    };
});

// --- CUSTOMER DETAILS ---
// Fetches customer info and populates DOM with their basic profile
function fetchCustomerDetails(customerId) {
    fetch(`/api/customers/get-details?id=${customerId}`)
        .then(res => res.json())
        .then(customer => {
            globalCustomer = customer;
            const detailsContainer = document.getElementById('customerInfo');
            const phone = [customer.phone, customer.mobile].filter(p => p && p.length > 2).join(' | ');

            detailsContainer.innerHTML = `
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
                    <tr><th>Phone/Mobile</th><td>${phone || ''}</td></tr>
                </table>
            `;
        })
        .catch(err => console.error('Failed to load customer data:', err));
}

// --- SALES LIST ---
// Fetches and displays a summary table of all sales linked to this customer
function fetchCustomerSales(customerId) {
    fetch(`/api/customers/get-sales?id=${customerId}`)
        .then(res => res.json())
        .then(sales => {
            const tbody = document.getElementById('salesTable').querySelector('tbody');

            if (sales.length === 0) {
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 5;
                cell.innerText = "No sales for this customer";
                cell.style.textAlign = "center";
                return;
            }

            sales.forEach(sale => {
                const saleStatusMap = {
                    'ONACCOUNT_CLOSED': 'COMPLETED - ON ACCOUNT',
                    'ONACCOUNT': 'INCOMPLETE',
                    'CLOSED': 'COMPLETED - CLOSED'
                };

                const saleDate = new Date(sale.sale_date);
                const formattedDate = `${String(saleDate.getDate()).padStart(2, '0')}/${String(saleDate.getMonth() + 1).padStart(2, '0')}/${saleDate.getFullYear()}`;
                const status = saleStatusMap[sale.status] || sale.status;
                const price = sale.total_price_incl.toFixed(2);

                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${sale.invoice_number}</td>
                    <td>${sale.receipt_number}</td>
                    <td>${status}</td>
                    <td>$${price}</td>
                `;
                row.setAttribute('data-sale-id', sale.id);
                row.onclick = () => fetchSaleLineItems(sale.id, formattedDate, price, status, sale.receipt_number, sale.invoice_number);
            });

            const endRow = tbody.insertRow();
            const endCell = endRow.insertCell();
            endCell.colSpan = 5;
            endCell.innerText = "--- End of sales ---";
            endCell.style.textAlign = "center";
        })
        .catch(err => console.error('Failed to load customer sales:', err));
}

// --- SALE DETAILS ---
// Fetches itemized sale details and displays them in the modal
function fetchSaleLineItems(saleId, saleDate, saleTotal, saleStatus, receiptNum, invoiceNum) {
    fetch(`/api/sales/get-line-items?saleId=${saleId}`)
        .then(res => res.json())
        .then(lineItems => {
            // Fill in metadata fields
            document.getElementById('saleDate').innerText = saleDate;
            document.getElementById('saleStatus').innerText = saleStatus;
            document.getElementById('invoiceNum').innerText = invoiceNum;
            document.getElementById('receiptNum').innerText = receiptNum;

            globalDate = saleDate;
            globalInvoice = invoiceNum;
            globalTotalPrice = parseFloat(saleTotal);

            const tbody = document.getElementById('lineItemsTable').querySelector('tbody');
            tbody.innerHTML = '';

            const promises = lineItems.map(item =>
                fetchProductDetails(item.product_id).then(name => ({
                    ...item,
                    variantName: name || 'No name'
                }))
            );

            Promise.all(promises).then(items => {
                items.sort((a, b) => a.variantName.localeCompare(b.variantName));
                items.forEach(item => {
                    let quantity = item.quantity.toFixed(2);
                    if ((quantity * item.price).toFixed(1) != item.total_price) {
                        quantity = (item.total_price / item.price).toFixed(2);
                    }

                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${item.variantName}</td>
                        <td>${quantity}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>$${item.tax.toFixed(2)}</td>
                        <td>$${(item.total_price * 1.1).toFixed(2)}</td>
                    `;
                });

                // Add totals row
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td class="large-font"></td>
                    <td class="large-font"></td>
                    <td class="large-font">$${(saleTotal - (saleTotal / 11)).toFixed(2)}</td>
                    <td class="large-font">$${(saleTotal / 11).toFixed(2)}</td>
                    <td class="large-font"><strong>$${saleTotal}</strong></td>
                `;

                fetchPaymentDetails(saleId, saleStatus);
                document.getElementById('lineItemsModal').style.display = 'block';
            });
        })
        .catch(err => console.error('Failed to load sale line items:', err));
}

// --- PAYMENT INFO ---
// Loads and renders payment method breakdown and payment dates
function fetchPaymentDetails(saleId, saleStatusText) {
    fetch(`/api/sales/get-payment?saleId=${saleId}`)
        .then(res => res.json())
        .then(payments => {
            const container = document.getElementById('paymentDetails');
            container.innerHTML = '<h3>Payment Details:</h3><ul>';

            if (['INCOMPLETE', 'VOIDED'].includes(saleStatusText) && payments.length === 0) {
                container.innerHTML += saleStatusText === "VOIDED"
                    ? 'No payments recorded as sale was voided.'
                    : 'No payments recorded. Either sale was incomplete, or there was likely a sync failure with Xero.';
            } else {
                payments.forEach(payment => {
                    let type = payment.name === 'Xero' ? 'Xero (on account)' :
                               payment.name === 'DEAR' ? 'DEAR (on account)' :
                               payment.name;

                    const date = new Date(payment.payment_date);
                    const formatted = type === 'Xero'
                        ? date.toLocaleDateString('en-GB')
                        : date.toLocaleString('en-GB', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit', hour12: true
                        });

                    container.innerHTML += `<li>${type}: $${payment.amount.toFixed(2)}, paid on ${formatted}</li>`;
                });

                container.innerHTML += '</ul>';
            }
        })
        .catch(err => console.error('Failed to load payment details:', err));
}

// --- PDF + BUTTON HOOKS ---
// Hook up modal footer buttons for PDF and navigation
document.getElementById('closeModalButton').addEventListener('click', closeModal);
document.getElementById('backToHomeButton').addEventListener('click', backToHome);
document.getElementById('generatePdfButton').addEventListener('click', () => {
    generatePDF({ globalCustomer, globalDate, globalInvoice, globalTotalPrice });
});
