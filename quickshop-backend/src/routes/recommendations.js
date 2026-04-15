const express = require('express');
const router = express.Router();
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('online-boutique-recommendations');

const PRODUCTS = [
    { id: 1, name: 'Samba Edition Jersey', category: 'national', price: 85, rating: 4.8, views: 12840 },
    { id: 2, name: 'Albiceleste Jersey', category: 'national', price: 85, rating: 4.9, views: 15230 },
    { id: 3, name: 'Les Bleus Jersey', category: 'national', price: 85, rating: 4.7, views: 11920 },
    { id: 4, name: 'Samurai Blue Jersey', category: 'national', price: 85, rating: 4.6, views: 8740 },
    { id: 5, name: 'Oranje Classic Jersey', category: 'national', price: 89, rating: 4.5, views: 6320 },
    { id: 6, name: 'Gunners Home Kit', category: 'clubs', price: 95, rating: 4.8, views: 18940 },
    { id: 7, name: 'Blues Away Kit', category: 'clubs', price: 95, rating: 4.4, views: 9870 },
    { id: 8, name: 'Cityzens Third Kit', category: 'clubs', price: 95, rating: 4.6, views: 14230 },
    { id: 11, name: 'Retro Samba 1970', category: 'retro', price: 120, rating: 4.9, views: 7890 },
    { id: 12, name: 'Retro Albiceleste 1986', category: 'retro', price: 130, rating: 5.0, views: 9210 },
    { id: 13, name: 'Retro Les Bleus 1998', category: 'retro', price: 125, rating: 4.8, views: 6540 },
    { id: 14, name: 'Gunners Retro 2004', category: 'retro', price: 115, rating: 4.7, views: 5430 },
];

// GET /recommendations?userId=...
router.get('/', async (req, res) => {
    return tracer.startActiveSpan('recommendations.personalized', async (rootSpan) => {
        const userId = req.query.userId || req.headers['x-user-id'] || 'user_123';
        rootSpan.setAttribute('user.id', userId);

        try {
            // 1. Fetch user profile and purchase history
            let userProfile;
            await tracer.startActiveSpan('user_profile.fetch', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.name': 'online-boutique_prod',
                    'db.statement': 'SELECT u.*, array_agg(o.product_category) as preferred_categories FROM users u LEFT JOIN order_items o ON u.id = o.user_id WHERE u.id = $1 GROUP BY u.id',
                    'db.operation': 'SELECT',
                });
                userProfile = {
                    id: userId,
                    preferredCategories: ['national', 'retro'],
                    priceRange: { min: 80, max: 130 },
                    purchaseCount: 7,
                };
                await new Promise(r => setTimeout(r, 15 + Math.random() * 12));
                span.end();
            });

            // 2. ML model inference for personalization
            let scoredProducts;
            await tracer.startActiveSpan('ml_model.predict', async (span) => {
                span.setAttributes({
                    'ml.model_name': 'product-recommender-v3',
                    'ml.model_version': '3.2.1',
                    'ml.framework': 'tensorflow-serving',
                    'http.method': 'POST',
                    'http.url': 'http://ml-serving.internal:8501/v1/models/recommender:predict',
                    'ml.input_features': 12,
                    'ml.batch_size': 1,
                });

                await new Promise(r => setTimeout(r, 35 + Math.random() * 25));

                scoredProducts = PRODUCTS
                    .map(p => ({
                        ...p,
                        relevanceScore: Math.random() * 0.4 + 0.6,
                    }))
                    .sort((a, b) => b.relevanceScore - a.relevanceScore)
                    .slice(0, 8);

                span.setAttribute('ml.inference_time_ms', 35);
                span.setAttribute('ml.predictions_count', scoredProducts.length);
                span.setAttribute('http.status_code', 200);
                span.end();
            });

            // 3. Fetch full product details
            await tracer.startActiveSpan('db.fetch_products', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'SELECT * FROM products WHERE id = ANY($1)',
                    'db.operation': 'SELECT',
                    'db.sql.table': 'products',
                });
                await new Promise(r => setTimeout(r, 10 + Math.random() * 8));
                span.setAttribute('db.rows_affected', scoredProducts.length);
                span.end();
            });

            // 4. Cache results
            await tracer.startActiveSpan('cache.store', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': `recommendations:${userId}`,
                    'cache.ttl_seconds': 1800,
                    'cache.operation': 'SETEX',
                });
                await new Promise(r => setTimeout(r, 4));
                span.end();
            });

            // 5. Serialize
            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.items_count', scoredProducts.length);
                await new Promise(r => setTimeout(r, 2));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.setAttribute('recommendations.count', scoredProducts.length);
            rootSpan.end();

            res.json({ recommendations: scoredProducts });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Recommendation service unavailable' });
        }
    });
});

// GET /recommendations/trending
router.get('/trending', async (req, res) => {
    return tracer.startActiveSpan('recommendations.trending', async (rootSpan) => {
        try {
            // 1. Check cache
            let cacheHit = Math.random() > 0.5;
            let trendingProducts;

            await tracer.startActiveSpan('cache.check', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': 'trending:products:global',
                    'cache.hit': cacheHit,
                    'cache.ttl_seconds': 600,
                });
                await new Promise(r => setTimeout(r, 2 + Math.random() * 3));
                span.end();
            });

            if (!cacheHit) {
                // 2. Aggregate analytics data
                await tracer.startActiveSpan('analytics.aggregate_views', async (span) => {
                    span.setAttributes({
                        'db.system': 'clickhouse',
                        'db.name': 'analytics_prod',
                        'db.statement': 'SELECT product_id, count() as views, uniq(user_id) as unique_viewers FROM product_views WHERE timestamp > now() - INTERVAL 24 HOUR GROUP BY product_id ORDER BY views DESC LIMIT 10',
                        'db.operation': 'SELECT',
                        'analytics.time_range': '24h',
                        'analytics.aggregation': 'count_by_product',
                    });
                    await new Promise(r => setTimeout(r, 45 + Math.random() * 30));
                    span.end();
                });

                // 3. Fetch product details
                await tracer.startActiveSpan('db.fetch_products', async (span) => {
                    span.setAttributes({
                        'db.system': 'postgresql',
                        'db.statement': 'SELECT * FROM products WHERE id = ANY($1)',
                        'db.operation': 'SELECT',
                    });
                    trendingProducts = [...PRODUCTS]
                        .sort((a, b) => b.views - a.views)
                        .slice(0, 6);
                    await new Promise(r => setTimeout(r, 8 + Math.random() * 5));
                    span.setAttribute('db.rows_affected', trendingProducts.length);
                    span.end();
                });

                // 4. Cache results
                await tracer.startActiveSpan('cache.store', async (span) => {
                    span.setAttributes({
                        'cache.system': 'redis',
                        'cache.key': 'trending:products:global',
                        'cache.ttl_seconds': 600,
                    });
                    await new Promise(r => setTimeout(r, 3));
                    span.end();
                });
            } else {
                trendingProducts = [...PRODUCTS]
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 6);
            }

            // 5. Serialize
            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.items_count', trendingProducts.length);
                await new Promise(r => setTimeout(r, 1));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.setAttribute('trending.count', trendingProducts.length);
            rootSpan.end();

            res.json({ trending: trendingProducts });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Trending service unavailable' });
        }
    });
});

module.exports = router;
