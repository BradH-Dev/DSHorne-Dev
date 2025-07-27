const axios = require('axios');
const AUTH_TOKEN = process.env.SQUARE_AUTH_TOKEN;

exports.handleBarcodeScan = async (req, res) => {
  const { barcode } = req.body;
  const headers = {
    'Square-Version': '2024-03-20',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    const search = async (attr) => {
      return axios.post('https://connect.squareup.com/v2/catalog/search', {
        query: { exact_query: { attribute_value: barcode, attribute_name: attr } },
        object_types: ['ITEM_VARIATION']
      }, { headers });
    };

    let response = await search('sku');
    if (!response.data.objects?.length) response = await search('upc');

    if (response.data.objects?.length) {
      const variation = response.data.objects[0];
      const { amount, currency } = variation.item_variation_data.price_money;
      const unitType = variation.item_variation_data.measurement_unit_id;
      let itemName = variation.item_variation_data.name;

      const fetchItemName = async () => {
        const itemId = variation.item_variation_data.item_id;
        const r = await axios.get(`https://connect.squareup.com/v2/catalog/object/${itemId}`, { headers });
        if (r.data.object?.item_data?.name) {
          itemName = variation.item_variation_data.name === 'Regular'
            ? r.data.object.item_data.name
            : `${r.data.object.item_data.name} - ${variation.item_variation_data.name}`;
        }
      };

      await fetchItemName();

      const suffix = unitType === 'TPCSTBJNZI4CT6C4DWXLEEE4' ? 'per sq/ft'
                    : unitType === '32DG7AKGAOXF7JCF2FNFNJPE' ? 'per sq/m'
                    : 'ea';
      const price = `$${(amount / 100).toFixed(2)} ${suffix}`;

      res.json({ price, currency, itemName });
    } else {
      res.json({ message: 'Unknown product, ask a team member for assistance' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
