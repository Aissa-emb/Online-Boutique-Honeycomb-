# Pitch App — Composable Observability Demo

A production-grade demo application for showcasing **Embrace SDK + OpenTelemetry composable observability** across mobile and backend. Built to generate rich, realistic telemetry for partner demos, workshops, and internal enablement.

> **QuickShop** is a fictional soccer jersey e-commerce app. Users browse, search, add-to-cart, and checkout — all fully instrumented for observability.

---

## Architecture

```
┌──────────────────────────┐       ┌──────────────────────────┐
│    QuickShop Mobile      │       │    QuickShop Backend     │
│    (React Native / iOS)  │──────▶│    (Node.js / Express)   │
│                          │       │                          │
│  • Embrace SDK           │       │  • OpenTelemetry SDK     │
│  • Breadcrumbs           │       │  • Auto-instrumentation  │
│  • View Spans            │       │  • Multi-span routes     │
│  • Network Span Fwd.     │       │  • OTLP Trace Export     │
│  • Crash Reporting       │       │  • OTLP Metric Export    │
└──────────────────────────┘       └──────────────────────────┘
         │                                   │
         ▼                                   ▼
   Embrace Dashboard              Any OTLP-compatible backend
   (User Timelines,               (traces, metrics, logs)
    Crashes, Network)
```

---

## Project Structure

```
.
├── quickshop-mobile/        # React Native iOS app
│   ├── src/
│   │   ├── screens/         # 10 screens with full navigation
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # apiClient (centralized network layer)
│   │   ├── config/          # API URL + tunnel config
│   │   └── context/         # Cart state management
│   └── ios/                 # Native iOS project with Embrace
├── quickshop-backend/       # Express.js API server
│   ├── server.js            # Entry point with 9 route modules
│   └── src/
│       ├── config/otel.js   # OpenTelemetry SDK setup
│       ├── routes/          # 9 instrumented route files
│       └── middleware/      # Request correlation
└── health-check/            # Automated health check script
```

---

## Setup

### Prerequisites

- Node.js v18+
- React Native development environment (Xcode, CocoaPods)
- An Embrace.io account (for mobile observability)
- (Optional) Any OTLP-compatible observability backend for backend traces

### 1. Backend

```bash
cd quickshop-backend
npm install
```

**To export traces to your OTLP backend**, set the following environment variables before starting the server:

```bash
# Replace with your backend's OTLP endpoint and auth headers
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.example.com \
OTEL_EXPORTER_OTLP_HEADERS="x-api-key=YOUR_API_KEY_HERE" \
node server.js
```

If no OTLP endpoint is configured, traces will be logged to the console.

### 2. Mobile App

```bash
cd quickshop-mobile
npm install
cd ios && pod install && cd ..
npx react-native start --port 8083
```

In a separate terminal:
```bash
npx react-native run-ios
```

### 3. Configure Embrace

The Embrace SDK is initialized in `ios/QuickShop/EmbraceInitializer.swift`. **Replace the placeholder `appId` value with your own Embrace App ID** from your Embrace dashboard.

### 4. (Optional) Tunnel for Network Span Forwarding

For Embrace NSF to capture and forward mobile network spans to your OTLP backend, the mobile app must route API calls through a **publicly routable hostname** (Embrace will not forward `localhost` or private IPs).

1. Start an ngrok tunnel: `ngrok http 3005`
2. Copy the public HTTPS URL
3. Set it in `quickshop-mobile/src/config/api.js`:
   ```js
   const TUNNEL_URL = 'https://your-tunnel-url.ngrok-free.dev';
   ```
4. Reload the mobile app

See [`quickshop-mobile/TUNNEL_SETUP.md`](quickshop-mobile/TUNNEL_SETUP.md) for detailed instructions.

---

## Mobile App (React Native)

### Screens

| Screen | Description | Instrumentation |
|---|---|---|
| **Product List** | Hero banner + jersey catalog grid | View spans, breadcrumbs on category filter |
| **Product Detail** | Full-bleed product page with size selection | Breadcrumbs for product view, add-to-cart |
| **Search** | Live product search with API calls | Network spans per keystroke search |
| **Cart** | Cart management with quantity controls | Breadcrumbs for quantity changes |
| **Checkout** | Payment flow with simulated crash | Breadcrumbs for payment steps, **crash trigger** |
| **Order History** | Past orders with status tracking | Network spans for order list fetch |
| **Order Detail** | Individual order breakdown | Breadcrumbs for detail view |
| **Account** | User profile and notification toggles | Network spans for preference saves |
| **Wishlist** | Saved items list | Breadcrumbs for wishlist actions |
| **National Collection** | Curated national team jersey page | View spans |

### Embrace SDK Integration

- **Automatic View Tracking**: Every screen navigation emits a named view span
- **Breadcrumbs**: Contextual breadcrumbs at each user action (browse → select → add-to-cart → checkout)
- **Network Span Forwarding (NSF)**: All API calls use a public tunnel URL so Embrace captures full network spans and forwards them via W3C `traceparent` to the backend's OTLP collector
- **Crash Reporting**: A simulated crash in the checkout flow triggers a `TypeError` that the SDK captures with full JS stack trace

### Simulated Crash

The checkout screen contains a deliberate crash that fires when a user with items in the cart taps "Pay":

```
TypeError: Cannot read property 'executeTransaction' of null
```

This crash is designed to look like a real production bug — a null payment bridge object — and generates a complete crash report with contextual breadcrumbs in the Embrace timeline:

1. `Viewed Checkout`
2. `Tapped Complete Payment`
3. `Cart has items, initiating native payment bridge...`
4. `Payment bridge encountered unrecoverable state`
5. 💥 Crash

### Network Layer (`apiClient.js`)

All API calls route through a centralized client that:
- Resolves the base URL from `src/config/api.js` (supports local, tunnel, and staging modes)
- Preserves Embrace's auto-injected `traceparent` headers
- Adds `ngrok-skip-browser-warning` headers for tunnel compatibility
- Guards against HTML error responses (e.g., tunnel 502 pages)

---

## Backend (Node.js + Express)

### OpenTelemetry Setup

The backend initializes the OpenTelemetry Node SDK before any other imports:

- **Trace Exporter**: OTLP/HTTP — sends spans to any OTLP-compatible collector endpoint
- **Metric Exporter**: OTLP/HTTP — exports metrics on a 15-second interval
- **Auto-Instrumentation**: `@opentelemetry/auto-instrumentations-node` captures HTTP and Express spans automatically
- **Resource Attributes**: `service.name`, `service.version`, `deployment.environment`, `service.namespace`
- **Sampling**: `AlwaysOnSampler` — captures 100% of traces for demo purposes

### API Routes (9 fully instrumented endpoints)

| Route | Method | Description | Instrumentation Highlights |
|---|---|---|---|
| `/products` | GET | Product catalog with pagination | Multi-span: `db.query`, `cache.check`, `inventory.lookup` |
| `/search` | GET | Full-text product search | Multi-span: `search.parse`, `search.execute`, `search.rank` |
| `/checkout` | POST | Order placement and payment | Multi-span: `payment.validate`, `payment.process`, `order.create`, `inventory.reserve` |
| `/orders` | GET | Order history retrieval | Multi-span: `db.query`, `order.enrich` |
| `/auth` | POST | User authentication | Multi-span: `auth.validate`, `token.generate`, `session.create` |
| `/reviews` | GET/POST | Product reviews | Multi-span: `review.fetch`, `sentiment.analyze` |
| `/recommendations` | GET | Personalized recommendations | Multi-span: `user.profile`, `ml.inference`, `cache.store` |
| `/shipping` | GET/POST | Shipping estimates and tracking | Multi-span: `rate.calculate`, `carrier.query` |
| `/notifications` | POST | Notification preferences | Multi-span: `preference.validate`, `preference.store` |

Every route creates realistic child spans with timing jitter, simulated database queries, and contextual span attributes — producing rich, production-like traces.

---

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `TUNNEL_URL` | `quickshop-mobile/src/config/api.js` | Public tunnel URL for NSF |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Backend env | Your OTLP collector endpoint |
| `OTEL_EXPORTER_OTLP_HEADERS` | Backend env | Auth headers for your OTLP backend |
| `PORT` | Backend env | API server port (default: 3005) |

---

## What This Demo Shows

1. **End-to-End Trace Correlation**: Mobile network spans (captured by Embrace NSF) correlate with backend spans via W3C `traceparent` propagation
2. **Rich User Timelines**: Every screen, action, and network call appears in the Embrace user timeline with contextual breadcrumbs
3. **Crash Diagnostics**: The simulated checkout crash demonstrates how breadcrumbs provide debugging context leading up to a failure
4. **Production-Like Backend Traces**: Each API route generates multi-span traces with realistic timing, attributes, and parent-child relationships
5. **Composable Architecture**: The backend exports standard OTLP — plug in any compatible backend (Jaeger, Grafana, Datadog, New Relic, Honeycomb, Chronosphere, etc.)

---

## License

Internal demo application — intended for partner demos and enablement.
