const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;

exports.batchRetrieveOrders = async (req, res) => {
    const fetch = (await import('node-fetch')).default;
    try {
        const result = await fetch('https://connect.squareup.com/v2/orders/batch-retrieve', {
            method: 'POST',
            headers: {
                'Square-Version': '2024-05-15',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await result.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error forwarding request' });
    }
};
