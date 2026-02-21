require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const projectRoutes = require('./src/routes/projects');
const receiptRoutes = require('./src/routes/receipts');
const documentRoutes = require('./src/routes/documents');
const bankAccountRoutes = require('./src/routes/bankAccounts');
const aiRoutes = require('./src/routes/ai');
const exchangeRoutes = require('./src/routes/exchange');
const paymentRoutes = require('./src/routes/payments');

const app = express();

// Stripe webhook needs raw body BEFORE json parsing
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { error: 'Слишком много запросов, попробуйте позже' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 BusinessZhumashBank API running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

module.exports = app;
