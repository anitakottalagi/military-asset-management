const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, (req, res) => {
  const { base_id, asset_type } = req.query;
  let query = `
    SELECT a.*, b.name as base_name
    FROM assets a
    JOIN bases b ON a.base_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role !== 'admin') {
    const base = db.prepare('SELECT id FROM bases WHERE name = ?').get(req.user.base);
    if (base) { query += ' AND a.base_id = ?'; params.push(base.id); }
  } else if (base_id) {
    query += ' AND a.base_id = ?'; params.push(base_id);
  }

  if (asset_type) { query += ' AND a.type = ?'; params.push(asset_type); }
  query += ' ORDER BY b.name, a.type, a.name';

  res.json(db.prepare(query).all(...params));
});

router.get('/bases', authenticate, (req, res) => {
  res.json(db.prepare('SELECT * FROM bases ORDER BY name').all());
});


router.get('/dashboard', authenticate, (req, res) => {
  const { base_id, asset_type, start_date, end_date } = req.query;

  let baseFilter = '';
  const params = [];

  if (req.user.role !== 'admin') {
    const base = db.prepare('SELECT id FROM bases WHERE name = ?').get(req.user.base);
    if (base) { baseFilter = base.id; }
  } else if (base_id) {
    baseFilter = base_id;
  }

  const buildWhere = (table, baseCol) => {
    const conditions = [];
    const p = [];
    if (baseFilter) { conditions.push(`${table}.${baseCol} = ?`); p.push(baseFilter); }
    if (asset_type) { conditions.push(`${table}.asset_type = ?`); p.push(asset_type); }
    if (start_date) { conditions.push(`DATE(${table}.${table === 'assets' ? 'rowid' : table === 'purchases' ? 'purchase_date' : table === 'transfers' ? 'transfer_date' : 'assignment_date'}) >= ?`); p.push(start_date); }
    if (end_date)   { conditions.push(`DATE(${table}.${table === 'assets' ? 'rowid' : table === 'purchases' ? 'purchase_date' : table === 'transfers' ? 'transfer_date' : 'assignment_date'}) <= ?`); p.push(end_date); }
    return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params: p };
  };

  
  const assetWhere = baseFilter ? `WHERE a.base_id = ${baseFilter}` : '';
  const typeWhere = asset_type ? `AND a.type = '${asset_type}'` : '';
  const openingBalance = db.prepare(`SELECT COALESCE(SUM(a.quantity), 0) as total FROM assets a ${assetWhere} ${typeWhere}`).get();

  let pQuery = `SELECT COALESCE(SUM(quantity), 0) as total FROM purchases WHERE 1=1`;
  const pParams = [];
  if (baseFilter) { pQuery += ' AND base_id = ?'; pParams.push(baseFilter); }
  if (asset_type) { pQuery += ' AND asset_type = ?'; pParams.push(asset_type); }
  if (start_date) { pQuery += ' AND DATE(purchase_date) >= ?'; pParams.push(start_date); }
  if (end_date)   { pQuery += ' AND DATE(purchase_date) <= ?'; pParams.push(end_date); }
  const purchases = db.prepare(pQuery).get(...pParams);

 
  let tiQuery = `SELECT COALESCE(SUM(quantity), 0) as total FROM transfers WHERE 1=1`;
  const tiParams = [];
  if (baseFilter) { tiQuery += ' AND to_base_id = ?'; tiParams.push(baseFilter); }
  if (asset_type) { tiQuery += ' AND asset_type = ?'; tiParams.push(asset_type); }
  if (start_date) { tiQuery += ' AND DATE(transfer_date) >= ?'; tiParams.push(start_date); }
  if (end_date)   { tiQuery += ' AND DATE(transfer_date) <= ?'; tiParams.push(end_date); }
  const transfersIn = db.prepare(tiQuery).get(...tiParams);

  
  let toQuery = `SELECT COALESCE(SUM(quantity), 0) as total FROM transfers WHERE 1=1`;
  const toParams = [];
  if (baseFilter) { toQuery += ' AND from_base_id = ?'; toParams.push(baseFilter); }
  if (asset_type) { toQuery += ' AND asset_type = ?'; toParams.push(asset_type); }
  if (start_date) { toQuery += ' AND DATE(transfer_date) >= ?'; toParams.push(start_date); }
  if (end_date)   { toQuery += ' AND DATE(transfer_date) <= ?'; toParams.push(end_date); }
  const transfersOut = db.prepare(toQuery).get(...toParams);

  
  let aQuery = `SELECT COALESCE(SUM(quantity), 0) as total FROM assignments WHERE 1=1`;
  const aParams = [];
  if (baseFilter) { aQuery += ' AND base_id = ?'; aParams.push(baseFilter); }
  if (asset_type) { aQuery += ' AND asset_type = ?'; aParams.push(asset_type); }
  if (start_date) { aQuery += ' AND DATE(assignment_date) >= ?'; aParams.push(start_date); }
  if (end_date)   { aQuery += ' AND DATE(assignment_date) <= ?'; aParams.push(end_date); }
  const assignments = db.prepare(aQuery).get(...aParams);

  
  let eQuery = `SELECT COALESCE(SUM(quantity), 0) as total FROM expenditures WHERE 1=1`;
  const eParams = [];
  if (baseFilter) { eQuery += ' AND base_id = ?'; eParams.push(baseFilter); }
  if (asset_type) { eQuery += ' AND asset_type = ?'; eParams.push(asset_type); }
  if (start_date) { eQuery += ' AND DATE(expenditure_date) >= ?'; eParams.push(start_date); }
  if (end_date)   { eQuery += ' AND DATE(expenditure_date) <= ?'; eParams.push(end_date); }
  const expenditures = db.prepare(eQuery).get(...eParams);

  
  const byType = db.prepare(`
    SELECT a.type, COALESCE(SUM(a.quantity), 0) as total
    FROM assets a
    ${assetWhere} ${typeWhere}
    GROUP BY a.type
  `).all();

  
  const byBase = db.prepare(`
    SELECT b.name as base_name, COALESCE(SUM(a.quantity), 0) as total
    FROM assets a
    JOIN bases b ON a.base_id = b.id
    ${assetWhere} ${typeWhere}
    GROUP BY b.name
  `).all();

  res.json({
    openingBalance: openingBalance.total,
    purchases: purchases.total,
    transfersIn: transfersIn.total,
    transfersOut: transfersOut.total,
    assignments: assignments.total,
    expenditures: expenditures.total,
    closingBalance: openingBalance.total,
    byType,
    byBase,
  });
});

module.exports = router;
