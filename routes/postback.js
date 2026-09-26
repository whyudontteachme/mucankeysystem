const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /postback/lootlabs
router.get('/lootlabs', (req, res) => {
    const { click_id, ip, unique_id } = req.query;
    
    console.log('[Postback] Received:', req.query);
    
    // Log semua postback
    db.run(
        `INSERT INTO postback_logs (click_id, user_id, ip, raw_data) VALUES (?, ?, ?, ?)`,
        [click_id, unique_id, ip, JSON.stringify(req.query)]
    );
    
    if (!click_id) {
        return res.status(400).send('Missing click_id');
    }
    
    // Auto-activate license berdasarkan IP + pending
    if (ip) {
        db.get(
            `SELECT * FROM licenses WHERE ip = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
            [ip],
            (err, row) => {
                if (err) {
                    console.error('[Postback] DB error:', err);
                    return res.status(500).send('DB error');
                }
                
                if (row) {
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 30);
                    
                    db.run(
                        `UPDATE licenses SET status = 'active', expires_at = ?, click_id = ? WHERE id = ?`,
                        [expiresAt.toISOString(), click_id, row.id],
                        (err2) => {
                            if (err2) {
                                console.error('[Postback] Update error:', err2);
                            } else {
                                console.log('[Postback] Activated license #' + row.id);
                            }
                        }
                    );
                }
            }
        );
    }
    
    res.status(200).send('OK');
});

module.exports = router;