// deviceUsers.js - Endpoints:
// GET    /device-users         - List all device user mappings
// POST   /device-users/import  - Import device user data (JSON array)
// POST   /device-users/map     - Map a device_user_id to a user_id
// GET    /device-users/export  - Export all mapped device users as JSON

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /device-users: List all device user mappings, joined with user info if mapped
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, m.device_user_id, m.fingerprint_data, m.user_id, u.name as user_name, up.phone as user_phone
      FROM device_user_mapping m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN user_profile up ON u.id = up.userid
      ORDER BY m.device_user_id ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /device-users/import: Import device user data (JSON array)
router.post('/import', async (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array.' });
  }
  try {
    for (const item of data) {
      if (!item.device_user_id) continue;
      await db.query(
        `INSERT INTO device_user_mapping (device_user_id, fingerprint_data) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE fingerprint_data = VALUES(fingerprint_data)`,
        [item.device_user_id, item.fingerprint_data || null]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /device-users/map: Map a device_user_id to a user_id or unmap
router.post('/map', async (req, res) => {
  const { device_user_id, user_id } = req.body;
  if (!device_user_id) {
    return res.status(400).json({ error: 'device_user_id is required.' });
  }
  try {
    if (user_id === null || user_id === undefined) {
      // Unmap: set user_id to NULL
      await db.query(
        'UPDATE device_user_mapping SET user_id = NULL WHERE device_user_id = ?',
        [device_user_id]
      );
    } else {
      // Map: insert or update
      await db.query(
        `INSERT INTO device_user_mapping (device_user_id, user_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [device_user_id, user_id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /device-users/export: Export all mapped device users as JSON
router.get('/export', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.device_user_id, m.fingerprint_data, m.user_id, u.name, up.phone
      FROM device_user_mapping m
      JOIN users u ON m.user_id = u.id
      JOIN user_profile up ON u.id = up.userid
      ORDER BY m.device_user_id ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All endpoints implemented

module.exports = router; 