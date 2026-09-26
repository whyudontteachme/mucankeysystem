// ============================================================
// MUCAN HUB BACKEND - MAIN SERVER
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const postbackRoutes = require('./routes/postback');
const adminRoutes = require('./routes/admin');

// Init express
const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { status: 'error', message: 'Too many requests, slow down' },
});
app.use('/auth', limiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/postback', postbackRoutes);
app.use('/admin', adminRoutes);

// Root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Mucan Hub Key API' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[Mucan Hub] Server running on port ${PORT}`);
});