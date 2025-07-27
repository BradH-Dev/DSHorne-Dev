
export function backToHome() {
    window.location.href = '/'; // Redirects to the home page
}

export function closeModal() {
    const modal = document.getElementById('lineItemsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Allow scrolling on the body
}

// Modified fetchProductDetails to return a promise with the variant name
export function fetchProductDetails(productId) {
    return fetch(`/api/products/details?productId=${productId}`)
        .then(async response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const text = await response.text();
            if (!text) {
                throw new Error('Empty response body');
            }
            const productDetail = JSON.parse(text);
            return productDetail.variant_name || 'No name';
        })
        .catch(err => {
            console.error('Failed to fetch product details:', err);
            return 'Product details unavailable'; // Default fallback
        });
}

export function generatePDF({ globalCustomer, globalDate, globalInvoice, globalTotalPrice }) {
    globalTotalPrice = parseFloat(globalTotalPrice) || 0;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const rightMargin = 10;
    const textOffset = pageWidth - rightMargin;

    const dateThreshold = new Date('May 6, 2024');
    const currentDate = new Date(globalDate);
    const logoFile = currentDate > dateThreshold ? '/shared/assets/new_logo.jpg' : '/shared/assets/old_logo.jpg';

    doc.addImage(logoFile, 'PNG', 10, 5, 100, 40);

    doc.setFontSize(10);
    if (currentDate > dateThreshold){
        doc.text("MILLCOOTA PTY LTD as trustee for", textOffset, 10, { align: "right" });
        doc.text("RAE FAMILY TRUST trading as DS Horne", textOffset, 15, { align: "right" });
        doc.text("ACN 676 399 992", textOffset, 20, { align: "right" });
        doc.text("ABN 27 839 233 829", textOffset, 25, { align: "right" });
        doc.text("113 Muller Road", textOffset, 35, { align: "right" });
        doc.text("Hampstead Gardens, SA 5086", textOffset, 40, { align: "right" });
    } else {
        doc.text("D.S. Horne Pty Ltd", textOffset, 10, { align: "right" });
        doc.text("ABN 19 224 873 282", textOffset, 15, { align: "right" });
        doc.text("113 Muller Road", textOffset, 25, { align: "right" });
        doc.text("Hampstead Gardens, SA 5086", textOffset, 30, { align: "right" });
    }

    doc.setFontSize(20);
    doc.text('Tax Invoice - Duplicate', 10, 60);

    let yOffset = 70;
    doc.setFontSize(10);

    if (globalCustomer.customer_code !== "WALKIN") {
        doc.text('To:', 10, yOffset); yOffset += 5;

        const fullName = `${globalCustomer.first_name || ''} ${globalCustomer.last_name || ''}`.trim();
        const companyName = globalCustomer.company_name?.trim() || '';
        const email = globalCustomer.email?.trim() || '';

        let phone = '';

        if (globalCustomer.phone) {
            phone += `${globalCustomer.phone}`;
        }
        if (globalCustomer.mobile && globalCustomer.phone && globalCustomer.mobile.length > 2 && globalCustomer.phone.length > 2) {
            phone += ` | `;
        }
        if (globalCustomer.mobile) {
            phone += `${globalCustomer.mobile}`;
        }
        phone = phone.trim();

        const addressLines = [
            globalCustomer.physical_address_1,
            globalCustomer.physical_address_2,
            [globalCustomer.physical_suburb, globalCustomer.physical_city, globalCustomer.physical_state].filter(Boolean).join(', '),
            globalCustomer.physical_postcode,
            globalCustomer.physical_country_id,
        ].filter(Boolean);

        if (fullName) { doc.text(fullName, 15, yOffset); yOffset += 5; }
        if (companyName) { doc.text(companyName, 15, yOffset); yOffset += 5; }

        yOffset += 1;
        doc.setFont('helvetica', 'bolditalic');
        addressLines.forEach(line => { doc.text(line.trim(), 15, yOffset); yOffset += 5; });
        doc.setFont('helvetica', 'normal');
        yOffset += 1;

        if (email) { doc.text(email, 15, yOffset); yOffset += 5; }
        if (phone) { doc.text(phone, 15, yOffset); yOffset += 5; }
        yOffset += 7;
    }

    doc.text(`Invoice Date: ${globalDate}`, 10, yOffset); yOffset += 5;
    doc.text(`Invoice Number: ${globalInvoice}`, 10, yOffset); yOffset += 10;

    const lineItemsTable = document.getElementById('lineItemsTable');
    const trs = lineItemsTable?.querySelectorAll('tbody tr') || [];
    const rows = Array.from(trs).slice(0, -1).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent));

    if (yOffset + 10 > pageHeight - 30) { doc.addPage(); yOffset = 10; }

    doc.autoTable({
        head: [['Product Name', 'Quantity', 'Price per (excl GST)', 'GST per', 'Total (incl GST)']],
        body: rows,
        startY: yOffset
    });
    yOffset = doc.lastAutoTable.finalY + 10;

    const gstTotalAccurate = globalTotalPrice / 11;
    const tableWidth = pageWidth / 2;

    if (yOffset + 15 > pageHeight - 30) { doc.addPage(); yOffset = 10; }
    doc.autoTable({
        head: [['', '']],
        body: [
            ["Subtotal (excl GST)", `$${(globalTotalPrice - gstTotalAccurate).toFixed(2)}`],
            ["Total GST", `$${gstTotalAccurate.toFixed(2)}`],
            ["Total (incl GST)", `$${globalTotalPrice.toFixed(2)}`]
        ],
        startY: yOffset,
        columnStyles: { 1: { fontStyle: 'bold' } },
        tableWidth,
        margin: { left: tableWidth - rightMargin - 4, right: rightMargin }
    });
    yOffset = doc.lastAutoTable.finalY + 10;

    if (yOffset + 20 > pageHeight - 30) { doc.addPage(); yOffset = 10; }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, yOffset, pageWidth - 10, yOffset);
    yOffset += 5;

    let paidTotal = 0;
    const paymentDetails = document.getElementById('paymentDetails');
    const payments = [];
    if (paymentDetails) {
        let paymentInfo = paymentDetails.innerText.split('\n').filter(Boolean);
        yOffset += 5;
        for (let info of paymentInfo) {
            const amountMatch = info.match(/\$(-?[\d\.]+)/);
            if (!amountMatch) continue;
            const amount = parseFloat(amountMatch[1]);
            payments.push({ line: info, amount });

            const methodMatch = info.match(/^([^:]+):/);
            const refundText = methodMatch?.[1]?.trim() === "Cash"
                ? "Change tendered/refunded: "
                : `${methodMatch?.[1]?.trim()} refund: `;

            const paidOnMatch = info.match(/paid on (.+)/);

            if (amount < 0) {
                doc.text(`${refundText}$${Math.abs(amount).toFixed(2)}, completed on ${paidOnMatch?.[1]?.trim() || ''}`, 10, yOffset);
                paidTotal -= amount;
            } else {
                doc.text(info, 10, yOffset);
                paidTotal += amount;
            }
            yOffset += 5;
        }
    }

    yOffset += 5;
    const balanceDue = globalTotalPrice - paidTotal;

    doc.setFontSize(14);
    doc.autoTable({
        head: [['', '']],
        body: [
            ["Total balance paid", `$${paidTotal.toFixed(2)}`],
            ["Total balance due", `$${balanceDue.toFixed(2)}`]
        ],
        startY: yOffset,
        columnStyles: { 1: { fontStyle: 'bold' } },
        tableWidth,
        margin: { right: rightMargin }
    });

    doc.output('blob').arrayBuffer().then(buffer => {
        const formData = new FormData();
        formData.append('pdf', new Blob([buffer]), `${globalInvoice}.pdf`);

        fetch('/api/pdfs/save', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.url) window.open(data.url, '_blank');
            else alert('PDF upload failed');
        })
        .catch(err => {
            console.error('PDF upload error:', err);
            alert('Something went wrong while uploading the PDF.');
        });
    });
}