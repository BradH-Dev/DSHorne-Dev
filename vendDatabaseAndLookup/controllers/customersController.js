const db = require('../db');

exports.getCustomerDetails = (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).send('Customer ID is required');

    db.query('SELECT * FROM customers WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).send('Error fetching customer');
        results.length ? res.json(results[0]) : res.status(404).send('Not found');
    });
};

exports.getCustomerSales = (req, res) => {
    const customerId = req.query.id;
    if (!customerId) return res.status(400).send('Customer ID is required');

    const sql = 'SELECT * FROM sales WHERE customer_id = ? ORDER BY sale_date DESC';
    db.query(sql, [customerId], (err, results) => {
        if (err) return res.status(500).send('Error fetching customer sales');
        res.json(results);
    });
};

exports.searchAllCustomers = (req, res) => {
    const keywords = req.body.search?.split(' ') || [];
    if (!keywords.length) return res.status(400).send('No search terms provided');

    let sql = "SELECT * FROM customers WHERE ";
    const params = [];

    sql += keywords.map(() => `(first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ?)`).join(' AND ');
    keywords.forEach(k => params.push(`%${k}%`, `%${k}%`, `%${k}%`));

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).send('Search failed');
        res.json(results);
    });
};