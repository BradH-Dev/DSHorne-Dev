const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;
const BASE_URL = 'https://connect.squareup.com/v2/catalog';
const HEADERS = {
    'Square-Version': '2024-05-15',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
};

exports.searchItems = async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/search`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error searching catalog:', error);
        res.status(500).json({ error: 'Error searching catalog' });
    }
};


exports.getItemDetailsBatch = async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/batch-retrieve`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({
                object_ids: req.body.object_ids,
                include_related_objects: false,
                include_category_path_to_root: false
            })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Failed to fetch item details:', error);
        res.status(500).send('Failed to fetch item details');
    }
};
