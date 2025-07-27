const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

exports.getCategoryDetails = (req, res) => {
    const categoryId = req.body.categoryId;
    
    let found = false;

    fs.createReadStream('C:\\Users\\DS Horne Server\\Documents\\costOfSalesServer\\categories.csv')
        .pipe(csv())
        .on('data', row => {
            if (row['ID'] === categoryId) {
                found = true;
                res.json({ message: `Match found: ${row['SELECTION']}` });
                res.end();
            }
        })
        .on('end', () => {
            if (!found) res.status(404).json({ message: 'No match found.' });
        });
};
