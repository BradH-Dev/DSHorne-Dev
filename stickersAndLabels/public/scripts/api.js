export async function apiCall(sku) {
    const response = await fetch('/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: sku })
    });

    const itemDetails = await response.json();
    return itemDetails;
}