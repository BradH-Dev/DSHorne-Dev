const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');

// Simulate barcode scanning
document.addEventListener('keydown', async (event) => {
    if (event.key === "Enter") {  // Simulating barcode scan trigger
        const barcode = prompt("Enter Barcode:");  // Simulate barcode input
        if (barcode) scanBarcode(barcode);
    }
});

async function scanBarcode(barcode) {
    statusDiv.textContent = 'Scanning...';
    const socket = new WebSocket('<enter websocket here>');

    socket.onopen = () => {
        socket.send(JSON.stringify({ action: 'scan', barcode: barcode }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.status) {
            statusDiv.textContent = data.status;  // Show "Running", "Almost there", etc.
        }

        if (data.result) {
            displayResult(data.result);
            socket.close();  // Close the WebSocket connection when done
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        statusDiv.textContent = 'Error communicating with server.';
        socket.close();
    };
}

function displayResult(result) {
    resultDiv.innerHTML = `
        <strong>Item Name:</strong> ${result.itemName}<br>
        <strong>Price:</strong> ${result.price} ${result.currency}
    `;
}
