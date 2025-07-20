// db.js - MySQL connection pool for oyisiindonesia database

require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, // Change if your MySQL user is different
  password: process.env.DB_PASSWORD, // Change if your MySQL password is set
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise(); 