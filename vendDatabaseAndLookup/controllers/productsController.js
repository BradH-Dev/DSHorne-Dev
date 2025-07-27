const db = require('../db');

exports.getProductDetails = (req, res) => {
    const productId = req.query.productId;
    if (!productId) return res.status(400).send('Product ID is required');

    const sql = 'SELECT variant_name FROM products WHERE id = ?';
    db.query(sql, [productId], (err, results) => {
        if (err) return res.status(500).send('Error fetching product details');
        res.json(results[0]);
    });
};