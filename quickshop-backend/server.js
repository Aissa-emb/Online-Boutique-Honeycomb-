const express = require('express');
const cors = require('cors');
const { setupTelemetry } = require('./src/config/otel');

// Initialize OpenTelemetry FIRST — before any other imports that make HTTP calls
setupTelemetry();

const productsRouter = require('./src/routes/products');
const checkoutRouter = require('./src/routes/checkout');
const authRouter = require('./src/routes/auth');
const searchRouter = require('./src/routes/search');
const ordersRouter = require('./src/routes/orders');
const reviewsRouter = require('./src/routes/reviews');
const recommendationsRouter = require('./src/routes/recommendations');
const shippingRouter = require('./src/routes/shipping');
const notificationsRouter = require('./src/routes/notifications');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Request correlation ID middleware
app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader('x-correlation-id', req.correlationId);
    next();
});

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.path !== '/health') {
            console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms [${req.correlationId}]`);
        }
    });
    next();
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/recommendations', recommendationsRouter);
app.use('/api/v1/shipping', shippingRouter);
app.use('/api/v1/notifications', notificationsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`Unhandled error on ${req.method} ${req.path}:`, err.message);
    res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`\n🏪 Online Boutique API v2.0.0 running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Endpoints: /products, /search, /checkout, /orders, /reviews, /recommendations, /shipping, /notifications, /auth\n`);
});
