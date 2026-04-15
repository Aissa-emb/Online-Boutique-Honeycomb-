const express = require('express');
const router = express.Router();
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('online-boutique-search');

const PRODUCT_INDEX = [
    { id: 1, name: 'Samba Edition Jersey', category: 'national', tags: ['brazil', 'home', '2024'], price: 85 },
    { id: 2, name: 'Albiceleste Jersey', category: 'national', tags: ['argentina', 'home', '2024'], price: 85 },
    { id: 3, name: 'Les Bleus Jersey', category: 'national', tags: ['france', 'home', '2024'], price: 85 },
    { id: 4, name: 'Samurai Blue Jersey', category: 'national', tags: ['japan', 'special', '2024'], price: 85 },
    { id: 5, name: 'Oranje Classic Jersey', category: 'national', tags: ['netherlands', 'home', '2024'], price: 89 },
    { id: 6, name: 'Gunners Home Kit', category: 'clubs', tags: ['arsenal', 'home', '2024'], price: 95 },
    { id: 7, name: 'Blues Away Kit', category: 'clubs', tags: ['chelsea', 'away', '2024'], price: 95 },
    { id: 8, name: 'Cityzens Third Kit', category: 'clubs', tags: ['manchester-city', 'third', '2024'], price: 95 },
    { id: 9, name: 'Samba Training Top', category: 'training', tags: ['brazil', 'training'], price: 55 },
    { id: 10, name: 'Les Bleus Training Top', category: 'training', tags: ['france', 'training'], price: 55 },
    { id: 11, name: 'Retro Samba 1970', category: 'retro', tags: ['brazil', 'retro', '1970'], price: 120 },
    { id: 12, name: 'Retro Albiceleste 1986', category: 'retro', tags: ['argentina', 'retro', '1986'], price: 130 },
    { id: 13, name: 'Retro Les Bleus 1998', category: 'retro', tags: ['france', 'retro', '1998'], price: 125 },
    { id: 14, name: 'Gunners Retro 2004', category: 'retro', tags: ['arsenal', 'retro', '2004'], price: 115 },
    { id: 15, name: 'Samba Goalkeeper Jersey', category: 'national', tags: ['brazil', 'goalkeeper', '2024'], price: 90 },
    { id: 16, name: 'Albiceleste Away Jersey', category: 'national', tags: ['argentina', 'away', '2024'], price: 85 },
    { id: 17, name: 'Blues Home Kit', category: 'clubs', tags: ['chelsea', 'home', '2024'], price: 95 },
    { id: 18, name: 'Gunners Away Kit', category: 'clubs', tags: ['arsenal', 'away', '2024'], price: 95 },
    { id: 19, name: 'Cityzens Home Kit', category: 'clubs', tags: ['manchester-city', 'home', '2024'], price: 95 },
    { id: 20, name: 'Samurai Blue Away Jersey', category: 'national', tags: ['japan', 'away', '2024'], price: 85 },
];

// GET /search?q=...&category=...&minPrice=...&maxPrice=...&page=...&limit=...
router.get('/', async (req, res) => {
    return tracer.startActiveSpan('search.query', async (rootSpan) => {
        const { q, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

        rootSpan.setAttributes({
            'search.query': q || '',
            'search.category': category || 'all',
            'search.price_min': parseFloat(minPrice) || 0,
            'search.price_max': parseFloat(maxPrice) || 999,
            'search.page': parseInt(page),
            'search.limit': parseInt(limit),
        });

        try {
            // 1. Parse and normalize the query
            let parsedQuery;
            await tracer.startActiveSpan('search.parse_query', async (span) => {
                span.setAttribute('search.raw_query', q || '');
                parsedQuery = (q || '').toLowerCase().trim();
                span.setAttribute('search.parsed_query', parsedQuery);
                span.setAttribute('search.has_typo_correction', false);
                await new Promise(r => setTimeout(r, 3));
                span.end();
            });

            // 2. Execute search against index (simulating Elasticsearch)
            let rawResults;
            await tracer.startActiveSpan('elasticsearch.query', async (span) => {
                span.setAttributes({
                    'db.system': 'elasticsearch',
                    'db.operation': 'search',
                    'db.elasticsearch.index': 'products_v3',
                    'db.elasticsearch.cluster': 'prod-search-01',
                });

                // Simulate occasional cold shard latency (5% chance)
                const isColdShard = Math.random() < 0.05;
                const latency = isColdShard ? 1800 + Math.random() * 700 : 12 + Math.random() * 25;
                span.setAttribute('elasticsearch.took_ms', Math.round(latency));
                span.setAttribute('elasticsearch.cold_shard', isColdShard);

                if (isColdShard) {
                    span.addEvent('cold_shard_detected', {
                        'shard.id': 'shard-3',
                        'shard.node': 'es-node-02.internal',
                    });
                }

                await new Promise(r => setTimeout(r, latency));

                rawResults = PRODUCT_INDEX.filter(p => {
                    let match = true;
                    if (parsedQuery) {
                        match = p.name.toLowerCase().includes(parsedQuery) ||
                            p.tags.some(t => t.includes(parsedQuery));
                    }
                    if (category && category !== 'all') match = match && p.category === category;
                    if (minPrice) match = match && p.price >= parseFloat(minPrice);
                    if (maxPrice) match = match && p.price <= parseFloat(maxPrice);
                    return match;
                });

                span.setAttribute('elasticsearch.hits_total', rawResults.length);
                span.end();
            });

            // 3. Rank and sort results
            await tracer.startActiveSpan('search.rank_results', async (span) => {
                span.setAttribute('search.results_count', rawResults.length);
                span.setAttribute('search.ranking_algorithm', 'bm25_with_recency');
                await new Promise(r => setTimeout(r, 5 + Math.random() * 8));
                span.end();
            });

            // 4. Apply personalization boost
            await tracer.startActiveSpan('search.apply_personalization', async (span) => {
                span.setAttributes({
                    'personalization.user_segment': 'returning_customer',
                    'personalization.boost_applied': true,
                    'personalization.model_version': 'v2.4.1',
                });
                await new Promise(r => setTimeout(r, 8 + Math.random() * 5));
                span.end();
            });

            // 5. Serialize response
            const pageInt = parseInt(page);
            const limitInt = parseInt(limit);
            const paginatedResults = rawResults.slice((pageInt - 1) * limitInt, pageInt * limitInt);

            await tracer.startActiveSpan('response.serialize', async (span) => {
                span.setAttribute('response.items_count', paginatedResults.length);
                span.setAttribute('response.format', 'json');
                await new Promise(r => setTimeout(r, 2));
                span.end();
            });

            rootSpan.setStatus({ code: SpanStatusCode.OK });
            rootSpan.setAttribute('search.total_results', rawResults.length);
            rootSpan.setAttribute('search.returned_results', paginatedResults.length);
            rootSpan.end();

            res.json({
                results: paginatedResults,
                pagination: {
                    page: pageInt,
                    limit: limitInt,
                    total: rawResults.length,
                    totalPages: Math.ceil(rawResults.length / limitInt),
                },
                query: q || '',
            });
        } catch (error) {
            rootSpan.recordException(error);
            rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            rootSpan.end();
            res.status(500).json({ error: 'Search service unavailable' });
        }
    });
});

module.exports = router;
