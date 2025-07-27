const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;
const BASE_URL = 'https://connect.squareup.com/v2/orders';
const HEADERS = {
    'Square-Version': '2024-05-15',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
};

exports.searchOrders = async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/search`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error searching orders:', error);
        res.status(500).json({ error: 'Error searching orders' });
    }
};

exports.batchRetrieveOrders = async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/batch-retrieve`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error batch retrieving orders:', error);
        res.status(500).json({ error: 'Error retrieving orders' });
    }
};
