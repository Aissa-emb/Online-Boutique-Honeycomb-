# Tunnel Setup for Embrace Network Spans Forwarding (NSF)

This guide explains how to route your local QuickShop backend through a public HTTPS tunnel so that **Embrace Network Spans Forwarding** can capture client-side network spans and forward them to your OTLP backend for end-to-end trace correlation.

## Why a Tunnel?

Embrace NSF **will not forward** requests to:
- `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `*.local`
- Private IP ranges (`192.168.x.x`, `10.x.x.x`, `172.16–31.x.x`)

A public tunnel assigns an HTTPS hostname (e.g. `abc123.ngrok-free.app`) to your local backend, making the domain routable and eligible for NSF forwarding.

---

## Quick Start

### 1. Start the backend

```bash
cd quickshop-backend

# With OTLP export:
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.example.com \
OTEL_EXPORTER_OTLP_HEADERS="x-api-key=YOUR_API_KEY" \
node server.js

# Or console-only:
node server.js
```

### 2. Start a tunnel

**Option A — ngrok** (recommended)

```bash
# Install: https://ngrok.com/download
ngrok http 3005
```

**Option B — Cloudflare Tunnel**

```bash
# Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/
cloudflared tunnel --url http://localhost:3005
```

Copy the public HTTPS URL from the tunnel output (e.g. `https://abc123.ngrok-free.app`).

### 3. Configure the app

Edit `src/config/api.js`:

```js
const TUNNEL_URL = 'https://abc123.ngrok-free.app';  // ← paste your tunnel URL here
```

### 4. Reload the app

```bash
npm start -- --reset-cache
# Then press 'i' for iOS simulator
```

All API calls will now target the public tunnel hostname.

---

## Architecture

```
┌──────────────────┐     HTTPS      ┌──────────────┐    HTTP     ┌──────────────────┐
│  iOS Simulator   │ ──────────────▶│  ngrok /      │ ──────────▶│  Local Backend   │
│  (QuickShop)     │  traceparent   │  Cloudflare   │            │  :3005           │
│                  │  header        │  Tunnel       │            │  (OTel → OTLP)   │
└──────────────────┘                └──────────────┘            └──────────────────┘
        │                                                              │
        │ Embrace SDK                                                  │ OTel SDK
        ▼                                                              ▼
  ┌──────────────┐                                            ┌──────────────┐
  │  Embrace     │     NSF forwards spans                     │  Your OTLP   │
  │  Dashboard   │ ─────────────────────────────────────────▶ │  Backend     │
  └──────────────┘     (same trace-id)                        └──────────────┘
```

---

## Embrace Dashboard Configuration

### Prerequisites Checklist

- [ ] **Data destination enabled** — Your OTLP backend is configured as a destination in Embrace (Settings → Data Destinations)
- [ ] **App enabled for NSF** — QuickShop is listed under enabled apps (Settings → Integrations → Network Spans Forwarding → Apps)
- [ ] **Tunneled domain added** — Add your tunnel domain pattern to NSF domain patterns:
  - **Exact match**: `abc123.ngrok-free.app`
  - **Regex match**: `.*\.ngrok-free\.app` (covers all ngrok URLs)
- [ ] **SDK version ≥ 6.0.0** — QuickShop uses `@embrace-io/react-native ^6.4.0` ✅

### Sampling Rates

| Environment | Default Rate |
|---|---|
| Development | 100% |
| Production | 1% |

Since this is a local dev setup, Embrace will sample 100% of spans by default.

---

## Verification

### 1. Confirm the app is using the tunnel hostname

Check Metro logs — you should see:
```
[apiClient] → GET https://abc123.ngrok-free.app/products
```

Not `127.0.0.1` or `localhost`.

### 2. Confirm backend receives requests via tunnel

Check your backend terminal — you should see incoming requests with the tunnel's forwarded headers.

### 3. Confirm traceparent propagation

The backend's OTel auto-instrumentation (`@opentelemetry/instrumentation-http`) automatically reads `traceparent` headers from incoming requests and joins the distributed trace. Verify by:

1. Open your OTLP backend → query the `quickshop-backend` service
2. Look for traces that include both:
   - **Client span** (forwarded by Embrace NSF with `emb.*` attributes)
   - **Server span** (from backend OTel SDK)
3. The `trace-id` should match between the Embrace dashboard and your OTLP backend

### 4. Quick smoke test

```bash
# From any terminal — hit your tunnel to verify it reaches the backend
curl -v https://abc123.ngrok-free.app/products
```

---

## Switching Environments

| Mode | `api.js` setting | Result |
|---|---|---|
| **Local direct** (no NSF) | `TUNNEL_URL: ''` | `http://127.0.0.1:3005` |
| **Tunnel** (NSF enabled) | `TUNNEL_URL: 'https://...'` | Tunnel HTTPS URL |
| **Staging** | Set `APP_ENV: 'staging'` + configure `STAGING_URL` in `api.js` | Staging server |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Spans not appearing in your OTLP backend | Verify NSF domain pattern matches your tunnel hostname |
| `Network request failed` | Ensure tunnel is running and URL is correct in `api.js` |
| Still hitting localhost | Delete Metro cache: `npm start -- --reset-cache` |
| ngrok shows 502 Bad Gateway | Ensure backend is running on port 3005 |
