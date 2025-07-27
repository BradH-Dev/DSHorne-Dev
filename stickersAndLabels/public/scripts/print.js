import { showCustomAlert } from './utils.js';

export function printShipping() {
    const pdfUrl = document.getElementById('shippingLabel').value;
    if (!pdfUrl) {
        showCustomAlert('Please enter a valid URL and try again');
        return;
    }

    fetch('/print/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl })
    })
    .then(res => res.json())
    .then(data => showCustomAlert(data.message))
    .catch(err => {
        console.error('Error:', err);
        showCustomAlert('Failed to print the shipping label. Check the URL and restart the printer. Otherwise, contact Brad.');
    });
}

export function uploadAndPrint() {
    const fileInput = document.getElementById('freightFile');
    const file = fileInput.files[0];

    if (!file) {
        showCustomAlert('Please select a Direct Freight PDF file to print.');
        return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    fetch('/print/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => showCustomAlert(data.message))
    .catch(err => {
        console.error('Error:', err);
        showCustomAlert('Failed to print the file. Please check the file and try again.');
    });
}
