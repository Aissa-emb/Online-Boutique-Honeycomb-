/**
 * Local environment overrides (GITIGNORED — do not commit)
 *
 * Copy this file to .env.local.js and fill in your values.
 * See TUNNEL_SETUP.md for instructions.
 */
module.exports = {
    /**
     * Your public tunnel HTTPS URL (e.g. from ngrok or Cloudflare Tunnel).
     * When set, the app routes all API calls through this URL instead of localhost.
     * This is REQUIRED for Embrace Network Spans Forwarding to work.
     *
     * Example: 'https://abc123.ngrok-free.app'
     */
    TUNNEL_URL: '',

    /**
     * App environment label. Defaults to 'development'.
     * Options: 'development' | 'staging' | 'production'
     */
    // APP_ENV: 'development',
};
