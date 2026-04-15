/**
 * apiClient — Shared network layer for QuickShop
 *
 * All app network calls go through this module so:
 *   - The base URL is resolved once from config
 *   - Required headers (Authorization, X-Session-Id, X-Currency) are always sent
 *   - Existing headers (including Embrace's traceparent) are NEVER stripped
 *   - Content-Type defaults to JSON but can be overridden
 */
import { API_BASE_URL, API_KEY } from '../config/api';

// Generate a stable session ID for this app launch
const SESSION_ID = 'mobile-session-' + Math.random().toString(36).substring(2, 10);
let currentCurrency = 'USD';

/**
 * Update the currency sent on every subsequent request.
 * @param {string} code — ISO currency code (e.g. 'EUR', 'JPY')
 */
function setCurrency(code) {
    currentCurrency = code;
}

/**
 * Core request function.
 * @param {string} path  — e.g. '/api/v1/products' or '/api/v1/orders'
 * @param {RequestInit} [options] — standard fetch options
 * @returns {Promise<Response>}
 */
async function request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    console.log(`[apiClient] → ${options.method || 'GET'} ${url}`);

    const mergedOptions = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Auth — required by the /api/v1 endpoints
            'Authorization': `Bearer ${API_KEY}`,
            // Session & currency — required for cart / checkout / pricing
            'X-Session-Id': SESSION_ID,
            'X-Currency': currentCurrency,
            // Required for ngrok free tier — skips the HTML interstitial page
            'ngrok-skip-browser-warning': 'true',
            // Provide a non-browser User-Agent so ngrok doesn't serve HTML
            'User-Agent': 'QuickShop-Mobile/1.0',
            // Spread caller-supplied headers AFTER defaults so they can override
            // but never accidentally remove trace headers injected by the SDK
            ...(options.headers || {}),
        },
    };

    const response = await fetch(url, mergedOptions);

    // Guard: if ngrok returns an HTML error page (502, etc.), throw a clear error
    const contentType = response.headers?.get?.('content-type') || '';
    if (!response.ok && contentType.includes('text/html')) {
        const snippet = await response.text().then(t => t.substring(0, 100));
        throw new Error(`API returned ${response.status} (HTML): ${snippet}`);
    }

    return response;
}

const apiClient = {
    /** Current session ID (read-only) */
    sessionId: SESSION_ID,

    /** Update the currency header for future requests */
    setCurrency,

    /**
     * GET request
     * @param {string} path
     * @param {RequestInit} [options]
     */
    get: (path, options = {}) =>
        request(path, { ...options, method: 'GET' }),

    /**
     * POST request
     * @param {string} path
     * @param {object} body — will be JSON-stringified
     * @param {RequestInit} [options]
     */
    post: (path, body, options = {}) =>
        request(path, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        }),

    /**
     * DELETE request
     * @param {string} path
     * @param {RequestInit} [options]
     */
    delete: (path, options = {}) =>
        request(path, { ...options, method: 'DELETE' }),

    /**
     * Raw request — for callers needing full control
     */
    request,
};

export default apiClient;
