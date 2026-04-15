const express = require('express');
const router = express.Router();
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('online-boutique-reviews');

const REVIEWS = {
    1: [
        { id: 'rv_001', userId: 'user_891', username: 'Marco P.', rating: 5, title: 'Perfect fit', body: 'Exactly what I expected. Great quality fabric and the colors are vibrant.', createdAt: '2024-03-10T08:30:00Z', verified: true },
        { id: 'rv_002', userId: 'user_234', username: 'Lucas S.', rating: 4, title: 'Good quality', body: 'Nice jersey overall. Runs slightly large, would recommend sizing down.', createdAt: '2024-03-08T15:20:00Z', verified: true },
        { id: 'rv_003', userId: 'user_567', username: 'Ana R.', rating: 5, title: 'Authentic feel', body: 'The material is identical to what the players wear. Worth every penny.', createdAt: '2024-02-28T11:45:00Z', verified: true },
    ],
    2: [
        { id: 'rv_004', userId: 'user_345', username: 'Diego M.', rating: 5, title: 'Incredible design', body: 'The three stripes with the sun emblem look amazing. Proud to wear it.', createdAt: '2024-03-12T19:10:00Z', verified: true },
        { id: 'rv_005', userId: 'user_678', username: 'Sofia L.', rating: 3, title: 'Decent but pricey', body: 'Good construction but I feel like the price could be lower for a replica.', createdAt: '2024-03-05T09:30:00Z', verified: false },
    ],
    6: [
        { id: 'rv_006', userId: 'user_901', username: 'James W.', rating: 5, title: 'Gunner for life', body: 'Best home kit in years. The cannon crest detail is impeccable.', createdAt: '2024-03-15T14:00:00Z', verified: true },
        { id: 'rv_007', userId: 'user_112', username: 'Aisha K.', rating: 4, title: 'Quality material', body: 'Breathable and comfortable for match days. Sizing is accurate.', createdAt: '2024-03-11T20:45:00Z', verified: true },
    ],
};

// GET /products/:id/reviews
router.get('/:productId/reviews', async (req, res) => {
    return tracer.startActiveSpan('reviews.list', async (rootSpan) => {
        const productId = parseInt(req.params.productId);
        const { sort = 'recent', page = 1, limit = 10 } = req.query;

        rootSpan.setAttributes({
            'product.id': productId,
            'reviews.sort': sort,
            'reviews.page': parseInt(page),
        });

        try {
            // 1. Check review cache
            let cacheHit = Math.random() > 0.6;
            await tracer.startActiveSpan('cache.check', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': `reviews:product:${productId}:${sort}:${page}`,
                    'cache.hit': cacheHit,
                    'cache.ttl_seconds': 300,
                    'net.peer.name': 'redis-primary.internal',
                    'net.peer.port': 6379,
                });
                await new Promise(r => setTimeout(r, 2 + Math.random() * 3));
                span.end();
            });

            let reviews;
            if (!cacheHit) {
                // 2. Query database
                await tracer.startActiveSpan('db.query', async (span) => {
                    span.setAttributes({
                        'db.system': 'postgresql',
                        'db.name': 'online-boutique_prod',
                        'db.statement': 'SELECT r.*, u.display_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3',
                        'db.operation': 'SELECT',
                        'db.sql.table': 'reviews',
                    });
                    reviews = REVIEWS[productId] || [];
                    await new Promise(r => setTimeout(r, 22 + Math.random() * 18));
                    span.setAttribute('db.rows_affected', reviews.length);
                    span.end();
                });

                // 3. Store in cache
                await tracer.startActiveSpan('cache.store', async (span) => {
                    span.setAttributes({
                        'cache.system': 'redis',
                        'cache.key': `reviews:product:${productId}:${sort}:${page}`,
                        'cache.ttl_seconds': 300,
                        'cache.operation': 'SET',
                    });
                    await new Promise(r => setTimeout(r, 3 + Math.random() * 2));
                    span.end();
                });
            } else {
                reviews = REVIEWS[productId] || [];
            }

            // 4. Calculate aggregate stats
            await tracer.startActiveSpan('reviews.compute_stats', async (span) => {
                const avgRating = reviews.length > 0
                    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                    : 0;
                span.setAttributes({
                    'reviews.average_rating': Math.round(avgRating * 10) / 10,
                    'reviews.total_count': reviews.length,
                    'reviews.verified_count': reviews.filter(r => r.verified).length,
                });
                await new Promise(r => setTimeout(r, 2));
                span.end();
            });

            // 5. Serialize
            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.items_count', reviews.length);
                await new Promise(r => setTimeout(r, 1));
                span.end();
            });

            const avgRating = reviews.length > 0
                ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
                : 0;

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.json({
                productId,
                reviews,
                stats: {
                    averageRating: avgRating,
                    totalReviews: reviews.length,
                    verifiedReviews: reviews.filter(r => r.verified).length,
                },
            });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to load reviews' });
        }
    });
});

// POST /products/:id/reviews
router.post('/:productId/reviews', async (req, res) => {
    return tracer.startActiveSpan('reviews.create', async (rootSpan) => {
        const productId = parseInt(req.params.productId);
        const { rating, title, body, userId } = req.body;

        rootSpan.setAttributes({
            'product.id': productId,
            'review.rating': rating,
            'user.id': userId || 'anonymous',
        });

        try {
            // 1. Verify auth
            await tracer.startActiveSpan('auth.verify_token', async (span) => {
                span.setAttribute('auth.method', 'bearer_jwt');
                await new Promise(r => setTimeout(r, 6));
                span.end();
            });

            // 2. Content moderation scan
            await tracer.startActiveSpan('content_moderation.scan', async (span) => {
                span.setAttributes({
                    'http.method': 'POST',
                    'http.url': 'https://api.moderatecontent.com/v2/text',
                    'moderation.text_length': (body || '').length,
                    'moderation.provider': 'moderatecontent',
                });

                // 3% chance of moderation service timeout
                const isTimeout = Math.random() < 0.03;
                if (isTimeout) {
                    await new Promise(r => setTimeout(r, 5000));
                    const err = new Error('Content moderation service timed out');
                    span.recordException(err);
                    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
                    span.setAttribute('http.status_code', 504);
                    span.end();
                    throw err;
                }

                await new Promise(r => setTimeout(r, 60 + Math.random() * 40));
                span.setAttribute('http.status_code', 200);
                span.setAttribute('moderation.result', 'approved');
                span.setAttribute('moderation.confidence', 0.98);
                span.end();
            });

            // 3. Insert into database
            await tracer.startActiveSpan('db.insert', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.name': 'online-boutique_prod',
                    'db.statement': 'INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    'db.operation': 'INSERT',
                    'db.sql.table': 'reviews',
                });
                await new Promise(r => setTimeout(r, 15 + Math.random() * 10));
                span.setAttribute('db.rows_affected', 1);
                span.end();
            });

            // 4. Invalidate cache
            await tracer.startActiveSpan('cache.invalidate', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key_pattern': `reviews:product:${productId}:*`,
                    'cache.operation': 'DEL',
                    'cache.keys_deleted': 3,
                });
                await new Promise(r => setTimeout(r, 4));
                span.end();
            });

            // 5. Send confirmation notification
            await tracer.startActiveSpan('notifications.send_review_confirmation', async (span) => {
                span.setAttributes({
                    'notification.type': 'push',
                    'notification.provider': 'firebase',
                    'http.method': 'POST',
                    'http.url': 'https://fcm.googleapis.com/v1/projects/online-boutique/messages:send',
                });
                await new Promise(r => setTimeout(r, 30 + Math.random() * 20));
                span.setAttribute('http.status_code', 200);
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.status(201).json({
                reviewId: `rv_${Date.now()}`,
                status: 'published',
                message: 'Review submitted successfully',
            });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();

            if (error.message.includes('timed out')) {
                res.status(504).json({ error: 'Review submission timed out. Please try again.' });
            } else {
                res.status(500).json({ error: 'Failed to submit review' });
            }
        }
    });
});

module.exports = router;
