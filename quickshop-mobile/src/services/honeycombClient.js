/**
 * honeycombClient — Fire-and-forget network layer for the JSON API (/api/v1)
 *
 * Every method triggers a real HTTP request to microservices.honeydemo.io,
 * generating traces that appear in the Honeycomb 'msdemo' environment.
 */
import {
    HONEYCOMB_BASE_URL,
    mapProductId,
    getRandomPerson,
    getRandomProductId,
} from '../config/honeycomb';

const API_KEY = 'ddcd09c3-4add-4b3e-9080-35287aa79700';
// Generate a simple session ID for this app launch
const SESSION_ID = 'mobile-session-' + Math.random().toString(36).substring(2, 10);
let currentCurrency = 'USD';

/**
 * Core request — wraps fetch with logging and error swallowing.
 */
async function request(path, options = {}) {
    const url = `${HONEYCOMB_BASE_URL}${path}`;
    const method = options.method || 'GET';
    console.log(`[honeycomb] → ${method} ${url}`);

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'X-Session-Id': SESSION_ID,
                'X-Currency': currentCurrency,
                'User-Agent': 'QuickShop-Mobile/1.0',
                ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {}),
            },
        });
        console.log(`[honeycomb] ← ${response.status} ${method} ${path}`);
        return response;
    } catch (error) {
        console.warn(`[honeycomb] ✗ ${method} ${path} failed:`, error.message);
        return null;
    }
}

// ── Public API ───────────────────────────────────────────────

const honeycombClient = {
    /**
     * Browse index page
     */
    browseIndex: () =>
        request('/api/v1/products'),

    /**
     * Browse a product
     * @param {number} appProductId — the app-local product ID
     */
    browseProduct: (appProductId) => {
        const demoId = mapProductId(appProductId);
        return request(`/api/v1/products/${demoId}`);
    },

    /**
     * Add a product to cart
     */
    addToCart: async (appProductId, quantity = 1) => {
        const demoId = mapProductId(appProductId);
        // Browse the product first (locust does GET then POST)
        await request(`/api/v1/products/${demoId}`);
        return request('/api/v1/cart/items', {
            method: 'POST',
            body: JSON.stringify({ product_id: demoId, quantity }),
        });
    },

    /**
     * View cart
     */
    viewCart: () =>
        request('/api/v1/cart'),

    /**
     * Full checkout flow
     */
    checkout: async () => {
        // Mimic locust: add_to_cart then checkout
        const randomProductId = getRandomProductId();
        await request(`/api/v1/products/${randomProductId}`);
        await request('/api/v1/cart/items', {
            method: 'POST',
            body: JSON.stringify({
                product_id: randomProductId,
                quantity: Math.ceil(Math.random() * 5),
            }),
        });
        
        const person = getRandomPerson();
        // Convert string fields to numbers as per the API requirements
        const orderPayload = {
            ...person,
            zip_code: parseInt(person.zip_code, 10),
            credit_card_expiration_month: parseInt(person.credit_card_expiration_month, 10),
            credit_card_expiration_year: parseInt(person.credit_card_expiration_year, 10),
            credit_card_cvv: parseInt(person.credit_card_cvv, 10),
        };

        return request('/api/v1/orders', {
            method: 'POST',
            body: JSON.stringify(orderPayload),
        });
    },

    /**
     * Set currency
     * @param {string} currencyCode — e.g. 'EUR', 'USD', 'JPY', 'CAD'
     */
    setCurrency: (currencyCode) => {
        currentCurrency = currencyCode;
        return request('/api/v1/session/currency', {
            method: 'POST',
            body: JSON.stringify({ currency_code: currencyCode }),
        });
    },
};

export default honeycombClient;
