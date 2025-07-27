const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;
const BASE_URL = 'https://connect.squareup.com/v2/inventory/changes/batch-create';
const HEADERS = {
    'Square-Version': '2024-05-15',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
};

exports.updateStock = async (req, res) => {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Error updating inventory' });
    }
};
