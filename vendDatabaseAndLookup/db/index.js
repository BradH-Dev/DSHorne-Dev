const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'vend'
});

connection.connect(error => {
    if (error) throw error;
    console.log("Connected to MySQL");
});

connection.on('error', (err) => {
    console.error('MySQL error:', err);
    if (err.fatal) process.exit(1);
});

module.exports = connection;