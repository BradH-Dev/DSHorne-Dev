
const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;

exports.forwardSearchRequest = async (req, res) => {
    const fetch = (await import('node-fetch')).default;
  
    try {
      const r = await fetch('https://connect.squareup.com/v2/catalog/search', {
        method: 'POST',
        headers: {
          'Square-Version': '2024-05-15',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      res.json(await r.json());
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Error forwarding request' });
    }
  };
  
  exports.forwardItemRequest = async (req, res) => {
    const fetch = (await import('node-fetch')).default;
  
    try {
      const r = await fetch('https://connect.squareup.com/v2/catalog/batch-retrieve', {
        method: 'POST',
        headers: {
          'Square-Version': '2024-05-15',
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      res.json(await r.json());
    } catch (e) {
      res.status(500).json({ error: 'Error forwarding request' });
    }
  };
  