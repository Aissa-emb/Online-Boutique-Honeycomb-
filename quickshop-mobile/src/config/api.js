/**
 * QuickShop API Configuration
 *
 * TUNNEL MODE:
 *   Set TUNNEL_URL below to your ngrok/Cloudflare HTTPS URL.
 *   This routes ALL API calls through the public hostname so
 *   Embrace NSF can forward network spans to your OTLP backend.
 *
 * LOCAL MODE:
 *   Leave TUNNEL_URL as '' to use the local backend directly.
 *
 * DEMO MODE (default):
 *   When neither tunnel nor local server is configured, falls back
 *   to the Honeycomb demo backend which hosts the /api/v1 endpoints.
 */

// ──────────────────────────────────────────────────────────
// ✏️  SET YOUR TUNNEL URL HERE
// ──────────────────────────────────────────────────────────
const TUNNEL_URL = ''; // Set your public tunnel URL here (e.g., https://your-subdomain.ngrok-free.dev)

// ──────────────────────────────────────────────────────────
// API Key — must match the FRONTEND_API_KEY on the server
// ──────────────────────────────────────────────────────────
const API_KEY = 'ddcd09c3-4add-4b3e-9080-35287aa79700';

// ──────────────────────────────────────────────────────────
// Defaults (do not change unless switching environments)
// ──────────────────────────────────────────────────────────
// Use `localhost` (not 127.0.0.1) — iOS App Transport Security
// only allows insecure HTTP for the 'localhost' hostname.
const LOCAL_URL = 'http://localhost:3005';
const DEMO_URL = 'https://microservices.honeydemo.io';
const STAGING_URL = '';
const APP_ENV = 'development';

// ──────────────────────────────────────────────────────────
// Resolved config
// ──────────────────────────────────────────────────────────
const USE_PUBLIC_TUNNEL = Boolean(TUNNEL_URL);

const API_BASE_URL = (() => {
    if (TUNNEL_URL) return TUNNEL_URL;
    if (APP_ENV === 'staging' && STAGING_URL) return STAGING_URL;
    // Default to LOCAL_URL since we want to access local customized products
    return LOCAL_URL;
})();

// Legacy alias
const API_URL = API_BASE_URL;

// Diagnostic
console.log(`[QuickShop Config] API_BASE_URL = ${API_BASE_URL}`);
console.log(`[QuickShop Config] USE_PUBLIC_TUNNEL = ${USE_PUBLIC_TUNNEL}`);

export { API_URL, API_BASE_URL, API_KEY, APP_ENV, USE_PUBLIC_TUNNEL, TUNNEL_URL };
