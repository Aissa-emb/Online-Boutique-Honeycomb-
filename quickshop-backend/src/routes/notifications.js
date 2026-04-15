const express = require('express');
const router = express.Router();
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('online-boutique-notifications');

const USER_NOTIFICATIONS = [
    { id: 'ntf_001', type: 'order_shipped', title: 'Your order has shipped!', body: 'Order ORD-20240322-1293 is on its way via UPS.', read: false, createdAt: '2024-03-23T10:30:00Z' },
    { id: 'ntf_002', type: 'price_drop', title: 'Price drop alert', body: 'Samurai Blue Jersey is now $75 — $10 off!', read: false, createdAt: '2024-03-22T14:15:00Z' },
    { id: 'ntf_003', type: 'back_in_stock', title: 'Back in stock', body: 'Retro Albiceleste 1986 is back in stock in your size.', read: true, createdAt: '2024-03-21T09:00:00Z' },
    { id: 'ntf_004', type: 'order_delivered', title: 'Order delivered', body: 'Order ORD-20240315-7842 was delivered successfully.', read: true, createdAt: '2024-03-19T10:20:00Z' },
    { id: 'ntf_005', type: 'promotion', title: 'Spring Sale — 20% off', body: 'Use code SPRING24 at checkout for 20% off all retro jerseys.', read: true, createdAt: '2024-03-18T08:00:00Z' },
];

// GET /notifications
router.get('/', async (req, res) => {
    return tracer.startActiveSpan('notifications.list', async (rootSpan) => {
        const userId = req.query.userId || req.headers['x-user-id'] || 'user_123';
        rootSpan.setAttribute('user.id', userId);

        try {
            // 1. Auth
            await tracer.startActiveSpan('auth.verify_token', async (span) => {
                span.setAttribute('auth.method', 'bearer_jwt');
                await new Promise(r => setTimeout(r, 5));
                span.end();
            });

            // 2. Query notifications
            await tracer.startActiveSpan('db.query', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.name': 'online-boutique_prod',
                    'db.statement': 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
                    'db.operation': 'SELECT',
                    'db.sql.table': 'notifications',
                });
                await new Promise(r => setTimeout(r, 12 + Math.random() * 8));
                span.setAttribute('db.rows_affected', USER_NOTIFICATIONS.length);
                span.end();
            });

            // 3. Serialize
            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.items_count', USER_NOTIFICATIONS.length);
                await new Promise(r => setTimeout(r, 1));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.setAttribute('notifications.unread_count', USER_NOTIFICATIONS.filter(n => !n.read).length);
            rootSpan.end();

            res.json({
                notifications: USER_NOTIFICATIONS,
                unreadCount: USER_NOTIFICATIONS.filter(n => !n.read).length,
            });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to load notifications' });
        }
    });
});

// POST /notifications/read
router.post('/read', async (req, res) => {
    return tracer.startActiveSpan('notifications.mark_read', async (rootSpan) => {
        const { notificationIds } = req.body;
        rootSpan.setAttribute('notifications.count', notificationIds?.length || 0);

        try {
            await tracer.startActiveSpan('auth.verify_token', async (span) => {
                span.setAttribute('auth.method', 'bearer_jwt');
                await new Promise(r => setTimeout(r, 5));
                span.end();
            });

            await tracer.startActiveSpan('db.update', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'UPDATE notifications SET read = true WHERE id = ANY($1) AND user_id = $2',
                    'db.operation': 'UPDATE',
                    'db.sql.table': 'notifications',
                });
                await new Promise(r => setTimeout(r, 8 + Math.random() * 5));
                span.setAttribute('db.rows_affected', notificationIds?.length || 0);
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();
            res.json({ success: true });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to update notifications' });
        }
    });
});

// POST /notifications/preferences
router.post('/preferences', async (req, res) => {
    return tracer.startActiveSpan('notifications.update_preferences', async (rootSpan) => {
        const { pushEnabled, emailEnabled, smsEnabled, categories } = req.body;
        rootSpan.setAttributes({
            'preferences.push': pushEnabled ?? true,
            'preferences.email': emailEnabled ?? true,
            'preferences.sms': smsEnabled ?? false,
        });

        try {
            // 1. Auth
            await tracer.startActiveSpan('auth.verify_token', async (span) => {
                span.setAttribute('auth.method', 'bearer_jwt');
                await new Promise(r => setTimeout(r, 5));
                span.end();
            });

            // 2. Update preferences in DB
            await tracer.startActiveSpan('db.update', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'UPDATE notification_preferences SET push_enabled = $1, email_enabled = $2, sms_enabled = $3, categories = $4 WHERE user_id = $5',
                    'db.operation': 'UPDATE',
                    'db.sql.table': 'notification_preferences',
                });
                await new Promise(r => setTimeout(r, 10 + Math.random() * 8));
                span.setAttribute('db.rows_affected', 1);
                span.end();
            });

            // 3. Invalidate cached preferences
            await tracer.startActiveSpan('cache.invalidate', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': 'notification_prefs:user_123',
                    'cache.operation': 'DEL',
                });
                await new Promise(r => setTimeout(r, 3));
                span.end();
            });

            // 4. Publish event to message bus
            await tracer.startActiveSpan('event_bus.publish', async (span) => {
                span.setAttributes({
                    'messaging.system': 'kafka',
                    'messaging.destination': 'user.preferences.updated',
                    'messaging.destination_kind': 'topic',
                    'messaging.operation': 'publish',
                    'messaging.kafka.partition': 0,
                });
                await new Promise(r => setTimeout(r, 8 + Math.random() * 5));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.json({ success: true, message: 'Notification preferences updated' });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to update preferences' });
        }
    });
});

module.exports = router;
