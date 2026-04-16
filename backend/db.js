const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'military.db'));


db.pragma('journal_mode = WAL');


db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'base_commander', 'logistics_officer')),
    base TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('vehicle', 'weapon', 'ammunition')),
    base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (base_id) REFERENCES bases(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    purchased_by INTEGER NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (purchased_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    from_base_id INTEGER NOT NULL,
    to_base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    transferred_by INTEGER NOT NULL,
    transfer_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    FOREIGN KEY (from_base_id) REFERENCES bases(id),
    FOREIGN KEY (to_base_id) REFERENCES bases(id),
    FOREIGN KEY (transferred_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    base_id INTEGER NOT NULL,
    assigned_to TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assignment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expenditures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    base_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    recorded_by INTEGER NOT NULL,
    expenditure_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
  );
`);


const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  
  const insertBase = db.prepare('INSERT INTO bases (name) VALUES (?)');
  insertBase.run('Alpha Base');
  insertBase.run('Bravo Base');
  insertBase.run('Charlie Base');

  
  const insertUser = db.prepare('INSERT INTO users (username, password, role, base) VALUES (?, ?, ?, ?)');
  insertUser.run('admin', bcrypt.hashSync('admin123', 10), 'admin', null);
  insertUser.run('commander_alpha', bcrypt.hashSync('commander123', 10), 'base_commander', 'Alpha Base');
  insertUser.run('commander_bravo', bcrypt.hashSync('commander123', 10), 'base_commander', 'Bravo Base');
  insertUser.run('logistics1', bcrypt.hashSync('logistics123', 10), 'logistics_officer', 'Alpha Base');

  
  const insertAsset = db.prepare('INSERT INTO assets (name, type, base_id, quantity) VALUES (?, ?, ?, ?)');
  insertAsset.run('M1 Abrams Tank', 'vehicle', 1, 10);
  insertAsset.run('Humvee', 'vehicle', 1, 25);
  insertAsset.run('M16 Rifle', 'weapon', 1, 100);
  insertAsset.run('M4 Carbine', 'weapon', 2, 80);
  insertAsset.run('5.56mm Ammo', 'ammunition', 1, 50000);
  insertAsset.run('7.62mm Ammo', 'ammunition', 2, 30000);
  insertAsset.run('Bradley IFV', 'vehicle', 2, 8);
  insertAsset.run('M249 SAW', 'weapon', 3, 40);
  insertAsset.run('9mm Ammo', 'ammunition', 3, 20000);
}

module.exports = db;
