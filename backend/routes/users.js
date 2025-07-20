// users.js - Endpoints:
// GET /users?q=search - List/search users by name or email

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /users?q=search
router.get('/', async (req, res) => {
  const q = req.query.q;
  try {
    let sql = 'SELECT users.id as id, users.name, users.email FROM users';
    let params = [];
    if (q) {
      sql += ' WHERE users.name LIKE ? OR users.email LIKE ?';
      params = [`%${q}%`, `%${q}%`];
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 