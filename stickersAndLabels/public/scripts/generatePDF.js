import { showCustomAlert } from './utils.js';

export function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const startX = 1;
    let x = startX, y = 10;
    const barcodeWidth = 38, barcodeHeight = 21, padding = 6;
    const contentWidth = barcodeWidth - padding;
    const contentHeight = barcodeHeight - 2 * padding;
    const columnWidth = barcodeWidth + 3;
    const rowHeight = barcodeHeight + 0.15;
    let pageRows = 0;
    const maxRowsPerPage = Math.floor((297 - 10) / rowHeight);

    const table = document.getElementById('entries');
    for (let i = 1; i < table.rows.length; i++) {
        const inputs = table.rows[i].getElementsByTagName('input');
        const sku = inputs[0].value;
        const quantity = parseInt(inputs[1].value);
        const price = table.rows[i].cells[3].textContent.trim();
        let itemName = table.rows[i].cells[2].textContent.trim();

        for (let q = 0; q < quantity; q++) {
            if (pageRows >= maxRowsPerPage) {
                doc.addPage();
                y = 10;
                pageRows = 0;
                x = startX;
            }

            let textY = y + padding;
            let maxBarcodeHeight, barcodeStartY;

            if (document.getElementById('includePrice').checked) {
                doc.setFontSize(10);
                doc.text(`${price}`, x + padding, textY);
                doc.setFontSize(6);

                const splitText = doc.splitTextToSize(itemName, contentWidth);
                if (splitText.length > 2) {
                    itemName = `${splitText[0]} ${splitText[1].substring(0, splitText[1].length - 3)}...`;
                }
                let lastTextY = textY;
                splitText.forEach((line, index) => {
                    if (index < 2) {
                        doc.text(line, x + padding, lastTextY + 3);
                        lastTextY += 3;
                    }
                });
                barcodeStartY = lastTextY + 2;
                maxBarcodeHeight = y + barcodeHeight - barcodeStartY - 1;
            } else {
                doc.setFontSize(8);
                const splitText = doc.splitTextToSize(itemName, contentWidth);
                if (splitText.length > 3) {
                    itemName = `${splitText[0]} ${splitText[1]} ${splitText[2].substring(0, splitText[2].length - 3)}...`;
                }
                let lastTextY = textY;
                splitText.forEach((line, index) => {
                    if (index < 3) {
                        doc.text(line, x + padding, lastTextY);
                        lastTextY += 3;
                    }
                });
                barcodeStartY = lastTextY - 1;
                maxBarcodeHeight = y + barcodeHeight - barcodeStartY - 1;
            }

            const canvas = document.createElement('canvas');
            JsBarcode(canvas, sku, {
                format: "CODE128",
                width: 1,
                height: maxBarcodeHeight,
                displayValue: false,
                margin: 0
            });

            const imgData = canvas.toDataURL("image/png");
            doc.addImage(imgData, 'PNG', x + startX + 4, barcodeStartY, contentWidth, maxBarcodeHeight);

            const SKUFontSize = 5;
            doc.setFontSize(SKUFontSize);
            const textWidth = doc.getStringUnitWidth(sku) * 5 / 2;
            const textBackgroundY = barcodeStartY + maxBarcodeHeight - 2;
            doc.setFillColor(255, 255, 255);
            doc.rect(x + startX + 4 + (contentWidth / 2) - (textWidth / 2), textBackgroundY + 0.4, textWidth, 4, 'F');
            doc.setTextColor(0, 0, 0);
            doc.text(sku, x + startX + 4 + (contentWidth / 2), textBackgroundY - 0.5 + SKUFontSize / 2, { align: 'center' });

            x += columnWidth;
            if (x + barcodeWidth > 210) {
                x = startX;
                y += rowHeight;
                pageRows++;
            }
        }
    }

    const pdfBlob = doc.output('blob');
    const formData = new FormData();
    formData.append("pdf", pdfBlob, "barcodes.pdf");

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.url) {
            window.open(data.url, '_blank');
        }
    })
    .catch(error => {
        console.error('Error uploading PDF:', error);
        showCustomAlert('Failed to upload the PDF. Please try again.');
    });
}
