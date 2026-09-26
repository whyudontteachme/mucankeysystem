const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');

// Generate license key
function generateLicenseKey() {
    return 'MUCAN-' + crypto.randomBytes(16).toString('hex').toUpperCase();
}

// POST /auth/verify
router.post('/verify', (req, res) => {
    const { userId, hwid } = req.body;
    
    if (!userId || !hwid) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'userId dan hwid wajib diisi' 
        });
    }
    
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    
    db.get(
        `SELECT * FROM licenses WHERE user_id = ? AND hwid = ? ORDER BY created_at DESC LIMIT 1`,
        [userId, hwid],
        (err, row) => {
            if (err) {
                console.error('[Auth] DB error:', err);
                return res.status(500).json({ status: 'error', message: 'DB error' });
            }
            
            // Cek license aktif
            if (row && row.status === 'active') {
                // Cek expiry
                if (row.expires_at && new Date(row.expires_at) < new Date()) {
                    db.run(`UPDATE licenses SET status = 'expired' WHERE id = ?`, [row.id]);
                    return res.json({
                        status: 'expired',
                        message: 'License expired, silakan ambil key baru'
                    });
                }
                
                return res.json({
                    status: 'valid',
                    key: row.license_key,
                    expires_at: row.expires_at,
                    message: 'License aktif'
                });
            }
            
            // Pending
            if (row && row.status === 'pending') {
                return res.json({
                    status: 'pending',
                    link: `${process.env.LOOTLABS_LINK}&userId=${userId}&hwid=${hwid}`,
                    message: 'Selesaikan iklan dulu'
                });
            }
            
            // Belum ada → bikin baru
            const newKey = generateLicenseKey();
            
            db.run(
                `INSERT INTO licenses (user_id, hwid, license_key, status, ip) VALUES (?, ?, ?, 'pending', ?)`,
                [userId, hwid, newKey, clientIp],
                function(err2) {
                    if (err2) {
                        console.error('[Auth] Insert error:', err2);
                        return res.status(500).json({ status: 'error', message: 'Insert error' });
                    }
                    
                    return res.json({
                        status: 'pending',
                        link: `${process.env.LOOTLABS_LINK}&userId=${userId}&hwid=${hwid}`,
                        message: 'Selesaikan iklan untuk mendapat key'
                    });
                }
            );
        }
    );
});

// POST /auth/redeem
router.post('/redeem', (req, res) => {
    const { userId, hwid, key } = req.body;
    
    if (!userId || !hwid || !key) {
        return res.status(400).json({ status: 'error', message: 'Data kurang' });
    }
    
    db.get(
        `SELECT * FROM licenses WHERE user_id = ? AND hwid = ? AND license_key = ?`,
        [userId, hwid, key],
        (err, row) => {
            if (err) return res.status(500).json({ status: 'error' });
            
            if (!row) {
                return res.json({ status: 'error', message: 'Key tidak valid' });
            }
            
            if (row.status !== 'active') {
                return res.json({ 
                    status: 'error', 
                    message: 'Key belum aktif, selesaikan iklan dulu' 
                });
            }
            
            return res.json({
                status: 'valid',
                key: row.license_key,
                expires_at: row.expires_at,
                message: 'Login sukses'
            });
        }
    );
});

module.exports = router;