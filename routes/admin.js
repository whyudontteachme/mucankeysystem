const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Auth middleware
function authAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token || token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    next();
}

// GET /admin/licenses
router.get('/licenses', authAdmin, (req, res) => {
    db.all(`SELECT * FROM licenses ORDER BY created_at DESC`, (err, rows) => {
        if (err) {
            console.error('[Admin] Error:', err);
            return res.status(500).json({ status: 'error', message: 'DB error' });
        }
        res.json({ status: 'ok', data: rows });
    });
});

// POST /admin/activate/:id
router.post('/activate/:id', authAdmin, (req, res) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    db.run(
        `UPDATE licenses SET status = 'active', expires_at = ? WHERE id = ?`,
        [expiresAt.toISOString(), req.params.id],
        function(err) {
            if (err) return res.status(500).json({ status: 'error' });
            res.json({ status: 'ok', affected: this.changes });
        }
    );
});

// POST /admin/revoke/:id
router.post('/revoke/:id', authAdmin, (req, res) => {
    db.run(
        `UPDATE licenses SET status = 'revoked' WHERE id = ?`,
        [req.params.id],
        function(err) {
            if (err) return res.status(500).json({ status: 'error' });
            res.json({ status: 'ok', affected: this.changes });
        }
    );
});

// DELETE /admin/delete/:id
router.delete('/delete/:id', authAdmin, (req, res) => {
    db.run(
        `DELETE FROM licenses WHERE id = ?`,
        [req.params.id],
        function(err) {
            if (err) return res.status(500).json({ status: 'error' });
            res.json({ status: 'ok', affected: this.changes });
        }
    );
});

// GET /admin/postbacks
router.get('/postbacks', authAdmin, (req, res) => {
    db.all(`SELECT * FROM postback_logs ORDER BY created_at DESC LIMIT 100`, (err, rows) => {
        if (err) return res.status(500).json({ status: 'error' });
        res.json({ status: 'ok', data: rows });
    });
});

module.exports = router;