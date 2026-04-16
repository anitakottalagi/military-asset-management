const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, (req, res) => {
  const { base_id, asset_type, start_date, end_date } = req.query;
  let query = `
    SELECT a.*, b.name as base_name, u.username as assigned_by_name
    FROM assignments a
    JOIN bases b ON a.base_id = b.id
    JOIN users u ON a.assigned_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role !== 'admin') {
    const base = db.prepare('SELECT id FROM bases WHERE name = ?').get(req.user.base);
    if (base) { query += ' AND a.base_id = ?'; params.push(base.id); }
  } else if (base_id) {
    query += ' AND a.base_id = ?'; params.push(base_id);
  }

  if (asset_type) { query += ' AND a.asset_type = ?'; params.push(asset_type); }
  if (start_date) { query += ' AND DATE(a.assignment_date) >= ?'; params.push(start_date); }
  if (end_date)   { query += ' AND DATE(a.assignment_date) <= ?'; params.push(end_date); }

  query += ' ORDER BY a.assignment_date DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', authenticate, authorize('admin', 'base_commander'), (req, res) => {
  const { asset_name, asset_type, base_id, assigned_to, quantity, notes } = req.body;
  if (!asset_name || !asset_type || !base_id || !assigned_to || !quantity)
    return res.status(400).json({ error: 'asset_name, asset_type, base_id, assigned_to, quantity are required' });

  const asset = db.prepare('SELECT * FROM assets WHERE name = ? AND base_id = ?').get(asset_name, base_id);
  if (!asset || asset.quantity < quantity)
    return res.status(400).json({ error: 'Insufficient asset quantity' });

  db.prepare('UPDATE assets SET quantity = quantity - ? WHERE name = ? AND base_id = ?').run(quantity, asset_name, base_id);

  const result = db.prepare(
    'INSERT INTO assignments (asset_name, asset_type, base_id, assigned_to, quantity, assigned_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(asset_name, asset_type, base_id, assigned_to, quantity, req.user.id, notes || null);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Assignment recorded' });
});


router.get('/expenditures', authenticate, (req, res) => {
  const { base_id, asset_type, start_date, end_date } = req.query;
  let query = `
    SELECT e.*, b.name as base_name, u.username as recorded_by_name
    FROM expenditures e
    JOIN bases b ON e.base_id = b.id
    JOIN users u ON e.recorded_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role !== 'admin') {
    const base = db.prepare('SELECT id FROM bases WHERE name = ?').get(req.user.base);
    if (base) { query += ' AND e.base_id = ?'; params.push(base.id); }
  } else if (base_id) {
    query += ' AND e.base_id = ?'; params.push(base_id);
  }

  if (asset_type) { query += ' AND e.asset_type = ?'; params.push(asset_type); }
  if (start_date) { query += ' AND DATE(e.expenditure_date) >= ?'; params.push(start_date); }
  if (end_date)   { query += ' AND DATE(e.expenditure_date) <= ?'; params.push(end_date); }

  query += ' ORDER BY e.expenditure_date DESC';
  res.json(db.prepare(query).all(...params));
});


router.post('/expenditures', authenticate, authorize('admin', 'base_commander', 'logistics_officer'), (req, res) => {
  const { asset_name, asset_type, base_id, quantity, reason, notes } = req.body;
  if (!asset_name || !asset_type || !base_id || !quantity || !reason)
    return res.status(400).json({ error: 'asset_name, asset_type, base_id, quantity, reason are required' });

  const asset = db.prepare('SELECT * FROM assets WHERE name = ? AND base_id = ?').get(asset_name, base_id);
  if (!asset || asset.quantity < quantity)
    return res.status(400).json({ error: 'Insufficient asset quantity' });

  db.prepare('UPDATE assets SET quantity = quantity - ? WHERE name = ? AND base_id = ?').run(quantity, asset_name, base_id);

  const result = db.prepare(
    'INSERT INTO expenditures (asset_name, asset_type, base_id, quantity, reason, recorded_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(asset_name, asset_type, base_id, quantity, reason, req.user.id, notes || null);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Expenditure recorded' });
});

module.exports = router;
