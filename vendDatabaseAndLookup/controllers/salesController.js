const db = require('../db');

exports.getUnknownCustomerSales = (req, res) => {
    const { start, end, minPrice, maxPrice, invoice } = req.query;
    let sql = 'SELECT * FROM sales WHERE 1=1';
    const params = [];

    if (start) {
        sql += ' AND created_at >= ?';
        params.push(start);
    }
    if (end) {
        sql += ' AND created_at <= ?';
        params.push(end);
    }
    if (minPrice) {
        sql += ' AND total_price_incl >= ?';
        params.push(minPrice);
    }
    if (maxPrice) {
        sql += ' AND total_price_incl <= ?';
        params.push(maxPrice);
    }
    if (invoice) {
        sql += ' AND (invoice_number LIKE ? OR invoice_number = ?)';
        params.push(`%${invoice}%`, invoice);
    }

    sql += ' ORDER BY (invoice_number = ?) DESC, created_at DESC';
    params.push(invoice); // for prioritizing exact matches

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).send('Error fetching unknown customer sales');
        res.json(results);
    });
};

exports.getSaleLineItems = (req, res) => {
    const saleId = req.query.saleId;
    if (!saleId) return res.status(400).send('Sale ID is required');

    const sql = 'SELECT * FROM line_items WHERE sale_id = ?';
    db.query(sql, [saleId], (err, results) => {
        if (err) return res.status(500).send('Error fetching line items');
        res.json(results);
    });
};

exports.getPaymentDetails = (req, res) => {
    const saleId = req.query.saleId;
    if (!saleId) return res.status(400).send('Sale ID is required');

    const sql = 'SELECT name, amount, payment_date FROM payments WHERE sale_id = ?';
    db.query(sql, [saleId], (err, results) => {
        if (err) return res.status(500).send('Error fetching payment details');
        res.json(results);
    });
};
