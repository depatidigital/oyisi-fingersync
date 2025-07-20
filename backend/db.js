// db.js - MySQL connection pool for oyisiindonesia database

const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Change if your MySQL user is different
  password: '', // Change if your MySQL password is set
  database: 'oyisiindonesia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise(); 