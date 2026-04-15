const express = require('express');
const router = express.Router();
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('online-boutique-checkout');

router.post('/', async (req, res) => {
    return tracer.startActiveSpan('checkout.process', async (rootSpan) => {
        try {
            const { cartItems, paymentMethodId, userId, shippingAddress, promoCode } = req.body;

            rootSpan.setAttributes({
                'user.id': userId || 'anonymous',
                'cart.item_count': cartItems?.length || 0,
                'payment.method_id': paymentMethodId,
                'checkout.has_promo': !!promoCode,
            });

            // --- 1. Request Validation ---
            await tracer.startActiveSpan('checkout.validate_request', async (span) => {
                span.setAttribute('validation.fields_checked', 4);
                if (!paymentMethodId) {
                    const error = new Error('Payment method is required');
                    span.recordException(error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                    span.end();
                    throw error;
                }
                if (!cartItems || cartItems.length === 0) {
                    const error = new Error('Cart is empty');
                    span.recordException(error);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                    span.end();
                    throw error;
                }
                await new Promise(r => setTimeout(r, 8 + Math.random() * 5));
                span.setStatus({ code: SpanStatusCode.OK });
                span.end();
            });

            // --- 2. Inventory Reservation ---
            await tracer.startActiveSpan('checkout.reserve_inventory', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'UPDATE inventory SET reserved = reserved + $1 WHERE product_id = $2 AND (quantity - reserved) >= $1',
                    'db.operation': 'UPDATE',
                    'db.sql.table': 'inventory',
                    'inventory.warehouse': 'us-east-1',
                    'inventory.items_reserved': cartItems?.length || 0,
                });

                // 1% chance of inventory conflict
                const isConflict = Math.random() < 0.01;
                if (isConflict) {
                    await new Promise(r => setTimeout(r, 50));
                    const err = new Error('Insufficient inventory for requested quantity');
                    span.recordException(err);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
                    span.setAttribute('inventory.conflict', true);
                    span.end();
                    throw err;
                }

                await new Promise(r => setTimeout(r, 25 + Math.random() * 15));
                span.setAttribute('db.rows_affected', cartItems?.length || 0);
                span.end();
            });

            // --- 3. Apply Promotions ---
            let discount = 0;
            await tracer.startActiveSpan('checkout.apply_promotions', async (span) => {
                span.setAttributes({
                    'promo.code': promoCode || 'none',
                    'promo.validation_source': 'promotions_service',
                });

                if (promoCode) {
                    await tracer.startActiveSpan('promotions.validate_code', async (innerSpan) => {
                        innerSpan.setAttributes({
                            'db.system': 'postgresql',
                            'db.statement': 'SELECT * FROM promotions WHERE code = $1 AND valid_from <= NOW() AND valid_until >= NOW() AND uses_remaining > 0',
                            'db.operation': 'SELECT',
                            'db.sql.table': 'promotions',
                        });
                        await new Promise(r => setTimeout(r, 10 + Math.random() * 8));
                        discount = promoCode === 'SPRING24' ? 0.20 : 0;
                        innerSpan.setAttribute('promo.valid', discount > 0);
                        innerSpan.setAttribute('promo.discount_percent', discount * 100);
                        innerSpan.end();
                    });
                }

                span.setAttribute('promo.discount_applied', discount);
                await new Promise(r => setTimeout(r, 5));
                span.end();
            });

            // --- 4. Calculate Tax ---
            let taxAmount;
            await tracer.startActiveSpan('checkout.calculate_tax', async (span) => {
                span.setAttributes({
                    'http.method': 'POST',
                    'http.url': 'https://api.taxjar.com/v2/taxes',
                    'tax.provider': 'taxjar',
                    'tax.destination_state': 'NY',
                    'tax.destination_zip': '10001',
                });
                const subtotal = (cartItems || []).reduce((sum, item) => sum + (item.price || 85), 0);
                taxAmount = Math.round(subtotal * 0.0875 * 100) / 100;
                await new Promise(r => setTimeout(r, 40 + Math.random() * 25));
                span.setAttribute('http.status_code', 200);
                span.setAttribute('tax.amount', taxAmount);
                span.setAttribute('tax.rate', 0.0875);
                span.end();
            });

            // --- 5. Payment Processing ---
            await tracer.startActiveSpan('checkout.process_payment', async (span) => {
                span.setAttributes({
                    'payment.gateway': 'stripe',
                    'http.method': 'POST',
                    'http.url': 'https://api.stripe.com/v1/payment_intents',
                    'payment.method_type': 'card',
                    'payment.currency': 'usd',
                });

                const subtotal = (cartItems || []).reduce((sum, item) => sum + (item.price || 85), 0);
                const totalAmount = Math.round((subtotal * (1 - discount) + taxAmount) * 100) / 100;
                span.setAttribute('payment.amount', totalAmount);

                // 3% chance of card decline
                const isDeclined = Math.random() < 0.03;
                if (isDeclined) {
                    await new Promise(r => setTimeout(r, 200));
                    const declineReasons = ['insufficient_funds', 'card_declined', 'expired_card'];
                    const reason = declineReasons[Math.floor(Math.random() * declineReasons.length)];
                    const err = new Error(`Payment declined: ${reason}`);
                    span.recordException(err);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
                    span.setAttribute('payment.decline_reason', reason);
                    span.setAttribute('http.status_code', 402);
                    span.end();
                    throw { kind: 'PAYMENT_ERROR', error: err, reason };
                }

                // 1% chance of gateway timeout
                const isTimeout = Math.random() < 0.01;
                if (isTimeout) {
                    await new Promise(r => setTimeout(r, 30000));
                }

                await new Promise(r => setTimeout(r, 150 + Math.random() * 100));
                span.setAttribute('http.status_code', 200);
                span.setAttribute('payment.intent_id', `pi_${Date.now()}`);
                span.setStatus({ code: SpanStatusCode.OK });
                span.end();
            });

            // --- 6. Create Order Record ---
            const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
            await tracer.startActiveSpan('checkout.create_order', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'INSERT INTO orders (id, user_id, items, total, status, shipping_address) VALUES ($1, $2, $3, $4, $5, $6)',
                    'db.operation': 'INSERT',
                    'db.sql.table': 'orders',
                    'order.id': orderId,
                });
                await new Promise(r => setTimeout(r, 15 + Math.random() * 10));
                span.setAttribute('db.rows_affected', 1);
                span.end();
            });

            // --- 7. Send Confirmation Email ---
            await tracer.startActiveSpan('checkout.send_confirmation_email', async (span) => {
                span.setAttributes({
                    'email.provider': 'sendgrid',
                    'email.template': 'order_confirmation',
                    'http.method': 'POST',
                    'http.url': 'https://api.sendgrid.com/v3/mail/send',
                    'email.recipient': userId ? `${userId}@example.com` : 'customer@example.com',
                });
                await new Promise(r => setTimeout(r, 55 + Math.random() * 30));
                span.setAttribute('http.status_code', 202);
                span.end();
            });

            // --- 8. Publish Order Event ---
            await tracer.startActiveSpan('event_bus.publish_order_created', async (span) => {
                span.setAttributes({
                    'messaging.system': 'kafka',
                    'messaging.destination': 'orders.created',
                    'messaging.destination_kind': 'topic',
                    'messaging.operation': 'publish',
                    'messaging.message_id': orderId,
                });
                await new Promise(r => setTimeout(r, 6 + Math.random() * 4));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.setAttribute('order.id', orderId);
            rootSpan.end();

            res.json({
                success: true,
                orderId,
                message: 'Order placed successfully',
            });

        } catch (err) {
            const error = err.error || err;

            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();

            if (err.kind === 'PAYMENT_ERROR') {
                return res.status(402).json({
                    error: 'PAYMENT_DECLINED',
                    reason: err.reason,
                    message: `Payment was declined: ${err.reason.replace(/_/g, ' ')}`,
                    timestamp: new Date().toISOString(),
                });
            } else if (error.message === 'Payment method is required' || error.message === 'Cart is empty') {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: error.message,
                    timestamp: new Date().toISOString(),
                });
            } else if (error.message.includes('Insufficient inventory')) {
                return res.status(409).json({
                    error: 'INVENTORY_CONFLICT',
                    message: 'One or more items are no longer available in the requested quantity',
                    timestamp: new Date().toISOString(),
                });
            }

            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred during checkout',
                timestamp: new Date().toISOString(),
            });
        }
    });
});

module.exports = router;
