const express = require('express');
const router = express.Router();
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('online-boutique-orders');

const ORDERS = [
    {
        id: 'ORD-20240315-7842',
        userId: 'user_123',
        items: [{ name: 'Samba Edition Jersey', size: 'M', price: 85, quantity: 1 }],
        total: 93.49,
        status: 'delivered',
        tracking: 'FX-9284710384',
        carrier: 'FedEx',
        createdAt: '2024-03-15T14:23:00Z',
        deliveredAt: '2024-03-19T10:15:00Z',
    },
    {
        id: 'ORD-20240322-1293',
        userId: 'user_123',
        items: [
            { name: 'Albiceleste Jersey', size: 'L', price: 85, quantity: 1 },
            { name: 'Les Bleus Jersey', size: 'L', price: 85, quantity: 1 },
        ],
        total: 178.98,
        status: 'shipped',
        tracking: 'UP-1284759302',
        carrier: 'UPS',
        createdAt: '2024-03-22T09:51:00Z',
        deliveredAt: null,
    },
    {
        id: 'ORD-20240328-5619',
        userId: 'user_123',
        items: [{ name: 'Retro Samba 1970', size: 'M', price: 120, quantity: 1 }],
        total: 131.88,
        status: 'processing',
        tracking: null,
        carrier: null,
        createdAt: '2024-03-28T16:44:00Z',
        deliveredAt: null,
    },
    {
        id: 'ORD-20240401-8834',
        userId: 'user_456',
        items: [{ name: 'Gunners Home Kit', size: 'S', price: 95, quantity: 2 }],
        total: 198.55,
        status: 'delivered',
        tracking: 'FX-7382910473',
        carrier: 'FedEx',
        createdAt: '2024-04-01T11:30:00Z',
        deliveredAt: '2024-04-05T09:20:00Z',
    },
];

// GET /orders?userId=...
router.get('/', async (req, res) => {
    return tracer.startActiveSpan('orders.list', async (rootSpan) => {
        const userId = req.query.userId || req.headers['x-user-id'] || 'user_123';
        rootSpan.setAttribute('user.id', userId);

        try {
            // 1. Verify authentication token
            await tracer.startActiveSpan('auth.verify_token', async (span) => {
                span.setAttributes({
                    'auth.method': 'bearer_jwt',
                    'auth.token_type': 'access',
                });
                await new Promise(r => setTimeout(r, 8 + Math.random() * 5));
                span.end();
            });

            // 2. Query orders from database
            let userOrders;
            await tracer.startActiveSpan('db.query', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.name': 'online-boutique_prod',
                    'db.statement': 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
                    'db.operation': 'SELECT',
                    'db.sql.table': 'orders',
                });
                userOrders = ORDERS.filter(o => o.userId === userId);
                await new Promise(r => setTimeout(r, 18 + Math.random() * 15));
                span.setAttribute('db.rows_affected', userOrders.length);
                span.end();
            });

            // 3. Enrich with item details
            await tracer.startActiveSpan('orders.enrich_items', async (span) => {
                span.setAttribute('orders.count', userOrders.length);
                await new Promise(r => setTimeout(r, 5 + Math.random() * 8));
                span.end();
            });

            // 4. Serialize
            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.items_count', userOrders.length);
                span.setAttribute('response.format', 'json');
                await new Promise(r => setTimeout(r, 2));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.setAttribute('orders.returned_count', userOrders.length);
            rootSpan.end();

            res.json({ orders: userOrders });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to retrieve orders' });
        }
    });
});

// GET /orders/:id
router.get('/:id', async (req, res) => {
    return tracer.startActiveSpan('orders.get_detail', async (rootSpan) => {
        const orderId = req.params.id;
        rootSpan.setAttribute('order.id', orderId);

        try {
            // 1. Verify token
            await tracer.startActiveSpan('auth.verify_token', async (span) => {
                span.setAttribute('auth.method', 'bearer_jwt');
                await new Promise(r => setTimeout(r, 6));
                span.end();
            });

            // 2. Fetch order from DB
            let order;
            await tracer.startActiveSpan('db.query', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.name': 'online-boutique_prod',
                    'db.statement': 'SELECT * FROM orders WHERE id = $1',
                    'db.operation': 'SELECT',
                    'db.sql.table': 'orders',
                });
                order = ORDERS.find(o => o.id === orderId);
                await new Promise(r => setTimeout(r, 12 + Math.random() * 10));
                span.setAttribute('db.rows_affected', order ? 1 : 0);
                span.end();
            });

            if (!order) {
                rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'Order not found' });
                rootSpan.end();
                return res.status(404).json({ error: 'Order not found' });
            }

            // 3. Fetch tracking info from carrier
            if (order.tracking) {
                await tracer.startActiveSpan('shipping.fetch_tracking', async (span) => {
                    span.setAttributes({
                        'http.method': 'GET',
                        'http.url': `https://api.${(order.carrier || 'fedex').toLowerCase()}.com/track/v1/shipments`,
                        'shipping.carrier': order.carrier,
                        'shipping.tracking_number': order.tracking,
                    });

                    const carrierLatency = 80 + Math.random() * 150;
                    await new Promise(r => setTimeout(r, carrierLatency));

                    span.setAttribute('http.status_code', 200);
                    span.setAttribute('http.response_content_length', 1247);
                    span.end();
                });
            }

            // 4. Serialize
            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.format', 'json');
                await new Promise(r => setTimeout(r, 2));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();
            res.json({ order });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to retrieve order' });
        }
    });
});

// POST /orders/:id/return
router.post('/:id/return', async (req, res) => {
    return tracer.startActiveSpan('orders.initiate_return', async (rootSpan) => {
        const orderId = req.params.id;
        const { reason, items } = req.body;
        rootSpan.setAttributes({
            'order.id': orderId,
            'return.reason': reason || 'not_specified',
            'return.items_count': items?.length || 0,
        });

        try {
            // 1. Verify token
            await tracer.startActiveSpan('auth.verify_token', async (span) => {
                span.setAttribute('auth.method', 'bearer_jwt');
                await new Promise(r => setTimeout(r, 6));
                span.end();
            });

            // 2. Check return eligibility
            await tracer.startActiveSpan('inventory.check_return_eligibility', async (span) => {
                const order = ORDERS.find(o => o.id === orderId);
                span.setAttributes({
                    'order.status': order?.status || 'unknown',
                    'return.within_policy_window': true,
                    'return.policy_days': 30,
                });
                await new Promise(r => setTimeout(r, 15 + Math.random() * 10));

                if (!order || order.status === 'processing') {
                    const err = new Error('Order not eligible for return');
                    span.recordException(err);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
                    span.end();
                    throw err;
                }
                span.end();
            });

            // 3. Update order status
            await tracer.startActiveSpan('db.update_order_status', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'UPDATE orders SET status = $1, return_reason = $2 WHERE id = $3',
                    'db.operation': 'UPDATE',
                    'db.sql.table': 'orders',
                });
                await new Promise(r => setTimeout(r, 20 + Math.random() * 10));
                span.setAttribute('db.rows_affected', 1);
                span.end();
            });

            // 4. Send return confirmation email
            await tracer.startActiveSpan('notifications.send_email', async (span) => {
                span.setAttributes({
                    'email.template': 'return_initiated',
                    'email.provider': 'sendgrid',
                    'http.method': 'POST',
                    'http.url': 'https://api.sendgrid.com/v3/mail/send',
                });
                await new Promise(r => setTimeout(r, 45 + Math.random() * 30));
                span.setAttribute('http.status_code', 202);
                span.end();
            });

            // 5. Initiate refund
            await tracer.startActiveSpan('refund.initiate', async (span) => {
                span.setAttributes({
                    'payment.gateway': 'stripe',
                    'http.method': 'POST',
                    'http.url': 'https://api.stripe.com/v1/refunds',
                    'refund.amount': 85.00,
                    'refund.currency': 'usd',
                });
                await new Promise(r => setTimeout(r, 120 + Math.random() * 80));
                span.setAttribute('http.status_code', 200);
                span.setAttribute('refund.id', `re_${Date.now()}`);
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.json({
                returnId: `RET-${Date.now()}`,
                status: 'return_initiated',
                message: 'Return request submitted. You will receive a confirmation email shortly.',
            });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(400).json({ error: error.message });
        }
    });
});

module.exports = router;
