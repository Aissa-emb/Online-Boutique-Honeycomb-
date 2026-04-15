const http = require('http');

const BASE_URL = 'http://localhost:3005';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '3');
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '2000');

async function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3005,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'user_123',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms + Math.random() * ms * 0.5));
}

// --- User Journey Personas ---

async function browsingCustomer(userId) {
    const label = `[Browser ${userId}]`;
    console.log(`${label} Starting browsing session...`);

    await request('POST', '/auth/login', { username: `customer_${userId}`, password: 'securepass' });
    await delay(800);

    await request('GET', '/products');
    await delay(1200);

    // Search for something
    const searchTerms = ['jersey', 'retro', 'training', 'away', 'goalkeeper'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    await request('GET', `/search?q=${term}`);
    await delay(600);

    // Browse a few products
    const productIds = [1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = 0; i < 3; i++) {
        const pid = productIds[Math.floor(Math.random() * productIds.length)];
        await request('GET', `/products/${pid}`);
        await delay(500);

        // Check reviews
        if (Math.random() > 0.5) {
            await request('GET', `/reviews/${pid}/reviews`);
            await delay(300);
        }

        // Check related products
        if (Math.random() > 0.6) {
            await request('GET', `/products/${pid}/related`);
            await delay(400);
        }
    }

    // Check trending
    await request('GET', '/recommendations/trending');
    await delay(500);

    // Check personalized recommendations
    await request('GET', `/recommendations?userId=user_${userId}`);
    await delay(400);

    await request('POST', '/auth/logout', { token: 'session-token' });
    console.log(`${label} Session complete (browse only)`);
}

async function purchasingCustomer(userId) {
    const label = `[Buyer ${userId}]`;
    console.log(`${label} Starting purchase journey...`);

    await request('POST', '/auth/login', { username: `buyer_${userId}`, password: 'securepass' });
    await delay(600);

    // Browse products
    const { body: productsData } = await request('GET', '/products');
    await delay(800);

    // View a product detail
    const productId = Math.floor(Math.random() * 20) + 1;
    await request('GET', `/products/${productId}`);
    await delay(600);

    // Check reviews
    await request('GET', `/reviews/${productId}/reviews`);
    await delay(400);

    // Get shipping estimate
    await request('POST', '/shipping/estimate', {
        address: '456 Commerce St, Brooklyn, NY 11201',
        items: [{ id: productId, quantity: 1 }],
        expedited: Math.random() > 0.7,
    });
    await delay(500);

    // Checkout
    const promos = [null, null, null, 'SPRING24', 'INVALID_CODE'];
    const promo = promos[Math.floor(Math.random() * promos.length)];

    const checkoutResult = await request('POST', '/checkout', {
        userId: `user_${userId}`,
        cartItems: [{ id: productId, name: 'Jersey', price: 85, quantity: 1 }],
        paymentMethodId: 'pm_card_visa',
        shippingAddress: '456 Commerce St, Brooklyn, NY 11201',
        promoCode: promo,
    });
    await delay(1000);

    if (checkoutResult.status === 200 && checkoutResult.body.orderId) {
        console.log(`${label} Order placed: ${checkoutResult.body.orderId}`);
    } else {
        console.log(`${label} Checkout returned ${checkoutResult.status}`);
    }

    // Check notifications
    await request('GET', '/notifications');
    await delay(300);

    await request('POST', '/auth/logout', { token: 'session-token' });
    console.log(`${label} Purchase journey complete`);
}

async function returningCustomer(userId) {
    const label = `[Returner ${userId}]`;
    console.log(`${label} Starting return flow...`);

    await request('POST', '/auth/login', { username: `returner_${userId}`, password: 'securepass' });
    await delay(500);

    // Check order history
    await request('GET', '/orders');
    await delay(600);

    // View specific order
    const orderIds = ['ORD-20240315-7842', 'ORD-20240322-1293', 'ORD-20240328-5619'];
    const orderId = orderIds[Math.floor(Math.random() * orderIds.length)];
    await request('GET', `/orders/${orderId}`);
    await delay(400);

    // Track shipment
    await request('GET', `/shipping/${orderId}/track`);
    await delay(500);

    // Initiate return (sometimes)
    if (Math.random() > 0.5) {
        const reasons = ['wrong_size', 'not_as_described', 'changed_mind', 'defective'];
        await request('POST', `/orders/${orderId}/return`, {
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            items: [{ productId: 1, quantity: 1 }],
        });
        await delay(800);
    }

    // Check notifications
    await request('GET', '/notifications');
    await delay(300);

    await request('POST', '/auth/logout', { token: 'session-token' });
    console.log(`${label} Return flow complete`);
}

async function powerUser(userId) {
    const label = `[Power ${userId}]`;
    console.log(`${label} Starting power user session...`);

    // Register new account
    await request('POST', '/auth/register', {
        username: `power_${userId}_${Date.now()}`,
        email: `power${userId}@example.com`,
        password: 'strongpassword',
    });
    await delay(400);

    await request('POST', '/auth/login', { username: `power_${userId}`, password: 'strongpassword' });
    await delay(300);

    // Heavy search usage
    const categories = ['national', 'clubs', 'retro', 'training'];
    for (const cat of categories) {
        await request('GET', `/search?q=jersey&category=${cat}`);
        await delay(300);
    }

    // Price range search
    await request('GET', '/search?q=&minPrice=80&maxPrice=100');
    await delay(400);

    // View many products
    for (let i = 1; i <= 6; i++) {
        await request('GET', `/products/${i}`);
        await delay(200);
    }

    // Leave a review
    await request('POST', `/reviews/3/reviews`, {
        userId: `user_${userId}`,
        rating: Math.floor(Math.random() * 2) + 4,
        title: 'Great quality',
        body: 'Fits perfectly and the fabric quality is excellent. Would recommend.',
    });
    await delay(500);

    // Check recommendations
    await request('GET', `/recommendations?userId=user_${userId}`);
    await delay(300);

    // Update notification preferences
    await request('POST', '/notifications/preferences', {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        categories: ['order_updates', 'price_drops'],
    });
    await delay(200);

    // Purchase
    await request('POST', '/checkout', {
        userId: `user_${userId}`,
        cartItems: [
            { id: 3, name: 'Les Bleus Jersey', price: 85, quantity: 1 },
            { id: 11, name: 'Retro Samba 1970', price: 120, quantity: 1 },
        ],
        paymentMethodId: 'pm_card_visa',
        shippingAddress: '789 Football Ave, Manhattan, NY 10023',
        promoCode: 'SPRING24',
    });
    await delay(800);

    // Refresh token
    await request('POST', '/auth/refresh-token', { refreshToken: 'refresh-token-value' });
    await delay(200);

    await request('POST', '/auth/logout', { token: 'session-token' });
    console.log(`${label} Power user session complete`);
}

async function errorScenario(userId) {
    const label = `[Error ${userId}]`;
    console.log(`${label} Testing error paths...`);

    // Bad login (rate limit test)
    for (let i = 0; i < 3; i++) {
        await request('POST', '/auth/login', { username: 'nonexistent', password: 'wrong' });
        await delay(100);
    }

    // Checkout without payment method
    await request('POST', '/checkout', {
        userId: `user_${userId}`,
        cartItems: [{ id: 1, price: 85 }],
    });
    await delay(300);

    // Checkout with empty cart
    await request('POST', '/checkout', {
        userId: `user_${userId}`,
        cartItems: [],
        paymentMethodId: 'pm_card_visa',
    });
    await delay(300);

    // Non-existent product
    await request('GET', '/products/99999');
    await delay(200);

    // Non-existent order
    await request('GET', '/orders/ORD-NONEXISTENT');
    await delay(200);

    // Search with no results
    await request('GET', '/search?q=xyznonexistent');
    await delay(200);

    console.log(`${label} Error scenarios complete`);
}

// --- Main Loop ---

const JOURNEYS = [browsingCustomer, purchasingCustomer, returningCustomer, powerUser, errorScenario];
const WEIGHTS = [30, 35, 15, 10, 10]; // Percentage weights

function pickJourney() {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < JOURNEYS.length; i++) {
        cumulative += WEIGHTS[i];
        if (roll < cumulative) return JOURNEYS[i];
    }
    return browsingCustomer;
}

async function main() {
    console.log(`\n🚀 QuickShop Traffic Generator`);
    console.log(`   Concurrency: ${CONCURRENCY} users`);
    console.log(`   Interval: ${INTERVAL_MS}ms between new users`);
    console.log(`   Press Ctrl+C to stop\n`);

    let userCount = 1;
    let stats = { total: 0, browsing: 0, purchasing: 0, returning: 0, power: 0, errors: 0 };

    while (true) {
        const journey = pickJourney();
        const journeyName = journey.name;

        if (journeyName.includes('browsing')) stats.browsing++;
        else if (journeyName.includes('purchasing')) stats.purchasing++;
        else if (journeyName.includes('returning')) stats.returning++;
        else if (journeyName.includes('power')) stats.power++;
        else if (journeyName.includes('error')) stats.errors++;
        stats.total++;

        journey(userCount++).catch(err => {
            console.error(`[User ${userCount - 1}] Journey failed:`, err.message);
        });

        await new Promise(r => setTimeout(r, INTERVAL_MS));

        if (userCount % 50 === 0) {
            console.log(`\n📊 Stats: ${stats.total} sessions | Browse: ${stats.browsing} | Buy: ${stats.purchasing} | Return: ${stats.returning} | Power: ${stats.power} | Error: ${stats.errors}\n`);
        }

        if (userCount > 10000) userCount = 1;
    }
}

main();
