const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Kalau deploy di Railway, path-nya di /data
// Kalau lokal, di folder project
const DB_DIR = process.env.RAILWAY_ENVIRONMENT ? '/data' : __dirname;
const DB_PATH = path.join(DB_DIR, 'mucan.db');

// Pastiin folder ada
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('[DB] Error:', err.message);
    } else {
        console.log('[DB] Connected to', DB_PATH);
    }
});

db.serialize(() => {
    // Tabel licenses
    db.run(`
        CREATE TABLE IF NOT EXISTS licenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            hwid TEXT NOT NULL,
            license_key TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            click_id TEXT,
            ip TEXT
        )
    `);
    
    // Tabel postback logs
    db.run(`
        CREATE TABLE IF NOT EXISTS postback_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            click_id TEXT,
            user_id TEXT,
            ip TEXT,
            raw_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    console.log('[DB] Tables ready');
});

module.exports = db;