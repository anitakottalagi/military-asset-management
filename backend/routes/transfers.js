const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, (req, res) => {
  const { base_id, asset_type, start_date, end_date } = req.query;
  let query = `
    SELECT t.*, fb.name as from_base_name, tb.name as to_base_name, u.username as transferred_by_name
    FROM transfers t
    JOIN bases fb ON t.from_base_id = fb.id
    JOIN bases tb ON t.to_base_id = tb.id
    JOIN users u ON t.transferred_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role !== 'admin') {
    const base = db.prepare('SELECT id FROM bases WHERE name = ?').get(req.user.base);
    if (base) {
      query += ' AND (t.from_base_id = ? OR t.to_base_id = ?)';
      params.push(base.id, base.id);
    }
  } else if (base_id) {
    query += ' AND (t.from_base_id = ? OR t.to_base_id = ?)';
    params.push(base_id, base_id);
  }

  if (asset_type) { query += ' AND t.asset_type = ?'; params.push(asset_type); }
  if (start_date) { query += ' AND DATE(t.transfer_date) >= ?'; params.push(start_date); }
  if (end_date)   { query += ' AND DATE(t.transfer_date) <= ?'; params.push(end_date); }

  query += ' ORDER BY t.transfer_date DESC';
  res.json(db.prepare(query).all(...params));
});


router.post('/', authenticate, authorize('admin', 'base_commander', 'logistics_officer'), (req, res) => {
  const { asset_name, asset_type, from_base_id, to_base_id, quantity, notes } = req.body;
  if (!asset_name || !asset_type || !from_base_id || !to_base_id || !quantity)
    return res.status(400).json({ error: 'asset_name, asset_type, from_base_id, to_base_id, quantity are required' });

  if (from_base_id === to_base_id)
    return res.status(400).json({ error: 'Source and destination bases must differ' });

  
  const sourceAsset = db.prepare('SELECT * FROM assets WHERE name = ? AND base_id = ?').get(asset_name, from_base_id);
  if (!sourceAsset || sourceAsset.quantity < quantity)
    return res.status(400).json({ error: 'Insufficient asset quantity at source base' });

  
  const transfer = db.transaction(() => {
    db.prepare('UPDATE assets SET quantity = quantity - ? WHERE name = ? AND base_id = ?').run(quantity, asset_name, from_base_id);

    const dest = db.prepare('SELECT id FROM assets WHERE name = ? AND base_id = ?').get(asset_name, to_base_id);
    if (dest) {
      db.prepare('UPDATE assets SET quantity = quantity + ? WHERE id = ?').run(quantity, dest.id);
    } else {
      db.prepare('INSERT INTO assets (name, type, base_id, quantity) VALUES (?, ?, ?, ?)').run(asset_name, asset_type, to_base_id, quantity);
    }

    return db.prepare(
      'INSERT INTO transfers (asset_name, asset_type, from_base_id, to_base_id, quantity, transferred_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(asset_name, asset_type, from_base_id, to_base_id, quantity, req.user.id, notes || null);
  });

  const result = transfer();
  res.status(201).json({ id: result.lastInsertRowid, message: 'Transfer completed' });
});

module.exports = router;
