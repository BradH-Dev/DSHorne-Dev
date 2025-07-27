import { sleep, donePopup } from './helpers.js';
import { runFullProcess, setStatusText, setGlobalUploadBool, getGlobalUploadBool } from './logic.js';

// Disable the main action button by default - only enabled after file validation
document.getElementById('allProcessesButton').disabled = true;

/**
 * External Navigation Buttons
 * These buttons redirect the user to the relevant Square and Xero pages.
 * They are purely convenience links to reduce steps in the accounting workflow.
 */
document.getElementById('cogsButton').addEventListener('click', () => {
  window.open('https://app.squareup.com/dashboard/sales/inventory-reports/cogs', '_blank');
});

document.getElementById('xeroButton').addEventListener('click', () => {
  window.open('https://go.xero.com/Journal/Import.aspx', '_blank');
});

/**
 * File Upload Handler
 * This triggers when a user selects a CSV file from their device.
 * Validates file presence, sends to server, and updates UI state accordingly.
 */
document.getElementById('fileInput').addEventListener('change', () => {
  const file = document.getElementById('fileInput').files[0];
  if (file) {
    // Update visible file name and prepare upload payload
    document.getElementById('fileName').textContent = file.name;
    const formData = new FormData();
    formData.append('file', file);

    // Notify user of upload status and initiate upload to backend
    setStatusText('Uploading and processing file...', true);

    fetch('/upload/file', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        // Update UI and enable full processing only after successful upload
        setStatusText(data.message);
        setGlobalUploadBool(true);
        document.getElementById('allProcessesButton').disabled = false;
      })
      .catch(err => {
        // Upload failure fallback — block progress and notify user
        console.error('Error:', err);
        setStatusText('Failed to process file', false, true);
        setGlobalUploadBool(false);
      });
  }
});

/**
 * Custom Upload Button Click Handler
 * Provides a clean user interface for file selection by triggering hidden input.
 */
document.getElementById('customFileButton').addEventListener('click', () => {
  document.getElementById('allProcessesButton').disabled = true;
  document.getElementById('fileName').textContent = '';
  document.getElementById('fileInput').click();
});

/**
 * Main Process Trigger Button
 * When clicked, prompts the user whether to include invoice data in calculations.
 * This gate exists to influence downstream data aggregation logic.
 */
document.getElementById('allProcessesButton').addEventListener('click', () => {
  if (getGlobalUploadBool()) {
    const popup = document.getElementById('invoicePopup');

    // Reset modal state before showing it again
    document.getElementById('dateRangeSection').style.display = 'none';
    document.getElementById('yesInvoices').style.display = 'inline-block';
    document.getElementById('noInvoices').style.display = 'inline-block';
    document.getElementById('invoiceCheckText').innerHTML = `Would you like to include an invoice check before generating the full report?`;

    // Show modal and prepare outside click handler to dismiss it
    setTimeout(() => {
      popup.style.display = 'block';
      window.addEventListener('click', outsideClickHandler);
    }, 0);

    // Closes the modal if the user clicks outside its bounds
    function outsideClickHandler(event) {
      if (!popup.contains(event.target)) {
        popup.style.display = 'none';
        window.removeEventListener('click', outsideClickHandler);
      }
    }
  } else {
    // Block processing if file hasn't been uploaded and notify user
    donePopup('Upload a file first', '', 'OK');
  }
});

/**
 * User confirms inclusion of invoice check. This is to include invoices Angela manually generates
 * This triggers additional form input for selecting a date range.
 */
document.getElementById('yesInvoices').addEventListener('click', () => {
  document.getElementById('dateRangeSection').style.display = 'block';
  document.getElementById('invoiceCheckText').innerText =
    'Please enter the SAME start and end date range you selected in Square.';
  document.getElementById('yesInvoices').style.display = 'none';
  document.getElementById('noInvoices').style.display = 'none';
});

/**
 * User skips invoice check
 * Closes modal and proceeds immediately to primary data processing.
 */
document.getElementById('noInvoices').addEventListener('click', () => {
  document.getElementById('invoicePopup').style.display = 'none';
  document.getElementById('allProcessesButton').disabled = true;
  runFullProcess();
});

/**
 * Invoice Check Confirmation Handler
 * Sends a date range to the server to fetch manual invoice data,
 * and chains into full report generation once complete.
 */
document.getElementById('continueWithInvoices').addEventListener('click', async () => {
  const startDate = document.getElementById('startDatePopup').value;
  const endDate = document.getElementById('endDatePopup').value;
  if (!startDate || !endDate) return alert('Select start and end date.');

  // Hide the modal and inform user of potential long wait
  document.getElementById('invoicePopup').style.display = 'none';
  setStatusText(`Fetching manual Xero invoice data...`, true);

  // Convert local date input into UTC timestamps
  const updatedAfter = new Date(startDate + 'T00:00:00').toISOString();
  const updatedBefore = new Date(endDate + 'T23:59:59').toISOString();

  try {
    document.getElementById('allProcessesButton').disabled = true;

    // Hit the backend to fetch invoices within the given range
    const response = await fetch('/invoices/get', {
      method: 'POST',
      body: JSON.stringify({ updatedAfter, updatedBefore }),
      headers: { 'Content-Type': 'application/json' }
    });

    // Fallback in case of failure
    if (!response.ok) throw new Error('Invoice fetch failed');

    // Allow user time buffer before next action
    await sleep(3000);
    runFullProcess();
  } catch (err) {
    console.error(err);
    alert('Failed to fetch invoices. Continuing without them.');
    runFullProcess();
  }
});
