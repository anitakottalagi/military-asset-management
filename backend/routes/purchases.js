const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, (req, res) => {
  const { base_id, asset_type, start_date, end_date } = req.query;
  let query = `
    SELECT p.*, b.name as base_name, u.username as purchased_by_name
    FROM purchases p
    JOIN bases b ON p.base_id = b.id
    JOIN users u ON p.purchased_by = u.id
    WHERE 1=1
  `;
  const params = [];

  
  if (req.user.role !== 'admin') {
    const base = db.prepare('SELECT id FROM bases WHERE name = ?').get(req.user.base);
    if (base) { query += ' AND p.base_id = ?'; params.push(base.id); }
  } else if (base_id) {
    query += ' AND p.base_id = ?'; params.push(base_id);
  }

  if (asset_type) { query += ' AND p.asset_type = ?'; params.push(asset_type); }
  if (start_date) { query += ' AND DATE(p.purchase_date) >= ?'; params.push(start_date); }
  if (end_date)   { query += ' AND DATE(p.purchase_date) <= ?'; params.push(end_date); }

  query += ' ORDER BY p.purchase_date DESC';
  res.json(db.prepare(query).all(...params));
});


router.post('/', authenticate, authorize('admin', 'logistics_officer'), (req, res) => {
  const { asset_name, asset_type, base_id, quantity, notes } = req.body;
  if (!asset_name || !asset_type || !base_id || !quantity)
    return res.status(400).json({ error: 'asset_name, asset_type, base_id, quantity are required' });

  const purchase = db.prepare(
    'INSERT INTO purchases (asset_name, asset_type, base_id, quantity, purchased_by, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(asset_name, asset_type, base_id, quantity, req.user.id, notes || null);

  
  const existing = db.prepare('SELECT id FROM assets WHERE name = ? AND base_id = ?').get(asset_name, base_id);
  if (existing) {
    db.prepare('UPDATE assets SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO assets (name, type, base_id, quantity) VALUES (?, ?, ?, ?)').run(asset_name, asset_type, base_id, quantity);
  }

  res.status(201).json({ id: purchase.lastInsertRowid, message: 'Purchase recorded' });
});

module.exports = router;
