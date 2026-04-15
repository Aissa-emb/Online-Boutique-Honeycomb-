const express = require('express');
const router = express.Router();
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('online-boutique-products');

const PRODUCTS = [
    { id: 1, name: 'Honeybee Plush', category: 'novelty', season: 'Novelty', price: 29.79, stock: 142, rating: 4.8, reviewCount: 234, description: 'A cute and cuddly honeybee plush toy. Perfect for nature lovers of all ages.' },
    { id: 2, name: '20 Sided Die', category: 'novelty', season: 'Novelty', price: 15.19, stock: 98, rating: 4.9, reviewCount: 312, description: 'A beautifully crafted 20-sided die made from natural wood with laser-engraved numbers.' },
    { id: 3, name: 'Vintage Typewriter', category: 'vintage', season: 'Vintage', price: 67.98, stock: 167, rating: 4.7, reviewCount: 189, description: 'A fully functional vintage typewriter from the 1940s era. A true collector\'s item.' },
    { id: 4, name: 'Vintage Camera Lens', category: 'vintage', season: 'Vintage', price: 12.48, stock: 73, rating: 4.6, reviewCount: 145, description: 'A classic manual focus camera lens with brass construction. Perfect for photography enthusiasts.' },
    { id: 5, name: 'Home Barista Kit', category: 'home', season: 'Home', price: 123.99, stock: 56, rating: 4.8, reviewCount: 567, description: 'Everything you need to brew the perfect cup at home. Includes pour-over dripper, grinder, and scale.' },
    { id: 6, name: 'Terrarium', category: 'home', season: 'Home', price: 36.44, stock: 210, rating: 4.5, reviewCount: 234, description: 'A geometric glass terrarium with gold metal frame. Bring a touch of nature to any space.' },
    { id: 7, name: 'Film Camera', category: 'vintage', season: 'Vintage', price: 499.99, stock: 12, rating: 4.9, reviewCount: 345, description: 'A vintage twin-lens reflex film camera in excellent condition. A functional work of art.' },
    { id: 8, name: 'Vintage Record Player', category: 'vintage', season: 'Vintage', price: 65.50, stock: 89, rating: 4.6, reviewCount: 87, description: 'A classic vinyl record player with warm analog sound. Perfect for vinyl enthusiasts.' },
    { id: 9, name: 'Metal Camping Mug', category: 'outdoor', season: 'Outdoor', price: 24.33, stock: 320, rating: 4.3, reviewCount: 92, description: 'A durable enamel camping mug. Built to withstand the elements while keeping your coffee hot.' },
    { id: 10, name: 'City Bike', category: 'outdoor', season: 'Outdoor', price: 789.50, stock: 45, rating: 4.9, reviewCount: 156, description: 'This single gear bike probably cannot climb the hills of San Francisco.' },
    { id: 11, name: 'Air Plant', category: 'home', season: 'Home', price: 12.30, stock: 280, rating: 4.4, reviewCount: 201, description: 'A low-maintenance succulent air plant in a handmade ceramic pot. Perfect for any desk or shelf.' },
];

// GET /products
router.get('/', async (req, res) => {
    return tracer.startActiveSpan('products.list', async (rootSpan) => {
        const { category, sort = 'popular', page = 1, limit = 20 } = req.query;
        rootSpan.setAttributes({
            'products.category_filter': category || 'all',
            'products.sort': sort,
            'products.page': parseInt(page),
        });

        try {
            // 1. Cache check
            const cacheHit = Math.random() > 0.7;
            await tracer.startActiveSpan('cache.check', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': `products:list:${category || 'all'}:${sort}:${page}`,
                    'cache.hit': cacheHit,
                    'net.peer.name': 'redis-primary.internal',
                    'net.peer.port': 6379,
                });
                await new Promise(r => setTimeout(r, 2 + Math.random() * 4));
                span.end();
            });

            let filteredProducts = PRODUCTS;

            if (!cacheHit) {
                // 2. Database query
                await tracer.startActiveSpan('db.query', async (span) => {
                    span.setAttributes({
                        'db.system': 'postgresql',
                        'db.name': 'online-boutique_prod',
                        'db.statement': category
                            ? 'SELECT * FROM products WHERE category = $1 ORDER BY popularity DESC LIMIT $2 OFFSET $3'
                            : 'SELECT * FROM products ORDER BY popularity DESC LIMIT $1 OFFSET $2',
                        'db.operation': 'SELECT',
                        'db.sql.table': 'products',
                        'db.connection_pool.active': 8,
                        'db.connection_pool.idle': 12,
                        'db.connection_pool.max': 20,
                    });

                    if (category) {
                        filteredProducts = PRODUCTS.filter(p => p.category === category);
                    }

                    // Simulate occasional DB connection pool exhaustion (2%)
                    const isPoolExhausted = Math.random() < 0.02;
                    if (isPoolExhausted) {
                        await new Promise(r => setTimeout(r, 3000));
                        const err = new Error('Connection pool exhausted: all 20 connections in use');
                        span.recordException(err);
                        span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
                        span.setAttribute('db.connection_pool.active', 20);
                        span.setAttribute('db.connection_pool.idle', 0);
                        span.end();
                        throw err;
                    }

                    await new Promise(r => setTimeout(r, 15 + Math.random() * 20));
                    span.setAttribute('db.rows_affected', filteredProducts.length);
                    span.end();
                });

                // 3. Fetch inventory counts
                await tracer.startActiveSpan('inventory.batch_check', async (span) => {
                    span.setAttributes({
                        'db.system': 'postgresql',
                        'db.statement': 'SELECT product_id, quantity FROM inventory WHERE product_id = ANY($1) AND warehouse_id = $2',
                        'db.operation': 'SELECT',
                        'db.sql.table': 'inventory',
                        'inventory.warehouse': 'us-east-1',
                    });
                    await new Promise(r => setTimeout(r, 8 + Math.random() * 6));
                    span.setAttribute('db.rows_affected', filteredProducts.length);
                    span.end();
                });

                // 4. Cache result
                await tracer.startActiveSpan('cache.store', async (span) => {
                    span.setAttributes({
                        'cache.system': 'redis',
                        'cache.key': `products:list:${category || 'all'}:${sort}:${page}`,
                        'cache.ttl_seconds': 120,
                    });
                    await new Promise(r => setTimeout(r, 3));
                    span.end();
                });
            }

            // 5. Serialize response
            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.items_count', filteredProducts.length);
                span.setAttribute('response.format', 'json');
                span.setAttribute('response.bytes', JSON.stringify(filteredProducts).length);
                await new Promise(r => setTimeout(r, 3));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.setAttribute('products.returned_count', filteredProducts.length);
            rootSpan.end();

            res.json({ products: filteredProducts });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to load products' });
        }
    });
});

// GET /products/:id
router.get('/:id', async (req, res) => {
    return tracer.startActiveSpan('products.get_detail', async (rootSpan) => {
        const productId = parseInt(req.params.id);
        rootSpan.setAttribute('product.id', productId);

        try {
            // 1. Cache check
            await tracer.startActiveSpan('cache.check', async (span) => {
                span.setAttributes({
                    'cache.system': 'redis',
                    'cache.key': `product:${productId}`,
                    'cache.hit': false,
                });
                await new Promise(r => setTimeout(r, 2 + Math.random() * 3));
                span.end();
            });

            // 2. Database query
            let product;
            await tracer.startActiveSpan('db.query', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.name': 'online-boutique_prod',
                    'db.statement': 'SELECT p.*, i.quantity as stock FROM products p JOIN inventory i ON p.id = i.product_id WHERE p.id = $1',
                    'db.operation': 'SELECT',
                    'db.sql.table': 'products',
                });
                product = PRODUCTS.find(p => p.id === productId);
                await new Promise(r => setTimeout(r, 10 + Math.random() * 15));
                span.setAttribute('db.rows_affected', product ? 1 : 0);
                span.end();
            });

            if (!product) {
                rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: 'Product not found' });
                rootSpan.end();
                return res.status(404).json({ error: 'Product not found' });
            }

            // 3. Fetch review summary
            await tracer.startActiveSpan('reviews.fetch_summary', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = $1',
                    'db.operation': 'SELECT',
                });
                await new Promise(r => setTimeout(r, 6 + Math.random() * 5));
                span.end();
            });

            // 4. Serialize
            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.format', 'json');
                await new Promise(r => setTimeout(r, 2));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.end();

            res.json({ product });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to load product' });
        }
    });
});

// GET /products/:id/related
router.get('/:id/related', async (req, res) => {
    return tracer.startActiveSpan('products.get_related', async (rootSpan) => {
        const productId = parseInt(req.params.id);
        rootSpan.setAttribute('product.id', productId);

        try {
            const product = PRODUCTS.find(p => p.id === productId);

            // 1. Find related by category
            await tracer.startActiveSpan('db.query', async (span) => {
                span.setAttributes({
                    'db.system': 'postgresql',
                    'db.statement': 'SELECT * FROM products WHERE category = $1 AND id != $2 ORDER BY rating DESC LIMIT 4',
                    'db.operation': 'SELECT',
                    'db.sql.table': 'products',
                });
                await new Promise(r => setTimeout(r, 12 + Math.random() * 10));
                span.end();
            });

            // 2. Collaborative filtering
            await tracer.startActiveSpan('ml_model.collaborative_filter', async (span) => {
                span.setAttributes({
                    'ml.model_name': 'item-similarity-v2',
                    'ml.model_version': '2.1.0',
                    'http.method': 'POST',
                    'http.url': 'http://ml-serving.internal:8501/v1/models/item-similarity:predict',
                });
                await new Promise(r => setTimeout(r, 20 + Math.random() * 15));
                span.setAttribute('http.status_code', 200);
                span.end();
            });

            const relatedProducts = PRODUCTS
                .filter(p => p.id !== productId && product && p.category === product.category)
                .slice(0, 4);

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.setAttribute('related.count', relatedProducts.length);
            rootSpan.end();

            res.json({ related: relatedProducts });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Failed to load related products' });
        }
    });
});

module.exports = router;
